import os

from django.core.wsgi import get_wsgi_application

# Production par défaut : seul un serveur d'application charge ce fichier.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_wsgi_application()
