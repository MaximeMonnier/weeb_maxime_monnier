---
name: conventions-docker
description: >-
  Use this skill when the user works on Docker for the Weeb project —
  "dockerise le projet", "écris le Dockerfile", "docker-compose", "conteneuriser
  le back Django", "image du front Vite", "healthcheck", ".dockerignore",
  "variables d'environnement", "compose dev / prod", "passer en Postgres".
  Covers multi-stage builds, non-root user, pinned base images, healthchecks,
  .env handling and strict dev/test/prod separation for the Django+DRF API
  (:8000) and the React/Vite frontend (:5173).
---

# Conventions Docker — projet Weeb

⚠️ **Le dépôt contient `compose.yaml` (service `db` seul, issue #49), et aucun Dockerfile ni `.dockerignore` à ce jour.** Ces règles sont normatives : elles s'appliquent dès la première image écrite.

## Dette à corriger AVANT de dockeriser

1. ~~`SECRET_KEY` en dur, `DEBUG = True`, `ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS` codés en dur~~ — **fait** (issue #48). Les settings sont découpés en `config/settings/{base,development,test,production}.py`, lus depuis l'environnement, et le module actif est choisi par `DJANGO_SETTINGS_MODULE`. La clé versionnée jusque-là reste dans l'historique git : elle est compromise et a été régénérée.
2. ~~Base SQLite~~ — **fait** (issue #49). `psycopg` et `psycopg-binary` sont épinglés dans `backend/requirements.txt`, `DATABASES` est composé par `postgres_database()` dans `config/settings/base.py` et appelé par chacun des trois environnements, et le service `db` est déclaré dans `compose.yaml`.
3. `backend/requirements.txt` — aucun serveur WSGI de production. Ajouter `gunicorn` avec l'image du backend.

## Images de base

- **Toujours épinglées par version exacte.** Jamais `latest`, jamais un tag majeur seul.
- Backend : `python:3.13-slim`
- Frontend (build) : `node:22-alpine` — (service) : `nginx:1.27-alpine`
- Base de données : `postgres:17-alpine`

## Multi-stage obligatoire

Aucune image finale ne contient de chaîne de build.

- **Backend** : stage `builder` (compilation des wheels) → stage final qui installe les wheels et copie le code.
- **Frontend** : stage `builder` (`npm ci` puis `npm run build`) → stage `nginx` qui ne reçoit que `/app/dist`. Node ne doit pas exister dans l'image finale.

## Utilisateur non-root

Chaque image crée son utilisateur et bascule dessus **avant** `CMD` :

```dockerfile
RUN useradd --create-home --uid 1000 weeb
USER weeb
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

Aucune image ne tourne en root. Vérification : `docker run --rm <image> id -u` ne renvoie jamais `0`.

## Ordre des layers (cache)

Les dépendances sont copiées et installées **avant** le code applicatif.

```dockerfile
# Backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

```dockerfile
# Frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

Inverser cet ordre invalide le cache à chaque modification de code : c'est une erreur, pas une préférence.

## .dockerignore

**Un `.dockerignore` par contexte de build** (`backend/`, `frontend/`), systématiquement. Contenu minimal, aligné sur le `.gitignore` du projet :

```
# backend/.dockerignore
venv/
__pycache__/
*.py[cod]
.env
staticfiles/
media/
```

```
# frontend/.dockerignore
node_modules/
dist/
.env
*.log
```

## Healthcheck sur chaque service

Aucun service sans `healthcheck`. Les dépendances utilisent `depends_on: condition: service_healthy`.

| Service | Sonde |
|---|---|
| `backend` | `curl -f http://localhost:8000/api/articles/` (endpoint public en lecture) |
| `frontend` | `wget -q --spider http://localhost/` |
| `db` | `pg_isready -h 127.0.0.1 -U $$POSTGRES_USER -d $$POSTGRES_DB` — `$$` : résolu dans le conteneur, pas par Compose. `-h` obligatoire : sans lui la sonde passe par la socket Unix, à laquelle répond déjà le serveur temporaire d'initialisation |

## Secrets et variables d'environnement

- **Aucun secret en dur** : ni dans un `Dockerfile`, ni dans un `compose.yaml`, ni dans le code. Pas de `ENV SECRET_KEY=...`.
- Tout passe par un `.env` **non versionné** (déjà couvert par `.gitignore` : `.env`, `*.env`).
- Un **`.env.example` versionné**, tenu à jour : chaque variable y figure avec une valeur factice et un commentaire. Ajouter une variable sans la reporter dans `.env.example` est une erreur.

Variables attendues au minimum : `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `VITE_API_URL`.

La connexion passe par ces cinq variables séparées, **pas** par une `DATABASE_URL` : les trois premières servent aussi telles quelles à initialiser l'image `postgres`, ce qui évite de décrire les mêmes identifiants deux fois.

⚠️ **Pas de `$` dans les valeurs du `.env`.** Compose y voit le début d'une variable à substituer et tronque la valeur, là où `python-dotenv` la lit entière. Un secret qui en contient produit des avertissements `variable is not set` à chaque commande Compose, et casserait toute valeur réellement interpolée dans un fichier Compose.

## Séparation dev / test / prod

Trois fichiers distincts, jamais un seul compose avec des branchements :

| Fichier | Rôle |
|---|---|
| `compose.yaml` | Base commune : services, réseaux, volumes, healthchecks. Nom de projet figé par `name:`, sinon le préfixe des volumes suit le nom du dossier |
| `compose.override.yaml` | **Dev** : volumes de code montés, hot-reload (`runserver`, `vite dev`), `DJANGO_DEBUG=1` |
| `compose.prod.yaml` | **Prod** : aucun volume de code, `gunicorn`, `nginx`, `DJANGO_DEBUG=0`, `restart: unless-stopped` |

- En dev uniquement : montage du code et ports exposés (`8000`, `5173`).
- En prod : image autoportante, code copié dans l'image, aucun bind-mount de source.
- Les tests s'exécutent sur l'image de prod avec un service `db` éphémère, jamais sur l'image de dev.
