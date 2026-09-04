"""Tests de la réinitialisation de mot de passe : la réponse ne doit rien révéler."""

import re

from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .models import CustomUser
from .views import INVALID_LINK_RESPONSE, NEUTRAL_RESPONSE


class PasswordResetRequestTests(TestCase):
    """La demande répond la même chose dans tous les cas et n'écrit le lien que par email."""

    def setUp(self):
        self.url = reverse("password-reset")
        self.active_user = CustomUser.objects.create_user(
            email="actif@example.com", first_name="A", last_name="Actif",
            password="MotDePasseValide123",
        )
        self.inactive_user = CustomUser.objects.create_user(
            email="inactif@example.com", first_name="I", last_name="Inactif",
            password="MotDePasseValide123",
        )
        self.inactive_user.is_active = False
        self.inactive_user.save()

    def request_reset(self, email):
        return self.client.post(self.url, {"email": email}, content_type="application/json")

    def test_compte_actif_recoit_le_lien_sans_rien_renvoyer(self):
        response = self.request_reset("actif@example.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), NEUTRAL_RESPONSE)
        # Le cœur de l'issue #68 : le client ne doit tenir ni l'uid ni le token.
        self.assertNotIn("uid", response.json())
        self.assertNotIn("token", response.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["actif@example.com"])
        self.assertIn("/reset-password?uid=", mail.outbox[0].body)

    def test_email_inconnu_repond_exactement_pareil(self):
        known = self.request_reset("actif@example.com")
        mail.outbox.clear()
        unknown = self.request_reset("jamais-inscrit@example.com")

        self.assertEqual(unknown.status_code, known.status_code)
        self.assertEqual(unknown.json(), known.json())
        self.assertEqual(mail.outbox, [])

    def test_compte_inactif_repond_pareil_mais_ne_recoit_rien(self):
        response = self.request_reset("inactif@example.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), NEUTRAL_RESPONSE)
        self.assertEqual(mail.outbox, [])


class PasswordResetConfirmTests(TestCase):
    """Le lien reçu par email change bien le mot de passe, et ne sert qu'une fois."""

    def setUp(self):
        self.url = reverse("password-reset-confirm")
        self.user = CustomUser.objects.create_user(
            email="actif@example.com", first_name="A", last_name="Actif",
            password="AncienMotDePasse123",
        )
        self.client.post(reverse("password-reset"), {"email": self.user.email},
                         content_type="application/json")
        link = re.search(r"/reset-password\?uid=([^&]+)&token=(\S+)", mail.outbox[0].body)
        self.uid, self.token = link.group(1), link.group(2)

    def confirm(self, new_password):
        return self.client.post(
            self.url,
            {"uid": self.uid, "token": self.token, "new_password": new_password},
            content_type="application/json",
        )

    def test_le_lien_change_le_mot_de_passe(self):
        response = self.confirm("NouveauMotDePasse456")

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NouveauMotDePasse456"))

    def test_le_lien_ne_sert_quune_fois(self):
        self.assertEqual(self.confirm("NouveauMotDePasse456").status_code, 200)

        self.assertEqual(self.confirm("EncoreUnAutre789").status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NouveauMotDePasse456"))

    def test_un_compte_desactive_entre_temps_ne_peut_plus_confirmer(self):
        self.user.is_active = False
        self.user.save()

        response = self.confirm("NouveauMotDePasse456")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), INVALID_LINK_RESPONSE)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AncienMotDePasse123"))
