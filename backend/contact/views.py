from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Contact
from .serializers import ContactSerializer


class ContactCreateView(generics.CreateAPIView):
    """Enregistre un message de contact. Endpoint PUBLIC."""
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    # Sans quota, un script remplit la table sans borne.
    throttle_scope = "contact"
