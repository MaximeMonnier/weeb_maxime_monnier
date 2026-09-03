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

Un troisième, `.env.prod`, n'est nécessaire que pour lancer la **pile de
production** : voir « Ce que la production attend de la configuration ». Rien
de ce qui suit n'en a besoin.

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

PostgreSQL tourne dans un conteneur, décrit par `compose.dev.yaml`. Depuis la
racine :

```bash
docker compose -f compose.dev.yaml up -d --wait db
```

`db` à la fin : sans lui, Compose démarre aussi l'API et le front, et construit
leurs images — utile plus tard, inutile pour les deux étapes qui suivent.

`--wait` rend la main seulement quand la base répond vraiment, et non dès que le
conteneur est lancé : l'étape suivante peut donc enchaîner sans attendre.

```bash
docker compose -f compose.dev.yaml ps     # le service `db` doit être `healthy`
```

> Le `-f` n'est pas facultatif, et il vaut pour toutes les commandes. Il n'y a
> **pas** de `compose.yaml` dans ce dépôt : chaque pile a son fichier, et une
> commande qui oublie le `-f` s'arrête sur `no configuration file provided`
> plutôt que de viser la mauvaise pile. `export COMPOSE_FILE=compose.dev.yaml`
> le pose une fois pour toutes dans le terminal.

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
docker compose -f compose.dev.yaml up -d --wait
```

L'interface répond alors sur http://localhost:5173 et l'API sur
http://localhost:8000. Le code des deux applications est monté depuis le dépôt :
modifier un composant React ou un fichier Python recharge le service concerné
sans reconstruire d'image. Détail dans « La stack complète avec Compose ».

**Ou les deux applications sur la machine**, avec la seule base en conteneur —
plus rapide à itérer, et le débogueur reste à portée :

```bash
docker compose -f compose.dev.yaml up -d --wait db
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
docker compose -f compose.dev.yaml exec backend python manage.py createsuperuser
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
| `docker compose -f compose.dev.yaml up -d --wait db` | Démarre la **seule** base et attend qu'elle réponde |
| `docker compose -f compose.dev.yaml ps` | Affiche l'état du service et sa santé |
| `docker compose -f compose.dev.yaml logs -f db` | Suit les journaux de PostgreSQL |
| `docker compose -f compose.dev.yaml exec db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'` | Ouvre une console SQL sur la base |
| `docker compose -f compose.dev.yaml stop` | Arrête les services sans rien supprimer |
| `docker compose -f compose.dev.yaml down` | Supprime les conteneurs, **garde** les données |
| `docker compose -f compose.dev.yaml down -v` | Supprime aussi le volume : **toutes les données sont perdues** |

Le `-f` se répète à chaque ligne, et c'est voulu — voir l'encadré de l'étape
*2. La base de données*. `export COMPOSE_FILE=compose.dev.yaml` dispense de le
taper pour toute la durée du terminal.

### La stack complète avec Compose (depuis la racine)

**Deux fichiers autonomes**, un par pile, et jamais de condition dans un fichier
unique. Aucune fusion : chacun se lit de bout en bout.

| Fichier | Rôle |
|---|---|
| `compose.dev.yaml` | le développement : code monté, ports publiés sur `127.0.0.1`, rechargement à chaud |
| `compose.prod.yaml` | la production : images figées, redémarrage automatique, base coupée du monde, ports publiés sur `127.0.0.1` seulement |

```bash
# développement
docker compose -f compose.dev.yaml up -d --wait

# production
docker compose -f compose.prod.yaml up -d --wait --wait-timeout 60
```

Le front répond alors sur **http://127.0.0.1:8081/** et l'API sur
**http://127.0.0.1:8001/**, sur la boucle locale et nulle part ailleurs. La base,
elle, ne publie rien du tout.

**Cette pile ne termine pas le TLS et ne s'ouvre pas au réseau** : les deux
tâches reviennent au nginx **du serveur**, qui tourne hors de Compose et met le
site et l'API sur la même origine. Sans lui, la pile fonctionne mais n'est
joignable que depuis la machine — c'est ce qu'on veut sur un poste. Sa
configuration de référence est plus bas, § « Déployer derrière le nginx du
serveur » : elle n'est pas facultative, l'API répond `301` à toute requête en
clair.

Les deux fichiers se ressemblent — une cinquantaine de lignes leur sont
communes, et c'est le prix assumé de leur lisibilité. Un socle partagé les
économiserait, mais la fusion qu'il impose coûtait plus cher : trois règles
n'existaient que par elle et n'ont plus d'objet — l'override chargé d'office et
les `-f` qu'il rendait obligatoires d'un seul côté, l'entrée héritée qu'on peut
ajouter mais jamais retirer, et l'ordre de concaténation des `env_file`,
aujourd'hui écrit dans le fichier. Le piège du **nom des images**, lui, reste
entier : voir plus bas.

