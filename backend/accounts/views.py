import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str


from .models import CustomUser
from .serializers import (
    RegisterSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
    LoginSerializer,
    RefreshSerializer,
)

logger = logging.getLogger(__name__)

# La première répond à tous les cas de sa vue, la seconde à tous ses échecs : deux
# libellés diraient qui est inscrit. Rendues par copie, ces dicts étant partagés.
NEUTRAL_RESPONSE = {
    "detail": "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
}

INVALID_LINK_RESPONSE = {"detail": "Lien invalide ou expiré."}


def send_password_reset_link(user):
    """Adresse à l'utilisateur un lien vers le front, portant son uid et son token."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    message = (
        "Bonjour,\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe.\n"
        "Choisissez-en un nouveau en suivant ce lien :\n\n"
        f"{link}\n\n"
        "Ce lien est à usage unique et devient caduc dès le mot de passe changé.\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n"
    )

    try:
        send_mail(
            subject="Réinitialisation de votre mot de passe — Weeb",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception:
        # Une panne SMTP ne survient que pour un compte existant : la laisser remonter
        # en 500 rendrait la réponse distinguable et trahirait l'inscription.
        logger.exception("Échec de l'envoi du lien de réinitialisation")


def set_password_and_revoke(user, password):
    """Change le mot de passe et met en liste noire chaque refresh encore valable du compte."""
    # D'un bloc : sans quoi une révocation en échec garderait le nouveau mot de passe et
    # les sessions volées. Les jetons d'accès vivent leurs 15 minutes, voir base.py.
    with transaction.atomic():
        # Le verrou que prend aussi RefreshSerializer : une rotation lancée pendant ce bloc
        # attend sa fin, celle qui l'a précédé a déjà inscrit son refresh neuf.
        CustomUser.objects.select_for_update().get(pk=user.pk)
        user.set_password(password)
        user.save()
        BlacklistedToken.objects.bulk_create(
            [BlacklistedToken(token=token) for token in
             OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=True)],
            # Une déconnexion, qui ne prend pas le verrou, peut inscrire l'un d'eux entre-temps.
            ignore_conflicts=True,
        )


class LoginView(TokenObtainPairView):
    """Connexion : délivre les tokens JWT. Endpoint PUBLIC (pas besoin d'être connecté)."""
    # Redit alors que simplejwt le pose déjà : la convention du dépôt veut qu'une
    # vue publique le déclare, une vue muette étant fermée par défaut.
    permission_classes = [AllowAny]
    # Sous-classée pour deux attributs que la vue de simplejwt, importée, ne porte pas.
    # Le compteur compte les appels, pas les échecs.
    throttle_scope = "login"
    serializer_class = LoginSerializer


class LoginRefreshView(TokenRefreshView):
    """Renouvellement des jetons JWT. Endpoint PUBLIC : le refresh envoyé tient lieu d'identité."""
    permission_classes = [AllowAny]
    serializer_class = RefreshSerializer


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur. Endpoint PUBLIC (pas besoin d'être connecté)."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "register"


class PasswordResetRequestView(APIView):
    """Étape 1 : envoie par email un lien de réinitialisation. Endpoint PUBLIC (pas besoin d'être connecté)."""
    permission_classes = [AllowAny]
    # Le quota le plus bas des six : chaque appel envoie un email réel, donc
    # sans lui l'endpoint est un envoyeur gratuit qui fait blacklister le relais.
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)          # 400 auto si email manquant/invalide
        email = serializer.validated_data["email"]

        # is_active : un compte créé mais pas encore validé par un administrateur
        # choisirait un mot de passe pour se heurter ensuite au login.
        try:
            user = CustomUser.objects.get(email=email, is_active=True)
        except CustomUser.DoesNotExist:
            user = None

        if user is not None:
            send_password_reset_link(user)

        return Response(dict(NEUTRAL_RESPONSE), status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Étape 2 : vérifie le token et applique le nouveau mot de passe. Endpoint PUBLIC (pas besoin d'être connecté)."""
    permission_classes = [AllowAny]
    # Le token HMAC ne se devine pas : c'est le coût qu'on borne, chaque appel passant
    # un mot de passe aux validateurs puis à PBKDF2. Scope à part : la demande et la
    # confirmation ne doivent pas se consommer leur quota l'une l'autre.
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Message unique aux deux échecs : les distinguer dirait, un uid étant
        # base64(pk), quels identifiants correspondent à un compte actif.
        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            # Même filtre qu'à la demande : un compte désactivé entre-temps ne doit
            # pas pouvoir consommer le lien qu'il a reçu.
            user = CustomUser.objects.get(pk=user_id, is_active=True)
        except (CustomUser.DoesNotExist, ValueError, TypeError):
            return Response(dict(INVALID_LINK_RESPONSE), status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, data["token"]):
            return Response(dict(INVALID_LINK_RESPONSE), status=status.HTTP_400_BAD_REQUEST)

        # On réinitialise quand on croit sa session volée : celle de l'attaquant tombe avec.
        set_password_and_revoke(user, data["new_password"])
        return Response({"detail": "Mot de passe réinitialisé avec succès."},
                        status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    """Change le mot de passe du membre connecté, ferme ses autres sessions et lui rend des jetons neufs."""
    # Le mot de passe actuel se teste ici : sans quota, un jeton d'accès volé suffirait à le deviner.
    throttle_scope = "password_change"

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        # Chaque refresh émis passe en liste noire, celui de cet appareil compris : qui
        # change un mot de passe compromis veut couper la session volée.
        set_password_and_revoke(user, serializer.validated_data["new_password"])
        # Émis après la révocation, sans quoi il y passerait avec les autres.
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Mot de passe modifié.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )
