from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Contact
from .serializers import ContactSerializer


class ContactCreateView(generics.CreateAPIView):
    """Enregistre un message de contact. Endpoint PUBLIC (pas besoin d'être connecté)."""
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    # Sans quota, la table Contact grossit sans borne au rythme d'un script.
    throttle_scope = "contact"
