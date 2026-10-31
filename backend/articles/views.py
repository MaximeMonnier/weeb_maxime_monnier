from django.db.models.functions import Left, Length
from django.db.models.lookups import GreaterThan
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleListSerializer, ArticleSerializer
from .permissions import IsOwnerOrReadOnly

# Extrait taillé par PostgreSQL : le texte entier ne quitte pas la base pour la liste.
LONGUEUR_EXTRAIT = 100


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD des articles : lecture PUBLIQUE, écriture réservée à l'auteur."""
    # Sans jointure, la liste chercherait le public_name de l'auteur une fois par article.
    queryset = Article.objects.select_related("author")
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    throttle_scope = "article_write"

    def get_throttles(self):
        # Quota sur les écritures qui peuvent déposer une image ; lecture et suppression restent libres.
        if self.action in ("create", "update", "partial_update"):
            return super().get_throttles()
        return []

    def get_serializer_class(self):
        # La liste seule : le détail et l'écriture ont besoin du champ content.
        if self.action == "list":
            return ArticleListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            # Sans l'annotate, content serait rechargé ligne par ligne ; sans le defer, il voyagerait entier.
            # La coupure se mesure ici : au front, il faudrait recopier LONGUEUR_EXTRAIT.
            return queryset.defer("content").annotate(
                excerpt=Left("content", LONGUEUR_EXTRAIT),
                excerpt_truncated=GreaterThan(Length("content"), LONGUEUR_EXTRAIT),
            )
        return queryset

    def perform_create(self, serializer):
        # L'auteur = l'utilisateur connecté. JAMAIS fourni par le client.
        serializer.save(author=self.request.user)
