from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str


from .models import CustomUser
from .serializers import (
    RegisterSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur. Endpoint PUBLIC (pas besoin d'être connecté)."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class PasswordResetRequestView(APIView):
    """Étape 1 : génère un token de réinitialisation pour l'email fourni."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)          # 400 auto si email manquant/invalide
        email = serializer.validated_data["email"]

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Aucun compte associé à cet email."},
                            status=status.HTTP_404_NOT_FOUND)

        uid = urlsafe_base64_encode(force_bytes(user.pk))   # l'id encodé (pour l'URL)
        token = default_token_generator.make_token(user)    # jeton signé, à durée limitée

        return Response({"uid": uid, "token": token}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Étape 2 : vérifie le token et applique le nouveau mot de passe."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Décoder l'uid pour retrouver l'utilisateur
        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            user = CustomUser.objects.get(pk=user_id)
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

