from django.db import models


class Contact(models.Model):
    """Un message de contact envoyé par un utilisateur, avec un sujet et un contenu."""

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()

    def __str__(self):
        return self.subject
