"""Tests des articles : lecture, écriture, propriété, signature, listes, pages et peuplement."""

import re
from datetime import timedelta
from io import StringIO

from django.conf import settings
from django.core.management import CommandError, call_command
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import CustomUser

from .management.commands.peupler_articles import DEMO_AUTHOR_EMAIL
from .models import Article
from .views import LONGUEUR_EXTRAIT


def membre(email):
    """Un compte actif : create_user laisse is_active à True, seule l'inscription le baisse."""
    return CustomUser.objects.create_user(
        email=email, first_name="M", last_name="Embre", password="MotDePasseValide123",
    )


def porteur(user):
    """En-tête JWT : seul JWTAuthentication est monté, ni session ni force_login ne passent."""
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
        self.assertEqual(len(response.json()["results"]), 1)

    def test_le_detail_est_ouvert_au_visiteur(self):
        response = self.client.get(reverse("article-detail", args=[self.article.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Premier article")

    def test_la_creation_anonyme_est_refusee(self):
        """401 et non 403 : l'en-tête WWW-Authenticate de JWTAuthentication décide du code."""
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
        """perform_create impose l'auteur ; le champ en lecture seule n'en tient que la forme."""
        response = self.client.post(
            reverse("article-list"),
            {"title": "Article signé d'un autre", "content": "Contenu.",
             "author": self.intrus.pk},
            content_type="application/json",
            headers=porteur(self.auteur),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["author"], self.auteur.public_name)
        self.assertEqual(Article.objects.get(pk=response.json()["id"]).author, self.auteur)

    def test_l_auteur_ne_cede_pas_son_article_par_une_modification(self):
        """Sans perform_update, seul le champ en lecture seule empêche de signer pour un autre."""
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


class ArticleSignatureTests(TestCase):
    """L'article est signé par `public_name`, jamais par l'email que rend `__str__`."""

    def setUp(self):
        self.auteur = CustomUser.objects.create_user(
            email="jean@example.com", first_name="Jean", last_name="Dupont",
            password="MotDePasseValide123",
        )
        self.article = Article.objects.create(
            title="Article signé", content="Contenu.", author=self.auteur,
        )

    def urls(self):
        """Les deux lectures publiques, qui ne passent pas par le même serializer."""
        return {
            "liste": reverse("article-list"),
            "détail": reverse("article-detail", args=[self.article.pk]),
        }

    def signature(self, url):
        """L'auteur tel que la réponse le rend, la liste fût-elle paginée."""
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        corps = response.json()
        return corps["results"][0]["author"] if "results" in corps else corps["author"]

    def test_la_liste_et_le_detail_signent_du_prenom_et_du_nom(self):
        for nom, url in self.urls().items():
            with self.subTest(vue=nom):
                self.assertEqual(self.signature(url), "Jean Dupont")

    def test_aucune_adresse_electronique_ne_sort_de_la_lecture_publique(self):
        """Sur la réponse brute : un email réexposé sous une autre clé compte autant."""
        for nom, url in self.urls().items():
            with self.subTest(vue=nom):
                self.assertNotIn(self.auteur.email, self.client.get(url).content.decode())

    def test_un_compte_sans_prenom_ni_nom_est_signe_d_un_repli(self):
        """Prénom et nom ne sont exigés qu'à l'inscription : un compte créé au shell n'en a pas."""
        sans_nom = CustomUser.objects.create_user(
            email="sans-nom@example.com", password="MotDePasseValide123",
        )
        self.article.author = sans_nom
        self.article.save()

        for nom, url in self.urls().items():
            with self.subTest(vue=nom):
                self.assertEqual(self.signature(url), "Auteur anonyme")


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
            [article["title"] for article in response.json()["results"]],
            ["Récent", "Intermédiaire", "Ancien"],
        )


class ArticleExtraitDeListeTests(TestCase):
    """La liste rend l'extrait, le détail le texte : l'extrait vient de l'annotation du queryset."""

    def setUp(self):
        # Plus long que l'extrait : à contenu plus court, la liste rendrait le texte
        # entier et une coupure disparue passerait inaperçue.
        self.contenu = "Phrase de démonstration. " * 20
        self.article = Article.objects.create(
            title="Article long", content=self.contenu, author=membre("auteur@example.com"),
        )

    def test_la_liste_rend_l_extrait_et_jamais_le_contenu(self):
        response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        article = response.json()["results"][0]
        # Le jeu entier, et pas seulement l'absence de content : ArticleCard lit aussi
        # id, author et created_at, qu'un fields raccourci ferait disparaître sans que
        # rien ne tombe ici — la carte afficherait « Par undefined le Invalid Date ».
        self.assertEqual(
            sorted(article),
            ["author", "created_at", "excerpt", "excerpt_truncated", "id", "title"],
        )
        self.assertEqual(article["excerpt"], self.contenu[:LONGUEUR_EXTRAIT])
        self.assertEqual(len(article["excerpt"]), LONGUEUR_EXTRAIT)

    def test_la_liste_dit_quels_extraits_sont_coupes(self):
        """À LONGUEUR_EXTRAIT caractères pile, l'article est entier : pas de « ... »."""
        auteur = self.article.author
        Article.objects.create(
            title="Article juste", content="x" * LONGUEUR_EXTRAIT, author=auteur,
        )
        Article.objects.create(
            title="Article juste au-delà", content="x" * (LONGUEUR_EXTRAIT + 1),
            author=auteur,
        )

        response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        coupes = {
            article["title"]: article["excerpt_truncated"]
            for article in response.json()["results"]
        }
        self.assertEqual(coupes, {
            "Article long": True,
            "Article juste": False,
            "Article juste au-delà": True,
        })

    def test_la_liste_ne_lit_le_contenu_qu_au_travers_de_l_extrait(self):
        """Sans le defer, content voyagerait entier de la base au serializer, qui le tairait."""
        with CaptureQueriesContext(connection) as requetes:
            response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        table = connection.ops.quote_name(Article._meta.db_table)
        colonne = f"{table}.{connection.ops.quote_name('content')}"
        sql = " ".join(requete["sql"] for requete in requetes)
        # Présente au moins une fois : un nom mal écrit ferait passer le refus à vide.
        self.assertIn(colonne, sql)
        self.assertNotRegex(sql, rf"(?<!\(){re.escape(colonne)}")

    def test_le_detail_rend_le_contenu_entier_et_pas_d_extrait(self):
        response = self.client.get(reverse("article-detail", args=[self.article.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["content"], self.contenu)
        self.assertNotIn("excerpt", response.json())
        self.assertNotIn("excerpt_truncated", response.json())


class ArticlePaginationTests(TestCase):
    """PAGE_SIZE et Meta.ordering décident seuls des pages, ni la vue ni le serializer."""

    def test_la_page_suivante_reprend_ou_la_premiere_s_arrete(self):
        auteur = membre("auteur@example.com")
        taille = settings.REST_FRAMEWORK["PAGE_SIZE"]
        total = taille + 3
        # Deux par deux à la même date, une paire à cheval sur la coupure quand la
        # taille est paire : l'id seul les départage, et sans lui l'un des deux peut
        # sortir sur les deux pages. L'UPDATE, parce qu'auto_now_add écrase la date.
        maintenant = timezone.now()
        for rang in range(total):
            article = Article.objects.create(
                title=f"Article {rang}", content="Contenu.", author=auteur,
            )
            Article.objects.filter(pk=article.pk).update(
                created_at=maintenant - timedelta(hours=(rang + 1) // 2),
            )
        attendu = [
            article.pk for article in sorted(
                Article.objects.all(), key=lambda a: (a.created_at, a.pk), reverse=True,
            )
        ]

        premiere = self.client.get(reverse("article-list")).json()

        self.assertEqual(premiere["count"], total)
        self.assertIsNone(premiere["previous"])
        self.assertEqual([a["id"] for a in premiere["results"]], attendu[:taille])

        # Le lien tel que l'API le donne, et non une page recalculée par le test.
        seconde = self.client.get(premiere["next"]).json()

        self.assertIsNone(seconde["next"])
        self.assertEqual([a["id"] for a in seconde["results"]], attendu[taille:])


class ArticleDatesImposeesTests(TestCase):
    """Les dates viennent du modèle : ce que le client en dit ne franchit pas l'API."""

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


class ArticleLongueurTests(TestCase):
    """content n'a pas de longueur en base : ArticleSerializer la borne, création et modification."""

    LIMITE = 20000

    def setUp(self):
        self.auteur = membre("auteur@example.com")
        self.article = Article.objects.create(
            title="Article existant", content="Contenu.", author=self.auteur,
        )

    def creer(self, content):
        return self.client.post(
            reverse("article-list"), {"title": "Long billet", "content": content},
            content_type="application/json", headers=porteur(self.auteur),
        )

    def modifier(self, content):
        return self.client.patch(
            reverse("article-detail", args=[self.article.pk]), {"content": content},
            content_type="application/json", headers=porteur(self.auteur),
        )

    def test_la_creation(self):
        response = self.creer("C" * (self.LIMITE + 1))

        self.assertEqual(response.status_code, 400)
        self.assertIn("content", response.json())
        self.assertEqual(self.creer("C" * self.LIMITE).status_code, 201)

    def test_la_modification(self):
        response = self.modifier("C" * (self.LIMITE + 1))

        self.assertEqual(response.status_code, 400)
        self.assertIn("content", response.json())
        self.article.refresh_from_db()
        self.assertEqual(self.article.content, "Contenu.")
        self.assertEqual(self.modifier("C" * self.LIMITE).status_code, 200)


class ArticleCoutDesListesTests(TestCase):
    """Le coût des deux listes ne dépend pas du nombre d'articles : l'auteur est joint, pas relu."""

    def setUp(self):
        # Plusieurs auteurs : un seul ferait tomber le test tout autant, l'ORM ne
        # partageant aucun cache entre deux instances, mais pas une liste réelle.
        self.auteurs = [membre(f"auteur{rang}@example.com") for rang in range(3)]
        self.admin = CustomUser.objects.create_superuser(
            email="admin@example.com", first_name="A", last_name="Dmin",
            password="MotDePasseValide123",
        )

    def publier(self, nombre):
        """Ajoute `nombre` articles, répartis entre les auteurs."""
        Article.objects.bulk_create([
            Article(title=f"Article {rang}", content="Contenu.",
                    author=self.auteurs[rang % len(self.auteurs)])
            for rang in range(nombre)
        ])

    def compter(self, url):
        """Le nombre de requêtes d'un GET, mesuré plutôt que supposé."""
        with CaptureQueriesContext(connection) as requetes:
            reponse = self.client.get(url)

        self.assertEqual(reponse.status_code, 200)
        return len(requetes)

    def test_chaque_page_de_l_api_coute_autant_a_30_articles_qu_a_3(self):
        """Pleines comme entamée : une référence moins remplie trahit une requête par ligne."""
        url = reverse("article-list")
        self.publier(3)
        reference = self.compter(url)

        self.publier(27)

        suivante = url
        while suivante:
            with self.assertNumQueries(reference):
                suivante = self.client.get(suivante).json()["next"]

    def test_la_liste_de_l_admin_coute_autant_a_30_articles_qu_a_3(self):
        # force_login et non un jeton porteur : l'API ne monte que JWTAuthentication,
        # quand l'admin n'ouvre ses pages qu'à une session.
        self.client.force_login(self.admin)
        url = reverse("admin:articles_article_changelist")
        self.publier(3)
        reference = self.compter(url)

        self.publier(27)

        with self.assertNumQueries(reference):
            self.assertEqual(self.client.get(url).status_code, 200)


@override_settings(DEBUG=True)
class PeuplerArticlesTests(TestCase):
    """La commande peuple la base une fois ; DEBUG forcé, test.py et le runner le figeant."""

    def peupler(self):
        call_command("peupler_articles", stdout=StringIO())

    def demonstration(self):
        return Article.objects.filter(author__email=DEMO_AUTHOR_EMAIL)

    def test_la_commande_publie_30_articles_plus_longs_que_le_resume(self):
        """Plus longs que l'extrait : c'est la coupure que la commande sert à montrer."""
        self.peupler()

        self.assertEqual(self.demonstration().count(), 30)
        self.assertEqual(self.demonstration().values("title").distinct().count(), 30)
        for article in self.demonstration():
            self.assertGreater(len(article.content), LONGUEUR_EXTRAIT)

    def test_un_second_lancement_ne_cree_aucun_doublon(self):
        self.peupler()
        self.peupler()

        self.assertEqual(Article.objects.count(), 30)
        self.assertEqual(CustomUser.objects.filter(email=DEMO_AUTHOR_EMAIL).count(), 1)

    def test_un_article_de_demonstration_supprime_est_republie(self):
        """Un article se reconnaît à son auteur puis à son titre, pas au titre seul."""
        self.peupler()
        disparu = self.demonstration().first()
        disparu.delete()
        Article.objects.create(
            title=disparu.title, content="Contenu.", author=membre("membre@example.com"),
        )

        self.peupler()

        self.assertEqual(self.demonstration().count(), 30)
        self.assertTrue(self.demonstration().filter(title=disparu.title).exists())

    def test_l_auteur_de_demonstration_ne_peut_pas_se_connecter(self):
        self.peupler()

        auteur = CustomUser.objects.get(email=DEMO_AUTHOR_EMAIL)
        self.assertFalse(auteur.is_active)
        self.assertFalse(auteur.has_usable_password())

    @override_settings(DEBUG=False)
    def test_la_commande_refuse_quand_debug_vaut_false(self):
        with self.assertRaises(CommandError):
            self.peupler()

        self.assertFalse(Article.objects.exists())
        self.assertFalse(CustomUser.objects.filter(email=DEMO_AUTHOR_EMAIL).exists())