`--wait-timeout` n'est pas un ornement : les services de production repartent en
`unless-stopped`, donc un backend qui échoue au démarrage reboucle sans fin et
`--wait` seul attendrait indéfiniment. Soixante secondes, la durée que la pile
doit tenir de toute façon.

> ⚠️ **Le `-f` vaut pour TOUTES les commandes**, pas seulement `up`. Il n'y a
> pas de `compose.yaml` dans ce dépôt : une commande qui l'oublie s'arrête sur
> `no configuration file provided: not found`, et c'est exactement ce qu'on
> attend d'elle. Tant qu'un socle existait, la même commande visait le projet du
> développement et échouait **en silence** — `docker compose down` y supprimait
> les mauvais conteneurs, répondait « done », et laissait la production tourner.

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f backend
docker compose -f compose.prod.yaml exec backend python manage.py createsuperuser
docker compose -f compose.prod.yaml down

# ou, une fois pour toutes dans le terminal qui pilote la production :
export COMPOSE_FILE=compose.prod.yaml
```

| | développement | production |
|---|---|---|
| fichier | `compose.dev.yaml` | `compose.prod.yaml` |
| services | `db`, `backend`, `frontend` | les mêmes |
| front | Vite sur `5173`, code monté | nginx dans l'image, publié sur `127.0.0.1:8081` |
| API | `runserver` sur `8000`, code monté | Gunicorn, aucun montage, publié sur `127.0.0.1:8001` |
| base | publiée sur `127.0.0.1:5432` | **aucun port publié**, réseau `interne` fermé |
| entrée | trois ports en clair | deux ports en clair, sur la boucle locale, derrière le nginx du serveur |
| redémarrage | aucun | `unless-stopped` sur les trois services |
| images | `weeb-backend:dev`, `weeb-frontend:dev` | `weeb-backend:prod`, `weeb-frontend:prod` |
| projet Compose | `weeb`, volume `weeb_db_data` | `weeb-prod`, volumes `weeb-prod_db_data` et `weeb-prod_static_data` |

Les deux piles portent des **noms de projet différents**, donc des conteneurs, des
réseaux et des volumes distincts : un `down -v` lancé en développement ne touche
pas aux données de la production, et l'inverse est vrai aussi. Les deux jeux de
ports ne se recouvrent pas non plus, et **les deux piles peuvent tourner en même
temps** — le développement sur `5173`, `8000` et `5432`, la production sur `8081`
et `8001`. C'est la raison d'être de `BACKEND_PORT_PROD` et `FRONTEND_PORT_PROD` :
réutiliser les variables du développement remettrait les deux piles sur le même
port, et le `up` de la seconde échouerait en `port is already allocated`.

Les services démarrent en file, chacun attendant que le précédent soit
`healthy` : base, puis API, puis front. `up --wait` rend donc la main quand la
pile entière répond.

#### Ce que la production attend de la configuration

Quatre variables doivent valoir **autre chose** qu'en développement. Elles ne
vivent pas dans le `.env`, où les deux jeux se contrediraient sans que rien ne
le signale, mais dans un fichier à part que la seule pile de production charge
**par-dessus** :

```bash
cp .env.prod.example .env.prod
```

| Variable | Valeur | Pourquoi |
|---|---|---|
| `POSTGRES_SSLMODE` | `disable` | `postgres:17-alpine` ne sert pas de TLS, alors que les réglages de production exigent `require`. Le lien ne quitte jamais le réseau `interne` |
| `DJANGO_BEHIND_PROXY` | `1` | sans lui, la redirection HTTPS répond 301 à la sonde et le backend reste `unhealthy`. Cette valeur suppose que le nginx du serveur **écrase** `X-Forwarded-Proto`, et elle est bornée par le fait que la pile ne publie ses ports que sur `127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | **vide** | le nginx du serveur sert le front et l'API sur la même origine : il n'y a plus rien à autoriser. La ligne doit rester, vide : elle **remplace** celle du `.env`, et l'omettre ferait hériter la production des origines Vite du développement |
| `DJANGO_HSTS_SECONDS` | `0` | tant que la pile tourne sur un poste, elle est jointe sur `localhost`, le nom d'hôte de la pile de développement. Un HSTS posé sur `localhost` vaut pour **tous ses ports** : le navigateur refuserait ensuite `http://localhost:5173`. Monter les paliers le jour où il y a un vrai domaine |

