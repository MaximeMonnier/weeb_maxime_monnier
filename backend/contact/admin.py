from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("subject", "first_name", "last_name", "email")
    search_fields = ("email", "subject")
