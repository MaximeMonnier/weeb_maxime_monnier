"""Efface du disque l'image qu'aucun article ne désigne plus."""

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Article


def effacer_apres_validation(storage, nom):
    """Efface le fichier une fois la transaction validée : annulée, elle garde l'article et son image."""
    # robust : un échec d'effacement est journalisé, et ne fait pas répondre 500 à une écriture
    # déjà validée — un fichier orphelin vaut mieux qu'une réponse fausse.
    if nom:
        transaction.on_commit(lambda: storage.delete(nom), robust=True)


@receiver(pre_save, sender=Article)
def noter_la_couverture_en_base(sender, instance, **kwargs):
    """Retient l'image que l'article désigne encore en base, avant qu'il ne soit écrit."""
    instance._couverture_en_base = (
        Article.objects.filter(pk=instance.pk).values_list("cover", flat=True).first()
        if instance.pk else None
    )


# Après l'écriture et non avant : hors transaction, on_commit efface sur-le-champ, et un
# UPDATE en échec laisserait l'article pointer sur un fichier disparu.
@receiver(post_save, sender=Article)
def effacer_la_couverture_remplacee(sender, instance, **kwargs):
    """Remplacée ou retirée, l'ancienne image quitte le disque."""
    ancienne = getattr(instance, "_couverture_en_base", None)
    if ancienne != instance.cover.name:
        effacer_apres_validation(instance.cover.storage, ancienne)


# Un signal et non Article.delete() : la suppression d'un compte emporte ses articles en
# cascade sans jamais appeler leur delete().
@receiver(post_delete, sender=Article)
def effacer_la_couverture_supprimee(sender, instance, **kwargs):
    """Un article supprimé emporte son image."""
    effacer_apres_validation(instance.cover.storage, instance.cover.name)
