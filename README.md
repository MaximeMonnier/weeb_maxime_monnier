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
dans le code, elles sont lues depuis un fichier `.env` que chacun crée chez lui.

```bash
cp .env.example .env
```

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

**Le front affiche une erreur CORS dans la console du navigateur**
L'adresse du front n'est pas dans `CORS_ALLOWED_ORIGINS` du `.env`. Y ajouter
l'origine exacte, port compris, puis redémarrer le serveur Django.
