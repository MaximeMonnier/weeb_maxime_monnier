from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    PasswordField, TokenObtainPairSerializer, TokenRefreshSerializer,
)

from .models import CustomUser
from .validators import validate_password_strength

# Sans borne, un mot de passe de 2,5 Mo passerait entier au hachage, PBKDF2 compris.
MAX_PASSWORD_LENGTH = 128


class RegisterSerializer(serializers.ModelSerializer):
    """Valide les données d'inscription et crée l'utilisateur (mot de passe hashé, compte inactif)."""

    # write_only : le mot de passe peut ENTRER (inscription) mais ne RESSORT jamais dans la réponse JSON
    password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    class Meta:
        model = CustomUser
        fields = ("id", "email", "first_name", "last_name", "password")

    def validate(self, attrs):
        """Vérifie le mot de passe contre AUTH_PASSWORD_VALIDATORS, l'identité en main."""
        # Instance non enregistrée : elle ne sert qu'à donner ses attributs au
        # validateur de similarité, qui refuse un mot de passe tiré de l'email ou du nom.
        user = CustomUser(
            email=attrs["email"], first_name=attrs["first_name"], last_name=attrs["last_name"],
        )
        validate_password_strength(attrs["password"], "password", user=user)
        return attrs

    def create(self, validated_data):
        # On passe par create_user (notre manager) → le mot de passe est HASHÉ.
        # is_active dès l'appel : le désactiver après coup laisserait le compte
        # ouvert entre l'INSERT et l'UPDATE, le temps qu'une connexion s'y glisse.
        return CustomUser.objects.create_user(**validated_data, is_active=False)

class PasswordResetRequestSerializer(serializers.Serializer):
    """Valide la demande : on a juste besoin de l'email."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Valide la confirmation : uid + token + nouveau mot de passe."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, max_length=MAX_PASSWORD_LENGTH)

    def validate(self, attrs):
        """Vérifie le mot de passe contre AUTH_PASSWORD_VALIDATORS, sans connaître le titulaire."""
        # Sans user : l'uid ne se décode qu'après ce serializer, dans la vue. Le
        # validateur de similarité reste donc muet ici — consigné dans AMELIORATIONS.md.
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


class LoginSerializer(TokenObtainPairSerializer):
    """Délivre les jetons, le mot de passe borné comme partout ailleurs."""

    def __init__(self, *args, **kwargs):
        # simplejwt crée ses champs dans __init__, et non en attributs de classe :
        # une déclaration au niveau de la classe serait écrasée.
        super().__init__(*args, **kwargs)
        self.fields["password"] = PasswordField(max_length=MAX_PASSWORD_LENGTH)


class RefreshSerializer(TokenRefreshSerializer):
    """Renouvelle les jetons, et refuse en 401 un compte supprimé comme un compte désactivé."""

    def validate(self, attrs):
        # simplejwt relit le titulaire par objects.get() sans intercepter son absence :
        # le 500 qui en sortait, apiFetch le prend pour une panne et garde les jetons.
        try:
            return super().validate(attrs)
        except CustomUser.DoesNotExist:
            raise AuthenticationFailed(
                self.error_messages["no_active_account"], "no_active_account"
            )
