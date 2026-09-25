from django.db.models.functions import Left
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Article
from .serializers import ArticleListSerializer, ArticleSerializer
from .permissions import IsOwnerOrReadOnly

# Longueur de l'extrait rendu par la liste, taillé par PostgreSQL : le texte entier
# ne quitte plus la base pour une carte qui n'en montre que le début.
LONGUEUR_EXTRAIT = 100


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD complet des articles (liste, création, détail, modif, suppression)."""
    # Jointure et non requête par ligne : le serializer rend l'auteur par son
    # public_name, et la liste irait sinon le chercher en base une fois par article.
    queryset = Article.objects.select_related("author")
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_class(self):
        # La liste seule : le détail et l'écriture ont besoin du champ content.
        if self.action == "list":
            return ArticleListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            # Les deux vont ensemble : defer laisse content en base, annotate y
            # taille l'extrait. Sans l'annotation, le serializer rechargerait
            # content une requête par ligne ; sans le defer, il voyagerait entier.
            return queryset.defer("content").annotate(
                excerpt=Left("content", LONGUEUR_EXTRAIT),
            )
        return queryset

    def perform_create(self, serializer):
        # L'auteur = l'utilisateur connecté. JAMAIS fourni par le client.
        serializer.save(author=self.request.user)
