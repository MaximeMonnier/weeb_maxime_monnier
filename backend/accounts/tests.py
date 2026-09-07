"""Tests des mots de passe : ce que la réponse ne doit pas révéler, ce qu'elle doit refuser,
ce que l'admin doit hasher, et à partir de quand l'API refuse de répondre."""

import re
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import Client, SimpleTestCase, TestCase
from django.urls import resolve, reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.throttling import ScopedRateThrottle

from .models import CustomUser
from .validators import PasswordComplexityValidator
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

    def post(self, uid, token, new_password="NouveauMotDePasse456"):
        return self.client.post(
            self.url,
            {"uid": uid, "token": token, "new_password": new_password},
            content_type="application/json",
        )

    def confirm(self, new_password):
        return self.post(self.uid, self.token, new_password)

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

    def test_les_deux_echecs_sont_indistinguables(self):
        """Un uid étant base64(pk), deux messages diraient quels pk sont des comptes actifs."""
        unknown_uid = self.post(
            urlsafe_base64_encode(force_bytes(self.user.pk + 10_000)), self.token
        )
        wrong_token = self.post(self.uid, "mauvais-token")

        self.assertEqual(unknown_uid.status_code, 400)
        self.assertEqual(unknown_uid.status_code, wrong_token.status_code)
        self.assertEqual(unknown_uid.json(), wrong_token.json())

    def test_un_compte_desactive_entre_temps_ne_peut_plus_confirmer(self):
        self.user.is_active = False
        self.user.save()

        response = self.confirm("NouveauMotDePasse456")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), INVALID_LINK_RESPONSE)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AncienMotDePasse123"))


class PasswordValidationTests(TestCase):
    """Les deux endpoints qui reçoivent un mot de passe passent par AUTH_PASSWORD_VALIDATORS."""

    WEAK_PASSWORD = "12345678"
    STRONG_PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.register_url = reverse("register")
        self.confirm_url = reverse("password-reset-confirm")
        self.user = CustomUser.objects.create_user(
            email="actif@example.com", first_name="A", last_name="Actif",
            password="AncienMotDePasse123",
        )
        self.client.post(reverse("password-reset"), {"email": self.user.email},
                         content_type="application/json")
        link = re.search(r"/reset-password\?uid=([^&]+)&token=(\S+)", mail.outbox[0].body)
        self.uid, self.token = link.group(1), link.group(2)

    def register(self, password, email="nouveau@example.com"):
        return self.client.post(
            self.register_url,
            {"email": email, "first_name": "N", "last_name": "Nouveau", "password": password},
            content_type="application/json",
        )

    def confirm(self, new_password):
        return self.client.post(
            self.confirm_url,
            {"uid": self.uid, "token": self.token, "new_password": new_password},
            content_type="application/json",
        )

    def test_inscription_refuse_un_mot_de_passe_faible(self):
        response = self.register(self.WEAK_PASSWORD)

        self.assertEqual(response.status_code, 400)
        # Sous la clé du champ, et non à la racine : c'est là que le formulaire l'affiche.
        self.assertIn("password", response.json())
        self.assertEqual(CustomUser.objects.filter(email="nouveau@example.com").count(), 0)

    def test_inscription_accepte_un_mot_de_passe_conforme(self):
        response = self.register(self.STRONG_PASSWORD)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(CustomUser.objects.filter(email="nouveau@example.com").exists())

    def test_confirmation_refuse_un_mot_de_passe_faible(self):
        response = self.confirm(self.WEAK_PASSWORD)

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.json())
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AncienMotDePasse123"))

    def test_confirmation_accepte_un_mot_de_passe_conforme(self):
        response = self.confirm(self.STRONG_PASSWORD)

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.STRONG_PASSWORD))

    def test_les_messages_de_refus_sortent_en_francais(self):
        """LANGUAGE_CODE tient les libellés de Django, que le README publie tels quels."""
        response = self.register(self.WEAK_PASSWORD)

        self.assertIn("Ce mot de passe est trop courant.", response.json()["password"])

    def test_inscription_refuse_un_mot_de_passe_tire_de_l_email(self):
        """La confirmation ne tient pas encore l'identité du compte, la similarité y est muette."""
        response = self.register("Chatonbleu42", email="Chatonbleu42@example.com")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())

    def test_les_quatre_validateurs_de_django_ne_suffisent_pas(self):
        """Assez longs, ni courants ni numériques : seul le cinquième validateur les rejette."""
        # Une classe manquante par cas : sans le message, une règle réduite au seul
        # chiffre refuserait encore le premier et le test resterait vert.
        for password in ("motdepassesansrien", "motdepasse123", "MOTDEPASSE123"):
            with self.subTest(password=password):
                response = self.register(password)

                self.assertEqual(response.status_code, 400)
                self.assertEqual(
                    response.json()["password"], [PasswordComplexityValidator.MESSAGE]
                )


