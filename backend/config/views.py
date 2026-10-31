from http import HTTPStatus

from django.db import DatabaseError, connection
from django.http import JsonResponse


# Vue Django nue, pas DRF : le défaut IsAuthenticated fermerait la sonde.
def health(request):
    """Répond 200 si la base est joignable, 503 sinon. Endpoint PUBLIC, interne au conteneur."""
    # SELECT 1 : coût constant, quelle que soit la taille des tables.
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except DatabaseError:
        return JsonResponse(
            {"detail": "Base de données injoignable."},
            status=HTTPStatus.SERVICE_UNAVAILABLE,
        )

    return JsonResponse({"status": "ok"})
