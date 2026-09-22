"""Publie des articles de démonstration, pour que /blog se remplisse en développement."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import CustomUser
from articles.models import Article

DEMO_AUTHOR_EMAIL = "auteur-demo@example.com"

# Le sujet n'est jamais sujet d'un verbe, ni précédé de « de » ou « à », qui se contractent
# devant « le » et « les » : « de le mode sombre » sortirait tel quel.
TOPICS = (
    "l'accessibilité",
    "le mode sombre",
    "la performance d'une page",
    "le référencement naturel",
    "les formulaires",
    "la typographie",
    "le design responsive",
    "les tests automatisés",
    "la sécurité des mots de passe",
    "le déploiement continu",
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
    """Les couples (titre, contenu), un par sujet et par angle, les sujets alternant."""
    return [
        (title.format(topic=topic), f"{opening.format(topic=topic)}\n\n{CLOSING}")
        for title, opening in ANGLES
        for topic in TOPICS
    ]


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
    help = "Publie 30 articles de démonstration, sans doublon d'un lancement à l'autre."

    def handle(self, *args, **options):
        # production.py fige DEBUG à False : c'est ce qui ferme la commande à sa base.
        if not settings.DEBUG:
            raise CommandError(
                "DEBUG vaut False : cette commande ne peuple que la base de développement."
            )

        expected = demo_articles()
        with transaction.atomic():
            author = demo_author()
            already_published = set(author.articles.values_list("title", flat=True))
            missing = [
                Article(title=title, content=content, author=author)
                for title, content in expected
                if title not in already_published
            ]
            Article.objects.bulk_create(missing)

        self.stdout.write(self.style.SUCCESS(
            f"{len(missing)} article(s) publié(s), {len(expected) - len(missing)} déjà en base."
        ))
