# Weeb

Blog avec espace membre : API REST en Django et interface en React.

Le projet est séparé en deux applications indépendantes qui se parlent par HTTP :

| Dossier | Rôle | Port en développement |
|---|---|---|
| `backend/` | API REST — Django 6 + Django REST Framework, authentification par JWT | `8000` |
| `frontend/` | Interface — React 19 + TypeScript + Vite + Tailwind CSS 4 | `5173` |

## Prérequis

- Python 3.12 ou plus récent
- Node.js 22 ou plus récent
- Docker avec Compose v2 (`docker compose version`) — la base de données tourne dans un conteneur
- Git

## Installation

À faire une seule fois après avoir cloné le dépôt.

### 1. La configuration

Le projet ne démarre pas sans configuration : les valeurs sensibles ne sont pas
dans le code, elles sont lues depuis des fichiers `.env` que chacun crée chez lui.

Il y en a **deux**, et ils ne sont pas interchangeables :

```bash
cp .env.example .env                    # Django et Docker Compose
cp frontend/.env.example frontend/.env  # le front, lu par Vite
```

Pourquoi deux : Vite ne lit que les `.env` situés à la racine de son propre
projet, donc `frontend/`. Une variable posée à la racine du dépôt lui resterait
invisible. Le second ne contient d'ailleurs aucun secret — tout ce que Vite y
lit part **en clair** dans le JavaScript servi au navigateur.

Puis générer une clé secrète et un mot de passe de base de données, et les coller
dans `.env` à la place des valeurs d'exemple :

```bash
# DJANGO_SECRET_KEY
python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits + "!@%^&*(-_=+)") for _ in range(50)))'

# POSTGRES_PASSWORD
python3 -c 'import secrets, string; a = string.ascii_letters + string.digits; print("".join(secrets.choice(a) for _ in range(32)))'
```

> Les apostrophes sont volontairement à l'extérieur de ces commandes : entre
> guillemets doubles, le `!` du jeu de caractères est pris par zsh et bash pour
> un rappel d'historique, et la commande échoue sur `event not found`.
>
> Les caractères `$` et `#` sont volontairement absents de ces jeux de
> caractères, et c'est pourquoi on n'utilise pas ici le
> `get_random_secret_key()` de Django, dont l'alphabet les contient.
> Le `$` est le vrai piège : Docker Compose lit le même `.env` et y voit le
> début d'une variable à substituer, donc il tronque la valeur là où Django la
> lit entière — une panne sans cause visible, que doubler le caractère
> n'arrange pas. Le `#` est écarté par simple précaution : il ouvre un
> commentaire dès qu'un espace le précède, pour les deux lecteurs à la fois.

Chaque variable de `.env.example` est commentée : lire ce fichier suffit à comprendre à quoi elle sert.

> Le `.env` ne doit **jamais** être envoyé sur GitHub. Il est déjà exclu par `.gitignore`.
> Une clé secrète qui a été versionnée est à considérer comme compromise : il faut en générer une autre.

### 2. La base de données

PostgreSQL tourne dans un conteneur, décrit par `compose.yaml`. Depuis la racine :

```bash
docker compose up -d --wait
```

`--wait` rend la main seulement quand la base répond vraiment, et non dès que le
conteneur est lancé : l'étape suivante peut donc enchaîner sans attendre.

```bash
docker compose ps     # le service `db` doit être `healthy`
```

### 3. Le backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate          # exige que la base soit démarrée
```

### 4. Le frontend

```bash
cd frontend
npm install
```

## Lancer le projet

La base doit tourner en premier — une seule fois, elle reste démarrée ensuite :

```bash
docker compose up -d --wait
```

Puis **deux terminaux**, un par application.

```bash
# terminal 1 — l'API sur http://localhost:8000
cd backend && source venv/bin/activate && python manage.py runserver

# terminal 2 — l'interface sur http://localhost:5173
cd frontend && npm run dev
```

Pour accéder à l'administration Django (`http://localhost:8000/admin/`), créer d'abord un compte :

```bash
cd backend && python manage.py createsuperuser
```

## Commandes utiles

### Backend (depuis `backend/`, environnement virtuel activé)

