from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    """Convertit un Article en JSON et valide les données reçues."""

    # author affiché en lecture seule (nom de l'auteur), jamais fourni par le client
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Article
        fields = ("id", "title", "content", "author", "created_at", "updated_at")
        read_only_fields = ("author", "created_at", "updated_at")


class ArticleListSerializer(serializers.ModelSerializer):
    """L'article tel que la liste le rend : un extrait, jamais le texte entier."""

    author = serializers.StringRelatedField(read_only=True)
    # Déclaré à la main : excerpt n'est pas un champ du modèle mais une annotation
    # posée par ArticleViewSet, et ModelSerializer ne sait pas la deviner.
    excerpt = serializers.CharField(read_only=True)

    class Meta:
        model = Article
        fields = ("id", "title", "excerpt", "author", "created_at")
