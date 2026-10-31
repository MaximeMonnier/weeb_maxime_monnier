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
    AccountDeleteSerializer,
    LoginSerializer,
    RefreshSerializer,
)

logger = logging.getLogger(__name__)

# Un seul libellé par vue, sinon on devine qui est inscrit ; rendus par copie, ces dicts étant partagés.
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
        # Seul un compte existant atteint le SMTP : un 500 trahirait l'inscription.
        logger.exception("Échec de l'envoi du lien de réinitialisation")


def set_password_and_revoke(user, password):
    """Change le mot de passe et met en liste noire chaque refresh encore valable du compte."""
    # D'un bloc : une révocation en échec ne doit pas garder le nouveau mot de passe.
    with transaction.atomic():
        # Verrou partagé avec RefreshSerializer : une rotation concurrente attend la fin du bloc.
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
    """Connexion : délivre les jetons JWT. Endpoint PUBLIC."""
    # Déjà posé par simplejwt, mais toute vue publique le déclare.
    permission_classes = [AllowAny]
    # Sous-classée pour le quota et le serializer ; le quota compte les appels, pas les échecs.
    throttle_scope = "login"
    serializer_class = LoginSerializer


class LoginRefreshView(TokenRefreshView):
    """Renouvellement des jetons JWT. Endpoint PUBLIC : le refresh envoyé tient lieu d'identité."""
    permission_classes = [AllowAny]
    serializer_class = RefreshSerializer


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur. Endpoint PUBLIC."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "register"


class PasswordResetRequestView(APIView):
    """Étape 1 : envoie par email un lien de réinitialisation. Endpoint PUBLIC."""
    permission_classes = [AllowAny]
    # Quota le plus bas : chaque appel envoie un vrai email, le relais finirait sur liste noire.
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # is_active : un compte pas encore validé choisirait un mot de passe pour buter au login.
        try:
            user = CustomUser.objects.get(email=email, is_active=True)
        except CustomUser.DoesNotExist:
            user = None

        if user is not None:
            send_password_reset_link(user)

        return Response(dict(NEUTRAL_RESPONSE), status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Étape 2 : vérifie le token et applique le nouveau mot de passe. Endpoint PUBLIC."""
    permission_classes = [AllowAny]
    # Le token ne se devine pas : le quota borne le coût des validateurs et de PBKDF2.
    # Scope à part : demande et confirmation ne se consomment pas leur quota.
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Message unique : l'uid valant base64(pk), deux messages diraient quels comptes sont actifs.
        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            # Un compte désactivé entre-temps ne consomme pas le lien reçu.
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
        # Celui de cet appareil compris : qui change un mot de passe compromis coupe la session volée.
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


class AccountDeleteView(APIView):
    """Supprime le compte du membre connecté, ses articles avec, sur son mot de passe redonné."""
    # Le mot de passe se teste ici : sans quota, un jeton d'accès volé suffirait à le deviner.
    throttle_scope = "account_delete"

    def delete(self, request):
        serializer = AccountDeleteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
