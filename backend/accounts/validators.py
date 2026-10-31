import re

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class PasswordComplexityValidator:
    """Exige une minuscule, une majuscule et un chiffre, que Django ne vérifie pas."""

    # Mêmes classes ASCII que lib/validationRules.ts : front et API acceptent les mêmes mots de passe.
    REQUIRED_CLASSES = (r"[a-z]", r"[A-Z]", r"[0-9]")
    MESSAGE = "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."

    def validate(self, password, user=None):
        if not all(re.search(pattern, password) for pattern in self.REQUIRED_CLASSES):
            raise DjangoValidationError(self.MESSAGE, code="password_missing_character_class")

    def get_help_text(self):
        return self.MESSAGE


def validate_password_strength(password, field_name, user=None):
    """Applique AUTH_PASSWORD_VALIDATORS et range l'échec sous la clé du champ appelant."""
    try:
        password_validation.validate_password(password, user=user)
    except DjangoValidationError as error:
        # Erreur sans champ : DRF la rendrait à la racine, hors de portée du formulaire.
        raise serializers.ValidationError({field_name: list(error.messages)}) from error
