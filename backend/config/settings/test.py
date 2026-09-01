"""Réglages des tests automatisés : aucun secret Django réel, mais une vraie base PostgreSQL."""

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import postgres_database

# Un test ne doit jamais dépendre de la page d'erreur détaillée pour passer.
DEBUG = False

# Clé volontairement factice et publique : l'environnement de test ne protège
# aucune donnée réelle, et la suite doit tourner en CI sans secret à fournir.
# C'est la raison pour laquelle base.py ne définit pas SECRET_KEY lui-même.
SECRET_KEY = 'cle-de-test-non-secrete'

# Le client de test Django utilise l'hôte "testserver".
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Aucun navigateur n'appelle l'API pendant les tests : rien à autoriser.
CORS_ALLOWED_ORIGINS = []


# Les tests tournent sur le même moteur que la production : une requête qui
# passe ici passera en ligne. Django crée et détruit lui-même une base dédiée
# `test_<POSTGRES_DB>`, la base de développement n'est jamais touchée.
# Contrepartie assumée : la suite exige un PostgreSQL joignable et les
# variables POSTGRES_* renseignées, contrairement à SECRET_KEY.
DATABASES = postgres_database()
