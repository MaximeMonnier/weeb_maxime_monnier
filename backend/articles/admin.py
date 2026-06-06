from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Gestion des articles dans l'admin Django."""

    list_display = ("title", "author", "created_at", "updated_at")
    list_filter = ("created_at", "author")
    search_fields = ("title", "content")
