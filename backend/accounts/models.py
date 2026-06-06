from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    """Sait fabriquer un utilisateur et un superutilisateur à partir d'un email."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)          # normalise (domaine en minuscules)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)                  # HASHE le mot de passe (jamais en clair)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)   # un admin doit pouvoir se connecter
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Utilisateur identifié par son EMAIL (pas de username)."""

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    is_active = models.BooleanField(default=True)    # compte utilisable ?
    is_staff = models.BooleanField(default=False)    # accès à l'admin Django ?
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()                          # branche notre manager

    USERNAME_FIELD = "email"                         # on se connecte avec l'email
    REQUIRED_FIELDS = ["first_name", "last_name"]    # demandés en plus par createsuperuser

    def __str__(self):
        return self.email
