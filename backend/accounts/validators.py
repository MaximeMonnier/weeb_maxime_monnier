"""Validation du mot de passe : le validateur maison, et le pont vers les serializers DRF."""

import re

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class PasswordComplexityValidator:
    """Exige une minuscule, une majuscule et un chiffre — ce qu'aucun des quatre validateurs de Django ne regarde."""

    # Classes ASCII, celles de la regex de FormSubscribe.tsx : les deux règles doivent
    # accepter les mêmes mots de passe, sinon le front refuse ce que l'API vient d'admettre.
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
        # Django lève une erreur sans champ ; sans ce dict, DRF la rendrait à la racine
        # de la réponse, où le front ne l'affiche sous aucun des champs du formulaire.
        raise serializers.ValidationError({field_name: list(error.messages)}) from error
