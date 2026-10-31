# Weeb

Blog avec espace membre : API REST en Django et interface en React.

| Dossier | Rôle | Port en développement |
|---|---|---|
| `backend/` | API REST — Django 6 + Django REST Framework, JWT | `8000` |
| `frontend/` | Interface — React 19 + TypeScript + Vite + Tailwind CSS 4 | `5173` |

Le rapport technique (architecture, dépendances, sécurité, RGPD) est dans
[`docs/rapport-technique.md`](docs/rapport-technique.md).

## Prérequis

Python 3.12+, Node.js 22+, Docker avec Compose v2, Git.

## Installation

```bash
cp .env.example .env                    # Django et Docker Compose
cp frontend/.env.example frontend/.env  # Vite : tout y part en clair dans le JavaScript servi

# DJANGO_SECRET_KEY, puis POSTGRES_PASSWORD, à coller dans .env (alphabets sans `$` ni `#`, que Compose interpréterait)
python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits + "!@%^&*(-_=+)") for _ in range(50)))'
python3 -c 'import secrets, string; a = string.ascii_letters + string.digits; print("".join(secrets.choice(a) for _ in range(32)))'

docker compose -f compose.dev.yaml up -d --wait db

cd backend
python3 -m venv venv && source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
cd ../frontend && npm install
```

- Le `-f` est obligatoire pour **toutes** les commandes Compose : il n'y a pas de `compose.yaml`.
  `export COMPOSE_FILE=compose.dev.yaml` le pose pour le terminal.
- Une clé secrète versionnée par erreur est compromise : en générer une autre.

## Lancer le projet

**Tout en conteneur** : `docker compose -f compose.dev.yaml up -d --wait`. Interface sur
http://localhost:5173, API sur http://localhost:8000, code monté.

**Ou sur la machine**, base et mail en conteneur :

```bash
docker compose -f compose.dev.yaml up -d --wait db mailpit
cd backend && source venv/bin/activate && python manage.py runserver   # terminal 1
cd frontend && npm run dev                                             # terminal 2
```

Compte administrateur et 30 articles de démonstration (refusé si `DEBUG` vaut faux) :

```bash
cd backend && python manage.py createsuperuser && python manage.py peupler_articles
# ou : docker compose -f compose.dev.yaml exec backend python manage.py <commande>
```

Mailpit affiche les emails du développement sur **http://127.0.0.1:8025** sans les livrer. Sans
lui, la réinitialisation répond quand même `200` : l'échec ne paraît que dans les journaux.

## Tester

```bash
# backend, depuis backend/, venv activé et base démarrée (crée et détruit test_<POSTGRES_DB>)
DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test articles.tests.NomDuTest.test_cas

