---
name: backend-django-drf
description: >-
  Use this skill when the user works on the Weeb Django/DRF backend — "ajoute un
  endpoint", "nouveau modèle", "crée un serializer", "gère les permissions",
  "nouvelle app Django", "migration", "route API", "vue DRF", "ViewSet".
  Covers the app-per-domain layout under backend/, ModelSerializer with
  read-only fields, explicit permissions on public views (the global default is
  IsAuthenticated), owner injection via perform_create, and French one-line
  docstrings.
---

# Conventions backend Django / DRF — projet Weeb

Django 6.0 · DRF 3.17 · simplejwt · projet dans `backend/config/`, apps à côté.

## Structure

- **Une app par domaine métier** : `accounts`, `articles`, `contact`. Créer une app plutôt que de gonfler une existante.
- Fichiers attendus dans une app : `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, et `permissions.py` uniquement si une permission personnalisée existe.
- `config/` ne contient que la configuration du projet : jamais de modèle ni de vue métier.
- Les routes sont montées sous `/api/` dans `config/urls.py`, une ligne `include()` par app.

## Modèles

- Docstring d'une ligne en français sur chaque modèle.
- `__str__` obligatoire, renvoyant le champ le plus parlant.
- Horodatage : `created_at = models.DateTimeField(auto_now_add=True)` et `updated_at = models.DateTimeField(auto_now=True)`.
- Référencer l'utilisateur via `settings.AUTH_USER_MODEL` (le projet utilise `accounts.CustomUser`), jamais `User` importé directement.
- Chaque `ForeignKey` déclare `on_delete` et `related_name`.
- `class Meta: ordering = [...]` dès qu'un ordre d'affichage est attendu.
- **Enregistrer chaque modèle dans `admin.py`** de son app.

## Serializers

- `ModelSerializer` par défaut ; `serializers.Serializer` uniquement pour une entrée sans modèle (ex. `PasswordResetRequestSerializer`).
- `fields` **toujours explicite** sous forme de tuple. Jamais `__all__`, jamais `exclude`.
- `read_only_fields` pour tout ce que le client ne doit pas fournir : `author`, `created_at`, `updated_at`.
- Mot de passe : `write_only=True` et `min_length=8`. Il ne ressort jamais dans une réponse JSON.
- Créer un utilisateur passe par `CustomUser.objects.create_user(...)` pour garantir le hachage.

## Vues et permissions

Le réglage global est `DEFAULT_PERMISSION_CLASSES = IsAuthenticated` : **sécurisé par défaut**.

- **Toute vue publique déclare explicitement sa permission.** Une vue sans `permission_classes` est privée — c'est voulu, ne pas l'ajouter « au cas où ».
  - Endpoint public en écriture (inscription, contact) : `permission_classes = [AllowAny]`
  - Lecture publique, écriture authentifiée (articles) : `[IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]`
- `ModelViewSet` + `DefaultRouter` pour un CRUD complet ; `generics.CreateAPIView` / `APIView` pour un endpoint unique.
- **Le propriétaire n'est jamais fourni par le client.** Il est injecté côté serveur :

```python
def perform_create(self, serializer):
    serializer.save(author=self.request.user)
```

- Permission objet dans le `permissions.py` de l'app, avec `has_object_permission` et le passage `SAFE_METHODS` en lecture.
- Docstring d'une ligne en français sur chaque vue, précisant si l'endpoint est **PUBLIC**.

## Routes

- CRUD : `DefaultRouter` avec `basename` explicite, `urlpatterns = router.urls`.
- Endpoint unique : `path("chemin/", MaVue.as_view(), name="mon-nom")`, `name` toujours renseigné.
- URL en kebab-case terminée par un slash : `password-reset/confirm/`.

## Réponses

- Utiliser les constantes `status.HTTP_*`, jamais un entier nu.
- Message d'erreur métier sous la clé `detail`, **rédigé en français** : `{"detail": "Token invalide ou expiré."}`.
- Valider avec `serializer.is_valid(raise_exception=True)` pour obtenir le 400 automatique.

## Migrations

- Générer et **committer** la migration dans le même commit que le changement de modèle.
- Ne jamais éditer une migration déjà poussée.

## Avant de pousser

```bash
cd backend && python manage.py check && python manage.py makemigrations --check --dry-run
```
