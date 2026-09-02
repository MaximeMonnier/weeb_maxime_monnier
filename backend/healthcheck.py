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

# Les réglages de production redirigent tout le trafic en clair vers HTTPS.
# Cet en-tête dit à Django que la requête d'origine était chiffrée — ce que
# ferait le reverse proxy devant lequel ce conteneur est destiné à tourner.
# Django ne l'écoute QUE si DJANGO_BEHIND_PROXY vaut 1. Sans cette variable,
# la sonde reçoit une redirection, échoue, et c'est le comportement voulu :
# un conteneur qui redirige tout vers une adresse HTTPS inexistante ne peut
# servir personne.
request = urllib.request.Request(URL, headers={'X-Forwarded-Proto': 'https'})

try:
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        if response.status == 200:
            sys.exit(0)
        print(f'Code de réponse inattendu : {response.status}', file=sys.stderr)
except Exception as error:  # noqa: BLE001 — toute erreur signifie « pas prêt »
    print(f'API injoignable : {error}', file=sys.stderr)

sys.exit(1)
