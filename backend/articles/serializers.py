from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    """Convertit un Article en JSON et valide les données reçues."""

    # Le prénom et le nom, jamais fournis par le client — et surtout jamais le
    # __str__ du compte, qui rend l'email : le blog se lit sans authentification.
    author = serializers.CharField(source="author.public_name", read_only=True)
    # Un booléen plutôt que l'identifiant de l'auteur, que le front comparerait au
    # sien : il ne connaît pas le lecteur, et rien d'autre ne sort sur l'auteur.
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ("id", "title", "content", "author", "is_author", "created_at", "updated_at")
        read_only_fields = ("author", "created_at", "updated_at")
        # Ici et pas au modèle : un TextField n'a pas de longueur en base, rien à migrer.
        extra_kwargs = {"content": {"max_length": 20000}}

    def get_is_author(self, article):
        """Vrai seulement si le lecteur connecté a écrit l'article."""
        request = self.context.get("request")
        return bool(
            request and request.user.is_authenticated and article.author_id == request.user.pk
        )


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