# frontend, depuis frontend/, sans base ni API ; un test vit à côté de sa source (<source>.test.ts(x))
npm run lint && npm test && npm run build
```

### Le parcours en navigateur

`npm run test:e2e` pilote Chromium contre la pile de développement debout, avec un compte **actif** :

```bash
cd frontend && npx playwright install chromium     # une fois par machine
docker compose -f compose.dev.yaml up -d --wait
E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e
npx playwright show-trace test-results/<cas>/trace.zip   # rejoue un échec
```

Cinq connexions par minute au plus : relancée trop tôt, la suite reçoit un `429`. La trace
contient le mot de passe en clair : ne pas la transmettre.

### Intégration continue

Sur chaque push et PR vers `preprod` ou `main`. Seul un push sur `main` publie les images sur
GHCR puis déploie (§ « Déploiement automatique »).

| Workflow | Ce qu'il lance |
|---|---|
| `tests.yml` | suite Django et `pip-audit` ; lint, Vitest, build et `npm audit` ; Playwright sur `compose.dev.yaml` |
| `docker-images.yml` | les deux images (front en cible `prod`) ; sur `main`, publication et déploiement |

Images `ghcr.io/maximemonnier/weeb-backend` et `weeb-frontend`, étiquetées par SHA et `latest`.
Une image nouvelle sur GHCR est privée : la rendre publique à la main.

## Commandes utiles

### Backend (depuis `backend/`, venv activé)

| Commande | Effet |
|---|---|
| `python manage.py makemigrations` / `migrate` | Crée / applique les migrations |
| `python manage.py purger_contacts` | Supprime les messages de contact de plus de 90 jours (`--dry-run` : compte) |
| `python manage.py flushexpiredtokens` | Purge les jetons expirés de la liste noire |
| `python manage.py check --deploy` | Contrôle la sécurité avant mise en ligne |

### Frontend (depuis `frontend/`)

`npm run dev` · `npm run build` · `npm run lint` · `npm test` · `npm run test:e2e` · `npm run preview`

### Compose (depuis la racine)

| Commande | Effet |
|---|---|
| `docker compose -f compose.dev.yaml up -d --wait` | Pile complète ; `--build` reconstruit |
| `docker compose -f compose.dev.yaml ps` / `logs -f <service>` | État / journaux |
| `docker compose -f compose.dev.yaml exec db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'` | Console SQL |
| `docker compose -f compose.dev.yaml down` | Supprime les conteneurs, **garde** les données |
| `docker compose -f compose.dev.yaml down -v` | Supprime aussi le volume : **données perdues** (en production, images des articles comprises) |

Deux projets distincts, `weeb` et `weeb-prod`, qui tournent ensemble :

| | développement | production |
|---|---|---|
| services | `db`, `mailpit`, `backend`, `frontend` | `db`, `backend`, `frontend`, `purge` |
| front | Vite, `127.0.0.1:5173`, code monté | nginx, `127.0.0.1:8081` |
| API | `runserver`, `127.0.0.1:8000`, code monté | Gunicorn, `127.0.0.1:8001` |
| base | publiée sur `127.0.0.1:5432` | non publiée |
| mail | Mailpit, SMTP `1025`, interface `8025` | un vrai relais |

### Images Docker (depuis la racine)

```bash
docker build -t weeb-backend ./backend
docker build --target prod -t weeb-frontend --build-arg VITE_API_URL=/api ./frontend
docker build --target dev -t weeb-frontend-dev ./frontend
```

`VITE_API_URL` est écrite dans le JavaScript à la construction : la changer impose de
reconstruire. L'image `dev` exige un volume anonyme sur `/app/node_modules`, sinon le montage du
code masque celui de l'image.

## Déployer

Front et API ne sont publiés que sur `127.0.0.1` ; TLS et ouverture au réseau reviennent au nginx
**du serveur**, hors Compose. Jamais sur `0.0.0.0` : n'importe qui pourrait forger
`X-Forwarded-Proto`.

### La configuration de production

`cp .env.prod.example .env.prod`. Chargé après `.env`, il gagne variable par variable :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `POSTGRES_SSLMODE` | `disable` | la base ne quitte pas le réseau `interne` |
| `DJANGO_BEHIND_PROXY` | `1` | Django croit le `X-Forwarded-Proto` que nginx écrase |
| `CORS_ALLOWED_ORIGINS` | **vide** | même origine. La ligne doit rester : omise, les origines du développement passent |
| `DJANGO_HSTS_SECONDS` | `0` | tant que la pile est jointe sur `localhost` |
| `DJANGO_LOG_LEVEL` | `INFO` | la ligne doit rester, sinon un `DEBUG` du `.env` passe |
| `EMAIL_HOST` | le relais SMTP | **exigée** : le backend refuse de démarrer sans |
| `FRONTEND_URL` | l'adresse publique du front | **exigée** : racine des liens envoyés par email |
| `DJANGO_ADMINS` | les adresses qui suivent le site | **exigée** : reçoivent chaque erreur 500 |

