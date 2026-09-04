"""Tests de la réinitialisation de mot de passe : la réponse ne doit rien révéler."""

import re

from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .models import CustomUser
from .views import NEUTRAL_RESPONSE


class PasswordResetRequestTests(TestCase):
    """La demande répond la même chose dans tous les cas et n'écrit le lien que par email."""

    def setUp(self):
        self.url = reverse("password-reset")
        self.actif = CustomUser.objects.create_user(
            email="actif@example.com", first_name="A", last_name="Actif",
            password="MotDePasseValide123",
        )
        self.inactif = CustomUser.objects.create_user(
            email="inactif@example.com", first_name="I", last_name="Inactif",
            password="MotDePasseValide123",
        )
        self.inactif.is_active = False
        self.inactif.save()

    def demander(self, email):
        return self.client.post(self.url, {"email": email}, content_type="application/json")

    def test_compte_actif_recoit_le_lien_sans_rien_renvoyer(self):
        reponse = self.demander("actif@example.com")

        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.json(), NEUTRAL_RESPONSE)
        # Le cœur de l'issue #68 : le client ne doit tenir ni l'uid ni le token.
        self.assertNotIn("uid", reponse.json())
        self.assertNotIn("token", reponse.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/reset-password?uid=", mail.outbox[0].body)

    def test_email_inconnu_repond_exactement_pareil(self):
        connu = self.demander("actif@example.com")
        mail.outbox.clear()
        inconnu = self.demander("jamais-inscrit@example.com")

        self.assertEqual(inconnu.status_code, connu.status_code)
        self.assertEqual(inconnu.json(), connu.json())
        self.assertEqual(mail.outbox, [])

    def test_compte_inactif_repond_pareil_mais_ne_recoit_rien(self):
        reponse = self.demander("inactif@example.com")

        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.json(), NEUTRAL_RESPONSE)
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
        lien = re.search(r"/reset-password\?uid=([^&]+)&token=(\S+)", mail.outbox[0].body)
        self.uid, self.token = lien.group(1), lien.group(2)

    def confirmer(self, mot_de_passe):
        return self.client.post(
            self.url,
            {"uid": self.uid, "token": self.token, "new_password": mot_de_passe},
            content_type="application/json",
        )

    def test_le_lien_change_le_mot_de_passe(self):
        reponse = self.confirmer("NouveauMotDePasse456")

        self.assertEqual(reponse.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NouveauMotDePasse456"))

    def test_le_lien_ne_sert_quune_fois(self):
        self.confirmer("NouveauMotDePasse456")

        self.assertEqual(self.confirmer("EncoreUnAutre789").status_code, 400)

    def test_un_compte_desactive_entre_temps_ne_peut_plus_confirmer(self):
        self.user.is_active = False
        self.user.save()

        self.assertEqual(self.confirmer("NouveauMotDePasse456").status_code, 400)
