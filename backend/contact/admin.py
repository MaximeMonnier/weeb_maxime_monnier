from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Lecture des messages de contact dans l'admin Django."""

    list_display = ("subject", "first_name", "last_name", "email")
    search_fields = ("email", "subject")
