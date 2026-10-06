"""Tests transversaux : la route de santé, les journaux, le rapport des 500, et les droits de chaque profil sur l'API."""

import logging
import os
import runpy
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlencode

from django.core import mail
from django.db import DatabaseError
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import URLResolver, get_resolver, reverse
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import CustomUser
from accounts.views import PasswordChangeView
from articles.models import Article


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


class JournauxTests(SimpleTestCase):
    """La configuration chargée, lue sur les loggers : assertLogs poserait son propre handler."""

    def console_racine(self):
        consoles = [h for h in logging.getLogger().handlers if type(h) is logging.StreamHandler]
        self.assertEqual(len(consoles), 1)
        return consoles[0]

    def test_le_journal_racine_ecrit_heure_niveau_et_nom(self):
        console = self.console_racine()
        ligne = logging.makeLogRecord(
            {"name": "accounts.views", "levelno": logging.ERROR, "levelname": "ERROR", "msg": "panne"}
        )

        sortie = console.format(ligne)

        self.assertTrue(console.formatter.usesTime())
        self.assertIn(ligne.asctime, sortie)
        self.assertIn("ERROR accounts.views panne", sortie)

    def test_le_niveau_lu_vaut_pour_la_racine_et_le_handler(self):
        # base.py relu à part : test.py surcharge le niveau du handler de la suite.
        with patch.dict(os.environ, {"DJANGO_LOG_LEVEL": "error"}):
            journaux = runpy.run_path(Path(__file__).parent / "settings" / "base.py")["LOGGING"]

        self.assertEqual(journaux["root"]["level"], "ERROR")
        self.assertEqual(journaux["handlers"]["console"]["level"], "ERROR")

    def test_le_logger_django_garde_mail_admins(self):
        classes = [type(h).__name__ for h in logging.getLogger("django").handlers]

        self.assertIn("AdminEmailHandler", classes)

    def test_une_ligne_de_django_ne_sort_qu_une_fois_en_debug(self):
        console = self.console_racine()
        de_django = logging.makeLogRecord({"name": "django.request"})
        du_projet = logging.makeLogRecord({"name": "accounts.views"})

        with override_settings(DEBUG=True):
            self.assertFalse(console.filter(de_django))
            self.assertTrue(console.filter(du_projet))
        with override_settings(DEBUG=False):
            self.assertTrue(console.filter(de_django))


