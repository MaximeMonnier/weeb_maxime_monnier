"""Réglages des tests automatisés : aucun secret Django réel, mais une vraie base PostgreSQL."""

import atexit
import shutil
import tempfile
from pathlib import Path

from .base import *  # noqa: F403
from .base import LOGGING, postgres_database, REST_FRAMEWORK

# Un test ne doit jamais dépendre de la page d'erreur détaillée pour passer.
DEBUG = False

# Clé factice et publique : rien à fournir en CI, d'où son absence de base.py.
SECRET_KEY = 'cle-de-test-non-secrete-de-32-octets-au-moins'

ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS = []


# Django crée et détruit `test_<POSTGRES_DB>` : la suite exige un PostgreSQL joignable.
DATABASES = postgres_database()


# Le runner impose déjà locmem ; l'écrire ici vaut hors du runner.
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


# Un dossier par lancement : deux suites en parallèle ne mêlent pas leurs images à celles du runserver.
MEDIA_ROOT = Path(tempfile.mkdtemp(prefix='weeb-test-media-'))
atexit.register(shutil.rmtree, MEDIA_ROOT, ignore_errors=True)


# Seul le niveau monte (chaque refus 4xx écrirait sa ligne) : config/tests.py vérifie le handler.
LOGGING = {
    **LOGGING,
    'handlers': {'console': {**LOGGING['handlers']['console'], 'level': 'CRITICAL'}},
}


# Les taux et non la classe, figée à l'import de DRF : un taux se réarme dans un test.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_RATES': {
        scope: None for scope in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    },
}