class CustomUserAdminTests(TestCase):
    """L'admin des utilisateurs hashe le mot de passe saisi et ne montre jamais le hash."""

    PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            email="admin@example.com", first_name="Ad", last_name="Min",
            password=self.PASSWORD,
        )
        self.client.force_login(self.admin)

    def test_un_compte_cree_depuis_l_admin_peut_se_connecter(self):
        """Le cœur de l'issue #70 : ModelAdmin enregistrait la saisie sans la hasher."""
        response = self.client.post(
            reverse("admin:accounts_customuser_add"),
            {
                "email": "nouveau@example.com",
                "first_name": "N",
                "last_name": "Nouveau",
                "usable_password": "true",
                "password1": self.PASSWORD,
                "password2": self.PASSWORD,
            },
        )

        self.assertEqual(response.status_code, 302)
        cree = CustomUser.objects.get(email="nouveau@example.com")
        self.assertNotEqual(cree.password, self.PASSWORD)
        # Le seul contrôle qui vaille : le compte passe la porte d'entrée réelle.
        login = Client().post(
            reverse("login"),
            {"email": "nouveau@example.com", "password": self.PASSWORD},
            content_type="application/json",
        )
        self.assertEqual(login.status_code, 200)

    def test_le_formulaire_d_edition_masque_le_hash(self):
        response = self.client.get(
            reverse("admin:accounts_customuser_change", args=[self.admin.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, self.admin.password)
        self.assertContains(response, "../password/")

    def test_is_active_reste_modifiable_depuis_la_liste(self):
        """La seule façon d'activer un compte, l'inscription le créant inactif."""
        membre = CustomUser.objects.create_user(
            email="membre@example.com", first_name="M", last_name="Embre",
            password=self.PASSWORD,
        )
        membre.is_active = False
        membre.save()

        # La liste affiche les deux comptes, donc le navigateur poste les deux sous-formulaires.
        response = self.client.post(
            reverse("admin:accounts_customuser_changelist"),
            {
                "form-TOTAL_FORMS": "2",
                "form-INITIAL_FORMS": "2",
                "form-MIN_NUM_FORMS": "0",
                "form-MAX_NUM_FORMS": "1000",
                "form-0-id": str(self.admin.pk),
                "form-0-is_active": "on",
                "form-1-id": str(membre.pk),
                "form-1-is_active": "on",
                "_save": "",
            },
        )

        self.assertEqual(response.status_code, 302)
        membre.refresh_from_db()
        self.assertTrue(membre.is_active)


class ThrottleScopeTests(SimpleTestCase):
    """Chaque endpoint public porte son scope : sans lui, il n'est compté par personne."""

    def test_chaque_endpoint_public_porte_son_scope(self):
        for nom_de_route, scope in {
            "login": "login",
            "register": "register",
            "password-reset": "password_reset",
            "contact": "contact",
        }.items():
            with self.subTest(route=nom_de_route):
                vue = resolve(reverse(nom_de_route)).func
                self.assertEqual(getattr(vue.cls, "throttle_scope", None), scope)


class LoginThrottleTests(TestCase):
    """Le quota de connexion, seul réarmé : la suite tourne sinon avec des taux éteints."""

    PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.url = reverse("login")
        CustomUser.objects.create_user(
            email="membre@example.com", first_name="M", last_name="Embre",
            password=self.PASSWORD,
        )
        # Le compteur vit dans un cache de processus, que rien ne vide entre deux tests.
        cache.clear()

    def tentative(self, mot_de_passe):
        return self.client.post(
            self.url,
            {"email": "membre@example.com", "password": mot_de_passe},
            content_type="application/json",
        )

    @patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"login": "5/min"})
    def test_la_sixieme_tentative_est_refusee(self):
        for _ in range(5):
            self.assertEqual(self.tentative("MauvaisMotDePasse123").status_code, 401)

        self.assertEqual(self.tentative("MauvaisMotDePasse123").status_code, 429)

    @patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"login": "5/min"})
    def test_le_quota_compte_les_appels_et_non_les_echecs(self):
        """DRF compte avant d'entrer dans la vue : le bon mot de passe consomme aussi."""
        for _ in range(5):
            self.assertEqual(self.tentative(self.PASSWORD).status_code, 200)

        self.assertEqual(self.tentative(self.PASSWORD).status_code, 429)

    def test_les_taux_sont_eteints_dans_la_suite(self):
        """Sans quoi un test enchaînant six appels échouerait sans rapport avec son sujet."""
        for _ in range(6):
            self.assertEqual(self.tentative(self.PASSWORD).status_code, 200)