| Commande | Effet |
|---|---|
| `python manage.py runserver` | Démarre l'API |
| `python manage.py migrate` | Applique les migrations à la base |
| `python manage.py makemigrations` | Crée une migration après un changement de modèle |
| `python manage.py createsuperuser` | Crée un compte administrateur |
| `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test` | Lance les tests |
| `python manage.py check --deploy` | Vérifie la configuration de sécurité avant mise en ligne |
| `python manage.py collectstatic --noinput` | Rassemble les fichiers statiques pour la production |

### Base de données (depuis la racine)

| Commande | Effet |
|---|---|
| `docker compose up -d --wait` | Démarre la base et attend qu'elle réponde |
| `docker compose ps` | Affiche l'état du service et sa santé |
| `docker compose logs -f db` | Suit les journaux de PostgreSQL |
| `docker compose exec db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'` | Ouvre une console SQL sur la base |
| `docker compose stop` | Arrête la base sans rien supprimer |
| `docker compose down` | Supprime le conteneur, **garde** les données |
| `docker compose down -v` | Supprime aussi le volume : **toutes les données sont perdues** |

### Image Docker du backend (depuis la racine)

L'API est empaquetée dans une image de production : Gunicorn, compte non-root,
migrations et fichiers statiques appliqués au démarrage. Elle ne remplace pas
`runserver` pour le développement quotidien.

| Commande | Effet |
|---|---|
| `docker build -t weeb-backend ./backend` | Construit l'image (contexte : `backend/`) |
| `docker image ls weeb-backend` | Affiche la taille de l'image |
| `docker run --rm weeb-backend id -u` | Vérifie que le conteneur ne tourne pas en root |
| `docker logs -f <conteneur>` | Suit les journaux de Gunicorn |
| `docker inspect -f '{{.State.Health.Status}}' <conteneur>` | Affiche le résultat de la sonde de santé |

Pour la lancer contre la base de `compose.yaml`, en la rattachant au réseau du
projet et en visant le service `db` :

```bash
docker run -d --name weeb-api --network weeb_default \
  --restart unless-stopped \
  --env-file .env \
  -e POSTGRES_HOST=db \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_SSLMODE=disable \
  -e DJANGO_BEHIND_PROXY=1 \
  -p 127.0.0.1:8000:8000 \
  weeb-backend
```

Quatre variables sont surchargées ici parce que le `.env` décrit un backend
lancé dans le venv, pas dans un conteneur :

- `POSTGRES_HOST=db` — la base se joint par le nom du service, pas par `localhost`,
  qui désignerait le conteneur de l'API lui-même ;
- `POSTGRES_PORT=5432` — le `.env` porte le port **publié sur la machine**, qui
  peut avoir été déplacé en 5433 ; à l'intérieur du réseau Compose, la base
  écoute toujours 5432 ;
- `POSTGRES_SSLMODE=disable` — le PostgreSQL local ne présente pas de certificat,
  alors que les réglages de production exigent TLS par défaut ;
- `DJANGO_BEHIND_PROXY=1` — sans lui, la redirection HTTPS de la production
  répond 301 à la sonde de santé et le conteneur reste `unhealthy`.

> ⚠️ **`DJANGO_BEHIND_PROXY=1` sans reverse proxy devant le conteneur n'est
> acceptable qu'ici**, parce que le port n'est publié que sur `127.0.0.1` :
> seule la machine peut appeler l'API, donc seule elle peut forger l'en-tête
> `X-Forwarded-Proto`. En ligne, ce réglage ne se justifie que derrière un proxy
> qui **écrase** cet en-tête. Il ne doit pas être recopié tel quel dans un futur
> `compose.prod.yaml`.

`--restart unless-stopped` : le script de démarrage s'arrête si la base n'est
pas joignable. Sans politique de redémarrage, un conteneur lancé avant sa base
resterait mort.

Le conteneur passe `healthy` quand `GET /api/articles/` renvoie 200. Un
raccordement à Compose viendra plus tard : ici l'image est construite et lancée
à la main.

### Image Docker du frontend (depuis la racine)

Un seul `Dockerfile`, **deux images**, choisies par `--target` :

