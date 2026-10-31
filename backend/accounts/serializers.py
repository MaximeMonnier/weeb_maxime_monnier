from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    PasswordField, TokenObtainPairSerializer, TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import api_settings

from django.db import transaction

from .models import CustomUser
from .validators import validate_password_strength

# Sans borne, un mot de passe de 2,5 Mo passerait entier au hachage, PBKDF2 compris.
MAX_PASSWORD_LENGTH = 128


class RegisterSerializer(serializers.ModelSerializer):
    """Valide les données d'inscription et crée l'utilisateur (mot de passe hashé, compte inactif)."""

    password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    class Meta:
        model = CustomUser
        fields = ("id", "email", "first_name", "last_name", "password")

    def validate(self, attrs):
        """Vérifie le mot de passe contre AUTH_PASSWORD_VALIDATORS, l'identité en main."""
        # Instance non enregistrée, pour le validateur de similarité (email, nom).
        user = CustomUser(
            email=attrs["email"], first_name=attrs["first_name"], last_name=attrs["last_name"],
        )
        validate_password_strength(attrs["password"], "password", user=user)
        return attrs

    def create(self, validated_data):
        # is_active dès l'appel : désactivé après coup, le compte serait ouvert entre INSERT et UPDATE.
        return CustomUser.objects.create_user(**validated_data, is_active=False)

class PasswordResetRequestSerializer(serializers.Serializer):
    """Demande de réinitialisation : l'email seul."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirmation de réinitialisation : uid, token et nouveau mot de passe."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    def validate(self, attrs):
        """Vérifie le mot de passe contre AUTH_PASSWORD_VALIDATORS, sans connaître le titulaire."""
        # Sans user : l'uid ne se décode que dans la vue, la similarité reste muette (AMELIORATIONS.md).
        validate_password_strength(attrs["new_password"], "new_password")
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Valide le changement : le mot de passe actuel d'abord, la robustesse du nouveau ensuite."""
    current_password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)
    new_password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    def validate_current_password(self, value):
        # 400 et non 401 : apiFetch prendrait un 401 pour un jeton périmé et le renouvellerait.
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Le mot de passe actuel est incorrect.")
        return value

    def validate(self, attrs):
        """Vérifie le nouveau mot de passe contre AUTH_PASSWORD_VALIDATORS, le titulaire en main."""
        validate_password_strength(
            attrs["new_password"], "new_password", user=self.context["request"].user,
        )
        return attrs


class AccountDeleteSerializer(serializers.Serializer):
    """Valide la suppression du compte : le mot de passe redonné, et rien d'autre."""
    password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    def validate_password(self, value):
        # 400 et non 401 : apiFetch renouvellerait le jeton.
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Le mot de passe est incorrect.")
        return value


class LoginSerializer(TokenObtainPairSerializer):
    """Délivre les jetons, le mot de passe borné comme partout ailleurs."""

    def __init__(self, *args, **kwargs):
        # simplejwt crée ses champs dans __init__ : un attribut de classe serait écrasé.
        super().__init__(*args, **kwargs)
        self.fields["password"] = PasswordField(max_length=MAX_PASSWORD_LENGTH)


class RefreshSerializer(TokenRefreshSerializer):
    """Renouvelle les jetons, et refuse en 401 un compte supprimé comme un compte désactivé."""

    def validate(self, attrs):
        user_id = self.token_class(attrs["refresh"]).payload.get(api_settings.USER_ID_CLAIM)
        with transaction.atomic():
            # Verrou avant que super() lise la liste noire : sinon une révocation en cours passerait.
            CustomUser.objects.select_for_update().filter(
                **{api_settings.USER_ID_FIELD: user_id}
            ).first()
            # simplejwt n'intercepte pas l'absence du titulaire : apiFetch prendrait son 500 pour une panne.
            try:
                return super().validate(attrs)
            except CustomUser.DoesNotExist:
                raise AuthenticationFailed(
                    self.error_messages["no_active_account"], "no_active_account"
                )
