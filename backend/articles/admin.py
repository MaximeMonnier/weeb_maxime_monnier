from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Gestion des articles dans l'admin Django."""

    list_display = ("title", "author", "created_at", "updated_at")
    # Redit ce que l'admin fait déjà de lui-même : une relation dans list_display
    # suffit à ChangeList pour joindre. L'écrire borne la jointure à author, là où
    # le défaut, select_related() nu, suivrait toute clé étrangère ajoutée depuis.
    list_select_related = ("author",)
    list_filter = ("created_at", "author")
    search_fields = ("title", "content")