| Cible | Ce qu'elle contient | Taille | Usage |
|---|---|---|---|
| `dev` | Node, toutes les dépendances, le serveur Vite | ~540 Mo | travailler sans installer Node sur sa machine |
| `prod` | le site compilé et nginx, **sans Node** | ~74 Mo | servir le site en ligne |

#### La cible `dev`

```bash
docker build --target dev -t weeb-frontend-dev ./frontend

docker run -d --name weeb-front-dev \
  -p 127.0.0.1:5173:5173 \
  -v "$PWD/frontend:/app" \
  -v /app/node_modules \
  weeb-frontend-dev
```

Les deux montages vont ensemble, et le second n'est pas une coquille :

- `-v "$PWD/frontend:/app"` place le code de la machine dans le conteneur, pour
  que Vite recharge la page à chaque enregistrement ;
- `-v /app/node_modules` — un volume anonyme, sans source — **recouvre** le
  premier à cet endroit précis. Sans lui, le `frontend/` de la machine masquerait
  le `node_modules` installé dans l'image, et Vite ne trouverait plus rien.

L'adresse de l'API vient alors du `frontend/.env`, apporté par le montage. Sans
montage, il faut la passer à la main, sinon le front s'arrête au chargement :

```bash
docker run -d --name weeb-front-dev -p 127.0.0.1:5173:5173 \
  -e VITE_API_URL=http://localhost:8000/api \
  weeb-frontend-dev
```

> ⚠️ **Ne pas lancer `npm run build` dans ce conteneur avec le montage.** Le
> compte `node` de l'image porte l'uid 1000, alors que les fichiers de la machine
> appartiennent à l'utilisateur qui a cloné le dépôt : la création de `dist/`
> échoue en `EACCES`. Construire depuis la machine avec `npm run build`, ou par
> la cible `prod` ci-dessous, qui compile à l'intérieur de l'image.

> ⚠️ **Deux traces que ce conteneur laisse sur la machine.** Docker crée le point
> de montage du volume anonyme **côté hôte** : un `frontend/node_modules` vide
> apparaît, appartenant à `root`, et bloque ensuite `npm ci` et `npm run lint` en
> `EACCES`. Le supprimer avec `rmdir frontend/node_modules` — le dossier est vide,
> le droit d'écriture sur `frontend/` suffit, `sudo` est inutile. Et supprimer le
> conteneur avec **`docker rm -v`** : sans le `-v`, chaque suppression abandonne un
> volume anonyme d'environ 300 Mo. `docker volume ls -qf dangling=true` les liste.

#### La cible `prod`

```bash
docker build --target prod -t weeb-frontend \
  --build-arg VITE_API_URL=https://api.exemple.fr/api ./frontend

docker run -d --name weeb-front -p 127.0.0.1:8080:8080 weeb-frontend
```

`--build-arg` n'est pas optionnel : l'adresse de l'API est **écrite dans le
JavaScript** au moment de la compilation, pas lue au démarrage. En changer impose
donc de reconstruire l'image. Un build lancé sans elle s'interrompt avec un
message explicite, plutôt que de produire un bundle qui afficherait une page
blanche dans le navigateur.

Le port est **8080** et non 80 : le conteneur tourne sous le compte `nginx`,
qui n'a pas le privilège de lier un port inférieur à 1024.

#### Vérifier une image

| Commande | Effet |
|---|---|
| `docker image ls weeb-frontend` | Affiche la taille de l'image |
| `docker run --rm weeb-frontend which node` | Doit **échouer** : Node est absent de l'image de production |
| `docker run --rm weeb-frontend id -u` | Vérifie que le conteneur ne tourne pas en root |
| `docker logs -f <conteneur>` | Suit les journaux |
| `docker inspect -f '{{.State.Health.Status}}' <conteneur>` | Affiche le résultat de la sonde de santé |

Les deux images passent `healthy` quand leur serveur répond sur `/`. Attention à
ce que cette sonde ne dit pas en `dev` : elle vérifie que Vite répond, pas que
l'application fonctionne. Une `VITE_API_URL` absente casse le front dans le
navigateur alors que le conteneur reste `healthy`.

#### Les choix du Dockerfile qui ne se devinent pas

