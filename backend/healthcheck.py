"""Sonde de santé du conteneur : sort 0 si l'API répond 200, 1 sinon."""

# Pas curl : absent de python:3.13-slim, et l'installer coûte 10 Mo pour une requête.

import sys
import urllib.request

# /health/ lit la base : un Gunicorn devant une base injoignable répond quand même au TCP.
# 127.0.0.1 doit figurer dans DJANGO_ALLOWED_HOSTS, sinon Django répond 400.
URL = 'http://127.0.0.1:8000/health/'
TIMEOUT_SECONDS = 5

# Gunicorn joint sans le nginx : la sonde rejoue son en-tête, sinon la production répond 301.
request = urllib.request.Request(URL, headers={'X-Forwarded-Proto': 'https'})

try:
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        if response.status == 200:
            sys.exit(0)
        print(f'Code de réponse inattendu : {response.status}', file=sys.stderr)
except Exception as error:  # noqa: BLE001 — toute erreur signifie « pas prêt »
    print(f'API injoignable : {error}', file=sys.stderr)

sys.exit(1)
