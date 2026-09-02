"""Sonde de santé du conteneur : sort 0 si l'API répond 200, 1 sinon."""

# Pourquoi un script Python et non `curl` : l'image python:3.13-slim n'embarque
# pas curl, et l'installer ajouterait une dizaine de mégaoctets et une surface
# d'attaque pour une seule requête HTTP. La bibliothèque standard suffit.
#
# La sonde vise un endpoint qui LIT LA BASE, et pas seulement le port : un
# Gunicorn debout devant une base injoignable répondrait au TCP tout en étant
# incapable de servir la moindre requête utile.

import sys
import urllib.request

# 127.0.0.1 et non le nom du conteneur : la sonde s'exécute à l'intérieur de
# celui-ci. Cet hôte doit figurer dans DJANGO_ALLOWED_HOSTS, sans quoi Django
# répond 400 et le conteneur est déclaré malade à tort.
URL = 'http://127.0.0.1:8000/api/articles/'
TIMEOUT_SECONDS = 5

# La sonde s'adresse à Gunicorn EN DIRECT, sans traverser le proxy TLS : elle
# teste CE conteneur, pas la chaîne entière. Elle rejoue donc elle-même l'en-tête
# que le proxy pose, sans quoi les réglages de production lui répondraient 301.
request = urllib.request.Request(URL, headers={'X-Forwarded-Proto': 'https'})

try:
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        if response.status == 200:
            sys.exit(0)
        print(f'Code de réponse inattendu : {response.status}', file=sys.stderr)
except Exception as error:  # noqa: BLE001 — toute erreur signifie « pas prêt »
    print(f'API injoignable : {error}', file=sys.stderr)

sys.exit(1)
