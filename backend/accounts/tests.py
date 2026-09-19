"""Tests des mots de passe et des jetons : ce que la réponse ne doit pas révéler, ce qu'elle
doit refuser, ce que l'admin doit hasher, à partir de quand l'API refuse de répondre,
jusqu'à quand un refresh reste bon, et à qui la connexion en délivre — l'inscription ne
créant qu'un compte en attente."""

import re
from unittest.mock import patch

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test import Client, SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
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
    """Chaque endpoint public porte son scope, et chaque scope a son taux."""

    def test_chaque_endpoint_public_porte_son_scope(self):
        taux = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
        for nom_de_route, scope in {
            "login": "login",
            "register": "register",
            "password-reset": "password_reset",
            "contact": "contact",
        }.items():
            with self.subTest(route=nom_de_route):
                vue = resolve(reverse(nom_de_route)).func
                self.assertEqual(getattr(vue.cls, "throttle_scope", None), scope)
                # Un scope sans taux ne laisse pas passer : il fait répondre 500.
                # Renommer une clé de base.py se verrait ici, pas en production.
                self.assertIn(scope, taux)


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


class JWTRotationTests(TestCase):
    """Ce que valent les jetons après usage : la rotation seule ne révoque rien."""

    PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.refresh_url = reverse("login-refresh")
        self.logout_url = reverse("logout")
        CustomUser.objects.create_user(
            email="membre@example.com", first_name="M", last_name="Embre",
            password=self.PASSWORD,
        )
        self.refresh = self.client.post(
            reverse("login"),
            {"email": "membre@example.com", "password": self.PASSWORD},
            content_type="application/json",
        ).json()["refresh"]

    def rafraichir(self, refresh):
        return self.client.post(
            self.refresh_url, {"refresh": refresh}, content_type="application/json"
        )

    def deconnecter(self, refresh):
        return self.client.post(
            self.logout_url, {"refresh": refresh}, content_type="application/json"
        )

    def test_le_rafraichissement_rend_un_refresh_neuf(self):
        """Sans ROTATE_REFRESH_TOKENS, la réponse ne porte que `access` et ce test échoue."""
        response = self.rafraichir(self.refresh)

        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.json()["refresh"], self.refresh)

    def test_le_refresh_consomme_ne_ressert_pas(self):
        """La moitié qui manquerait sans BLACKLIST_AFTER_ROTATION : les deux resteraient bons."""
        self.rafraichir(self.refresh)

        self.assertEqual(self.rafraichir(self.refresh).status_code, 401)

    def test_la_deconnexion_revoque_le_refresh(self):
        # Aucun en-tête d'authentification ici : la vue est publique, et le refresh
        # envoyé est la seule preuve exigée. Un IsAuthenticated hérité la fermerait.
        self.assertEqual(self.deconnecter(self.refresh).status_code, 200)

        self.assertEqual(self.rafraichir(self.refresh).status_code, 401)

    def test_la_deconnexion_refuse_un_refresh_deja_revoque(self):
        """L'app token_blacklist retirée d'INSTALLED_APPS, les deux appels rendraient 200 :
        simplejwt avale l'AttributeError et la vue révoque dans le vide, sans rien dire."""
        self.deconnecter(self.refresh)

        self.assertEqual(self.deconnecter(self.refresh).status_code, 401)


class RegisterTests(TestCase):
    """Ce que l'inscription crée : un compte en attente, écrit inactif du premier coup, dont
    la réponse tait le mot de passe."""

    PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.url = reverse("register")

    def inscrire(self):
        return self.client.post(
            self.url,
            {
                "email": "nouveau@example.com", "first_name": "N", "last_name": "Nouveau",
                "password": self.PASSWORD,
            },
            content_type="application/json",
        )

    def test_le_compte_cree_attend_sa_validation(self):
        """Le modèle pose is_active à True : seul l'argument donné à create_user l'en écarte."""
        response = self.inscrire()

        self.assertEqual(response.status_code, 201)
        self.assertFalse(CustomUser.objects.get(email="nouveau@example.com").is_active)

    def test_l_inscription_n_ecrit_la_ligne_qu_une_fois(self):
        """is_active remis à False après create_user, la ligne existerait ACTIVE entre les
        deux requêtes : une connexion concurrente y trouverait un compte que personne n'a
        encore validé. C'est cette fenêtre que l'écriture unique ferme."""
        # \b écarte les tables dérivées, accounts_customuser_groups et sa voisine,
        # dont le nom contient celui du compte sans qu'une écriture y touche.
        table = re.compile(rf"\b{CustomUser._meta.db_table}\b")

        with CaptureQueriesContext(connection) as requetes:
            response = self.inscrire()

        self.assertEqual(response.status_code, 201)
        # Les SELECT restent comptés avec le reste : le contrôle d'unicité de l'email en
        # émet un, et c'est le verbe qu'on regarde, une lecture n'ouvrant aucune fenêtre.
        verbes = [
            requete["sql"].split(maxsplit=1)[0] for requete in requetes
            if table.search(requete["sql"])
        ]
        self.assertEqual(verbes.count("INSERT"), 1, verbes)
        self.assertEqual(verbes.count("UPDATE"), 0, verbes)

    def test_la_reponse_ne_renvoie_pas_le_mot_de_passe(self):
        """write_only retiré, le ModelSerializer rendrait le champ du modèle : le hash."""
        response = self.inscrire()

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.json())


class LoginTests(TestCase):
    """La porte d'entrée ne s'ouvre qu'aux comptes validés."""

    PASSWORD = "MotDePasseValide123"

    def setUp(self):
        self.url = reverse("login")
        self.membre = CustomUser.objects.create_user(
            email="membre@example.com", first_name="M", last_name="Embre",
            password=self.PASSWORD,
        )

    def connecter(self):
        return self.client.post(
            self.url,
            {"email": self.membre.email, "password": self.PASSWORD},
            content_type="application/json",
        )

    def test_un_compte_valide_obtient_ses_deux_jetons(self):
        response = self.connecter()

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
        self.assertIn("refresh", response.json())

    def test_un_compte_en_attente_n_obtient_aucun_jeton(self):
        """Le compte inactif est refusé par authenticate(), en amont de la vue : rien
        dans accounts ne porte ce filtre, un backend d'authentification changé l'ôterait."""
        self.membre.is_active = False
        self.membre.save()

        response = self.connecter()

        # Le code autant que les clés : un 200 au corps vide passerait le seul test des clés.
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.json())
        self.assertNotIn("refresh", response.json())