> ⚠️ **`DJANGO_BEHIND_PROXY=1` ne se justifie plus tout seul.** Du temps où un
> service `proxy` était la seule porte de la pile, personne ne pouvait parler au
> backend sans passer par lui : l'en-tête forgé était impossible. Aujourd'hui le
> backend publie un port, et **tout processus de la machine** peut y poser un
> `X-Forwarded-Proto: https` et contourner la redirection HTTPS de Django. Ce
> qui limite la portée est le `127.0.0.1:` du `ports:`, qui ferme le réseau.
> C'est une atténuation, pas la garantie d'avant : ne jamais publier ces deux
> ports sur `0.0.0.0`.

`VITE_API_URL` n'est pas dans ce tableau et reste dans le `.env` de la racine,
d'où Compose la passe en argument de build au front. Elle vaut **`/api`**,
un chemin relatif : le nginx du serveur met le site et l'API sur la même origine,
donc le bundle n'a plus d'hôte à connaître. C'est ce qui rend l'image du front
indépendante de l'adresse publique du site — elle n'était jusqu'ici valable que
pour une seule cible, l'adresse étant écrite **dans le bundle** à la
construction, pas lue au démarrage. Une façade qui servirait l'API sur un autre
hôte que le site imposerait de revenir à une adresse absolue **et** de remplir
`CORS_ALLOWED_ORIGINS` : les deux lignes tiennent ensemble.

`compose.prod.yaml` déclare les **deux** fichiers sur son backend, dans cet
ordre — `env_file: [.env, .env.prod]` — et le dernier de la liste l'emporte
variable par variable. Tout ce que le `.env` apporte reste donc en place — clé
secrète, identifiants de base, hôtes autorisés — et seules ces quatre lignes
sont réécrites. L'ordre est écrit dans le fichier, il ne se déduit plus d'une
règle de fusion.

> ⚠️ **`env_file` n'alimente que l'intérieur du conteneur.** Ce qu'un fichier
> Compose interpole lui-même avec `${...}` ne se lit que dans le `.env` de la
> racine, et n'a donc rien à faire dans `.env.prod` :
>
> | Déplacée par erreur | Ce qui se passe |
> |---|---|
> | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `VITE_API_URL` | démarrage refusé, la variable nommée : elles s'écrivent `${VAR:?message}` |
> | `BACKEND_PORT_PROD`, `FRONTEND_PORT_PROD` | **rien de visible** : le repli `${VAR:-défaut}` s'applique et la production démarre sur un autre port que celui voulu |
> | `POSTGRES_PORT`, `BACKEND_PORT_DEV`, `FRONTEND_PORT_DEV` | rien en production, qui ne les interpole pas : `compose.dev.yaml` est seul à le faire. C'est le **développement** qu'on déplace alors sur d'autres ports, sans le voir |
>
> Les trois `POSTGRES_*` sont le piège de ce tableau : elles sont lues **des deux
> côtés**, par Compose pour créer la base et par Django dans le conteneur. Être
> lue dans le conteneur ne suffit donc pas à autoriser le déplacement — la règle
> est qu'**aucun fichier Compose ne doit l'interpoler**.
>
> Un cas à part, à ne pas confondre avec la troisième ligne : ce que Django lit
> dans le conteneur pour `POSTGRES_HOST` et `POSTGRES_PORT` ne vient d'aucun
> `env_file`, l'`environment:` du service imposant `db:5432` par-dessus. Les
> poser dans `.env.prod` ne changerait donc rien à la connexion à la base.
>
> `.env.prod` manquant, `up` s'arrête avant de rien démarrer, en nommant le
> chemin attendu — `ps`, `logs` et `down` continuent de fonctionner, une pile
> déjà lancée reste donc arrêtable.

#### Déployer derrière le nginx du serveur

La pile publie deux ports en clair sur `127.0.0.1` et **s'arrête là**. Trois
choses manquent pour qu'un site existe, et elles reviennent toutes au nginx du
serveur, qui tourne hors de Compose :

| Ce qui manque | Pourquoi c'est lui |
|---|---|
| le TLS | il a déjà certbot et un vrai domaine ; empiler un second terminateur ne servirait à rien |
| le routage `/api/` et `/admin/` vers l'API | la pile ne le fait nulle part : `frontend/nginx.conf` sert le site React et ignore ces chemins |
| l'ouverture au réseau | rien dans la pile n'écoute ailleurs que sur la boucle locale |

