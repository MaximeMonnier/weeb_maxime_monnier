from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleSerializer
from .permissions import IsOwnerOrReadOnly


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD complet des articles (liste, création, détail, modif, suppression)."""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        # L'auteur = l'utilisateur connecté. JAMAIS fourni par le client.
        serializer.save(author=self.request.user)
