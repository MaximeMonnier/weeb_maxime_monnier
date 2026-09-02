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
docker compose up -d --wait db
```

`db` à la fin : sans lui, Compose démarre aussi l'API et le front, et construit
leurs images — utile plus tard, inutile pour les deux étapes qui suivent.

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

Deux façons, au choix.

**Tout en conteneur** — une seule commande, sans venv ni `npm install`. Les
étapes *3. Le backend* et *4. Le frontend* deviennent facultatives ; **pas**
l'étape *1. La configuration* : le front lit `frontend/.env` par le montage, et
s'arrête au chargement sans lui.

```bash
docker compose up -d --wait
```

L'interface répond alors sur http://localhost:5173 et l'API sur
http://localhost:8000. Le code des deux applications est monté depuis le dépôt :
modifier un composant React ou un fichier Python recharge le service concerné
sans reconstruire d'image. Détail dans « La stack complète avec Compose ».

**Ou les deux applications sur la machine**, avec la seule base en conteneur —
plus rapide à itérer, et le débogueur reste à portée :

```bash
docker compose up -d --wait db
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
# applications lancées sur la machine
cd backend && python manage.py createsuperuser

# applications lancées par la pile de développement
docker compose exec backend python manage.py createsuperuser
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
| `docker compose up -d --wait db` | Démarre la **seule** base et attend qu'elle réponde |
| `docker compose ps` | Affiche l'état du service et sa santé |
| `docker compose logs -f db` | Suit les journaux de PostgreSQL |
| `docker compose exec db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'` | Ouvre une console SQL sur la base |
| `docker compose stop` | Arrête les services sans rien supprimer |
| `docker compose down` | Supprime les conteneurs, **garde** les données |
| `docker compose down -v` | Supprime aussi le volume : **toutes les données sont perdues** |

### La stack complète avec Compose (depuis la racine)

Trois fichiers, et jamais de condition dans un fichier unique :

| Fichier | Rôle |
|---|---|
| `compose.yaml` | le socle : les trois services, les deux réseaux, le volume de données. Ne se lance jamais seul |
| `compose.override.yaml` | le développement : code monté, ports publiés, rechargement à chaud. Compose le charge d'office |
| `compose.prod.yaml` | la production : images figées, redémarrage automatique, base coupée du monde |

```bash
# développement — Compose ajoute compose.override.yaml tout seul
docker compose up -d --wait

# production — les -f explicites écartent la surcharge de développement
docker compose -f compose.yaml -f compose.prod.yaml up -d --wait --wait-timeout 60
```

`--wait-timeout` n'est pas un ornement : les services de production repartent en
`unless-stopped`, donc un backend qui échoue au démarrage reboucle sans fin et
`--wait` seul attendrait indéfiniment. Soixante secondes, la durée que la pile
doit tenir de toute façon.

> ⚠️ **Les `-f` valent pour TOUTES les commandes de la production**, pas seulement
> `up`. Sans eux, Compose vise le projet `weeb`, celui du développement, et
> échoue **en silence** : `docker compose ps` ne liste rien de la production, et
> `docker compose down` supprime les conteneurs de développement, répond « done »,
> et laisse la production tourner — redémarrage de la machine compris, puisqu'elle
> est en `unless-stopped`.

```bash
docker compose -f compose.yaml -f compose.prod.yaml ps
docker compose -f compose.yaml -f compose.prod.yaml logs -f backend
docker compose -f compose.yaml -f compose.prod.yaml exec backend python manage.py createsuperuser
docker compose -f compose.yaml -f compose.prod.yaml down

# ou, une fois pour toutes dans le terminal qui pilote la production :
export COMPOSE_FILE=compose.yaml:compose.prod.yaml
```

> ⚠️ **Les `-f` ne sont pas facultatifs.** Sans eux, Compose charge
> `compose.override.yaml` : la production démarrerait avec le code de la machine
> monté dans les conteneurs et la base publiée sur l'hôte.

