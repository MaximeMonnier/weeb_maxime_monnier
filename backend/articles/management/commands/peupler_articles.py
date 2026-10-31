from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import CustomUser
from articles.models import Article

DEMO_AUTHOR_EMAIL = "auteur-demo@example.com"

# Hors de MEDIA_ROOT : versionnées, elles sont copiées dans le stockage, jamais servies d'ici.
COVERS_DIR = Path(__file__).resolve().parents[2] / "couvertures_demo"

# Jamais après « de » ou « à » ni sujet d'un verbe : « de le mode sombre » sortirait tel quel.
TOPICS = (
    ("l'accessibilité", "accessibilite.jpg"),
    ("le mode sombre", "mode-sombre.jpg"),
    ("la performance d'une page", "performance.jpg"),
    ("le référencement naturel", "referencement.jpg"),
    ("les formulaires", "formulaires.jpg"),
    ("la typographie", "typographie.jpg"),
    ("le design responsive", "responsive.jpg"),
    ("les tests automatisés", "tests.jpg"),
    ("la sécurité des mots de passe", "mots-de-passe.jpg"),
    ("le déploiement continu", "deploiement.jpg"),
)

ANGLES = (
    (
        "Premiers pas : {topic}",
        "Ce billet s'adresse à qui découvre {topic} et ne sait pas par où commencer. "
        "Plutôt qu'une liste exhaustive de règles, il propose trois habitudes simples à "
        "prendre dès la première maquette, puis un exercice à refaire sur un projet "
        "existant. L'objectif n'est pas la perfection, mais un premier pas mesurable, que "
        "l'on pourra comparer au suivant.",
    ),
    (
        "Cinq idées reçues sur {topic}",
        "Trop tôt, trop cher, trop technique : les objections contre {topic} reviennent "
        "dans presque toutes les équipes. La plupart ne résistent pourtant pas à un examen "
        "attentif. Nous en avons retenu cinq, entendues en réunion comme en revue de code, "
        "et nous les reprenons une à une, exemples concrets à l'appui, pour montrer ce "
        "qu'elles oublient.",
    ),
    (
        "Retour d'expérience : {topic}",
        "Il y a six mois, notre équipe a choisi de traiter {topic} comme une priorité, et "
        "non plus comme une case à cocher en fin de sprint. Voici ce que ce choix a changé "
        "dans notre façon de travailler : les revues de code, les maquettes, le dialogue "
        "avec les clients. Nous revenons aussi sur ce qui n'a pas marché, et sur ce que "
        "nous ferions autrement.",
    ),
)

CLOSING = (
    "Cet article fait partie d'une série de démonstration, publiée pour remplir le blog "
    "pendant le développement du site Weeb. Son contenu est volontairement générique : il "
    "sert à vérifier la mise en page, la coupure du résumé sur les cartes et la pagination "
    "de la liste, pas à informer."
)


def demo_articles():
    """Les triplets (titre, contenu, photo), un par sujet et par angle, les sujets alternant."""
    return [
        (title.format(topic=topic), f"{opening.format(topic=topic)}\n\n{CLOSING}", photo)
        for title, opening in ANGLES
        for topic, photo in TOPICS
    ]


def attach_cover(article, photo):
    """Copie la photo dans le stockage : chaque article a son fichier, effaçable sans les autres."""
    with open(COVERS_DIR / photo, "rb") as source:
        article.cover.save(photo, File(source), save=False)


def demo_author():
    """Le compte qui signe les articles : inactif et sans mot de passe, nul ne s'y connecte."""
    author = CustomUser.objects.filter(email=DEMO_AUTHOR_EMAIL).first()
    if author is None:
        # Sans mot de passe, create_user en pose un inutilisable.
        author = CustomUser.objects.create_user(
            email=DEMO_AUTHOR_EMAIL, first_name="Auteur", last_name="Démo", is_active=False,
        )
    return author


class Command(BaseCommand):
    help = "Publie 30 articles de démonstration illustrés, sans doublon d'un lancement à l'autre."

    def handle(self, *args, **options):
        # production.py fige DEBUG à False : c'est ce qui ferme la commande à sa base.
        if not settings.DEBUG:
            raise CommandError(
                "DEBUG vaut False : cette commande ne peuple que la base de développement."
            )

        expected = demo_articles()
        photo_of = {title: photo for title, _, photo in expected}
        with transaction.atomic():
            author = demo_author()
            already_published = set(author.articles.values_list("title", flat=True))
            missing = [
                Article(title=title, content=content, author=author)
                for title, content, _ in expected
                if title not in already_published
            ]
            # Un article publié avant les images en reçoit une ; un titre retiré de la liste, non.
            uncovered = list(author.articles.filter(cover="", title__in=photo_of))
            for article in missing + uncovered:
                attach_cover(article, photo_of[article.title])
            Article.objects.bulk_create(missing)
            Article.objects.bulk_update(uncovered, ["cover"])

        self.stdout.write(self.style.SUCCESS(
            f"{len(missing)} article(s) publié(s), {len(expected) - len(missing)} déjà en base, "
            f"{len(missing) + len(uncovered)} image(s) posée(s)."
        ))