Les autres lignes de `.env.prod.example` restent décommentées : supprimée, une ligne hérite de la
valeur Mailpit du `.env`. `VITE_API_URL`, `IMAGE_TAG` et les ports restent dans le `.env`.
`DJANGO_ALLOWED_HOSTS` contient le domaine et `127.0.0.1` pour la sonde.

Le serveur ne construit rien : il tire de GHCR l'étiquette `IMAGE_TAG` (un SHA de `main`, ou vide
pour `latest`). Revenir à un SHA ancien ne défait pas les migrations appliquées.

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d --no-build --wait --wait-timeout 60
docker compose -f compose.prod.yaml exec backend python manage.py createsuperuser
docker compose -f compose.prod.yaml exec backend python manage.py sendtestemail --admins
curl -s -o /dev/null -w '%{http_code}\n' -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/api/articles/   # 200
```

- `--no-build` : sans lui, une étiquette absente de GHCR se construit en local sans prévenir.
- `--wait-timeout` : sans lui, `--wait` attend indéfiniment un service qui reboucle.
- `purge` lance `purger_contacts` et `flushexpiredtokens` au démarrage puis chaque jour.

### Déployer derrière le nginx du serveur

Obligatoire : sans lui, l'API répond `301` à toute requête en clair. À adapter au domaine :

```nginx
# /etc/nginx/sites-available/weeb

# Host inconnu : connexion fermée, sinon la redirection réfléchirait un Host forgé.
server {
    listen 80  default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;
    # Négociée avant le SNI : seul le default_server la fixe.
    ssl_protocols       TLSv1.2 TLSv1.3;
    # Négociée après le SNI : répétée dans le serveur nommé.
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

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    # Dans une location : au niveau du server, le return passerait avant le défi de certbot.
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;   # nginx < 1.25.1 : `listen 443 ssl http2;` à la place
    server_name weeb.example.com;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $remote_addr;
    # $scheme écrase la valeur du client ; $http_x_forwarded_proto la relaierait.
    proxy_set_header X-Forwarded-Proto $scheme;

    # Sans barre finale : avec, /api/ serait retiré et Django rendrait 404.
    location /api/ {
        client_max_body_size 6m;   # défaut 1 Mo : trop peu pour une couverture
        proxy_pass http://127.0.0.1:8001;
    }
    location /admin/ {
        proxy_pass http://127.0.0.1:8001;
    }
    # Le site, /static/ et /media/, servis par le conteneur du front.
    location / {
        # Avec un vrai domaine, même max-age que DJANGO_HSTS_SECONDS :
        # add_header Strict-Transport-Security "max-age=3600; includeSubDomains" always;
        proxy_pass http://127.0.0.1:8081;
    }
}
```

`8001` et `8081` sont `BACKEND_PORT_PROD` et `FRONTEND_PORT_PROD`. Activer, la pile démarrée
(sinon `502`) :

```bash
sudo rm -f /etc/nginx/sites-enabled/default    # son default_server ferait échouer nginx -t
sudo ln -s /etc/nginx/sites-available/weeb /etc/nginx/sites-enabled/weeb
sudo nginx -t && sudo systemctl reload nginx
```

### Déployer sur le VPS

Le site tourne sur `https://weeb.kickster.fr`. Le nginx du VPS est un conteneur du réseau externe
`web`, qui n'atteint pas le `127.0.0.1` de l'hôte : `compose.vps.yaml`, chargé après
`compose.prod.yaml`, retire les `ports:` et branche front et API sur `web` (alias
`weeb-frontend`, `weeb-backend`).

Le clone vit dans `/home/apps/docker/apps/weeb`, sous `apps`. Son `.env` pose
`COMPOSE_FILE=compose.prod.yaml:compose.vps.yaml` : les commandes s'y tapent **sans** `-f`. Un
`-f compose.prod.yaml` seul sortirait les conteneurs de `web` (`502`). Vérifier par
`docker compose ps` puis `curl -sI https://weeb.kickster.fr/api/articles/`.

Côté nginx (`/home/apps/nginx`, hors dépôt), recharger par
`docker exec nginx nginx -t && docker exec nginx nginx -s reload` :