@override_settings(ADMINS=["equipe@weeb.local"])
class RapportDErreurTests(TestCase):
    """Le rapport d'une 500 part aux ADMINS sans mot de passe, jeton, email du compte, IP ni Referer."""

    def test_une_500_envoie_un_seul_rapport_sans_donnee_personnelle(self):
        membre = compte("membre@weeb.local")
        jeton = str(AccessToken.for_user(membre))
        mots_de_passe = {"old_password": "MotDePasseValide123", "new_password": "NouveauSecret456"}
        en_tetes = {
            "REMOTE_ADDR": "198.51.100.9",
            "HTTP_X_REAL_IP": "203.0.113.8",
            "HTTP_X_FORWARDED_FOR": "203.0.113.7",
            "HTTP_REFERER": "https://weeb.example/reset-password?uid=MQ&token=jeton-encore-valable",
        }
        # Sinon le client relance l'exception au test, avant tout envoi.
        client = Client(raise_request_exception=False)

        with patch.object(PasswordChangeView, "post", side_effect=RuntimeError("panne simulée")):
            response = client.post(
                reverse("password-change"),
                urlencode(mots_de_passe),
                content_type="application/x-www-form-urlencoded",
                HTTP_AUTHORIZATION=f"Bearer {jeton}",
                **en_tetes,
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(len(mail.outbox), 1)
        rapport = mail.outbox[0]
        self.assertEqual(rapport.to, ["equipe@weeb.local"])
        self.assertEqual(rapport.alternatives, [])
        # Les clés restent : le rapport a bien lu le corps et les en-têtes qu'il masque.
        for cle in [*mots_de_passe, *en_tetes]:
            self.assertIn(cle, rapport.body)
        for fuite in [*mots_de_passe.values(), *en_tetes.values(), jeton, membre.email]:
            self.assertNotIn(fuite, rapport.body)


PUBLIC, CONNECTE, AUTEUR = "public", "connecté", "auteur"

# Le tableau du README, § « L'API ». Une route ajoutée sans sa ligne ici fait tomber
# test_chaque_route_de_l_api_figure_dans_la_matrice.
MATRICE = [
    ("post", "register", PUBLIC),
    ("post", "login", PUBLIC),
    ("post", "login-refresh", PUBLIC),
    ("post", "logout", PUBLIC),
    ("post", "password-reset", PUBLIC),
    ("post", "password-reset-confirm", PUBLIC),
    ("post", "password-change", CONNECTE),
    ("delete", "account-delete", CONNECTE),
    ("get", "article-list", PUBLIC),
    ("post", "article-list", CONNECTE),
    ("get", "article-detail", PUBLIC),
    ("put", "article-detail", AUTEUR),
    ("patch", "article-detail", AUTEUR),
    ("delete", "article-detail", AUTEUR),
    ("post", "contact", PUBLIC),
    ("get", "api-root", CONNECTE),
]


def noms_des_routes_de_l_api(motifs=None, prefixe=""):
    """Le nom de chaque route montée sous api/, lu dans le routage réel."""
    for motif in get_resolver().url_patterns if motifs is None else motifs:
        chemin = prefixe + str(motif.pattern)
        if isinstance(motif, URLResolver):
            yield from noms_des_routes_de_l_api(motif.url_patterns, chemin)
        elif chemin.startswith("api/"):
            yield motif.name


def compte(email):
    return CustomUser.objects.create_user(
        email=email, first_name="M", last_name="Embre", password="MotDePasseValide123",
    )


class ControleDAccesTests(TestCase):
    """Visiteur, inscrit non validé, membre validé et auteur, sur chaque route de l'API."""

    def setUp(self):
        self.auteur = compte("auteur@example.com")
        self.membre = compte("membre@example.com")
        # Un compte en attente n'obtient aucun jeton (LoginTests) : le seul qu'il puisse
        # présenter date d'avant sa désactivation, le cas d'un compte suspendu par l'admin.
        non_valide = compte("attente@example.com")
        self.jeton_non_valide = AccessToken.for_user(non_valide)
        non_valide.is_active = False
        non_valide.save()

    def appeler(self, methode, nom, jeton=None):
        # Un article neuf à chaque appel : un DELETE passé ne change pas le code du suivant.
        if nom == "article-detail":
            article = Article.objects.create(title="T", content="C", author=self.auteur)
            url = reverse(nom, args=[article.pk])
        else:
            url = reverse(nom)
        en_tetes = {"HTTP_AUTHORIZATION": f"Bearer {jeton}"} if jeton else {}
        # Corps vide exprès : un 400 dit que la permission a laissé passer.
        return getattr(self.client, methode)(url, {}, content_type="application/json", **en_tetes)

    def verifier(self, jeton, ouvertes, code_refus=None):
        for methode, nom, acces in MATRICE:
            with self.subTest(methode=methode, route=nom, acces=acces):
                code = self.appeler(methode, nom, jeton).status_code
                if acces in ouvertes:
                    self.assertNotIn(code, (401, 403))
                else:
                    self.assertEqual(code, code_refus)

    def test_chaque_route_de_l_api_figure_dans_la_matrice(self):
        self.assertEqual(set(noms_des_routes_de_l_api()), {nom for _, nom, _ in MATRICE})

    def test_le_visiteur_n_ouvre_que_les_routes_publiques(self):
        self.verifier(None, ouvertes={PUBLIC}, code_refus=401)

    def test_l_inscrit_non_valide_n_ouvre_aucune_route_protegee(self):
        # Sans jeton il est un visiteur : ses routes publiques sont celles du test précédent.
        for methode, nom, acces in MATRICE:
            if acces != PUBLIC:
                with self.subTest(methode=methode, route=nom):
                    code = self.appeler(methode, nom, self.jeton_non_valide).status_code
                    self.assertEqual(code, 401)

    def test_le_membre_valide_ouvre_tout_sauf_l_article_d_un_autre(self):
        jeton = AccessToken.for_user(self.membre)

        self.verifier(jeton, ouvertes={PUBLIC, CONNECTE}, code_refus=403)

    def test_l_auteur_ouvre_toutes_les_routes(self):
        self.verifier(AccessToken.for_user(self.auteur), ouvertes={PUBLIC, CONNECTE, AUTEUR})

    def test_seul_un_compte_valide_publie_un_article(self):
        def publier(jeton):
            return self.client.post(
                reverse("article-list"), {"title": "Titre", "content": "Contenu"},
                content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {jeton}",
            )

        self.assertEqual(publier(self.jeton_non_valide).status_code, 401)
        self.assertFalse(Article.objects.exists())
        self.assertEqual(publier(AccessToken.for_user(self.membre)).status_code, 201)
