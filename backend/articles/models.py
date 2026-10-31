from django.db import models
from django.conf import settings


class Article(models.Model):
    """Un article de blog, rédigé par un utilisateur."""

    title = models.CharField(max_length=200)
    content = models.TextField()
    cover = models.ImageField(upload_to="articles/", blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="articles",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # L'id départage deux dates égales : sinon la pagination peut montrer un article deux fois.
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title