| Fichier | Rôle |
|---|---|
| `conf.d/weeb.conf` | `/api/` (avec `client_max_body_size 6m;`) et `/admin/` vers `weeb-backend:8000`, le reste vers `weeb-frontend:8080` ; seul HSTS du site (`max-age` = `DJANGO_HSTS_SECONDS`) |
| `snippets/ssl-app.conf` | `ssl.conf` sans ses `add_header` : front et Django posent les leurs |

Tout autre conteneur de `web` joint l'API directement, et pourrait y forger `X-Forwarded-Proto`.

Emails par le relais Brevo, authentifié sur `kickster.fr` (DKIM et DMARC dans Cloudflare, en
« DNS only »). Le VPS bloque 587 et 465 : `EMAIL_PORT=2525`. `DEFAULT_FROM_EMAIL` reste sur
`kickster.fr`, sinon Brevo rejette en silence.

### Surveillance

L'Uptime Kuma du VPS (`status.kickster.fr`) interroge chaque minute `https://weeb.kickster.fr/`
et `/api/articles/` (mot-clé `count`) et prévient par Telegram. Sur le même serveur, il ne voit
pas une panne du VPS entier.

### Déploiement automatique

Après publication des images d'un push sur `main`, le job `déploiement` de `docker-images.yml`
lance en SSH, sous `apps`, `scripts/deployer-vps.sh <sha>` : avance rapide du clone,
`IMAGE_TAG=<sha>` dans le `.env`, `pull`, `up -d --no-build --wait --wait-timeout 60`, et en cas
d'échec l'état et les journaux du backend. Deux déploiements ne se chevauchent pas.

| Secret du dépôt | Valeur |
|---|---|
| `VPS_HOST` | l'adresse du VPS, hors proxy Cloudflare (il ne relaie pas SSH) |
| `VPS_USER` | `apps` |
| `VPS_SSH_KEY` | une clé privée dédiée, sans phrase de passe |
| `VPS_KNOWN_HOSTS` | l'empreinte du VPS, sous le nom de `VPS_HOST` (`[adresse]:port` avec `VPS_PORT`) |
| `VPS_PORT` | facultatif, `22` par défaut |

```bash
ssh-keygen -t ed25519 -N '' -C weeb-deploy -f ~/.ssh/weeb-deploy
gh secret set VPS_SSH_KEY < ~/.ssh/weeb-deploy
ssh-keyscan -t ed25519 '<adresse>' > /tmp/vps_known_hosts && ssh-keygen -lf /tmp/vps_known_hosts
gh secret set VPS_KNOWN_HOSTS < /tmp/vps_known_hosts
```

Pièges :
- clé publique dans `/home/apps/.ssh/authorized_keys`, puis `sudo restorecon -R /home/apps/.ssh`,
  sans quoi SELinux la refuse en silence ;
- comparer l'empreinte à `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` ;
- un `AllowUsers` de sshd doit nommer `apps` ;
- le script arrive par `git pull`, jamais par copie ; un commit fait à la main sur le VPS bloque
  l'avance rapide, donc tout déploiement ;
- relancer le job d'un ancien commit remet ses images, pas ses fichiers Compose.

## Configuration par environnement

| Module de `backend/config/settings/` | Usage |
|---|---|
| `base.py` | commun : lit le `.env`, sans clé secrète, base ni canal d'email |
| `development.py` | `DEBUG` actif, emails vers Mailpit |
| `test.py` | clé factice, emails en mémoire, quotas éteints |
| `production.py` | `DEBUG` faux, HTTPS, TLS exigé vers la base et le relais SMTP |

`manage.py` prend `development`, `wsgi.py` et `asgi.py` prennent `production`. Un autre module se
choisit par `DJANGO_SETTINGS_MODULE` dans le terminal ou le conteneur, jamais dans le `.env`.

## L'API

