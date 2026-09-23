"""Sonde de santé du conteneur : la seule vue du projet qui ne serve aucun domaine métier."""

from http import HTTPStatus

from django.db import DatabaseError, connection
from django.http import JsonResponse


# Vue Django nue et non DRF : le défaut IsAuthenticated fermerait la route, et ni le
# jeton ni les quotas n'ont de sens pour une sonde qui s'appelle elle-même.
def health(request):
    """Répond 200 si la base est joignable, 503 sinon. Endpoint PUBLIC, interne au conteneur."""
    # SELECT 1 : son coût ne bouge pas quand la table grandit, là où la pagination de
    # /api/articles/ comptait toute la table à chaque passage de la sonde.
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except DatabaseError:
        return JsonResponse(
            {"detail": "Base de données injoignable."},
            status=HTTPStatus.SERVICE_UNAVAILABLE,
        )

    return JsonResponse({"status": "ok"})
