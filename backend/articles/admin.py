from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Gestion des articles dans l'admin Django."""

    list_display = ("title", "author", "created_at", "updated_at")
    # Sans elle, ChangeList joindrait quand même : une relation dans list_display
    # lui suffit. Elle borne la jointure à author, là où ce défaut — select_related()
    # nu — prendrait aussi toute clé étrangère non nulle ajoutée depuis.
    list_select_related = ("author",)
    list_filter = ("created_at", "author")
    search_fields = ("title", "content")