| | développement | production |
|---|---|---|
| front | Vite sur `5173`, code monté | nginx sur `8080`, bundle figé dans l'image |
| API | `runserver` sur `8000`, code monté | Gunicorn sur `8000`, aucun montage |
| base | publiée sur `127.0.0.1:5432` | **aucun port publié**, réseau `interne` fermé |
| redémarrage | aucun | `unless-stopped` sur les trois services |
| images | `weeb-backend:dev`, `weeb-frontend:dev` | `weeb-backend:prod`, `weeb-frontend:prod` |
| projet Compose | `weeb`, volume `weeb_db_data` | `weeb-prod`, volume `weeb-prod_db_data` |

Les deux piles portent des **noms de projet différents**, donc des conteneurs, des
réseaux et des volumes distincts : un `docker compose down -v` lancé en
développement ne touche pas aux données de la production, et l'inverse est vrai
aussi. Elles ne se disputent que le port `8000`, seul défaut commun aux deux —
déplacer `BACKEND_PORT_PROD` suffit à les faire tourner ensemble, à condition
d'ajuster `VITE_API_URL` avec.

Les trois services démarrent en file, chacun attendant que le précédent soit
`healthy` : base, puis API, puis front. `up --wait` rend donc la main quand la
pile entière répond — 18 secondes mesurées en production, images déjà construites.

#### Ce que la production attend du `.env`

Quatre variables changent de valeur, et le `.env.example` le redit à chacune :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `POSTGRES_SSLMODE` | `disable` | `postgres:17-alpine` ne sert pas de TLS, alors que les réglages de production exigent `require`. Le lien ne quitte jamais le réseau `interne` |
| `DJANGO_BEHIND_PROXY` | `1` | sans lui, la redirection HTTPS répond 301 à la sonde et le backend reste `unhealthy` |
| `VITE_API_URL` | l'adresse de l'API | Compose ne lit **que** le `.env` de la racine, jamais `frontend/.env`, et l'adresse est écrite dans le bundle à la construction |
| `CORS_ALLOWED_ORIGINS` | y ajouter `http://localhost:8080` | l'origine du front de production. Les réglages de production n'ont aucun repli : sans elle, le navigateur bloque chaque appel, sans que rien n'échoue côté serveur |

> ⚠️ Cette pile ne monte aucun terminateur TLS. `DJANGO_BEHIND_PROXY=1` la rend
> démarrable, pas utilisable depuis un navigateur : celui-ci n'envoie pas
> `X-Forwarded-Proto` et se fait rediriger vers une adresse HTTPS que personne ne
> sert. Une vraie mise en ligne place un proxy devant, et c'est lui qui rend ce
> réglage légitime.
>
> **C'est pour cela que les deux services de production ne publient leurs ports
> que sur `127.0.0.1`.** `DJANGO_BEHIND_PROXY=1` fait confiance à un en-tête que
> personne n'écrase : ouvert au réseau, n'importe quelle machine le forgerait
> pour contourner la redirection HTTPS et lire les jetons JWT en clair, pendant
> que Django croit servir du chiffré et pose ses cookies `Secure`. Élargir la
> publication **seulement** une fois le proxy en place.

#### Six pièges

- **Le nom des images.** Compose déduit `<projet>-<service>`, soit `weeb-backend`
  et `weeb-frontend` — les noms mêmes des constructions manuelles décrites
  ci-dessous. Sans `image:` explicite, il réutilise ces images-là plutôt que de
  construire les siennes, **sans rien signaler** : la pile de développement s'est
  retrouvée servie par le nginx de production. D'où les étiquettes `:dev` et
  `:prod`.
- **Le port publié de la base est dans `compose.override.yaml`, pas dans le
  socle.** Compose sait ajouter une entrée héritée, jamais la retirer : une
  publication posée dans `compose.yaml` serait impossible à enlever en production.
- **La pile de développement laisse un `frontend/node_modules` vide sur la
  machine**, appartenant à `root` — Docker crée le point de montage du volume
  anonyme côté hôte. Il bloque ensuite `npm ci` et `npm run lint` en `EACCES`.
  Le supprimer avec `rmdir frontend/node_modules` : le dossier est vide, le droit
  d'écriture sur `frontend/` suffit, `sudo` est inutile.
