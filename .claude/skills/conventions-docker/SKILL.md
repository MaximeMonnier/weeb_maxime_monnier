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

⚠️ **Le dépôt ne contient aujourd'hui aucun Dockerfile, compose ou `.dockerignore`.** Ces règles sont normatives : elles s'appliquent dès la première image écrite.

## Dette à corriger AVANT de dockeriser

Trois blocages présents dans le code actuel. Les traiter en premier, sinon l'image produite est inutilisable :

1. `backend/config/settings.py` — `SECRET_KEY` est en dur dans le fichier et versionné. La déplacer en variable d'environnement et **la considérer comme compromise** (en régénérer une nouvelle).
2. `backend/config/settings.py` — `DEBUG = True`, `ALLOWED_HOSTS = []`, `CORS_ALLOWED_ORIGINS` codés en dur. Tous doivent être lus depuis l'environnement.
3. `backend/requirements.txt` — base SQLite et aucun serveur WSGI de production. Ajouter `gunicorn` et `psycopg[binary]`, migrer `DATABASES` vers Postgres.

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
*.sqlite3
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
| `db` | `pg_isready -U $POSTGRES_USER` |

## Secrets et variables d'environnement

- **Aucun secret en dur** : ni dans un `Dockerfile`, ni dans un `compose.yaml`, ni dans le code. Pas de `ENV SECRET_KEY=...`.
- Tout passe par un `.env` **non versionné** (déjà couvert par `.gitignore` : `.env`, `*.env`).
- Un **`.env.example` versionné**, tenu à jour : chaque variable y figure avec une valeur factice et un commentaire. Ajouter une variable sans la reporter dans `.env.example` est une erreur.

Variables attendues au minimum : `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `VITE_API_URL`.

## Séparation dev / test / prod

Trois fichiers distincts, jamais un seul compose avec des branchements :

| Fichier | Rôle |
|---|---|
| `compose.yaml` | Base commune : services, réseaux, volumes, healthchecks |
| `compose.override.yaml` | **Dev** : volumes de code montés, hot-reload (`runserver`, `vite dev`), `DJANGO_DEBUG=1` |
| `compose.prod.yaml` | **Prod** : aucun volume de code, `gunicorn`, `nginx`, `DJANGO_DEBUG=0`, `restart: unless-stopped` |

- En dev uniquement : montage du code et ports exposés (`8000`, `5173`).
- En prod : image autoportante, code copié dans l'image, aucun bind-mount de source.
- Les tests s'exécutent sur l'image de prod avec un service `db` éphémère, jamais sur l'image de dev.