Sans cette configuration, la pile démarre et se déclare saine, mais l'API répond
`301` à toute requête en clair et le site est injoignable de l'extérieur.

**Le bloc à reprendre**, à adapter sur le domaine et les chemins de certificats :

```nginx
# /etc/nginx/sites-available/weeb

# ⚠️ Tout `Host` inconnu : aucune réponse. Sans ce bloc, le serveur suivant
# devient le `default_server` de ces quatre sockets et répond à N'IMPORTE QUEL
# `Host` — la redirection réfléchirait alors dans son en-tête `Location` une
# valeur forgée par le client. 444 ferme la connexion sans rien renvoyer.
server {
    listen 80  default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    server_tokens off;

    # Obligatoires sur un bloc SSL, même pour ne rien servir.
    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;

    # ⚠️ `ssl_protocols` VA ICI, et n'a aucun effet ailleurs : la version est
    # arrêtée AVANT que le SNI ne désigne un serveur, donc c'est le bloc par
    # défaut de la socket qui la gouverne, pour TOUS les noms qu'elle sert.
    # Mesuré sur nginx 1.22 : la même ligne posée dans le serveur nommé plus bas
    # ne change rien, et une requête en TLS 1.0 y est servie 200.
    #
    # Et il faut la redéclarer : le nginx.conf de Debian 12 pose
    # `ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;` en contexte http, dont on
    # hérite sinon.
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Les deux suivantes, en revanche, se choisissent PAR SERVEUR : la suite est
    # négociée après le SNI. Elles sont donc répétées dans le serveur nommé, et
    # les omettre là-bas y laisserait le `HIGH:!aNULL:!MD5` de Debian — mesuré :
    # un client n'offrant que AES256-SHA, RSA statique et sans confidentialité
    # persistante, obtient alors un 200.
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    # Les tickets de session rejouent une clé sur tous les tampons : sans
    # rotation, ils affaiblissent la confidentialité persistante.
    ssl_session_tickets off;

    return 444;
}

server {
    listen 80;
    listen [::]:80;
    server_name weeb.example.com;

    server_tokens off;

    # AVANT la redirection : le défi de certbot en mode `--webroot` est servi en
    # clair. Sans cette `location` il suivrait le 301, tomberait dans le
    # `location /` du bloc chiffré, et recevrait l'index React à la place du
    # jeton — le renouvellement échoue. Inutile avec `certbot --nginx`, qui
    # écrit sa propre configuration.
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Le port en clair ne relaie RIEN d'autre, il redirige. C'est ce qui rend
    # inoffensif un X-Forwarded-Proto forgé : il n'atteint jamais Django. Et
    # `$host` n'est sûr ici que parce que le `server_name` ci-dessus le borne.
    #
    # ⚠️ Dans une `location`, et non au niveau du `server` : un `return` posé
    # là s'exécute AVANT le choix de la location et court-circuiterait le défi
    # de certbot ci-dessus, qui recevrait le 301 au lieu de son jeton.
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    # nginx 1.25.1 et plus. En dessous — Debian 12 sert 1.22, Ubuntu 24.04 sert
    # 1.24 — écrire `listen 443 ssl http2;` et supprimer cette ligne, sinon
    # `nginx -t` s'arrête sur `unknown directive "http2"`.
    http2 on;
    server_name weeb.example.com;

    server_tokens off;

    # Le certificat se choisit par serveur : c'est le SNI qui le désigne.
    ssl_certificate     /etc/letsencrypt/live/weeb.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weeb.example.com/privkey.pem;

    # ⚠️ Répétées depuis le bloc par défaut, et ce n'est pas une redondance :
    # la suite est négociée APRÈS le SNI, donc ce bloc-ci a la sienne. Seul
    # `ssl_protocols` reste là-haut, la version étant arrêtée avant.
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # ⚠️ Ces quatre en-têtes sont hérités par les `location` ci-dessous, mais
    # seulement parce qu'aucune n'en déclare le sien : proxy_set_header ne
    # s'hérite QUE dans ce cas. En ajouter un dans une location y ferait
    # disparaître les quatre.
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    # $remote_addr et non $proxy_add_x_forwarded_for : ce serveur est en bordure,
    # donc la chaîne reçue du client est inventée. La relayer rendrait
    # contournable toute restriction par IP posée en aval.
    proxy_set_header X-Forwarded-For   $remote_addr;
    # ⚠️ LA ligne. Voir juste en dessous.
    proxy_set_header X-Forwarded-Proto $scheme;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8001;
    }

    # Tout le reste au front : le site React, et /static/ qu'il sert lui aussi.
    location / {
        # Le jour du vrai domaine : décommenter, avec le MÊME max-age que
        # DJANGO_HSTS_SECONDS, palier par palier. Ici et pas au niveau du
        # `server` : Django pose déjà l'en-tête sur /api/ et /admin/, et deux
        # en-têtes HSTS sur la même réponse ne valent pas mieux qu'un.
        # add_header Strict-Transport-Security "max-age=3600; includeSubDomains" always;
        proxy_pass http://127.0.0.1:8081;
    }
}
```

