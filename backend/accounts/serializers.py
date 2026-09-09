from rest_framework import serializers

from .models import CustomUser
from .validators import validate_password_strength


class RegisterSerializer(serializers.ModelSerializer):
    """Valide les données d'inscription et crée l'utilisateur (mot de passe hashé, compte inactif)."""

    # write_only : le mot de passe peut ENTRER (inscription) mais ne RESSORT jamais dans la réponse JSON
    password = serializers.CharField(write_only=True)

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
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Vérifie le mot de passe contre AUTH_PASSWORD_VALIDATORS, sans connaître le titulaire."""
        # Sans user : l'uid ne se décode qu'après ce serializer, dans la vue. Le
        # validateur de similarité reste donc muet ici — consigné dans AMELIORATIONS.md.
        validate_password_strength(attrs["new_password"], "new_password")
        return attrs

