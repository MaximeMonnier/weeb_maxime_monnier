from django.db import models
from django.conf import settings


class Article(models.Model):
    """Un article de blog, rédigé par un utilisateur."""

    title = models.CharField(max_length=200)
    content = models.TextField()

    # L'AUTEUR = le propriétaire de l'article. C'est ce lien qui permettra plus tard
    # de dire "seul le propriétaire peut modifier/supprimer".
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,        # = notre CustomUser
        on_delete=models.CASCADE,        # si l'auteur est supprimé, ses articles aussi
        related_name="articles",         # permet de faire user.articles.all()
    )

    created_at = models.DateTimeField(auto_now_add=True)   # rempli UNE fois, à la création
    updated_at = models.DateTimeField(auto_now=True)       # mis à jour à CHAQUE sauvegarde

    class Meta:
        ordering = ["-created_at"]       # les plus récents affichés en premier

    def __str__(self):
        return self.title