Les deux ports sont ceux de `BACKEND_PORT_PROD` et `FRONTEND_PORT_PROD` : les
changer dans le `.env` impose de les changer ici.

**Activer la configuration**, la pile Compose étant **déjà démarrée** — sans elle,
les trois `location` répondent `502` :

```bash
# Le site packagé déclare son propre `default_server` : le garder ferait
# échouer `nginx -t` sur « a duplicate default server for 0.0.0.0:80 ».
sudo rm -f /etc/nginx/sites-enabled/default

sudo ln -s /etc/nginx/sites-available/weeb /etc/nginx/sites-enabled/weeb
sudo nginx -t && sudo systemctl reload nginx
```

**Les deux serveurs ne répondent qu'à l'hôte qu'ils servent** (`server_name
weeb.example.com`), et le bloc `default_server` ferme la connexion sur tout autre
`Host` avec un `444`. Ce n'est pas décoratif : sur un serveur mono-site, d'où le
`sites-enabled/default` de la distribution a été retiré, le premier bloc déclaré
devient le `default_server` de chaque socket. La redirection en clair renverrait
alors un `Location` construit à partir d'un `Host` forgé par le client — une
redirection ouverte, sur le seul point d'entrée non authentifié de la façade.

Ce n'est **pas** un contrôle d'accès : le site reste joignable par l'adresse IP
du serveur avec l'en-tête `Host` qui convient. Le bloc ne borne que la valeur
réfléchie dans `Location`.

**La ligne qui justifie `DJANGO_BEHIND_PROXY=1`** :

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

`proxy_set_header` **remplace** la valeur reçue du client, et `$scheme` est le
protocole vu par nginx lui-même. Écrire `$http_x_forwarded_proto` à la place la
relaierait : n'importe qui se déclarerait en HTTPS, Django le croirait, et la
redirection serait contournée. Les deux directives se ressemblent, elles n'ont
pas du tout le même effet.

**Les réglages TLS ne vivent pas tous au même endroit, et c'est le piège de ce
bloc.** La **version** est arrêtée avant que le SNI ne désigne un serveur : c'est
le `default_server` de la socket qui la gouverne, pour tous les noms qu'elle
sert. La **suite de chiffrement**, elle, est négociée après le SNI, donc chaque
serveur a la sienne. D'où le partage, chacun vérifié par exécution sur nginx 1.22
avec le `nginx.conf` de Debian 12 :

| Directive | Où elle agit | Mesuré si on se trompe |
|---|---|---|
| `ssl_protocols` | le `default_server` seul | posée dans le serveur nommé : une requête en **TLS 1.0** y est servie `200` |
| `ssl_ciphers`, `ssl_prefer_server_ciphers` | **chaque** serveur | absentes du serveur nommé : un client n'offrant que `AES256-SHA` — RSA statique, sans confidentialité persistante — obtient `200` |
| `ssl_certificate` | chaque serveur | c'est l'objet même du SNI |

Et il faut les redéclarer, plutôt que de faire confiance à la distribution : le
`nginx.conf` de Debian 12 pose `ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;` et
laisse `server_tokens off;` en commentaire. Sans les lignes du bloc ci-dessus, la
façade accepte TLS 1.0 et annonce sa version de nginx.

**`proxy_pass` sans barre oblique finale, et c'est délibéré.**
`proxy_pass http://127.0.0.1:8001;` conserve le chemin complet ;
`proxy_pass http://127.0.0.1:8001/;` remplacerait le préfixe `/api/` de la
`location` par une barre oblique, et Django répondrait 404 sur toutes les
routes. Une adresse littérale dispense en revanche du `resolver` et de la
variable qu'exigeait le routage vers des noms de services Compose : `127.0.0.1`
ne se résout pas, donc rien à mettre en cache ni à rafraîchir.

> L'ordre d'écriture des trois `location`, lui, n'a **aucune importance** : ce
> sont des préfixes, et nginx retient toujours le plus long qui correspond,
> quelle que soit sa place dans le fichier. `/api/` l'emporte donc sur `/` sans
> qu'on ait à les ranger. L'ordre ne compterait qu'entre expressions régulières,
> et il n'y en a pas ici.