- **Le compte `node` reçoit `/app` avant l'installation.** Vite écrit son cache de
  dépendances pré-compilées dans `node_modules/.vite` au démarrage. Installer en
  root puis basculer d'utilisateur laisserait ce dossier en lecture seule pour
  lui, et le serveur ne démarrerait pas.
- **`DEV_POLLING=1`, posé par la cible `dev`.** `vite.config.ts` bascule alors la
  surveillance des fichiers en interrogation périodique. Les événements du système
  de fichiers ne traversent pas un montage lié : sans cela, le rechargement à
  chaud reste muet.
- **Vite est appelé directement, pas par `npm run dev`.** npm resterait le
  processus n° 1 sans transmettre `SIGTERM` à son enfant, et chaque `docker stop`
  attendrait les dix secondes du délai de grâce. Son option `--host` est
  indispensable : sans elle, Vite n'écoute que la boucle locale *du conteneur*,
  que la publication de port ne peut pas atteindre.
- **`nginx.conf` remplace la configuration entière**, et non un fragment de
  `conf.d/`. Celle d'origine pose une directive `user` et son fichier pid dans
  `/var/run`, deux choses interdites à un compte non privilégié ; tout ce que le
  serveur écrit a été renvoyé vers `/tmp`.
- **`try_files $uri $uri/ /index.html`.** Le routage appartient à React : sans ce
  repli, un rechargement de page sur `/articles/42` chercherait un fichier de ce
  nom et renverrait 404.

### Frontend (depuis `frontend/`)

| Commande | Effet |
|---|---|
| `npm run dev` | Démarre l'interface avec rechargement à chaud |
| `npm run build` | Compile la version de production dans `dist/` |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run preview` | Sert localement le résultat de `npm run build` |

## Configuration par environnement

Les réglages Django sont découpés par environnement dans `backend/config/settings/` :

| Module | Usage | Particularités |
|---|---|---|
| `base.py` | commun à tous | lit le `.env`, ne définit aucune clé secrète |
| `development.py` | poste de développement | `DEBUG` actif, origines `localhost:5173` autorisées |
| `test.py` | tests automatisés | clé factice, base `test_weeb` créée et détruite par Django, exige PostgreSQL |
| `production.py` | serveur en ligne | `DEBUG` forcé à faux, hôtes obligatoires, en-têtes de sécurité HTTPS, TLS exigé jusqu'à la base |

Le module utilisé est choisi par la variable `DJANGO_SETTINGS_MODULE`, à définir
dans le terminal ou dans le conteneur — **pas** dans le `.env`, que Django lit trop tard.

```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
```

Sans rien préciser : `manage.py` utilise `development`, et un serveur d'application
(`wsgi.py` / `asgi.py`) utilise `production`. Sur un serveur, poser la variable
explicitement, sinon une commande comme `migrate` s'exécuterait avec les réglages
de développement.

## L'API

Base : `http://localhost:8000/api/`

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register/` | public | Inscription. Le compte est créé **inactif**, un administrateur doit l'activer |
| `POST` | `/api/auth/login/` | public | Connexion : renvoie un token d'accès et un token de rafraîchissement |
| `POST` | `/api/auth/login/refresh/` | public | Renouvelle le token d'accès expiré |
| `POST` | `/api/auth/password-reset/` | public | Demande de réinitialisation du mot de passe |
| `POST` | `/api/auth/password-reset/confirm/` | public | Confirmation avec le nouveau mot de passe |
| `GET` | `/api/articles/` | public | Liste des articles |
| `GET` | `/api/articles/{id}/` | public | Détail d'un article |
| `POST` | `/api/articles/` | connecté | Crée un article, rattaché à son auteur |
| `PUT` `PATCH` `DELETE` | `/api/articles/{id}/` | auteur | Modification et suppression réservées à l'auteur |
| `POST` | `/api/contact/` | public | Envoi du formulaire de contact |

Les routes protégées attendent le token dans l'en-tête :

```
Authorization: Bearer <token d'accès>
```

Le token d'accès est valable 1 heure, celui de rafraîchissement 1 jour.

## Structure

```
.
├── .env.example              # modèle de configuration à copier en .env
├── compose.yaml              # services conteneurisés — pour l'instant la base
├── backend/
│   ├── config/               # configuration du projet Django
│   │   ├── settings/         # base, development, test, production
│   │   └── urls.py           # routeur principal
│   ├── accounts/             # utilisateurs, authentification JWT
│   ├── articles/             # articles du blog
│   ├── contact/              # formulaire de contact
│   ├── Dockerfile            # image de production de l'API
│   ├── .dockerignore         # ce que le build n'envoie pas au démon
│   ├── docker-entrypoint.sh  # migrations et statiques avant Gunicorn
│   ├── healthcheck.py        # sonde de santé du conteneur
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/ui/     # composants réutilisables, sans logique métier
        ├── components/common/ # composants liés à un domaine du projet
        ├── pages/             # une page par route
        ├── layouts/           # gabarits partagés
        ├── hooks/             # hooks React
        ├── lib/api.ts         # point d'entrée unique des appels à l'API
        └── types/             # types TypeScript partagés
