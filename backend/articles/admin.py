from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Gestion des articles dans l'admin Django."""

    list_display = ("title", "author", "cover", "created_at", "updated_at")
    # Sinon ChangeList fait un select_related() nu, qui joindrait toute clé étrangère non nulle.
    list_select_related = ("author",)
    list_filter = ("created_at", "author")
    search_fields = ("title", "content")