**`/static/` n'apparaît pas dans cette configuration, et c'est voulu.** Django ne
sert pas ses fichiers statiques avec `DEBUG = False` et l'image n'embarque pas
whitenoise : c'est le **conteneur du front** qui les sert, par une `location
/static/` de `frontend/nginx.conf` et le volume `static_data` que `collectstatic`
remplit au démarrage du backend. Ils arrivent donc par le `location /`
ci-dessus, avec le reste du site.

L'alternative aurait été de les servir depuis le nginx du serveur, ce qui
supposait de lui donner accès au volume : ni son chemin
(`/var/lib/docker/volumes/…`) ni ses droits (`0710 root:root`) ne s'y prêtent, et
un bind-mount à la place aurait demandé de préparer le dossier hôte sous l'uid
`1001` avant chaque premier démarrage, faute de quoi `collectstatic` échoue. Sans
l'admin ni l'API navigable de DRF, ces fichiers ne servent d'ailleurs personne :
le front, lui, a ses propres assets empreintés sous `/assets/`.

**Le reste de la configuration du serveur**, qui ne se devine pas :

- **`DJANGO_ALLOWED_HOSTS` doit contenir le domaine.** nginx transmet `Host
  $host`, donc le domaine réel arrive jusqu'à Django, qui répond `400` sur un
  hôte non listé. Y laisser `127.0.0.1`, auquel s'adresse la sonde du conteneur.
- **`CORS_ALLOWED_ORIGINS` vide et `VITE_API_URL=/api` ne sont justes que si le
  site et l'API sont sur la même origine**, ce que fait la configuration
  ci-dessus. Les servir sur deux hôtes — `api.weeb.example.com`, typiquement —
  impose de remplir la première et de reconstruire l'image du front avec une
  adresse absolue.
- **`DJANGO_HSTS_SECONDS` reste à `0` tant que le domaine n'est pas réel**, et
  le monter **ne suffit pas** : `SecurityMiddleware` ne pose l'en-tête que sur
  les réponses de Django, c'est-à-dire `/api/` et `/admin/`. Les pages du site
  sortent du conteneur du front et n'en reçoivent aucune. Avec un vrai domaine,
  monter les paliers — `3600`, `86400`, `31536000` — **et** décommenter
  l'`add_header Strict-Transport-Security` du `location /` ci-dessus, en lui
  donnant le **même** `max-age` à chaque palier. Sans lui, les pages du site
  n'ont jamais d'HSTS ; avec un `max-age` figé, le palier ne sert à rien.
- **Un port HTTPS non standard vaut des `403 CSRF` sur l'administration.** nginx
  transmet un `Host` sans port, que Django compare à un `Origin` qui en porte
  un. Y remédier demande un `CSRF_TRUSTED_ORIGINS`.
- **Limiter le débit sur `/admin/` et les routes d'authentification** est à faire
  ici, et n'existe nulle part : voir `AMELIORATIONS.md`.

**Vérifier la pile sans nginx devant**, sur un poste :

```bash
curl -sI http://127.0.0.1:8081/ | head -1
# HTTP/1.1 200 OK          — le front

curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/api/articles/
# 200                      — l'API

