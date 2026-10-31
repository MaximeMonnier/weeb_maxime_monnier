"""Réglages de développement : machine du développeur, front Vite en local."""

from .base import *  # noqa: F403
from .base import env_bool, env_int, env_list, env_required, env_str, postgres_database

# Aucun repli, même ici : une clé connue de tous finirait en production par oubli.
SECRET_KEY = env_required('DJANGO_SECRET_KEY')

DEBUG = env_bool('DJANGO_DEBUG', True)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', ['localhost', '127.0.0.1', '[::1]'])

CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    ['http://localhost:5173', 'http://127.0.0.1:5173'],
)


# Identifiants exigés même ici : une base aux identifiants devinables finirait exposée ailleurs.
DATABASES = postgres_database()


# Vrai SMTP plutôt que `console`, pour exercer l'envoi ; Mailpit affiche les messages sur :8025.
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Défauts du venv ; en conteneur, compose.dev.yaml impose `mailpit:1025`.
EMAIL_HOST = env_str('EMAIL_HOST', 'localhost')
EMAIL_PORT = env_int('EMAIL_PORT', 1025)

# smtplib n'a aucun délai par défaut : un relais muet bloquerait le worker d'une vue publique.
EMAIL_TIMEOUT = env_int('EMAIL_TIMEOUT', 10)

# En dur : Mailpit n'attend ni compte ni TLS, en imposer depuis le .env ferait échouer l'envoi sans bruit.
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
EMAIL_USE_TLS = False
