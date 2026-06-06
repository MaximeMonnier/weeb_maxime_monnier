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