Base : `http://localhost:8000/api/` en développement, `/api/` en production. Le visiteur n'a pas
de jeton ; le membre est connecté avec un compte validé ; l'auteur a écrit l'article visé. Un
compte non validé n'obtient aucun jeton. `backend/config/tests.py` rejoue ce tableau.

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register/` | public | Inscription. Le compte est créé **inactif** |
| `POST` | `/api/auth/login/` | public | Rend un jeton d'accès et un jeton de rafraîchissement |
| `POST` | `/api/auth/login/refresh/` | public | Renouvelle le jeton d'accès et rend un refresh neuf |
| `POST` | `/api/auth/logout/` | public | Révoque le jeton de rafraîchissement envoyé |
| `POST` | `/api/auth/password-reset/` | public | Envoie le lien par email. Répond toujours `200` |
| `POST` | `/api/auth/password-reset/confirm/` | public | `uid`, `token`, nouveau mot de passe. Révoque tous les jetons |
| `POST` | `/api/auth/password-change/` | connecté | Révoque les autres sessions, rend une paire neuve |
| `DELETE` | `/api/auth/account/` | connecté | Mot de passe redonné. Supprime le compte et ses articles |
| `GET` | `/api/articles/` | public | Liste paginée par 12 : `{count, next, previous, results}` |
| `GET` | `/api/articles/{id}/` | public | Détail ; `cover` vaut une URL ou `null` |
| `POST` | `/api/articles/` | connecté | `content` : 20 000 caractères au plus. `cover` facultative, en multipart : JPEG, PNG ou WebP lu dans le contenu, 5 Mo et 40 mégapixels au plus |
| `PUT` `PATCH` `DELETE` | `/api/articles/{id}/` | auteur | `cover` vide, ou `null` en JSON, retire l'image |
| `POST` | `/api/contact/` | public | `message` : 5 000 caractères au plus |
| `GET` | `/api/` | connecté | Index navigable du routeur DRF |

L'auteur est rendu en « Prénom Nom », jamais par son email. Routes protégées :
`Authorization: Bearer <jeton d'accès>`. Messages d'erreur en français, ceux de simplejwt par
`backend/locale/`. Après une modification du `.po`, recompiler le `.mo`, versionné :

```bash
msgfmt --check -o backend/locale/fr/LC_MESSAGES/django.mo backend/locale/fr/LC_MESSAGES/django.po

# sans gettext sur la machine
docker run --rm -v "$PWD/backend/locale:/locale" debian:12-slim sh -c \
  "apt-get update -qq && apt-get install -y -qq gettext && \
   msgfmt --check -o /locale/fr/LC_MESSAGES/django.mo /locale/fr/LC_MESSAGES/django.po && \
   chown $(id -u):$(id -g) /locale/fr/LC_MESSAGES/django.mo"
```

### Les jetons

Accès : 15 minutes, rien ne le révoque avant. Rafraîchissement : 1 jour, et il **tourne** :
chaque `login/refresh/` en rend un neuf et met l'ancien en liste noire. Le client range le
`refresh` reçu ; côté front, `apiFetch` le fait.

### Le mot de passe

8 à 128 caractères, ni courant ni entièrement numérique, avec majuscule, minuscule et chiffre.
Refus : `400` sous la clé du champ, `{"password": ["…"]}`.

### Le débit

Au-delà du quota : `429` avec `Retry-After`. Quotas réglables dans le `.env` ; la lecture des
articles n'est pas limitée.

| Route | Quota par défaut | Compté par | Variable |
|---|---|---|---|
| `POST /api/auth/login/` | 5 par minute | IP | `THROTTLE_LOGIN` |
| `POST /api/auth/register/` | 5 par heure | IP | `THROTTLE_REGISTER` |
| `POST /api/auth/password-reset/` | 3 par heure | IP | `THROTTLE_PASSWORD_RESET` |
| `POST /api/auth/password-reset/confirm/` | 5 par heure | IP | `THROTTLE_PASSWORD_RESET_CONFIRM` |
| `POST /api/auth/password-change/` | 5 par heure | compte | `THROTTLE_PASSWORD_CHANGE` |
| `DELETE /api/auth/account/` | 5 par heure | compte | `THROTTLE_ACCOUNT_DELETE` |
| `POST /api/contact/` | 5 par heure | IP | `THROTTLE_CONTACT` |
| `POST` `PUT` `PATCH /api/articles/` | 20 par heure | compte | `THROTTLE_ARTICLE_WRITE` |

