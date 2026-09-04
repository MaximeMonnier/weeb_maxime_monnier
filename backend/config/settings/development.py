"""Réglages de développement : machine du développeur, front Vite en local."""

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import env_bool, env_int, env_list, env_required, env_str, postgres_database

# Même en développement, aucune valeur de repli : une clé connue de tous
# finirait par se retrouver en production par simple oubli.
SECRET_KEY = env_required('DJANGO_SECRET_KEY')

# En développement le debug est allumé par défaut : la page d'erreur détaillée
# de Django est justement ce qu'on veut voir ici, et nulle part ailleurs.
DEBUG = env_bool('DJANGO_DEBUG', True)

# Hôtes du poste local, sauf si le .env en impose d'autres.
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', ['localhost', '127.0.0.1', '[::1]'])

# Le front Vite tourne sur le port 5173 : sans ces origines, le navigateur
# bloquerait chaque appel du front vers l'API.
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    ['http://localhost:5173', 'http://127.0.0.1:5173'],
)


# Base PostgreSQL du poste local, servie par le conteneur `db` de compose.dev.yaml.
# Les identifiants sont exigés : une base de développement accessible avec des
# identifiants devinables finirait par être exposée telle quelle ailleurs.
DATABASES = postgres_database()


# --- Emails ---
# Un vrai SMTP, et non le backend `console` : c'est le code d'envoi réel qui
# doit être exercé ici. En face, Mailpit affiche les messages au lieu de les
# livrer — http://127.0.0.1:8025.
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Le défaut vise Mailpit publié sur la machine, pour le backend lancé dans le
# venv. Celui qui tourne en conteneur reçoit `mailpit:1025` de compose.dev.yaml,
# la topologie du réseau Compose.
EMAIL_HOST = env_str('EMAIL_HOST', 'localhost')
EMAIL_PORT = env_int('EMAIL_PORT', 1025)

# En dur, pas lus : Mailpit n'attend ni compte ni TLS, et lui en imposer un
# depuis un .env ferait échouer l'envoi sans que la cause soit visible.
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
EMAIL_USE_TLS = False