```

Un utilisateur est identifié par son **email**, pas par un nom d'utilisateur.
Côté API, tout endpoint est protégé par défaut : une route publique doit
l'autoriser explicitement.

## Contribuer

- Une branche par issue, créée depuis `main` : `<numéro>-description-en-kebab-case`, sans accent.
- Messages de commit en français, à l'impératif, préfixés par leur type :
  `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`. Un seul type par commit.
- Les pull requests vont vers `preprod`, puis `preprod` est fusionnée dans `main`.
- Ajouter une variable d'environnement implique de l'ajouter à `.env.example`, avec un commentaire.

## Résolution de problèmes

**`ImproperlyConfigured: La variable d'environnement DJANGO_SECRET_KEY est absente ou vide`**
Le `.env` est absent ou la clé n'est pas renseignée. Reprendre l'étape *La configuration*.
Ce n'est pas un bug : le serveur refuse volontairement de démarrer sans clé, plutôt
que d'en utiliser une connue de tous.

**Je me suis inscrit mais je ne peux pas me connecter**
C'est le comportement prévu : un compte est créé inactif. L'activer depuis
`http://localhost:8000/admin/`, ou en ligne de commande :

```bash
cd backend && python manage.py shell -c "from accounts.models import CustomUser; u = CustomUser.objects.get(email='ton@email.fr'); u.is_active = True; u.save()"
```

**`connection to server at "localhost" ... failed: Connection refused`**
La base n'est pas démarrée. Depuis la racine : `docker compose up -d --wait`.

**`docker compose up` répond `required variable POSTGRES_DB is missing a value`**
Le `.env` est absent ou les variables `POSTGRES_*` n'y sont pas. Reprendre l'étape
*La configuration*. Compose refuse volontairement de démarrer plutôt que de créer
une base avec des identifiants improvisés.

**J'ai changé `POSTGRES_USER` ou `POSTGRES_DB` et la connexion échoue**
Ces valeurs ne servent qu'à la **création** de la base, au tout premier démarrage.
Un volume déjà initialisé les ignore. Pour repartir sur ces nouvelles valeurs :
`docker compose down -v`, puis `docker compose up -d --wait` et `python manage.py migrate`.
Attention, `-v` détruit toutes les données existantes.

**Le port 5432 est déjà utilisé**
Un PostgreSQL tourne déjà sur la machine. Changer `POSTGRES_PORT` dans le `.env`
(par exemple `5433`) : Django et Compose lisent tous deux cette variable.

**Le conteneur du backend reste `unhealthy`**
Regarder d'abord `docker logs <conteneur>` : une erreur de connexion à la base
y apparaît en clair. Si les journaux montrent un démarrage normal de Gunicorn,
la sonde reçoit autre chose qu'un 200. Les deux causes habituelles : `127.0.0.1`
absent de `DJANGO_ALLOWED_HOSTS`, qui vaut un 400 ; ou `DJANGO_BEHIND_PROXY`
laissé à 0, auquel cas la redirection HTTPS des réglages de production répond
301 à la sonde.

**Le front affiche une erreur CORS dans la console du navigateur**
L'adresse du front n'est pas dans `CORS_ALLOWED_ORIGINS` du `.env`. Y ajouter
l'origine exacte, port compris, puis redémarrer le serveur Django.
