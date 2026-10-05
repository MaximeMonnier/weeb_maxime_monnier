"""Réglages communs : aucun secret, aucune valeur propre à une machine."""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Ce fichier est backend/config/settings/base.py : trois crans au-dessus = backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Le `.env` de la racine du dépôt ; absent en conteneur, où Docker fournit les variables.
# `override=False` : l'environnement réel l'emporte toujours sur le fichier.
load_dotenv(BASE_DIR.parent / '.env', override=False)


def env_required(name):
    """Renvoie la variable d'environnement demandée, ou interrompt le démarrage si elle manque."""
    value = os.environ.get(name, '').strip()
    if not value:
        raise ImproperlyConfigured(
            f"La variable d'environnement {name} est absente ou vide. "
            "Renseigne-la dans le fichier .env à la racine du dépôt "
            "(modèle : .env.example) ou dans l'environnement du conteneur."
        )
    return value


def env_bool(name, default=False):
    """Lit une variable d'environnement comme un booléen : 1, true, yes et on valent vrai."""
    value = os.environ.get(name)
    # Une variable présente mais vide (`DJANGO_DEBUG=` dans un .env) vaut "non
    # renseignée" : on retombe sur le défaut, comme env_list.
    if value is None or not value.strip():
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def env_int(name, default):
    """Lit une variable d'environnement comme un entier, ou renvoie le défaut si elle est absente ou vide."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    try:
        return int(value.strip())
    except ValueError:
        # `from None` : sans ça, la ValueError de int() s'affiche en premier et
        # noie le message utile sous des dizaines de lignes de trace d'import.
        raise ImproperlyConfigured(
            f"La variable d'environnement {name} doit être un nombre entier, "
            f"or elle vaut {value!r}."
        ) from None


def env_str(name, default):
    """Lit une variable d'environnement comme une chaîne, ou renvoie le défaut si elle est absente ou vide."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    return value.strip()


def env_list(name, default=None):
    """Lit une variable d'environnement comme une liste de valeurs séparées par des virgules."""
    value = os.environ.get(name)
    if value is None or not value.strip():
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


# SECRET_KEY n'est PAS définie ici : chaque environnement dit d'où vient la sienne.
# La poser ici l'exigerait jusque pour lancer les tests.

# Par défaut faux : c'est l'environnement de développement qui l'active,
# jamais l'oubli d'une variable qui l'allume en production.
DEBUG = env_bool('DJANGO_DEBUG', False)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # --- Bibliothèques tierces ---
    'rest_framework',   # Django REST Framework : la couche qui transforme Django en API JSON
    'corsheaders',      # Autorise le front React (:5173) à appeler l'API (:8000)
    # Livrée avec simplejwt, mais inerte tant qu'elle n'est pas installée : c'est
    # elle qui apporte les tables où atterrissent les refresh révoqués, donc la
    # condition de BLACKLIST_AFTER_ROTATION comme de la vue de déconnexion.
    'rest_framework_simplejwt.token_blacklist',
    # Sans modèle ni route : présente pour que Django charge son catalogue, faute de
    # quoi tous ses refus sortent en anglais. backend/locale/ bouche ses trous.
    'rest_framework_simplejwt',

    # --- Applications ---
    'accounts',
    'articles',
    'contact',
]

AUTH_USER_MODEL = 'accounts.CustomUser'


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS : à placer le plus haut possible, avant CommonMiddleware
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
            # Défauts pour le backend lancé dans le venv ; en conteneur, Compose impose `db:5432`.
            'HOST': env_str('POSTGRES_HOST', 'localhost'),
            'PORT': env_int('POSTGRES_PORT', 5432),
        }
    }


# DATABASES n'est PAS défini ici : chaque environnement appelle postgres_database(),
# pour que l'import des réglages reste possible sans base configurée.


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
    # Cinquième validateur, maison : les quatre de Django ignorent la casse et les
    # chiffres, que le formulaire d'inscription exige déjà côté navigateur.
    {
        'NAME': 'accounts.validators.PasswordComplexityValidator',
    },
]


