from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """Valide les données d'inscription et crée l'utilisateur (mot de passe hashé, compte inactif)."""

    # write_only : le mot de passe peut ENTRER (inscription) mais ne RESSORT jamais dans la réponse JSON
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ("id", "email", "first_name", "last_name", "password")

    def create(self, validated_data):
        # On passe par create_user (notre manager) → le mot de passe est HASHÉ
        user = CustomUser.objects.create_user(**validated_data)
        # Compte créé mais EN ATTENTE de validation par un admin (ton Option A)
        user.is_active = False
        user.save()
        return user

class PasswordResetRequestSerializer(serializers.Serializer):
    """Valide la demande : on a juste besoin de l'email."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Valide la confirmation : uid + token + nouveau mot de passe."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)

