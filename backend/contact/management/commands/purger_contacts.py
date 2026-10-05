"""Supprime les messages de contact reçus il y a plus de 90 jours, comme l'annonce /privacy."""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from contact.models import Contact

# En dur, et non en variable d'environnement : aucune production ne doit garder plus
# longtemps que ce qu'annonce la section 5 de /privacy.
RETENTION = timedelta(days=90)


class Command(BaseCommand):
    help = "Supprime les messages de contact reçus il y a plus de 90 jours."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Affiche le nombre sans rien supprimer.",
        )

    def handle(self, *args, **options):
        expired = Contact.objects.filter(created_at__lt=timezone.now() - RETENTION)

        if options["dry_run"]:
            self.stdout.write(
                f"{expired.count()} message(s) de plus de {RETENTION.days} jours, rien supprimé."
            )
            return

        deleted, _ = expired.delete()
        self.stdout.write(self.style.SUCCESS(
            f"{deleted} message(s) de plus de {RETENTION.days} jours supprimé(s)."
        ))
