import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str


from .models import CustomUser
from .serializers import (
    RegisterSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)

# Corps volontairement identique que le compte existe ou non : distinguer les deux
# réponses dirait à n'importe qui quelles adresses sont inscrites.
NEUTRAL_RESPONSE = {
    "detail": "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
}


def send_password_reset_link(user):
    """Adresse à l'utilisateur un lien vers le front, portant son uid et son token."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    lien = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    message = (
        "Bonjour,\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe.\n"
        "Choisissez-en un nouveau en suivant ce lien :\n\n"
        f"{lien}\n\n"
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


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur. Endpoint PUBLIC (pas besoin d'être connecté)."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class PasswordResetRequestView(APIView):
    """Étape 1 : envoie par email un lien de réinitialisation. Endpoint PUBLIC (pas besoin d'être connecté)."""
    permission_classes = [AllowAny]

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

        return Response(NEUTRAL_RESPONSE, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Étape 2 : vérifie le token et applique le nouveau mot de passe. Endpoint PUBLIC (pas besoin d'être connecté)."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Décoder l'uid pour retrouver l'utilisateur
        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            # Même filtre qu'à la demande : un compte désactivé entre-temps ne doit
            # pas pouvoir consommer le lien qu'il a reçu.
            user = CustomUser.objects.get(pk=user_id, is_active=True)
        except (CustomUser.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Lien invalide."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que le token est bon (et ni expiré ni déjà utilisé)
        if not default_token_generator.check_token(user, data["token"]):
            return Response({"detail": "Token invalide ou expiré."},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data["new_password"])   # hashe le nouveau mdp
        user.save()
        return Response({"detail": "Mot de passe réinitialisé avec succès."},
                        status=status.HTTP_200_OK)

