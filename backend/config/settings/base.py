"""Réglages communs : aucun secret, aucune valeur propre à une machine."""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# `.env` de la racine, absent en conteneur ; l'environnement réel l'emporte sur lui.
load_dotenv(BASE_DIR.parent / '.env', override=False)


def env_required(name):
    """La variable d'environnement, ou l'arrêt au démarrage si elle manque ou est vide."""
    value = os.environ.get(name, '').strip()
    if not value:
        raise ImproperlyConfigured(
            f"La variable d'environnement {name} est absente ou vide. "
            "Renseigne-la dans le fichier .env à la racine du dépôt "
            "(modèle : .env.example) ou dans l'environnement du conteneur."
        )
    return value


def env_bool(name, default=False):
    """Booléen : 1, true, yes et on valent vrai ; absente ou vide, le défaut."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def env_int(name, default):
    """Entier ; absente ou vide, le défaut."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    try:
        return int(value.strip())
    except ValueError:
        # from None : sinon la ValueError de int() noie le message sous la trace d'import.
        raise ImproperlyConfigured(
            f"La variable d'environnement {name} doit être un nombre entier, "
            f"or elle vaut {value!r}."
        ) from None


def env_str(name, default):
    """Chaîne ; absente ou vide, le défaut."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    return value.strip()


def env_list(name, default=None):
    """Liste séparée par des virgules ; absente ou vide, le défaut."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


# SECRET_KEY absente exprès : chaque environnement fournit la sienne.

# Faux par défaut : seul development.py l'allume, jamais l'oubli d'une variable.
DEBUG = env_bool('DJANGO_DEBUG', False)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',
    # Tables des refresh révoqués : condition de BLACKLIST_AFTER_ROTATION et de logout/.
    'rest_framework_simplejwt.token_blacklist',
    # Pour son catalogue de traductions seul ; backend/locale/ bouche ses trous.
    'rest_framework_simplejwt',

    'accounts',
    'articles',
    'contact',
]

AUTH_USER_MODEL = 'accounts.CustomUser'


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS : à placer avant CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


def postgres_database():
    """Compose la configuration de la base PostgreSQL à partir de l'environnement."""
    return {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env_required('POSTGRES_DB'),
            'USER': env_required('POSTGRES_USER'),
            'PASSWORD': env_required('POSTGRES_PASSWORD'),
            # Défauts du venv ; en conteneur, Compose impose `db:5432`.
            'HOST': env_str('POSTGRES_HOST', 'localhost'),
            'PORT': env_int('POSTGRES_PORT', 5432),
        }
    }


# DATABASES absent exprès : l'import des réglages reste possible sans base.


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.PasswordComplexityValidator',
    },
]


# Pas de LocaleMiddleware : la langue ne suit pas l'Accept-Language, les libellés du projet étant français.
LANGUAGE_CODE = 'fr-fr'

# Lu avant les catalogues des apps : traduit les libellés que simplejwt laisse en anglais.
LOCALE_PATHS = [BASE_DIR / 'locale']

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Fermé par défaut : chaque vue PUBLIQUE déclare sa permission (AllowAny, ReadOnly).
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # 12 remplit sans trou la grille du blog, à deux comme à trois colonnes.
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    # Ne compte que les vues à `throttle_scope` ; un scope absent des taux fait échouer sa vue.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    # Compteur en LocMemCache, un par worker Gunicorn : le quota réel est multiplié par leur nombre.
    'DEFAULT_THROTTLE_RATES': {
        'login': env_str('THROTTLE_LOGIN', '5/min'),
        'register': env_str('THROTTLE_REGISTER', '5/hour'),
        'password_reset': env_str('THROTTLE_PASSWORD_RESET', '3/hour'),
        'password_reset_confirm': env_str('THROTTLE_PASSWORD_RESET_CONFIRM', '5/hour'),
        'password_change': env_str('THROTTLE_PASSWORD_CHANGE', '5/hour'),
        'account_delete': env_str('THROTTLE_ACCOUNT_DELETE', '5/hour'),
        'contact': env_str('THROTTLE_CONTACT', '5/hour'),
        'article_write': env_str('THROTTLE_ARTICLE_WRITE', '20/hour'),
    },
}

SIMPLE_JWT = {
    # 15 min : en localStorage, lisible par tout script, et rien ne le révoque avant échéance.
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    # Indissociables : la rotation seule laisse l'ancien refresh valide (README, « Les jetons »).
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')


# EMAIL_BACKEND absent exprès : hérité, il ferait ouvrir du SMTP à la suite de tests.

# Le défaut `.local` est refusé par tout relais réel : la production pose le sien.
DEFAULT_FROM_EMAIL = env_str('DEFAULT_FROM_EMAIL', 'no-reply@weeb.local')

# Adresse du front, racine des liens des emails ; sans barre finale, un chemin s'y ajoute.
FRONTEND_URL = env_str('FRONTEND_URL', 'http://localhost:5173').rstrip('/')


ADMINS = env_list('DJANGO_ADMINS')

# Le défaut de Django, `root@localhost`, serait refusé par le relais.
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Ici et non en production : la suite de tests vérifie ce que le rapport laisse sortir.
DEFAULT_EXCEPTION_REPORTER = 'config.rapport_erreurs.RapportSansUtilisateur'
DEFAULT_EXCEPTION_REPORTER_FILTER = 'config.rapport_erreurs.FiltreSansDonneesPersonnelles'


def _hors_console_de_django(record):
    """Écarte une ligne que le handler console de Django affiche déjà, DEBUG actif."""
    # Lu à l'écriture et non ici : development.py redéfinit DEBUG après ce fichier.
    from django.conf import settings

    return not (settings.DEBUG and (record.name == 'django' or record.name.startswith('django.')))


_NIVEAU_DES_JOURNAUX = env_str('DJANGO_LOG_LEVEL', 'INFO').upper()

# Ne pas redéfinir le logger `django` : il y perdrait son handler `mail_admins`.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'horodate': {'format': '{asctime} {levelname} {name} {message}', 'style': '{'},
    },
    'filters': {
        'hors_console_de_django': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': _hors_console_de_django,
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'horodate',
            'filters': ['hors_console_de_django'],
            # Sur le handler aussi : le niveau racine ne filtre pas ce que transmettent les enfants.
            'level': _NIVEAU_DES_JOURNAUX,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': _NIVEAU_DES_JOURNAUX,
    },
}
