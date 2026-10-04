# Weeb

Blog avec espace membre : API REST en Django et interface en React.

| Dossier | Rôle | Port en développement |
|---|---|---|
| `backend/` | API REST — Django 6 + Django REST Framework, authentification par JWT | `8000` |
| `frontend/` | Interface — React 19 + TypeScript + Vite + Tailwind CSS 4 | `5173` |

**Sommaire** : [Prérequis](#prérequis) · [Installation](#installation) ·
[Lancer le projet](#lancer-le-projet) · [Tester](#tester) · [Commandes utiles](#commandes-utiles) ·
[Déployer](#déployer) · [Configuration par environnement](#configuration-par-environnement) ·
[L'API](#lapi) · [Structure](#structure) · [Contribuer](#contribuer) ·
[Résolution de problèmes](#résolution-de-problèmes)

## Prérequis

- Python 3.12 ou plus récent
- Node.js 22 ou plus récent
- Docker avec Compose v2 (`docker compose version`)
- Git

## Installation

À faire une seule fois après avoir cloné le dépôt.

### 1. La configuration

Deux fichiers `.env`, jamais versionnés. Vite ne lit que celui de `frontend/`, et tout ce qu'il
y lit part **en clair** dans le JavaScript servi au navigateur.

```bash
cp .env.example .env                    # Django et Docker Compose
cp frontend/.env.example frontend/.env  # le front, lu par Vite
```

Générer une clé secrète et un mot de passe de base, puis les coller dans `.env` :

```bash
# DJANGO_SECRET_KEY
python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits + "!@%^&*(-_=+)") for _ in range(50)))'

# POSTGRES_PASSWORD
python3 -c 'import secrets, string; a = string.ascii_letters + string.digits; print("".join(secrets.choice(a) for _ in range(32)))'
```

> Ces alphabets excluent `$` et `#` : Compose lit le même `.env` et tronquerait la valeur au
> `$`. Les apostrophes extérieures évitent que le shell interprète le `!`.

Chaque variable est commentée dans `.env.example`. Une clé secrète versionnée par erreur est
compromise : en générer une autre.

### 2. La base de données

```bash
docker compose -f compose.dev.yaml up -d --wait db
docker compose -f compose.dev.yaml ps     # le service `db` doit être `healthy`
```

Le `-f` est obligatoire pour **toutes** les commandes Compose : il n'y a pas de `compose.yaml`.
`export COMPOSE_FILE=compose.dev.yaml` le pose pour la durée du terminal.

### 3. Le backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

### 4. Le frontend

```bash
cd frontend
npm install
```

## Lancer le projet

**Tout en conteneur**, sans venv ni `npm install` — l'étape 1 reste nécessaire :

```bash
docker compose -f compose.dev.yaml up -d --wait
```

L'interface répond sur http://localhost:5173, l'API sur http://localhost:8000. Le code est
monté : une modification recharge le service sans reconstruire d'image.

**Ou les deux applications sur la machine**, avec la base et le serveur de mail en conteneur :

```bash
docker compose -f compose.dev.yaml up -d --wait db mailpit

# terminal 1 — l'API
cd backend && source venv/bin/activate && python manage.py runserver

# terminal 2 — l'interface
cd frontend && npm run dev
```

Créer un compte administrateur (`http://localhost:8000/admin/`), puis publier 30 articles de
démonstration — la commande refuse de tourner quand `DEBUG` vaut faux :

```bash
# applications lancées sur la machine
cd backend && python manage.py createsuperuser
cd backend && python manage.py peupler_articles

# applications lancées par la pile de développement
docker compose -f compose.dev.yaml exec backend python manage.py createsuperuser
docker compose -f compose.dev.yaml exec backend python manage.py peupler_articles
```

Un compte inscrit par le site est créé **inactif** : l'activer depuis l'administration.

### Le serveur de mail du développement

Mailpit reçoit tous les emails envoyés en développement et les affiche sur
**http://127.0.0.1:8025** au lieu de les livrer. Sans lui, la réinitialisation de mot de passe
répond quand même `200` et l'échec ne paraît que dans les journaux. Envoyer un message d'essai :

```bash
cd backend && python manage.py shell -c \
  "from django.core.mail import send_mail; print(send_mail('essai', 'corps', None, ['test@site.fr']))"
```

## Tester

```bash
# backend, depuis backend/ avec le venv activé et la base démarrée
DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test articles.tests.NomDuTest.test_cas

# frontend, depuis frontend/ — ni base ni API nécessaires
npm run lint
npm test
npm run build
```

La suite backend crée et détruit une base `test_<POSTGRES_DB>`. Les tests Vitest vivent à côté
de leur source, sous le nom `<source>.test.ts` (`.test.tsx` pour un composant).

### Le parcours en navigateur

`npm run test:e2e` ouvre un vrai Chromium sur le site et le fait parler à l'API : connexion et
déconnexion. Le navigateur s'installe une fois par machine (660 Mo) :

```bash
cd frontend
npx playwright install chromium   # --with-deps ajoute les bibliothèques système, avec sudo
```

Il faut la pile de développement debout et un compte **actif** :

```bash
docker compose -f compose.dev.yaml up -d --wait
docker compose -f compose.dev.yaml exec backend python manage.py createsuperuser

cd frontend
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e
```

- L'API n'accepte que cinq connexions par minute : relancée dans la minute, la suite reçoit
  un `429`. Attendre une minute.
- Sur échec, une trace rejoue le parcours pas à pas. Elle contient le mot de passe en clair :
  ne pas la transmettre.

```bash
npx playwright show-trace test-results/<dossier-du-cas>/trace.zip
```

### Intégration continue

Deux workflows partent à chaque push sur `preprod` ou `main` et sur chaque pull request qui
vise l'une des deux. Aucun ne publie rien.

| Workflow | Jobs | Ce qu'il lance |
|---|---|---|
| `.github/workflows/tests.yml` | `backend`, `frontend` | la suite Django sur PostgreSQL 17 ; `npm run lint`, `npm test`, `npm run build` |
| `.github/workflows/docker-images.yml` | `backend`, `frontend` | la construction des deux images, le front en cible `prod` |

Le parcours Playwright n'y tourne pas. Reproduire la construction des images à partir du dernier
commit, sans rien de non versionné :

```bash
mkdir -p /tmp/weeb-propre && git archive HEAD | tar -x -C /tmp/weeb-propre
docker build --no-cache -t weeb-backend:ci /tmp/weeb-propre/backend
docker build --no-cache -t weeb-frontend:ci \
  --target prod --build-arg VITE_API_URL=/api /tmp/weeb-propre/frontend
docker image rm weeb-backend:ci weeb-frontend:ci
```

## Commandes utiles

### Backend (depuis `backend/`, venv activé)

| Commande | Effet |
|---|---|
| `python manage.py runserver` | Démarre l'API |
| `python manage.py migrate` | Applique les migrations |
| `python manage.py makemigrations` | Crée une migration après un changement de modèle |
| `python manage.py createsuperuser` | Crée un compte administrateur |
| `python manage.py peupler_articles` | Publie 30 articles de démonstration, en développement seulement |
| `python manage.py flushexpiredtokens` | Purge les jetons expirés de la liste noire |
| `python manage.py check --deploy` | Contrôle la configuration de sécurité avant mise en ligne |
| `python manage.py collectstatic --noinput` | Rassemble les fichiers statiques |

### Frontend (depuis `frontend/`)

| Commande | Effet |
|---|---|
| `npm run dev` | Démarre l'interface avec rechargement à chaud |
| `npm run build` | Vérifie les types puis compile dans `dist/` |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm test` | Lance la suite Vitest |
| `npm run test:e2e` | Lance le parcours Playwright contre la pile de développement |
| `npm run preview` | Sert le résultat de `npm run build` |

### Compose (depuis la racine)

| Commande | Effet |
|---|---|
| `docker compose -f compose.dev.yaml up -d --wait` | Pile de développement : `db`, `mailpit`, `backend`, `frontend` |
| `docker compose -f compose.dev.yaml up -d --build --wait` | La même, en reconstruisant les images |
| `docker compose -f compose.dev.yaml ps` | État et santé des services |
| `docker compose -f compose.dev.yaml logs -f db` | Suit les journaux d'un service |
| `docker compose -f compose.dev.yaml exec db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'` | Console SQL |
| `docker compose -f compose.dev.yaml stop` | Arrête les services sans rien supprimer |
| `docker compose -f compose.dev.yaml down` | Supprime les conteneurs, **garde** les données |
| `docker compose -f compose.dev.yaml down -v` | Supprime aussi le volume : **toutes les données sont perdues** |

Les deux piles sont deux projets Compose distincts, `weeb` et `weeb-prod` : un `down -v` de
l'une ne touche pas l'autre, et elles peuvent tourner ensemble.

| | développement | production |
|---|---|---|
| services | `db`, `mailpit`, `backend`, `frontend` | `db`, `backend`, `frontend` |
| front | Vite sur `127.0.0.1:5173`, code monté | nginx sur `127.0.0.1:8081` |
| API | `runserver` sur `127.0.0.1:8000`, code monté | Gunicorn sur `127.0.0.1:8001` |
| base | publiée sur `127.0.0.1:5432` | non publiée |
| mail | Mailpit, SMTP `1025`, interface `8025` | un vrai relais |

### Images Docker (depuis la racine)

| Commande | Effet |
|---|---|
| `docker build -t weeb-backend ./backend` | Construit l'image de l'API (Gunicorn, compte non-root) |
| `docker build --target dev -t weeb-frontend-dev ./frontend` | Image de développement du front : Vite, ~650 Mo |
| `docker build --target prod -t weeb-frontend --build-arg VITE_API_URL=/api ./frontend` | Image de production du front : nginx sur le port 8080, ~74 Mo |
| `docker image ls 'weeb-*'` | Taille des images |
| `docker run --rm weeb-backend id -u` | Doit rendre autre chose que `0` |
| `docker run --rm weeb-frontend which node` | Doit **échouer** : Node est absent de l'image de production |
| `docker inspect -f '{{.State.Health.Status}}' <conteneur>` | Résultat de la sonde de santé |

`VITE_API_URL` est écrite dans le JavaScript à la construction : la changer impose de
reconstruire, et un build sans elle s'interrompt. L'image `dev` se lance avec un volume anonyme
sur `node_modules`, sans quoi le montage du code masque celui de l'image :

```bash
docker run -d --name weeb-front-dev -p 127.0.0.1:5173:5173 \
  -v "$PWD/frontend:/app" -v /app/node_modules weeb-frontend-dev
docker rm -fv weeb-front-dev      # -v supprime aussi le volume anonyme
```

## Déployer

La pile de production publie le front et l'API sur `127.0.0.1` seulement. Le TLS, le routage
et l'ouverture au réseau reviennent au nginx **du serveur**, qui tourne hors de Compose. Ne
jamais publier ces ports sur `0.0.0.0` : n'importe qui pourrait alors forger `X-Forwarded-Proto`.

### La configuration de production

```bash
cp .env.prod.example .env.prod
```

`compose.prod.yaml` charge `.env` puis `.env.prod`, le second gagnant variable par variable :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `POSTGRES_SSLMODE` | `disable` | la base ne sert pas de TLS et ne quitte pas le réseau `interne` |
| `DJANGO_BEHIND_PROXY` | `1` | Django croit le `X-Forwarded-Proto` que le nginx du serveur écrase |
| `CORS_ALLOWED_ORIGINS` | **vide** | site et API sur la même origine. La ligne doit rester : omise, la production hériterait des origines du développement |
| `DJANGO_HSTS_SECONDS` | `0` | tant que la pile est jointe sur `localhost` ; monter par paliers avec un vrai domaine |
| `EMAIL_HOST` | le relais SMTP | **exigée** : le backend refuse de démarrer sans |
| `FRONTEND_URL` | l'adresse publique du front | **exigée** : racine des liens écrits dans les emails |

Les autres lignes de `.env.prod.example` (expéditeur, port, identifiants SMTP) restent toutes
décommentées : supprimée, une ligne hérite de la valeur du `.env`, réglée pour Mailpit.
`VITE_API_URL` et les ports restent dans le `.env` : Compose les interpole lui-même.
`DJANGO_ALLOWED_HOSTS` doit contenir le domaine, et garder `127.0.0.1` pour la sonde.

```bash
docker compose -f compose.prod.yaml up -d --wait --wait-timeout 60
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f backend
docker compose -f compose.prod.yaml exec backend python manage.py createsuperuser
docker compose -f compose.prod.yaml down
```

Sans `--wait-timeout`, `--wait` attend indéfiniment un service qui reboucle. Vérifier la pile
avant de mettre nginx devant :

```bash
curl -sI http://127.0.0.1:8081/ | head -1                      # 200 — le front
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/api/articles/   # 200 — l'API
curl -sI http://127.0.0.1:8001/api/articles/ | head -1          # 301 attendu sans nginx
```

### Déployer derrière le nginx du serveur

Cette configuration n'est pas facultative : sans elle, l'API répond `301` à toute requête en
clair. À adapter au domaine et aux chemins des certificats :

```nginx
# /etc/nginx/sites-available/weeb

# Tout Host inconnu : connexion fermée. Sans ce bloc, le serveur suivant répondrait
# à n'importe quel Host et sa redirection réfléchirait une valeur forgée.
server {
    listen 80  default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;

    # La version se négocie avant le SNI : c'est le default_server qui la fixe pour
    # tous les noms. Posée dans le serveur nommé, elle n'a aucun effet.
    ssl_protocols       TLSv1.2 TLSv1.3;

    # La suite se négocie après le SNI : elle est donc répétée dans le serveur nommé.
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    return 444;
}

server {
    listen 80;
    listen [::]:80;
    server_name weeb.example.com;

    server_tokens off;

    # Le défi de certbot `--webroot` est servi en clair, avant la redirection.
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Dans une location : au niveau du server, le return passerait avant le défi.
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    # nginx 1.25.1 et plus. En dessous : `listen 443 ssl http2;` et retirer cette ligne.
    http2 on;
    server_name weeb.example.com;

    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Hérités par les location tant qu'aucune ne déclare le sien.
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $remote_addr;
    # $scheme écrase la valeur du client ; $http_x_forwarded_proto la relaierait.
    proxy_set_header X-Forwarded-Proto $scheme;

    # Sans barre oblique finale : avec, le préfixe /api/ serait retiré et Django rendrait 404.
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8001;
    }

    # Le site React, et /static/ que le conteneur du front sert aussi.
    location / {
        # Avec un vrai domaine : décommenter, avec le même max-age que DJANGO_HSTS_SECONDS.
        # add_header Strict-Transport-Security "max-age=3600; includeSubDomains" always;
        proxy_pass http://127.0.0.1:8081;
    }
}
```

Les ports `8001` et `8081` sont `BACKEND_PORT_PROD` et `FRONTEND_PORT_PROD` du `.env`. Activer,
la pile étant déjà démarrée — sinon les trois `location` répondent `502` :

```bash
sudo rm -f /etc/nginx/sites-enabled/default    # son default_server ferait échouer nginx -t
sudo ln -s /etc/nginx/sites-available/weeb /etc/nginx/sites-enabled/weeb
sudo nginx -t && sudo systemctl reload nginx
```

## Configuration par environnement

| Module de `backend/config/settings/` | Usage |
|---|---|
| `base.py` | commun à tous : lit le `.env`, ne définit ni clé secrète, ni base, ni canal d'email |
| `development.py` | poste de développement : `DEBUG` actif, emails vers Mailpit |
| `test.py` | tests : clé factice, emails en mémoire, quotas de débit éteints |
| `production.py` | serveur : `DEBUG` faux, en-têtes HTTPS, TLS exigé vers la base et le relais SMTP |

`manage.py` utilise `development` par défaut, `wsgi.py` et `asgi.py` utilisent `production`.
Un autre module se choisit par `DJANGO_SETTINGS_MODULE`, dans le terminal ou le conteneur et
jamais dans le `.env`, lu trop tard.

## L'API

Base : `http://localhost:8000/api/` en développement, l'adresse du site suivie de `/api/` en
production.

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register/` | public | Inscription. Le compte est créé **inactif** |
| `POST` | `/api/auth/login/` | public | Connexion : rend un jeton d'accès et un jeton de rafraîchissement |
| `POST` | `/api/auth/login/refresh/` | public | Renouvelle le jeton d'accès et rend un jeton de rafraîchissement neuf |
| `POST` | `/api/auth/logout/` | public | Révoque le jeton de rafraîchissement envoyé |
| `POST` | `/api/auth/password-reset/` | public | Envoie le lien par email. Répond toujours `200` |
| `POST` | `/api/auth/password-reset/confirm/` | public | `uid`, `token` et nouveau mot de passe. Révoque tous les jetons du compte |
| `POST` | `/api/auth/password-change/` | connecté | Mot de passe actuel et nouveau. Révoque les autres sessions, rend une paire neuve |
| `GET` | `/api/articles/` | public | Liste paginée par 12 : `{count, next, previous, results}`, avec un extrait |
| `GET` | `/api/articles/{id}/` | public | Détail, contenu entier |
| `POST` | `/api/articles/` | connecté | Crée un article. `content` : 20 000 caractères au plus |
| `PUT` `PATCH` `DELETE` | `/api/articles/{id}/` | auteur | Modification et suppression |
| `POST` | `/api/contact/` | public | Formulaire de contact. `message` : 5 000 caractères au plus |

L'auteur d'un article est rendu en « Prénom Nom », jamais par son email. Les routes protégées
attendent l'en-tête `Authorization: Bearer <jeton d'accès>`.

Les messages d'erreur sont en français, ceux de simplejwt compris grâce à `backend/locale/`.
Après une modification du `.po`, recompiler le `.mo`, versionné :

```bash
msgfmt --check -o backend/locale/fr/LC_MESSAGES/django.mo backend/locale/fr/LC_MESSAGES/django.po

# sans gettext sur la machine
docker run --rm -v "$PWD/backend/locale:/locale" debian:12-slim sh -c \
  "apt-get update -qq && apt-get install -y -qq gettext && \
   msgfmt --check -o /locale/fr/LC_MESSAGES/django.mo /locale/fr/LC_MESSAGES/django.po && \
   chown $(id -u):$(id -g) /locale/fr/LC_MESSAGES/django.mo"
```

### Les jetons

Le jeton d'accès vaut 15 minutes et rien ne le révoque avant. Le jeton de rafraîchissement
vaut 1 jour et **tourne** : chaque `login/refresh/` en rend un neuf et met l'ancien en liste
noire. Un client doit donc ranger le `refresh` reçu en réponse ; côté front, `apiFetch` le fait.

### Le mot de passe

`register/`, `password-reset/confirm/` et `password-change/` exigent 8 à 128 caractères, ni
courant ni entièrement numérique, avec une majuscule, une minuscule et un chiffre. Un refus est
un `400` rangé sous la clé du champ :

```json
{"password": ["Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."]}
```

### Le débit

Au-delà du quota, l'API répond `429` avec un en-tête `Retry-After`. Les quotas se règlent dans
le `.env` ; la lecture des articles n'est pas limitée.

| Route | Quota par défaut | Compté par | Variable |
|---|---|---|---|
| `POST /api/auth/login/` | 5 par minute | IP | `THROTTLE_LOGIN` |
| `POST /api/auth/register/` | 5 par heure | IP | `THROTTLE_REGISTER` |
| `POST /api/auth/password-reset/` | 3 par heure | IP | `THROTTLE_PASSWORD_RESET` |
| `POST /api/auth/password-reset/confirm/` | 5 par heure | IP | `THROTTLE_PASSWORD_RESET_CONFIRM` |
| `POST /api/auth/password-change/` | 5 par heure | compte | `THROTTLE_PASSWORD_CHANGE` |
| `POST /api/contact/` | 5 par heure | IP | `THROTTLE_CONTACT` |

## Structure

```
.
├── .env.example              # modèle du .env de la racine
├── .env.prod.example         # modèle des valeurs propres à la production
├── .github/workflows/        # tests et construction des images
├── AMELIORATIONS.md          # pistes repérées, non traitées
├── compose.dev.yaml          # pile de développement
├── compose.prod.yaml         # pile de production
├── backend/
│   ├── config/               # settings/, urls.py, views.py (route /health/)
│   ├── accounts/             # utilisateurs, authentification JWT
│   ├── articles/             # blog, et la commande peupler_articles
│   ├── contact/              # formulaire de contact
│   ├── locale/               # traductions de simplejwt
│   ├── Dockerfile
│   ├── docker-entrypoint.sh  # migrations et statiques avant Gunicorn
│   ├── healthcheck.py        # sonde de santé du conteneur
│   └── requirements.txt
└── frontend/
    ├── .env.example          # VITE_* seulement, en clair dans le bundle
    ├── Dockerfile            # --target dev ou prod
    ├── nginx.conf            # serveur de l'image prod : site React et /static/
    ├── vite.config.ts        # Vite et Vitest
    ├── playwright.config.ts  # parcours en navigateur
    ├── e2e/
    └── src/
        ├── components/ui/      # composants réutilisables, sans logique métier
        ├── components/common/  # composants liés à un domaine
        ├── pages/              # une page par route
        ├── layouts/
        ├── hooks/              # dont useForm, socle des formulaires
        ├── lib/                # api.ts, seul point d'appel réseau ; tokens.ts, seul accès aux jetons
        └── types/
```

Le détail du front est dans `frontend/README.md`.

## Contribuer

- Une branche par issue, depuis `origin/preprod` : `<numéro>-description-en-kebab-case`.
- Commits en français, à l'impératif, préfixés par un type : `feat`, `fix`, `refactor`,
  `style`, `docs`, `chore`, `test`.
- Les pull requests vont vers `preprod`, puis `preprod` est fusionnée dans `main`.
- Toute variable d'environnement lue par le code figure, commentée, dans le `.env.example`
  correspondant.

## Résolution de problèmes

**`ImproperlyConfigured: La variable d'environnement DJANGO_SECRET_KEY est absente ou vide`** —
le `.env` manque ou la clé est vide : reprendre *1. La configuration*.

**`required variable POSTGRES_DB is missing a value`** — même cause, côté Compose.

**`no configuration file provided: not found`** — la commande Compose a été tapée sans `-f`.

**`Connection refused` vers la base** — la base n'est pas démarrée :
`docker compose -f compose.dev.yaml up -d --wait db`.

**La connexion échoue après un changement de `POSTGRES_USER` ou `POSTGRES_DB`** — ces valeurs ne
servent qu'à la création du volume. Repartir de zéro, **en perdant les données** :
`docker compose -f compose.dev.yaml down -v`, puis `up -d --wait db` et `migrate`.

**Un port est déjà utilisé** (`5432`, `1025`, `8025`, ou `port is already allocated`) — changer
la variable correspondante dans le `.env` : `POSTGRES_PORT`, `MAILPIT_SMTP_PORT_DEV`,
`MAILPIT_UI_PORT_DEV`, `BACKEND_PORT_PROD`… En production, reporter le port dans le
`proxy_pass` du nginx du serveur.

**Je me suis inscrit mais je ne peux pas me connecter** — le compte est créé inactif.
L'activer depuis l'administration, ou :

```bash
cd backend && python manage.py shell -c "from accounts.models import CustomUser; u = CustomUser.objects.get(email='ton@email.fr'); u.is_active = True; u.save()"
```

**La réinitialisation n'envoie rien** — l'adresse n'a pas de compte, le compte est inactif, ou
l'envoi a échoué : l'API répond pareil dans les trois cas. En développement, vérifier que
Mailpit tourne et regarder http://127.0.0.1:8025.

**`env file /chemin/.env.prod not found`** — `cp .env.prod.example .env.prod`.

**Le backend reste `unhealthy`** — lire `docker compose -f compose.prod.yaml logs backend`, puis
interroger la sonde :
`curl -s -o /dev/null -w '%{http_code}\n' -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/health/`.
`503` : base injoignable ; `400` : `127.0.0.1` absent de `DJANGO_ALLOWED_HOSTS` ; `301` :
`DJANGO_BEHIND_PROXY` à `0`.

**L'API de production répond `301` à mes `curl`** — attendu sans nginx devant : ajouter
`-H 'X-Forwarded-Proto: https'`.

**L'administration s'affiche sans style en production** — le volume `static_data` n'atteint pas
le front, qui sert `/static/` : vérifier que `frontend` le monte et que le backend a démarré.

**`npm ci` ou `npm run lint` échoue en `EACCES` sur `frontend/node_modules`** — la pile de
développement a laissé un dossier vide appartenant à `root` : `rmdir frontend/node_modules`.

**`Permission denied` en créant un fichier depuis un conteneur** (`makemigrations`…) — les
conteneurs écrivent sous les uid 1001 et 1000. Lancer la commande depuis le venv.

**Une modification de `docker-entrypoint.sh` ou `healthcheck.py` est sans effet** — ils sont
copiés dans l'image : `docker compose -f compose.dev.yaml up -d --build --wait`.

**Erreur CORS dans la console** — ajouter l'origine exacte, port compris, à
`CORS_ALLOWED_ORIGINS` (`.env`, ou `.env.prod` en production), puis redémarrer Django.
