"""Réglages de production : aucun repli, tout vient de l'environnement."""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import env_bool, env_int, env_list, env_required, env_str, postgres_database

# Aucune valeur de repli : sans clé, le service refuse de démarrer.
SECRET_KEY = env_required('DJANGO_SECRET_KEY')

# Forcé, pas lu : en production le debug exposerait le code source, les
# variables locales et une partie de la configuration à chaque erreur.
DEBUG = False

# Sans hôte autorisé, Django refuse toutes les requêtes. Mieux vaut le dire
# au démarrage que le découvrir sur un 400 en ligne.
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "La variable d'environnement DJANGO_ALLOWED_HOSTS est absente ou vide. "
        "Renseigne les noms de domaine servis par l'API, séparés par des virgules."
    )

# Vide accepté : front et API sur le même domaine n'ont pas de CORS. Un front sur son
# propre domaine doit y figurer, sinon le navigateur bloque chaque appel sans erreur serveur.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')

# Aucun repli non plus ici : mieux vaut un démarrage refusé qu'un service qui
# se rabat silencieusement sur une base qui n'est pas la bonne.
DATABASES = postgres_database()

# TLS jusqu'à la base : le défaut de libpq, `prefer`, retombe EN CLAIR sans rien dire.
# `require` chiffre sans VÉRIFIER le certificat : `verify-full` une fois la base en ligne.
# `setdefault` : une affectation effacerait les OPTIONS que postgres_database() poserait.
DATABASES['default'].setdefault('OPTIONS', {})['sslmode'] = env_str('POSTGRES_SSLMODE', 'require')

# --- Emails ---
# Relais EXIGÉ : sans canal d'envoi, la réinitialisation n'aurait plus qu'à renvoyer
# son jeton au client — la faille que ce réglage referme.
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env_required('EMAIL_HOST')
EMAIL_PORT = env_int('EMAIL_PORT', 587)

# Aucun délai de garde par défaut côté smtplib. L'envoi étant synchrone dans une vue
# publique, un relais muet immobiliserait les workers Gunicorn l'un après l'autre.
EMAIL_TIMEOUT = env_int('EMAIL_TIMEOUT', 10)
EMAIL_HOST_USER = env_str('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = env_str('EMAIL_HOST_PASSWORD', '')

# STARTTLS par défaut, comme le port 587 : sinon identifiants et messages
# partent en clair. Le couper demande un `EMAIL_USE_TLS=0` explicite.
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)

# Exigée elle aussi, plutôt qu'héritée du .env : ces liens partent chez
# l'utilisateur, et le défaut de développement enverrait tous les destinataires
# sur `localhost` sans que rien n'échoue côté serveur.
FRONTEND_URL = env_required('FRONTEND_URL').rstrip('/')

# Sans destinataire, une 500 ne laisse qu'une ligne dans des journaux que personne ne lit.
ADMINS = env_list('DJANGO_ADMINS')
if not ADMINS:
    raise ImproperlyConfigured(
        "La variable d'environnement DJANGO_ADMINS est absente ou vide. "
        "Renseigne les adresses qui reçoivent le rapport des erreurs 500, séparées par des virgules."
    )

# --- En-têtes et cookies de sécurité ---
# Ces réglages n'ont de sens que derrière HTTPS, donc uniquement ici.
SECURE_SSL_REDIRECT = True                  # redirige tout le trafic HTTP vers HTTPS
SESSION_COOKIE_SECURE = True                # le cookie de session ne part jamais en clair
CSRF_COOKIE_SECURE = True                   # idem pour le cookie CSRF
SECURE_CONTENT_TYPE_NOSNIFF = True          # empêche le navigateur de deviner le type d'un fichier
X_FRAME_OPTIONS = 'DENY'                    # interdit l'affichage du site dans une iframe

# HSTS : le navigateur mémorise qu'il ne doit plus jamais appeler ce domaine en
# HTTP. L'engagement dure et ne se révoque pas facilement, donc le défaut est
# court. Le monter par paliers une fois le HTTPS stable : 86400, puis 31536000.
SECURE_HSTS_SECONDS = env_int('DJANGO_HSTS_SECONDS', 3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# Le préchargement n'a de sens qu'avec un engagement d'un an : c'est la durée
# minimale exigée pour soumettre un domaine à la liste des navigateurs, et il
# couvrirait TOUS les sous-domaines, y compris une recette servie en HTTP.
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS >= 31536000

# Le proxy termine le TLS : cet en-tête dit à Django que la requête était chiffrée.
# Seulement derrière un proxy qui l'ÉCRASE, sinon tout client le forge et contourne
# la redirection HTTPS.
if env_bool('DJANGO_BEHIND_PROXY', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
