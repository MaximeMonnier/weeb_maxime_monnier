"""Réglages de production : aucun repli, tout vient de l'environnement."""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import env_bool, env_int, env_list, env_required, env_str, postgres_database

SECRET_KEY = env_required('DJANGO_SECRET_KEY')

# Forcé, pas lu : le debug exposerait code source et variables locales à chaque erreur.
DEBUG = False

# Sans hôte, Django refuse tout : mieux vaut un refus au démarrage qu'un 400 en ligne.
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "La variable d'environnement DJANGO_ALLOWED_HOSTS est absente ou vide. "
        "Renseigne les noms de domaine servis par l'API, séparés par des virgules."
    )

# Vide accepté : même domaine, pas de CORS. Un front sur son propre domaine doit y figurer.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')

DATABASES = postgres_database()

# `prefer`, défaut de libpq, retombe en clair ; `require` ne vérifie pas le certificat (`verify-full` à terme).
# setdefault : une affectation effacerait les OPTIONS de postgres_database().
DATABASES['default'].setdefault('OPTIONS', {})['sslmode'] = env_str('POSTGRES_SSLMODE', 'require')

# Compteurs des quotas partagés par les workers Gunicorn : en mémoire, chacun tiendrait les siens.
# La table vient de `createcachetable`, pas d'une migration (docker-entrypoint.sh).
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_quotas',
        # Au-delà de 300 entrées, le défaut, Django en efface un tiers : autant de compteurs remis à zéro.
        'OPTIONS': {'MAX_ENTRIES': 100_000},
    }
}

# Relais exigé : sans canal d'envoi, la réinitialisation devrait renvoyer son jeton au client.
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env_required('EMAIL_HOST')
EMAIL_PORT = env_int('EMAIL_PORT', 587)

# smtplib n'a aucun délai par défaut : un relais muet immobiliserait les workers un à un.
EMAIL_TIMEOUT = env_int('EMAIL_TIMEOUT', 10)
EMAIL_HOST_USER = env_str('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = env_str('EMAIL_HOST_PASSWORD', '')

# STARTTLS par défaut, comme le port 587 : sinon identifiants et messages partent en clair.
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)

# Exigée : héritée, elle enverrait les liens des emails vers `localhost` sans rien faire échouer.
FRONTEND_URL = env_required('FRONTEND_URL').rstrip('/')

# Sans destinataire, une 500 ne laisse qu'une ligne dans des journaux que personne ne lit.
ADMINS = env_list('DJANGO_ADMINS')
if not ADMINS:
    raise ImproperlyConfigured(
        "La variable d'environnement DJANGO_ADMINS est absente ou vide. "
        "Renseigne les adresses qui reçoivent le rapport des erreurs 500, séparées par des virgules."
    )

# Réglages qui n'ont de sens que derrière HTTPS, donc ici seulement.
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS ne se révoque pas facilement : défaut court, à monter par paliers (86400, puis 31536000).
SECURE_HSTS_SECONDS = env_int('DJANGO_HSTS_SECONDS', 3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# Le préchargement exige un an et couvrirait tous les sous-domaines, recette en HTTP comprise.
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS >= 31536000

# Seulement derrière un proxy qui ÉCRASE l'en-tête : sinon un client le forge et contourne HTTPS.
if env_bool('DJANGO_BEHIND_PROXY', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Sans NUM_PROXIES, DRF prend tout X-Forwarded-For pour identité : un client en changerait à
# chaque requête. 1 : la dernière adresse, celle qu'écrit le nginx ; 0 : REMOTE_ADDR seul.
REST_FRAMEWORK['NUM_PROXIES'] = 1 if env_bool('DJANGO_BEHIND_PROXY', False) else 0  # noqa: F405