# Fixe la langue des messages rendus par Django et DRF — ceux des validateurs de mot
# de passe compris. Aucun LocaleMiddleware : la langue ne suit pas l'Accept-Language
# du client, tous les libellés écrits par le projet étant français.
LANGUAGE_CODE = 'fr-fr'

# Lu avant les catalogues des apps : traduit les libellés que simplejwt laisse en anglais.
LOCALE_PATHS = [BASE_DIR / 'locale']

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

# Dossier où `collectstatic` rassemble les fichiers statiques pour qu'un serveur
# web les serve en production. Ignoré par git : c'est un dossier généré.
STATIC_ROOT = BASE_DIR / 'staticfiles'


REST_FRAMEWORK = {
    # Comment l'API reconnaît un utilisateur : via un token JWT dans l'en-tête "Authorization: Bearer <token>"
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Règle PAR DÉFAUT : il faut être authentifié pour accéder à un endpoint.
    # "Sécurisé par défaut" : chaque vue PUBLIQUE (inscription, connexion, liste des
    # articles, contact) devra explicitement autoriser l'accès (AllowAny / ReadOnly).
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Toute liste sort par pages, sous la forme {count, next, previous, results}.
    # 12 remplit sans trou la grille du blog, qu'elle ait deux ou trois colonnes.
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    # ScopedRateThrottle ne compte QUE les vues qui déclarent un `throttle_scope` : un membre
    # connecté par compte, un visiteur par IP. Un scope absent des taux fait échouer sa vue.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    # Défauts calés sur l'usage humain. Le compteur vit dans LocMemCache, un par worker
    # Gunicorn : le quota réel est multiplié par leur nombre. Assumé, pas de Redis ici.
    'DEFAULT_THROTTLE_RATES': {
        'login': env_str('THROTTLE_LOGIN', '5/min'),
        'register': env_str('THROTTLE_REGISTER', '5/hour'),
        'password_reset': env_str('THROTTLE_PASSWORD_RESET', '3/hour'),
        'password_reset_confirm': env_str('THROTTLE_PASSWORD_RESET_CONFIRM', '5/hour'),
        'password_change': env_str('THROTTLE_PASSWORD_CHANGE', '5/hour'),
        'account_delete': env_str('THROTTLE_ACCOUNT_DELETE', '5/hour'),
        'contact': env_str('THROTTLE_CONTACT', '5/hour'),
    },
}

SIMPLE_JWT = {
    # 15 min et non 60 : le token d'accès vit dans localStorage, donc lisible par
    # tout script de la page, et rien ne le révoque avant son échéance — même un
    # mot de passe changé. Sa durée est la seule borne de la fenêtre de vol.
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # le token de rafraîchissement dure 1 jour
    # Indissociables : la rotation seule laisserait l'ancien refresh valide jusqu'à
    # son échéance. Détail au README, § « Les jetons ».
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Front et API sont deux origines en développement (:5173, :8000) : sans liste,
# le navigateur bloque chaque appel.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')


# --- Emails ---
# EMAIL_BACKEND n'est PAS défini ici : un canal hérité ferait ouvrir des connexions
# SMTP à la suite de tests.

# Adresse expéditrice des messages, celle que verra le destinataire. Le défaut
# ne vaut qu'en développement : un domaine `.local` est refusé par tout relais
# réel, la production doit poser le sien.
DEFAULT_FROM_EMAIL = env_str('DEFAULT_FROM_EMAIL', 'no-reply@weeb.local')

# Racine des liens écrits DANS les emails, celui de réinitialisation de mot de
# passe en tête. C'est l'adresse du front, pas celle de l'API : le destinataire
# clique vers une page React. Sans barre oblique finale, un chemin s'y ajoute.
FRONTEND_URL = env_str('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
