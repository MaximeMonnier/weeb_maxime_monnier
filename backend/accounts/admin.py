from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Affichage des utilisateurs dans l'admin Django (et validation des comptes)."""

    # UserAdmin décrit un modèle à username : ses deux listes de champs sont à réécrire.
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "usable_password",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    list_display = ("email", "first_name", "last_name", "is_active", "is_staff")
    list_filter = ("is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)  # UserAdmin trierait sur username
    # L'admin valide un compte en un clic, depuis la liste.
    list_editable = ("is_active",)
