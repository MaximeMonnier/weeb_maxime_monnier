"""Tests des articles : ce que le visiteur lit sans compte, ce que l'API refuse d'écrire,
à qui l'article appartient quoi qu'en dise le corps envoyé, et dans quel ordre la liste
sort — le tri, l'auteur et les dates ne venant jamais du client."""

from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import CustomUser

from .models import Article


def membre(email):
    """Un compte actif : create_user laisse is_active à True, seule l'inscription le baisse."""
    return CustomUser.objects.create_user(
        email=email, first_name="M", last_name="Embre", password="MotDePasseValide123",
    )


def porteur(user):
    """En-tête d'un client authentifié : le projet ne monte que JWTAuthentication, donc
    ni session ni force_login ne passeraient la porte de DRF."""
    return {"authorization": f"Bearer {AccessToken.for_user(user)}"}


class ArticleLecturePubliqueTests(TestCase):
    """Lire n'exige aucun compte, écrire si : les deux moitiés d'IsAuthenticatedOrReadOnly."""

    def setUp(self):
        self.article = Article.objects.create(
            title="Premier article", content="Contenu.", author=membre("auteur@example.com"),
        )

    def test_la_liste_est_ouverte_au_visiteur(self):
        response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_le_detail_est_ouvert_au_visiteur(self):
        response = self.client.get(reverse("article-detail", args=[self.article.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Premier article")

    def test_la_creation_anonyme_est_refusee(self):
        """401 et non 403 : JWTAuthentication rend un en-tête WWW-Authenticate, ce qui fait
        répondre à DRF « non authentifié » là où une session vide vaudrait « interdit »."""
        response = self.client.post(
            reverse("article-list"),
            {"title": "Article clandestin", "content": "Contenu."},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(Article.objects.count(), 1)


class ArticleProprieteTests(TestCase):
    """L'auteur vient du jeton et jamais du corps ; lui seul modifie et supprime."""

    def setUp(self):
        self.auteur = membre("auteur@example.com")
        self.intrus = membre("intrus@example.com")
        self.article = Article.objects.create(
            title="Article de l'auteur", content="Contenu.", author=self.auteur,
        )
        self.url = reverse("article-detail", args=[self.article.pk])

    def test_l_auteur_envoye_par_le_client_est_ignore(self):
        """À la création, c'est perform_create qui impose l'auteur : il écrase ce que le
        corps propose, et l'article partirait sans auteur si la ligne s'en allait. Le champ
        déclaré en lecture seule, lui, ne tient ici que la forme rendue, l'email et non l'id."""
        response = self.client.post(
            reverse("article-list"),
            {"title": "Article signé d'un autre", "content": "Contenu.",
             "author": self.intrus.pk},
            content_type="application/json",
            headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["author"], self.auteur.email)
        self.assertEqual(Article.objects.get(pk=response.json()["id"]).author, self.auteur)

    def test_l_auteur_ne_cede_pas_son_article_par_une_modification(self):
        """Rien ne surcharge perform_update : à la modification, le champ déclaré en lecture
        seule est seul à empêcher un auteur de signer son article du nom d'un autre."""
        response = self.client.patch(
            self.url, {"title": "Titre corrigé", "author": self.intrus.pk},
            content_type="application/json", headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.author, self.auteur)

    def test_l_auteur_modifie_son_article(self):
        response = self.client.patch(
            self.url, {"title": "Titre corrigé"},
            content_type="application/json", headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, "Titre corrigé")

    def test_l_auteur_supprime_son_article(self):
        response = self.client.delete(self.url, headers=porteur(self.auteur))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Article.objects.filter(pk=self.article.pk).exists())

    def test_un_autre_membre_ne_modifie_rien(self):
        for methode, corps in (
            ("patch", {"title": "Titre détourné"}),
            ("put", {"title": "Titre détourné", "content": "Contenu détourné."}),
        ):
            with self.subTest(methode=methode):
                response = getattr(self.client, methode)(
                    self.url, corps,
                    content_type="application/json", headers=porteur(self.intrus),
                )

                self.assertEqual(response.status_code, 403)

        self.article.refresh_from_db()
        self.assertEqual(self.article.title, "Article de l'auteur")

    def test_un_autre_membre_ne_supprime_rien(self):
        response = self.client.delete(self.url, headers=porteur(self.intrus))

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Article.objects.filter(pk=self.article.pk).exists())


class ArticleOrdreTests(TestCase):
    """La liste sort du plus récent au plus ancien, et rien dans la vue ne le dit."""

    def setUp(self):
        auteur = membre("auteur@example.com")
        # Les trois articles sont créés dans le désordre : sans cela, l'ordre attendu
        # serait aussi celui des identifiants, et un Meta.ordering retiré passerait.
        # auto_now_add écrase toute date passée à create(), d'où l'UPDATE qui suit.
        for titre, jours in (("Intermédiaire", 1), ("Ancien", 2), ("Récent", 0)):
            article = Article.objects.create(title=titre, content="Contenu.", author=auteur)
            Article.objects.filter(pk=article.pk).update(
                created_at=timezone.now() - timedelta(days=jours),
            )

    def test_la_liste_va_du_plus_recent_au_plus_ancien(self):
        response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [article["title"] for article in response.json()],
            ["Récent", "Intermédiaire", "Ancien"],
        )


class ArticleDatesImposeesTests(TestCase):
    """Les dates sont celles du modèle : ce que le client en dit ne franchit pas l'API.

    auto_now_add et auto_now suffisent déjà à les rendre non modifiables, DRF les rendant
    alors read_only de lui-même : ces tests verrouillent le comportement, pas la ligne
    read_only_fields, qui pour ces deux champs-là ne fait que l'écrire."""

    DATE_ANCIENNE = "2000-01-01T00:00:00Z"

    def setUp(self):
        self.auteur = membre("auteur@example.com")

    def recent(self, date):
        """Vraie date de traitement, à une minute près : la suite ne date rien de 2000."""
        return date > timezone.now() - timedelta(minutes=1)

    def test_les_dates_envoyees_a_la_creation_sont_ignorees(self):
        response = self.client.post(
            reverse("article-list"),
            {"title": "Article daté par le client", "content": "Contenu.",
             "created_at": self.DATE_ANCIENNE, "updated_at": self.DATE_ANCIENNE},
            content_type="application/json",
            headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 201)
        article = Article.objects.get(pk=response.json()["id"])
        self.assertTrue(self.recent(article.created_at))
        self.assertTrue(self.recent(article.updated_at))

    def test_les_dates_envoyees_a_la_modification_sont_ignorees(self):
        article = Article.objects.create(
            title="Article existant", content="Contenu.", author=self.auteur,
        )
        creation, modification = article.created_at, article.updated_at

        response = self.client.patch(
            reverse("article-detail", args=[article.pk]),
            {"title": "Titre corrigé",
             "created_at": self.DATE_ANCIENNE, "updated_at": self.DATE_ANCIENNE},
            content_type="application/json",
            headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 200)
        article.refresh_from_db()
        self.assertEqual(article.created_at, creation)
        # Comparer à l'updated_at d'avant la requête, jamais à created_at : les deux
        # champs appellent now() chacun de leur côté et tombent souvent sur la même
        # microseconde, si bien qu'un updated_at resté figé passerait le test.
        self.assertGreater(article.updated_at, modification)
