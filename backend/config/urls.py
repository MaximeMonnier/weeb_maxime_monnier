"""Routeur principal : chaque préfixe d'URL est délégué à l'app concernée."""

from django.contrib import admin
from django.urls import path, include

from .views import health

urlpatterns = [
    path("admin/", admin.site.urls),              # tableau de bord d'administration Django
    # Hors du préfixe api/ : le nginx du serveur ne relaie que /api/ et /admin/, la
    # sonde reste donc joignable du seul conteneur.
    path("health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),  # inscription, connexion, reset mot de passe
    path("api/", include("articles.urls")),       # articles du blog (CRUD)
    path("api/", include("contact.urls")),        # formulaire de contact
]
