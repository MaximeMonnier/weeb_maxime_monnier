"""Tests du formulaire de contact : ce qu'un visiteur sans compte peut envoyer, ce que
l'API refuse d'enregistrer, ce qu'elle ne rend jamais en lecture et à partir de quel
rang elle cesse de répondre — la permission publique, les longueurs de champ, l'absence
de route de lecture et le taux du quota vivant chacune dans un fichier différent."""

from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
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
    """Envoyer n'exige aucun compte, alors que le défaut du projet est IsAuthenticated :
    tout tient au AllowAny de la vue, qu'aucun réglage ne rappelle."""

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
    """Ce que le serializer refuse : le modèle n'ayant ni blank ni null, les cinq champs
    sont requis sans que ContactSerializer n'en dise un mot."""

    def test_chaque_champ_est_obligatoire(self):
        for champ in MESSAGE:
            with self.subTest(champ=champ):
                corps = {cle: valeur for cle, valeur in MESSAGE.items() if cle != champ}
                response = envoyer(self.client, corps)

                self.assertEqual(response.status_code, 400)
                self.assertIn(champ, response.json())

        self.assertEqual(Contact.objects.count(), 0)

    def test_un_champ_vide_ne_vaut_pas_un_champ_absent(self):
        """Un formulaire envoie "" plutôt que d'omettre la clé : sans blank=True au modèle,
        le serializer refuse les deux, mais pour deux raisons différentes."""
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
        """max_length ne vit qu'au modèle : c'est le ModelSerializer qui en fait un 400,
        au lieu de laisser PostgreSQL lever une erreur de base sur un endpoint public."""
        response = envoyer(self.client, {**MESSAGE, "subject": "S" * 151})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_un_message_long_passe(self):
        """message est un TextField : rien ne borne sa longueur, seul le quota borne le volume."""
        response = envoyer(self.client, {**MESSAGE, "message": "M" * 5000})

        self.assertEqual(response.status_code, 201)


class ContactLectureTests(TestCase):
    """Les messages reçus ne ressortent jamais par l'API : ils ne se lisent que dans l'admin."""

    def setUp(self):
        Contact.objects.create(**MESSAGE)

    def test_la_liste_n_existe_pas_pour_un_visiteur(self):
        """405 et non 403 : CreateAPIView ne monte que POST, il n'y a pas de lecture à
        protéger — ajouter ListAPIView ouvrirait la boîte à tous, AllowAny étant global à la vue."""
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
    """Le quota est le seul frein au remplissage de la table : l'endpoint est public,
    et rien d'autre n'y limite le nombre d'écritures."""

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
        """DRF compte avant d'entrer dans la vue : cinq corps invalides ferment la porte
        au sixième, valide — sans quoi le quota se contournerait par des 400."""
        for _ in range(5):
            self.assertEqual(envoyer(self.client, {}).status_code, 400)

        self.assertEqual(envoyer(self.client, MESSAGE).status_code, 429)
        self.assertEqual(Contact.objects.count(), 0)


class ContactModeleTests(TestCase):
    """Le modèle tel qu'il est : cinq champs, aucun horodatage, le sujet pour étiquette."""

    def test_le_sujet_sert_d_etiquette(self):
        """Pas dans la liste de l'admin, dont ContactAdmin nomme les colonnes : dans le titre
        du formulaire, la confirmation de suppression et les actions récentes, où le défaut de
        Django rendrait « Contact object (1) »."""
        self.assertEqual(str(Contact.objects.create(**MESSAGE)), MESSAGE["subject"])
