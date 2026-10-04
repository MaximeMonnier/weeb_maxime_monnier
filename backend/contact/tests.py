"""Tests du contact : envoi public, refus, absence de lecture, tri, date et quota."""

from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import CustomUser

from .models import Contact

# Les cinq champs du modèle, dans un message que l'API accepte tel quel.
MESSAGE = {
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "subject": "Une question sur vos services",
    "message": "Bonjour, j'aimerais des précisions.",
}


def envoyer(client, corps):
    """POST sur le formulaire de contact, le corps sérialisé en JSON comme le fait le front."""
    return client.post(reverse("contact"), corps, content_type="application/json")


class ContactEnvoiPublicTests(TestCase):
    """Envoyer n'exige aucun compte : tout tient à l'AllowAny de la vue."""

    def test_un_visiteur_sans_compte_est_accepte(self):
        response = envoyer(self.client, MESSAGE)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Contact.objects.count(), 1)

    def test_le_message_est_enregistre_tel_quel(self):
        envoyer(self.client, MESSAGE)
        contact = Contact.objects.get()

        for champ, valeur in MESSAGE.items():
            with self.subTest(champ=champ):
                self.assertEqual(getattr(contact, champ), valeur)


class ContactValidationTests(TestCase):
    """Sans blank ni null au modèle, les cinq champs sont requis sans que le serializer le dise."""

    def test_chaque_champ_est_obligatoire(self):
        for champ in MESSAGE:
            with self.subTest(champ=champ):
                corps = {cle: valeur for cle, valeur in MESSAGE.items() if cle != champ}
                response = envoyer(self.client, corps)

                self.assertEqual(response.status_code, 400)
                self.assertIn(champ, response.json())

        self.assertEqual(Contact.objects.count(), 0)

    def test_un_champ_vide_ne_vaut_pas_un_champ_absent(self):
        """Chaîne vide et clé absente sont refusées, pour deux raisons différentes."""
        for champ in MESSAGE:
            with self.subTest(champ=champ):
                response = envoyer(self.client, {**MESSAGE, champ: ""})

                self.assertEqual(response.status_code, 400)
                self.assertIn(champ, response.json())

        self.assertEqual(Contact.objects.count(), 0)

    def test_un_email_malforme_est_refuse(self):
        response = envoyer(self.client, {**MESSAGE, "email": "jean.dupont"})

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertEqual(Contact.objects.count(), 0)

    def test_un_sujet_plus_long_que_le_champ_est_refuse(self):
        """max_length vit au modèle : le ModelSerializer en fait un 400 avant PostgreSQL."""
        response = envoyer(self.client, {**MESSAGE, "subject": "S" * 151})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_un_message_plus_long_que_la_borne_est_refuse(self):
        """message n'a pas de longueur en base : la borne ne vit que dans ContactSerializer."""
        response = envoyer(self.client, {**MESSAGE, "message": "M" * 5001})

        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.json())
        self.assertEqual(Contact.objects.count(), 0)
        self.assertEqual(envoyer(self.client, {**MESSAGE, "message": "M" * 5000}).status_code, 201)


class ContactDateImposeeTests(TestCase):
    """La date d'arrivée vient du serveur, quoi qu'en dise le corps envoyé."""

    def test_la_date_envoyee_par_le_client_est_ignoree(self):
        response = envoyer(self.client, {**MESSAGE, "created_at": "2000-01-01T00:00:00Z"})

        self.assertEqual(response.status_code, 201)
        # Vraie date de traitement, à une minute près : la suite ne date rien de 2000.
        self.assertGreater(Contact.objects.get().created_at, timezone.now() - timedelta(minutes=1))

    def test_la_reponse_de_creation_porte_la_date(self):
        """Le seul endroit d'où elle sort : contact n'expose aucune route de lecture."""
        response = envoyer(self.client, MESSAGE)

        self.assertEqual(
            parse_datetime(response.json()["created_at"]), Contact.objects.get().created_at,
        )


class ContactLectureTests(TestCase):
    """Les messages reçus ne ressortent jamais par l'API : ils ne se lisent que dans l'admin."""

    def setUp(self):
        Contact.objects.create(**MESSAGE)

    def test_la_liste_n_existe_pas_pour_un_visiteur(self):
        """405 et non 403 : CreateAPIView ne monte que POST, il n'y a pas de lecture à protéger."""
        response = self.client.get(reverse("contact"))

        self.assertEqual(response.status_code, 405)
        self.assertNotIn(MESSAGE["email"], response.content.decode())

    def test_la_liste_n_existe_pas_davantage_pour_un_membre(self):
        membre = CustomUser.objects.create_user(
            email="membre@example.com", first_name="M", last_name="Embre",
            password="MotDePasseValide123",
        )

        response = self.client.get(
            reverse("contact"), headers={"authorization": f"Bearer {AccessToken.for_user(membre)}"},
        )

        self.assertEqual(response.status_code, 405)
        self.assertNotIn(MESSAGE["email"], response.content.decode())


class ContactThrottleTests(TestCase):
    """Le quota est le seul frein au remplissage de la table d'un endpoint public."""

    def setUp(self):
        # Le compteur vit dans un cache de processus, que rien ne vide entre deux tests.
        cache.clear()

    # Le taux est éteint pour toute la suite par config/settings/test.py : il faut le
    # réarmer ici, sinon ce test seul ne verrait jamais de refus.
    @patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"contact": "5/hour"})
    def test_le_sixieme_message_de_l_heure_est_refuse(self):
        for _ in range(5):
            self.assertEqual(envoyer(self.client, MESSAGE).status_code, 201)

        self.assertEqual(envoyer(self.client, MESSAGE).status_code, 429)
        self.assertEqual(Contact.objects.count(), 5)

    @patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"contact": "5/hour"})
    def test_un_envoi_refuse_consomme_le_quota(self):
        """DRF compte avant la vue : sinon le quota se contournerait par des 400."""
        for _ in range(5):
            self.assertEqual(envoyer(self.client, {}).status_code, 400)

        self.assertEqual(envoyer(self.client, MESSAGE).status_code, 429)
        self.assertEqual(Contact.objects.count(), 0)


class ContactOrdreTests(TestCase):
    """Du plus récent au plus ancien, et seul Meta.ordering le dit."""

    def setUp(self):
        # Les trois messages sont créés dans le désordre : sans cela, l'ordre attendu
        # serait aussi celui des identifiants, et un Meta.ordering retiré passerait.
        # auto_now_add écrase toute date passée à create(), d'où l'UPDATE qui suit.
        for sujet, jours in (("Intermédiaire", 1), ("Ancien", 2), ("Récent", 0)):
            contact = Contact.objects.create(**{**MESSAGE, "subject": sujet})
            Contact.objects.filter(pk=contact.pk).update(
                created_at=timezone.now() - timedelta(days=jours),
            )

    def test_les_messages_vont_du_plus_recent_au_plus_ancien(self):
        self.assertEqual(
            [contact.subject for contact in Contact.objects.all()],
            ["Récent", "Intermédiaire", "Ancien"],
        )


class ContactModeleTests(TestCase):
    """Cinq champs saisis, une date posée par le serveur, le sujet pour étiquette."""

    def test_le_sujet_sert_d_etiquette(self):
        """Le sujet titre le formulaire de l'admin, au lieu de « Contact object (1) »."""
        self.assertEqual(str(Contact.objects.create(**MESSAGE)), MESSAGE["subject"])
