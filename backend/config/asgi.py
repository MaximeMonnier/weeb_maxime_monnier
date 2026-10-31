import os

from django.core.asgi import get_asgi_application

# Production par défaut : seul un serveur d'application charge ce fichier.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
