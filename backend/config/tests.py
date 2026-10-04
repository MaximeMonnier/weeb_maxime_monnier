"""Tests de la route de santé : ouverte au visiteur, une seule requête, 503 sans base."""

from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase
from django.urls import reverse


class HealthTests(TestCase):
    """Les trois garanties que le HEALTHCHECK du Dockerfile suppose sans les vérifier."""

    def test_repond_200_sans_jeton(self):
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)

    def test_ne_coute_qu_une_requete(self):
        # La sonde passe toutes les cinq secondes : une seconde requête, ou un COUNT
        # sur une table qui grandit, se paierait à chaque passage.
        with self.assertNumQueries(1):
            self.client.get(reverse("health"))

    def test_repond_503_quand_la_base_leve(self):
        with patch("config.views.connection.cursor", side_effect=DatabaseError("hors service")):
            response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 503)
