"""Réglages de développement : machine du développeur, front Vite en local."""

from .base import *  # noqa: F403 — on repart de tous les réglages communs
from .base import env_bool, env_list, env_required

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
