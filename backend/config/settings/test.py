"""Réglages des tests automatisés : exécutables sans .env, donc sans secret réel."""

from .base import *  # noqa: F403 — on repart de tous les réglages communs

# Un test ne doit jamais dépendre de la page d'erreur détaillée pour passer.
DEBUG = False

# Clé volontairement factice et publique : l'environnement de test ne protège
# aucune donnée réelle, et la suite doit tourner en CI sans secret à fournir.
SECRET_KEY = 'cle-de-test-non-secrete'

# Le client de test Django utilise l'hôte "testserver".
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Aucun navigateur n'appelle l'API pendant les tests : rien à autoriser.
CORS_ALLOWED_ORIGINS = []

# Base jetable en mémoire : les tests ne touchent pas au db.sqlite3 de travail.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
