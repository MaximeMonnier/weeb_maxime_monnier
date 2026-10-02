from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    """Convertit un Article en JSON et valide les données reçues."""

    # Le prénom et le nom, jamais fournis par le client — et surtout jamais le
    # __str__ du compte, qui rend l'email : le blog se lit sans authentification.
    author = serializers.CharField(source="author.public_name", read_only=True)

    class Meta:
        model = Article
        fields = ("id", "title", "content", "author", "created_at", "updated_at")
        read_only_fields = ("author", "created_at", "updated_at")
        # Ici et pas au modèle : un TextField n'a pas de longueur en base, rien à migrer.
        extra_kwargs = {"content": {"max_length": 20000}}


class ArticleListSerializer(serializers.ModelSerializer):
    """L'article tel que la liste le rend : un extrait, jamais le texte entier."""

    author = serializers.CharField(source="author.public_name", read_only=True)
    # Déclarés à la main : ce ne sont pas des champs du modèle mais des annotations
    # posées par ArticleViewSet, et ModelSerializer ne sait pas les deviner.
    excerpt = serializers.CharField(read_only=True)
    excerpt_truncated = serializers.BooleanField(read_only=True)

    class Meta:
        model = Article
        fields = ("id", "title", "excerpt", "excerpt_truncated", "author", "created_at")