## Structure

```
.
├── .env.example, .env.prod.example   # modèles des .env de la racine
├── .github/workflows/                # tests, images et déploiement
├── AMELIORATIONS.md                  # pistes repérées, non traitées
├── docs/rapport-technique.md         # architecture, dépendances, sécurité, RGPD
├── compose.dev.yaml, compose.prod.yaml, compose.vps.yaml
├── scripts/deployer-vps.sh           # déploiement, lancé par la CI
├── backend/
│   ├── config/                       # settings/, urls.py, views.py (/health/)
│   ├── accounts/  articles/  contact/
│   ├── locale/                       # traductions de simplejwt
│   ├── docker-entrypoint.sh          # migrations, table des quotas, statiques
│   └── healthcheck.py                # sonde du conteneur
└── frontend/                         # détail dans frontend/README.md
    ├── nginx.conf                    # image prod : site, /static/ et /media/
    ├── e2e/                          # parcours Playwright
    └── src/                          # components/{ui,common}, pages, hooks, lib (api.ts, tokens.ts)
```

## Contribuer

- Une branche par issue, depuis `origin/preprod` : `<numéro>-description-en-kebab-case`.
- Commits en français, préfixés `feat`, `fix`, `refactor`, `style`, `docs`, `chore` ou `test`.
- PR vers `preprod`, puis `preprod` fusionnée dans `main`.
- Toute variable d'environnement lue par le code figure dans son `.env.example`.

## Résolution de problèmes

| Symptôme | Cause et remède |
|---|---|
| `DJANGO_SECRET_KEY est absente ou vide` | `.env` absent ou incomplet : reprendre *Installation* |
| `required variable POSTGRES_DB is missing a value` | même cause, côté Compose |
| `no configuration file provided` | commande Compose sans `-f` |
| `Connection refused` vers la base | base arrêtée : `docker compose -f compose.dev.yaml up -d --wait db` |
| Connexion refusée après un changement de `POSTGRES_USER`/`DB` | ils ne servent qu'à créer le volume : `down -v` (**données perdues**), `up`, `migrate` |
| Port déjà utilisé | changer la variable de port du `.env` ; en production, reporter dans le `proxy_pass` |
| Inscrit mais impossible de se connecter | compte créé inactif : l'activer dans `/admin/` |
| La réinitialisation n'envoie rien | compte inconnu, inactif, ou envoi raté : réponse identique. En développement, voir Mailpit |
| `env file .env.prod not found` | `cp .env.prod.example .env.prod` |
| Backend `unhealthy` | `logs backend`, puis `curl -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/health/` : `503` base injoignable, `400` `127.0.0.1` absent des hôtes, `301` `DJANGO_BEHIND_PROXY` à `0` |
| L'API de production répond `301` | attendu sans nginx : ajouter `-H 'X-Forwarded-Proto: https'` |
| Admin sans style en production | le volume `static_data` n'atteint pas le front |
| `EACCES` sur `frontend/node_modules` | dossier vide laissé par la pile : `rmdir frontend/node_modules` |
| `Permission denied` en créant un fichier depuis un conteneur | uid 1001 et 1000 : lancer la commande depuis le venv |
| `docker-entrypoint.sh` ou `healthcheck.py` modifié sans effet | copiés dans l'image : `up -d --build --wait` |
| Erreur CORS | ajouter l'origine exacte, port compris, à `CORS_ALLOWED_ORIGINS`, puis redémarrer Django |
