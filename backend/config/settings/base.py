"""
Réglages communs à tous les environnements du projet Weeb.

Ce module ne contient AUCUN secret et AUCUNE valeur propre à une machine :
tout ce qui change d'un environnement à l'autre est lu depuis l'environnement
(fichier `.env` à la racine en local, variables injectées par Docker ailleurs).

Les modules `development`, `test` et `production` héritent de ce fichier ;
celui qui s'applique est choisi par la variable DJANGO_SETTINGS_MODULE.

Documentation : https://docs.djangoproject.com/en/6.0/ref/settings/
"""

import os
from datetime import timedelta  # sert à définir la durée de validité des tokens JWT
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Ce fichier est backend/config/settings/base.py : trois crans au-dessus = backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Charge le `.env` de la racine du dépôt (un cran au-dessus de backend/).
# En conteneur ce fichier n'existe pas et l'appel ne fait rien : les variables
# viennent alors de Docker. `override=False` pour que l'environnement réel
# l'emporte toujours sur le contenu du fichier.
load_dotenv(BASE_DIR.parent / '.env', override=False)


# ============================================
#  Lecture de l'environnement
# ============================================

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


# ============================================
#  Sécurité
# ============================================

# SECRET_KEY n'est PAS définie ici : chaque environnement dit d'où vient la
# sienne. `development` et `production` l'exigent depuis l'environnement, sans
# aucune valeur de repli ; `test` pose une clé factice, seuls les identifiants
# de base lui restant nécessaires.
# La définir ici la rendrait obligatoire y compris pour lancer les tests.

# Par défaut faux : c'est l'environnement de développement qui l'active,
# jamais l'oubli d'une variable qui l'allume en production.
DEBUG = env_bool('DJANGO_DEBUG', False)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS')


# Application definition

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


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

def postgres_database():
    """Compose la configuration de la base PostgreSQL à partir de l'environnement."""
    return {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env_required('POSTGRES_DB'),
            'USER': env_required('POSTGRES_USER'),
            'PASSWORD': env_required('POSTGRES_PASSWORD'),
            # Hôte et port ont un défaut, contrairement aux identifiants : la
            # base écoute sur le port standard de la machine tant que le backend
            # tourne hors conteneur. Une fois le backend conteneurisé,
            # POSTGRES_HOST prendra le nom du service Compose (`db`).
            'HOST': env_str('POSTGRES_HOST', 'localhost'),
            'PORT': env_int('POSTGRES_PORT', 5432),
        }
    }


# DATABASES n'est PAS défini ici, pour la même raison que SECRET_KEY : les
# identifiants sont exigés depuis l'environnement, et les exiger dès ce module
# rendrait impossible le simple import des réglages sans base configurée.
# Chaque environnement appelle postgres_database() lui-même.


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

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
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'

# Dossier où `collectstatic` rassemble les fichiers statiques pour qu'un serveur
# web les serve en production. Ignoré par git : c'est un dossier généré.
STATIC_ROOT = BASE_DIR / 'staticfiles'


# ============================================
#  Django REST Framework (DRF)
# ============================================
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
}

# ============================================
#  JWT (djangorestframework-simplejwt)
# ============================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # le token d'accès expire au bout d'1h
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # le token de rafraîchissement dure 1 jour
}

# ============================================
#  CORS — autoriser le front (Vite) à appeler l'API
# ============================================
# Sans ça, le navigateur BLOQUE les requêtes du front (:5173) vers l'API (:8000)
# car ce sont deux "origines" différentes (politique de sécurité Same-Origin).
# Les origines autorisées changent selon l'environnement : elles sont lues depuis
# CORS_ALLOWED_ORIGINS, sous forme de liste séparée par des virgules.
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')


# ============================================
#  Emails
# ============================================
# EMAIL_BACKEND n'est PAS défini ici, pour la même raison que SECRET_KEY : le
# canal d'envoi change du tout au tout d'un environnement à l'autre, et un
# défaut hérité ferait qu'une suite de tests ouvrirait des connexions réseau.

# Adresse expéditrice des messages, celle que verra le destinataire. Le défaut
# ne vaut qu'en développement : un domaine `.local` est refusé par tout relais
# réel, la production doit poser le sien.
DEFAULT_FROM_EMAIL = env_str('DEFAULT_FROM_EMAIL', 'no-reply@weeb.local')

# Racine des liens écrits DANS les emails, celui de réinitialisation de mot de
# passe en tête. C'est l'adresse du front, pas celle de l'API : le destinataire
# clique vers une page React. Sans barre oblique finale, un chemin s'y ajoute.
FRONTEND_URL = env_str('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
