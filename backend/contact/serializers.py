from rest_framework import serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    """Valide les données d'un message de contact."""

    class Meta:
        model = Contact
        fields = ("id", "first_name", "last_name", "email", "subject", "message")   

