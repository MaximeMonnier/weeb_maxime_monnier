"""Routeur principal : chaque préfixe d'URL est délégué à l'app concernée."""

from django.contrib import admin
from django.urls import path, include

from .views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    # Hors du préfixe api/ : le nginx du serveur ne relaie que /api/ et /admin/, la
    # sonde reste donc joignable du seul conteneur.
    path("health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("articles.urls")),
    path("api/", include("contact.urls")),
]