- **La sonde de la base vise `pg_isready -h 127.0.0.1`, et le `-h` n'est pas
  décoratif.** Sans lui, `pg_isready` passe par la socket Unix, à laquelle répond
  déjà le serveur temporaire que PostgreSQL lance pour initialiser son cluster :
  le service serait déclaré sain une fraction de seconde avant d'écouter en TCP,
  et le `migrate` qui suit un `up --wait` échouerait en « Connection refused ».
  La sonde teste donc le chemin de Django, le seul qui compte. Son `start_period`
  couvre cette initialisation, pendant laquelle les échecs ne sont pas comptés.
- **L'entrypoint et la sonde ne sont plus ceux du dépôt.** Ils vivent dans
  `/usr/local/bin/` depuis que le montage `./backend:/app` recouvrait leurs
  copies sous `/app` — ce sont donc bien ceux de l'image qui s'exécutent, mais
  éditer `backend/docker-entrypoint.sh` ou `backend/healthcheck.py` sur la
  machine n'a plus d'effet sur le conteneur tant que l'image n'est pas
  reconstruite (`docker compose up -d --build`). En échange, le bit exécutable
  du dépôt n'entre plus dans l'équation.
- **Les deux conteneurs de développement écrivent sous un uid fixe** : `1001`
  pour le backend, `1000` pour le front. Une commande qui crée un fichier dans le
  dépôt à travers le montage — `docker compose exec backend python manage.py
  makemigrations`, par exemple — échoue en `Permission denied` si l'utilisateur
  de la machine porte un autre uid (`id -u` pour le connaître). La lancer alors
  depuis le venv, où le fichier appartient d'emblée à la bonne personne.

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

Pour la faire tourner contre la base, ne pas la lancer à la main :
`compose.prod.yaml` s'en charge, avec les réglages que le `.env` ne décrit pas
pour un conteneur — voir « La stack complète avec Compose ». Le tableau ci-dessus
sert à inspecter l'image, pas à la mettre en service.

Le conteneur passe `healthy` quand `GET /api/articles/` renvoie 200.

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
├── compose.yaml              # socle : les trois services, les réseaux, le volume
├── compose.override.yaml     # surcharge de développement, chargée d'office
├── compose.prod.yaml         # surcharge de production, à passer par -f
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
La base n'est pas démarrée. Depuis la racine : `docker compose up -d --wait db`.

**`docker compose up` répond `required variable POSTGRES_DB is missing a value`**
Le `.env` est absent ou les variables `POSTGRES_*` n'y sont pas. Reprendre l'étape
*La configuration*. Compose refuse volontairement de démarrer plutôt que de créer
une base avec des identifiants improvisés.

**J'ai changé `POSTGRES_USER` ou `POSTGRES_DB` et la connexion échoue**
Ces valeurs ne servent qu'à la **création** de la base, au tout premier démarrage.
Un volume déjà initialisé les ignore. Pour repartir sur ces nouvelles valeurs :
`docker compose down -v`, puis `docker compose up -d --wait db` et `python manage.py migrate`.
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

**`npm ci` ou `npm run lint` échoue en `EACCES` sur `frontend/node_modules`**
La pile de développement a laissé un dossier vide appartenant à `root` : Docker
crée côté hôte le point de montage du volume anonyme. `rmdir frontend/node_modules`
suffit, sans `sudo`.

**La pile de développement sert le front par nginx au lieu de Vite**
Une image `weeb-frontend` construite à la main traîne sur la machine et porte le
nom que Compose déduirait. Les fichiers Compose nomment désormais les leurs
`weeb-frontend:dev` et `weeb-frontend:prod` ; si le symptôme revient, forcer la
construction avec `docker compose up -d --build --wait`.

**Le front affiche une erreur CORS dans la console du navigateur**
L'adresse du front n'est pas dans `CORS_ALLOWED_ORIGINS` du `.env`. Y ajouter
l'origine exacte, port compris, puis redémarrer le serveur Django.