curl -sI http://127.0.0.1:8001/api/articles/ | head -1
# HTTP/1.1 301 Moved Permanently
```

Le `301` du troisième appel est le comportement **attendu**, pas une panne : les
réglages de production redirigent tout le trafic en clair, et rien ne pose
l'en-tête tant qu'aucun nginx n'est devant. `backend/healthcheck.py` le forge
pour la même raison.

#### Six pièges

- **Le nom des images.** Sans `image:` explicite, Compose déduit
  `<projet>-<service>` : pour la pile de développement, dont le projet s'appelle
  `weeb`, cela donne `weeb-backend` et `weeb-frontend` — les noms mêmes des
  constructions manuelles décrites ci-dessous. Il réutilise alors ces images-là
  plutôt que de construire les siennes, **sans rien signaler** : la pile de
  développement s'est retrouvée servie par le nginx de production. D'où les
  étiquettes `:dev` et `:prod`, posées des deux côtés.
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
  reconstruite (`docker compose -f compose.dev.yaml up -d --build`). En échange,
  le bit exécutable du dépôt n'entre plus dans l'équation.
- **La production ne se joint pas sur les ports du développement.**
  `BACKEND_PORT_PROD` et `FRONTEND_PORT_PROD` valent `8001` et `8081`, et non
  `8000` et `5173` : deux jeux de variables, pour que les deux piles tournent
  ensemble. Les faire coïncider vaut un `port is already allocated` au `up` de
  la seconde — et, si la première est arrêtée, une pile de production servie à
  l'adresse où l'on croit trouver le développement.
- **Les deux conteneurs de développement écrivent sous un uid fixe** : `1001`
  pour le backend, `1000` pour le front. Une commande qui crée un fichier dans le
  dépôt à travers le montage — `docker compose -f compose.dev.yaml exec backend
  python manage.py makemigrations`, par exemple — échoue en `Permission denied`
  si l'utilisateur
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

L'adresse absolue ci-dessus vaut pour cette construction **à la main**, où
l'image est lancée seule. La pile de production, elle, passe `/api` : le nginx
du serveur met le site et l'API sur la même origine, ce qui rend l'image
indépendante de l'adresse publique du site.

Le port est **8080** et non 80 : le conteneur tourne sous le compte `nginx`,
qui n'a pas le privilège de lier un port inférieur à 1024.

**`nginx.conf` sert aussi `/static/`, qui n'appartient pas au front** : ce sont
les fichiers statiques de **Django**, arrivés par le volume `static_data` que la
pile de production monte en lecture seule. Une image lancée seule, comme
ci-dessus, n'a pas ce volume : la `location` ne trouve rien et répond 404, sans
conséquence hors de la pile. Le pourquoi est au § « Déployer derrière le nginx
du serveur » — il évite à celui-ci d'aller lire les volumes de Docker.

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

## Intégration continue

`.github/workflows/docker-images.yml` construit les **deux** images à chaque push sur
`preprod` ou sur `main`, et sur chaque pull request qui vise l'une des deux. Un job par image,
nommé comme elle, pour qu'un journal rouge désigne la construction en cause sans qu'il faille
l'ouvrir. Les deux vont au bout même si l'une casse : une seule exécution suffit à connaître
l'état des deux.

Les deux branches et pas seulement `preprod` : `main` est celle qui part sur un serveur, et
c'est donc elle que la publication d'images visera le jour où elle existera. Constater après
coup qu'une image ne se construit plus ne servirait à rien.

| Job | Contexte | Particularité |
|---|---|---|
| `backend` | `backend/` | — |
| `frontend` | `frontend/` | cible `prod`, avec `VITE_API_URL=/api` |

L'intérêt n'est pas de disposer des images : elles sont **jetées avec la machine**. Il est que
cette machine parte de zéro — sans cache, sans `node_modules`, sans `venv`, sans `.env`. C'est
le seul endroit où se voient un `.dockerignore` mal réglé, un fichier oublié dans `.gitignore`
ou une dépendance absente de `requirements.txt` ; sur le poste, ces trois défauts sont masqués
par ce qui y traîne déjà.

Les layers sont mis en cache d'une exécution à l'autre, avec **une portée par image** : sans
cela les deux écraseraient tour à tour le même cache et chaque passage réinstallerait Django
et les dépendances du front.

**Aucune publication vers un registre**, et c'est délibéré : pousser des images n'a de valeur
que si quelqu'un fait `docker pull`, et il n'existe aujourd'hui aucun serveur où déployer. Le
workflow ne déclare donc ni registre, ni permission `packages: write`. À reprendre le jour où
une mise en ligne existe. La cible `dev` du front est hors périmètre pour la même raison : elle
ne sert qu'au poste.

Reproduire la même chose sur sa machine, avant de pousser. `git archive` exporte le **dernier
commit**, donc sans rien de non versionné — mais sans les modifications pas encore committées
non plus, exactement comme le checkout de la machine de GitHub :

```bash
mkdir -p /tmp/weeb-propre && git archive HEAD | tar -x -C /tmp/weeb-propre

docker build --no-cache -t weeb-backend:ci /tmp/weeb-propre/backend
docker build --no-cache -t weeb-frontend:ci \
  --target prod --build-arg VITE_API_URL=/api /tmp/weeb-propre/frontend

