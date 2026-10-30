from uuid import uuid4

from rest_framework import serializers
from .models import Article

TAILLE_COUVERTURE_MAX = 5 * 1024 * 1024
# Le format que Pillow lit dans le contenu, et l'extension donnée au fichier enregistré.
FORMATS_COUVERTURE = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
# 40 mégapixels : une photo d'appareil passe, une bombe de décompression non.
PIXELS_COUVERTURE_MAX = 40_000_000


class CouvertureField(serializers.ImageField):
    """Une image jugée sur son contenu, enregistrée sous un nom tiré au hasard."""

    default_error_messages = {
        "trop_lourde": f"L'image dépasse {TAILLE_COUVERTURE_MAX // (1024 * 1024)} Mo.",
        "format": "Formats acceptés : JPEG, PNG et WebP.",
        "trop_grande": (
            f"L'image est trop grande : {PIXELS_COUVERTURE_MAX // 1_000_000} mégapixels au plus."
        ),
    }

    def to_internal_value(self, data):
        # Avant Pillow : un fichier trop lourd n'est pas même ouvert.
        if getattr(data, "size", 0) > TAILLE_COUVERTURE_MAX:
            self.fail("trop_lourde")
        fichier = super().to_internal_value(data)
        # Posée par l'ImageField de Django, qui a déjà refusé ce que Pillow ne sait pas lire.
        image = fichier.image
        if image.format not in FORMATS_COUVERTURE:
            self.fail("format")
        largeur, hauteur = image.size
        if largeur * hauteur > PIXELS_COUVERTURE_MAX:
            self.fail("trop_grande")
        # L'extension vient du contenu : nginx sert le type d'après elle, jamais d'après le nom reçu.
        fichier.name = f"{uuid4().hex}.{FORMATS_COUVERTURE[image.format]}"
        return fichier


class ArticleSerializer(serializers.ModelSerializer):
    """Convertit un Article en JSON et valide les données reçues."""

    # Le prénom et le nom, jamais fournis par le client — et surtout jamais le
    # __str__ du compte, qui rend l'email : le blog se lit sans authentification.
    author = serializers.CharField(source="author.public_name", read_only=True)
    # allow_null : un `cover` vide en multipart arrive en None, et retire l'image.
    cover = CouvertureField(required=False, allow_null=True)
    # Un booléen plutôt que l'identifiant de l'auteur, que le front comparerait au
    # sien : il ne connaît pas le lecteur, et rien d'autre ne sort sur l'auteur.
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "id", "title", "content", "cover", "author", "is_author", "created_at", "updated_at",
        )
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
        fields = ("id", "title", "excerpt", "excerpt_truncated", "cover", "author", "created_at")
