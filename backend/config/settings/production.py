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

# Liste vide acceptée volontairement : elle est correcte quand le front est
# servi depuis le même domaine que l'API, auquel cas il n'y a pas de CORS.
# Si le front a son propre domaine, l'y déclarer, sinon le navigateur bloquera
# chaque appel — sans que rien n'échoue côté serveur.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')

# Aucun repli non plus ici : mieux vaut un démarrage refusé qu'un service qui
# se rabat silencieusement sur une base qui n'est pas la bonne.
DATABASES = postgres_database()

# TLS exigé jusqu'à la base. Le défaut de libpq est `prefer` : sans TLS
# disponible, la connexion se poursuit EN CLAIR, mot de passe compris, sans
# rien signaler. `require` la fait échouer bruyamment à la place.
# La variable existe pour le cas où la base est jointe par une socket locale
# ou un tunnel déjà chiffré, où `disable` est alors le réglage correct.
#
# `setdefault` plutôt qu'une affectation : le jour où postgres_database() posera
# une autre option, une affectation l'effacerait ici sans rien dire.
#
# `require` chiffre mais ne VÉRIFIE PAS le certificat du serveur : il protège de
# l'écoute passive, pas d'un intermédiaire actif. Quand la base sera réellement
# en ligne, passer à `verify-full` et fournir un `sslrootcert`.
DATABASES['default'].setdefault('OPTIONS', {})['sslmode'] = env_str('POSTGRES_SSLMODE', 'require')

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

# Django ne voit que du HTTP quand un reverse proxy termine le TLS à sa place :
# cet en-tête lui dit que la requête d'origine était chiffrée. À n'activer que
# derrière un proxy qui ÉCRASE l'en-tête (l'ajouter ne suffit pas) : sinon
# n'importe quel client le forge et contourne la redirection HTTPS.
if env_bool('DJANGO_BEHIND_PROXY', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
