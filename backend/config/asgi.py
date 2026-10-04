"""Point d'entrée ASGI du projet, en réglages de production par défaut."""

import os

from django.core.asgi import get_asgi_application

# Production par défaut : ce point d'entrée n'est utilisé que par un
# serveur d'application. Le défaut le plus sûr est donc le plus strict.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
