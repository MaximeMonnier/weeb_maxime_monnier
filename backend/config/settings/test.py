"""Réglages des tests automatisés : aucun secret Django réel, mais une vraie base PostgreSQL."""

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import LOGGING, postgres_database, REST_FRAMEWORK

# Un test ne doit jamais dépendre de la page d'erreur détaillée pour passer.
DEBUG = False

# Clé factice et publique : aucune donnée réelle à protéger, aucune clé à fournir en CI.
# C'est pourquoi base.py ne définit pas SECRET_KEY.
SECRET_KEY = 'cle-de-test-non-secrete-de-32-octets-au-moins'

# Le client de test Django utilise l'hôte "testserver".
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Aucun navigateur n'appelle l'API pendant les tests : rien à autoriser.
CORS_ALLOWED_ORIGINS = []


# Le moteur de la production : Django crée et détruit `test_<POSTGRES_DB>`, sans toucher
# à la base de développement. La suite exige donc un PostgreSQL joignable.
DATABASES = postgres_database()


# --- Emails ---
# Aucune connexion SMTP, les messages restent dans `django.core.mail.outbox`.
# Le runner l'impose déjà ; l'écrire ici vaut hors du runner.
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


# --- Journaux ---
# Chaque refus 4xx de la suite écrirait sa ligne : le niveau seul monte, le handler
# reste celui de base.py, que vérifie config/tests.py.
LOGGING = {
    **LOGGING,
    'handlers': {'console': {**LOGGING['handlers']['console'], 'level': 'CRITICAL'}},
}


# --- Quotas de débit ---
# Un taux à None éteint son scope. Le taux et non la classe, figée à l'import de DRF :
# une classe retirée ne se réarmerait plus dans un test, un taux si.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_RATES': {
        scope: None for scope in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    },
}
