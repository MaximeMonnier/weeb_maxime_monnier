from django.db import models


class Contact(models.Model):
    """Un message de contact envoyé par un utilisateur, avec un sujet et un contenu."""

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)   # rempli UNE fois, à l'arrivée

    class Meta:
        ordering = ["-created_at"]       # les plus récents affichés en premier

    def __str__(self):
        return self.subject