# les deux images ne servent qu'à la vérification
docker image rm weeb-backend:ci weeb-frontend:ci
```

Les nommer n'est pas cosmétique : sans `-t`, chaque construction laisse une image que
`docker images` affiche `<none>`, à retrouver ensuite parmi les autres. Avec, la suppression
ci-dessus ne laisse rien — les deux cas ont été mesurés.

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

Base : `http://localhost:8000/api/` en développement. En production, l'adresse
publique est celle du site suivie de `/api/` : le nginx du serveur y sert l'API
et le site sur la même origine.

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
├── .env.prod.example         # modèle des valeurs propres à la production
├── .github/workflows/        # construction des deux images sur preprod et main
├── compose.dev.yaml          # pile de développement, autonome
├── compose.prod.yaml         # pile de production, autonome
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
    ├── Dockerfile            # un fichier, deux images : --target dev ou prod
    ├── nginx.conf            # serveur de l'image prod : site React et /static/
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
- Ajouter une variable d'environnement implique de l'ajouter au `.env.example`
  correspondant, avec un commentaire — `.env.prod.example` si elle ne concerne
  que la production, `frontend/.env.example` si elle est lue par Vite.

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
La base n'est pas démarrée. Depuis la racine :
`docker compose -f compose.dev.yaml up -d --wait db`.

**`docker compose` répond `no configuration file provided: not found`**
La commande a été tapée sans `-f`. Il n'y a pas de `compose.yaml` dans ce dépôt :
chaque pile a son fichier, et c'est ce qui empêche une commande de viser la
mauvaise. Ajouter `-f compose.dev.yaml` ou `-f compose.prod.yaml`, ou poser
`export COMPOSE_FILE=compose.dev.yaml` pour la durée du terminal.

**`up` répond `required variable POSTGRES_DB is missing a value`**
Le `.env` est absent ou les variables `POSTGRES_*` n'y sont pas. Reprendre l'étape
*La configuration*. Compose refuse volontairement de démarrer plutôt que de créer
une base avec des identifiants improvisés.

**J'ai changé `POSTGRES_USER` ou `POSTGRES_DB` et la connexion échoue**
Ces valeurs ne servent qu'à la **création** de la base, au tout premier démarrage.
Un volume déjà initialisé les ignore. Pour repartir sur ces nouvelles valeurs :
`docker compose -f compose.dev.yaml down -v`, puis
`docker compose -f compose.dev.yaml up -d --wait db` et `python manage.py migrate`.
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
301 à la sonde — en production, cette variable-là se règle dans `.env.prod`, où
le nginx du serveur, qui écrase `X-Forwarded-Proto`, la rend légitime.

**`env file /chemin/.env.prod not found`**
La pile de production réclame son second fichier de configuration :
`cp .env.prod.example .env.prod`. Voir « Ce que la production attend de la
configuration ». Compose s'arrête avant de démarrer quoi que ce soit, ce qui
est voulu — sans ce fichier, le backend partirait avec les valeurs du
développement et ne démarrerait pas.

**`Bind for 127.0.0.1:8001 failed: port is already allocated`**
Un service occupe déjà le port. Changer `BACKEND_PORT_PROD` ou
`FRONTEND_PORT_PROD` dans le `.env`, puis reporter la nouvelle valeur dans le
`proxy_pass` du nginx du serveur, qui la vise en dur.

**L'API de production répond `301` à tous mes `curl`**
C'est le comportement attendu : les réglages de production redirigent tout le
trafic en clair vers HTTPS, et la pile ne termine plus le TLS. Le nginx du
serveur pose `X-Forwarded-Proto: https` ; sans lui, le forger soi-même —
`curl -H 'X-Forwarded-Proto: https' http://127.0.0.1:8001/api/articles/`. Voir
« Déployer derrière le nginx du serveur ».

**L'administration Django s'affiche sans style en production**
Le volume `static_data` n'est pas arrivé jusqu'au front, qui sert `/static/`.
Vérifier que le service `frontend` le monte bien en lecture seule, et que le
backend a démarré avant lui : c'est son entrypoint qui remplit le volume avec
`collectstatic`.

**`npm ci` ou `npm run lint` échoue en `EACCES` sur `frontend/node_modules`**
La pile de développement a laissé un dossier vide appartenant à `root` : Docker
crée côté hôte le point de montage du volume anonyme. `rmdir frontend/node_modules`
suffit, sans `sudo`.

**La pile de développement sert le front par nginx au lieu de Vite**
Une image `weeb-frontend` construite à la main traîne sur la machine et porte le
nom que Compose déduirait. Les fichiers Compose nomment désormais les leurs
`weeb-frontend:dev` et `weeb-frontend:prod` ; si le symptôme revient, forcer la
construction avec `docker compose -f compose.dev.yaml up -d --build --wait`.

**Le front affiche une erreur CORS dans la console du navigateur**
L'adresse du front n'est pas dans `CORS_ALLOWED_ORIGINS`. Y ajouter l'origine
exacte, port compris, puis redémarrer le serveur Django. Attention au fichier :
c'est le `.env` en développement, mais `.env.prod` pour la pile de production,
dont la valeur remplace celle du `.env` au lieu de s'y ajouter.
