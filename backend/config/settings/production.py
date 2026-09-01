"""Réglages de production : aucun repli, tout vient de l'environnement."""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import env_liste

# Forcé, pas lu : en production le debug exposerait le code source, les
# variables locales et une partie de la configuration à chaque erreur.
DEBUG = False

# Sans hôte autorisé, Django refuse toutes les requêtes. Mieux vaut le dire
# au démarrage que le découvrir sur un 400 en ligne.
ALLOWED_HOSTS = env_liste('DJANGO_ALLOWED_HOSTS')
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "La variable d'environnement DJANGO_ALLOWED_HOSTS est absente ou vide. "
        "Renseigne les noms de domaine servis par l'API, séparés par des virgules."
    )

# Le front est servi depuis un autre domaine : il doit y être listé explicitement.
CORS_ALLOWED_ORIGINS = env_liste('CORS_ALLOWED_ORIGINS')

# --- En-têtes et cookies de sécurité ---
# Ces réglages n'ont de sens que derrière HTTPS, donc uniquement ici.
SECURE_SSL_REDIRECT = True                  # redirige tout le trafic HTTP vers HTTPS
SESSION_COOKIE_SECURE = True                # le cookie de session ne part jamais en clair
CSRF_COOKIE_SECURE = True                   # idem pour le cookie CSRF
SECURE_HSTS_SECONDS = 31536000              # un an : le navigateur refusera le HTTP ensuite
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True          # empêche le navigateur de deviner le type d'un fichier
X_FRAME_OPTIONS = 'DENY'                    # interdit l'affichage du site dans une iframe

# Le serveur web place l'en-tête quand la requête d'origine était en HTTPS ;
# sans ça, Django derrière un reverse proxy croit à tort recevoir du HTTP.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
