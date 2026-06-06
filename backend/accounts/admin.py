from django.contrib import admin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    """Affichage des utilisateurs dans l'admin Django (et validation des comptes)."""

    list_display = ("email", "first_name", "last_name", "is_active", "is_staff")
    list_filter = ("is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    # is_active modifiable depuis la liste → l'admin valide un compte en 1 clic
    list_editable = ("is_active",)
