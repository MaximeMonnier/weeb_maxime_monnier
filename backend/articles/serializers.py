from io import BytesIO
from uuid import uuid4

from django.core.files.base import ContentFile
from PIL import Image, ImageOps
from rest_framework import serializers
from .models import Article

TAILLE_COUVERTURE_MAX = 5 * 1024 * 1024
FORMATS_COUVERTURE = {"JPEG", "PNG", "WEBP"}
# 40 mégapixels : une photo d'appareil passe, une bombe de décompression non.
PIXELS_COUVERTURE_MAX = 40_000_000
COTE_COUVERTURE_MAX = 1600


def reencoder_en_webp(fichier):
    """L'image redressée, ramenée à 1600 px de côté au plus, en WebP et sans EXIF ni XMP."""
    fichier.seek(0)
    # Orientation appliquée avant de perdre l'EXIF, sinon une photo de téléphone reste couchée.
    image = ImageOps.exif_transpose(Image.open(fichier))
    image.thumbnail((COTE_COUVERTURE_MAX, COTE_COUVERTURE_MAX))
    contenu = BytesIO()
    # Le profil de couleur seul, sans exif ni xmp : sans lui une photo P3 ternit.
    # Pas en CMJN ou gris : le WebP passe en RGB, le profil ne décrirait plus les pixels.
    profil = image.info.get("icc_profile") if image.mode in ("RGB", "RGBA", "P") else None
    image.save(contenu, "WEBP", quality=85, icc_profile=profil)
    return contenu.getvalue()


class CouvertureField(serializers.ImageField):
    """Une image jugée sur son contenu, enregistrée en WebP sous un nom tiré au hasard."""

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
        try:
            contenu = reencoder_en_webp(fichier)
        # verify() ne décode pas : un JPEG tronqué ou un PNG piégé ne cassent qu'ici.
        except Exception:
            self.fail("invalid_image")
        # Le nom reçu est jeté : nginx sert le type d'après l'extension, qui doit dire vrai.
        return ContentFile(contenu, name=f"{uuid4().hex}.webp")


class ArticleSerializer(serializers.ModelSerializer):
    """Article complet, pour le détail et l'écriture."""

    # Jamais __str__, qui rend l'email : le blog se lit sans authentification.
    author = serializers.CharField(source="author.public_name", read_only=True)
    # allow_null : un `cover` vide en multipart arrive en None, et retire l'image.
    cover = CouvertureField(required=False, allow_null=True)
    # Un booléen plutôt que l'id de l'auteur : rien d'autre ne sort sur lui.
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "id", "title", "content", "cover", "author", "is_author", "created_at", "updated_at",
        )
        read_only_fields = ("author", "created_at", "updated_at")
        # Ici et non au modèle : un TextField n'a pas de longueur en base, rien à migrer.
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
    # Annotations d'ArticleViewSet, que ModelSerializer ne devine pas.
    excerpt = serializers.CharField(read_only=True)
    excerpt_truncated = serializers.BooleanField(read_only=True)

    class Meta:
        model = Article
        fields = ("id", "title", "excerpt", "excerpt_truncated", "cover", "author", "created_at")
