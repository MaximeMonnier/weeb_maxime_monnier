# Rapport technique — Weeb

Weeb est un site vitrine avec un blog et un espace membre. Ce rapport décrit le code tel qu'il
est sur la branche `preprod` au 31 octobre 2026 : comment le prendre en main, comment il est
découpé, quelles dépendances il utilise et comment il protège les comptes et les données.

## 1. Prise en main du code

### Prérequis

| Outil | Version | Usage |
|---|---|---|
| Python | 3.12 ou plus (3.13 dans l'image Docker) | backend |
| Node.js | 22 ou plus | frontend |
| Docker et Compose v2 | récent | base PostgreSQL 17, serveur de mail de test, pile complète |
| Git | récent | récupérer le dépôt |

### Configuration

Deux fichiers `.env`, jamais versionnés, se créent à partir de leur modèle :

```bash
cp .env.example .env                    # lu par Django et par Docker Compose
cp frontend/.env.example frontend/.env  # lu par Vite
```

Dans `.env`, il faut renseigner `DJANGO_SECRET_KEY` et `POSTGRES_PASSWORD`. Le README donne une
commande Python qui génère chacun. Tout ce que contient `frontend/.env` part en clair dans le
JavaScript envoyé au navigateur : on n'y met donc aucun secret.

### Lancer le backend et le frontend

```bash
docker compose -f compose.dev.yaml up -d --wait db mailpit   # base et serveur de mail

cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # API sur http://localhost:8000

cd ../frontend
npm install
npm run dev                         # site sur http://localhost:5173
```

On peut aussi tout lancer en conteneurs avec `docker compose -f compose.dev.yaml up -d --wait`.
L'option `-f` est obligatoire : le dépôt n'a pas de `compose.yaml`, pour qu'une commande ne vise
jamais la mauvaise pile par erreur.

### Créer le superutilisateur

```bash
cd backend
python manage.py createsuperuser    # demande email, prénom, nom, mot de passe
python manage.py peupler_articles   # facultatif : 30 articles de démonstration
```

Le superutilisateur est créé actif. Il ouvre l'administration sur http://localhost:8000/admin/,
où il valide les comptes inscrits.

### Tester l'API

```bash
# Liste publique des articles
curl http://localhost:8000/api/articles/

# Connexion : rend un jeton d'accès et un jeton de rafraîchissement
curl -X POST http://localhost:8000/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@exemple.fr", "password": "MotDePasse1"}'

# Route protégée : publier un article avec le jeton d'accès
curl -X POST http://localhost:8000/api/articles/ \
  -H 'Authorization: Bearer <jeton d accès>' \
  -H 'Content-Type: application/json' \
  -d '{"title": "Premier article", "content": "Un texte assez long."}'
```

Ouverte dans un navigateur, http://localhost:8000/api/articles/ affiche la même liste dans
l'interface navigable de Django REST Framework.

Les suites de tests automatisés se lancent ainsi :

```bash
# backend, depuis backend/, base démarrée
DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
# frontend, depuis frontend/
npm run lint && npm test && npm run build
```

## 2. Découpage et fonctionnement de l'application

### Trois parties

| Partie | Technologie | Rôle |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 | les pages du site, les formulaires, l'affichage du blog |
| Backend | Django 6, Django REST Framework | une API qui ne rend que du JSON : comptes, articles, contact |
| Base de données | PostgreSQL 17, en conteneur | comptes, articles, messages, jetons émis et révoqués |

Le frontend ne parle jamais à la base : il passe toujours par l'API. Le backend ne produit aucune
page HTML pour le visiteur, seulement l'administration Django pour l'équipe.

### Communication en JSON

Chaque échange est une requête HTTP dont le corps est du JSON. Côté front, un seul fichier fait
les appels réseau : `frontend/src/lib/api.ts`, avec sa fonction `apiFetch`. Elle :

- ajoute l'en-tête `Content-Type: application/json` ;
- ajoute le jeton d'accès (`Authorization: Bearer …`) quand le membre est connecté, sauf sur les
  routes publiques d'authentification ;
- transforme une réponse d'erreur en un objet `{ status, data }` que les formulaires traduisent
  en message lisible (`lib/apiErrors.ts`).

Les listes sont paginées par 12 et ont toujours la même forme :
`{ "count": 30, "next": "…?page=2", "previous": null, "results": [ … ] }`.

En production, le site et l'API sont servis sur le même domaine : le front appelle `/api/`, et
le nginx du serveur envoie ces adresses au conteneur Django.

### Flux d'authentification JWT

Un JWT (JSON Web Token) est un jeton signé par le serveur, que le navigateur renvoie à chaque
requête pour prouver qui il est. Le projet en utilise deux :

| Jeton | Durée | Rôle |
|---|---|---|
| accès (`access`) | 15 minutes | accompagne chaque requête protégée |
| rafraîchissement (`refresh`) | 1 jour | sert seulement à obtenir un nouveau jeton d'accès |

Le déroulé :

1. Le membre envoie son email et son mot de passe à `POST /api/auth/login/`. L'API rend les deux
   jetons, que le front range dans le stockage local du navigateur (`lib/tokens.ts`).
2. Chaque requête protégée porte le jeton d'accès.
3. Quand l'API répond `401` (jeton expiré), `apiFetch` appelle seul
   `POST /api/auth/login/refresh/`, range la nouvelle paire, puis rejoue la requête une fois.
   Si plusieurs requêtes reçoivent un `401` en même temps, un seul renouvellement est lancé.
4. Chaque renouvellement rend un nouveau jeton de rafraîchissement et met l'ancien sur liste
   noire : un jeton volé puis réutilisé est refusé.
5. La déconnexion (`POST /api/auth/logout/`) met le jeton de rafraîchissement sur liste noire,
   et le front efface les deux jetons.

## 3. Structure du projet Django

```
backend/
├── config/        le projet : réglages, routeur principal, sonde de santé
├── accounts/      les comptes et l'authentification
├── articles/      le blog
├── contact/       le formulaire de contact
├── locale/        les messages de simplejwt traduits en français
└── manage.py      lance le serveur, les migrations, les tests
```

### Le projet `config`

| Fichier | Rôle |
|---|---|
| `settings/base.py` | réglages communs : applications, API, JWT, quotas, CORS. Lit l'environnement par de petites fonctions (`env_required`, `env_bool`, …) |
| `settings/development.py` | mode debug, emails vers Mailpit |
| `settings/test.py` | clé factice, emails gardés en mémoire, quotas éteints |
| `settings/production.py` | debug coupé, HTTPS imposé, aucune valeur par défaut pour les secrets |
| `urls.py` | répartit les adresses : `/api/auth/` vers `accounts`, `/api/` vers `articles` et `contact`, `/admin/` |
| `views.py` | `/health/`, la sonde qui vérifie que la base répond, utilisée par Docker |
| `rapport_erreurs.py` | le rapport envoyé par email lors d'une erreur 500, sans donnée personnelle |

### Les applications

Chaque application regroupe un domaine et suit le même découpage :

| Fichier | Rôle |
|---|---|
| `models.py` | les tables de la base |
| `serializers.py` | valident le JSON reçu et fabriquent le JSON rendu |
| `views.py` | reçoivent la requête, vérifient les droits, appellent le serializer |
| `urls.py` | les adresses de l'application |
| `admin.py` | l'écran d'administration |
| `tests.py` | les tests automatisés |

**`accounts`** — `CustomUser` remplace l'utilisateur de Django : on se connecte par email, sans
nom d'utilisateur. `public_name` rend « Prénom Nom » (ou « Auteur anonyme »), seul nom montré aux visiteurs.
`validators.py` impose la complexité du mot de passe. Les vues couvrent l'inscription, la
connexion, le renouvellement des jetons, la réinitialisation et le changement du mot de passe,
la suppression du compte.

**`articles`** — `Article` porte un titre, un texte, une image facultative, un auteur et deux
dates. `ArticleViewSet` fournit les cinq opérations (lister, lire, créer, modifier, supprimer).
La liste rend un extrait du texte, calculé par la base, au lieu du texte entier.
`permissions.py` contient `IsOwnerOrReadOnly` : tout le monde lit, seul l'auteur modifie ou
supprime. `signals.py` efface du disque l'image d'un article remplacée ou supprimée. La commande
`peupler_articles` crée des articles de démonstration.

**`contact`** — `Contact` enregistre prénom, nom, email, sujet et message. `ContactCreateView`
reçoit le formulaire sans connexion. La commande `purger_contacts` supprime les messages de plus
de 90 jours.

## 4. Choix des dépendances

### Backend (`backend/requirements.txt`)

| Dépendance | Version | Pourquoi |
|---|---|---|
| Django | 6.0.8 | cadre complet et éprouvé : base de données, migrations, administration, sécurité (hachage des mots de passe, protections HTTP) |
| djangorestframework | 3.18.2 | transforme Django en API JSON : serializers, permissions, pagination, limitation de débit |
| djangorestframework_simplejwt | 5.5.1 | jetons JWT avec rotation et liste noire, intégrés à DRF |
| django-cors-headers | 4.9.0 | autorise, en développement, le front (port 5173) à appeler l'API (port 8000) |
| psycopg / psycopg-binary | 3.3.5 | pilote PostgreSQL recommandé par Django |
| pillow | 13.0.0 | lit et réencode les images d'article : vérifie leur contenu, retire leurs métadonnées |
| python-dotenv | 1.2.3 | lit le fichier `.env` en développement |
| gunicorn | 26.2.0 | serveur d'application de production, à la place du `runserver` de développement |

Les autres lignes du fichier (`asgiref`, `sqlparse`, `PyJWT`, `typing_extensions`) sont des
dépendances de celles-ci, figées pour que chaque installation soit identique.

### Frontend (`frontend/package.json`)

| Dépendance | Version | Pourquoi |
|---|---|---|
| react, react-dom | 19.2 | bibliothèque d'interface la plus répandue, demandée par le projet |
| react-router-dom | 7.12 | navigation entre les pages sans recharger le site |
| tailwindcss, @tailwindcss/vite | 4.1 | mise en forme par classes utilitaires, thème clair et sombre par variables |
| lucide-react | 0.562 | icônes légères, importées une par une |
| embla-carousel-react, -autoplay | 8.6 | carrousel de la page d'accueil, accessible et léger |
| typescript | 5.9 | typage : une erreur de forme de données se voit à la compilation |
| vite, @vitejs/plugin-react | 7.3, 5.1 | serveur de développement rapide et construction du site |
| vitest, jsdom, @testing-library/react | 5.0, 30.0, 16.3 | tests des composants dans un faux navigateur |
| @playwright/test | 1.63 | parcours de bout en bout dans un vrai Chromium |
| eslint, typescript-eslint | 10.14, 8.72 | contrôle de style et d'erreurs courantes |

### Infrastructure

| Élément | Version | Pourquoi |
|---|---|---|
| PostgreSQL | 17 (image `postgres:17-alpine`) | base relationnelle robuste, la même en développement et en production |
| Mailpit | 1.31 | reçoit les emails du développement et les affiche sans les envoyer |
| nginx | 1.27 | sert le site construit, les images et les fichiers statiques en production |
| GitHub Actions | — | lance les tests et construit les images à chaque push |

## 5. Authentification et sécurisation

### Procédure d'authentification

| Étape | Route | Ce qui se passe |
|---|---|---|
| Inscription | `POST /api/auth/register/` | prénom, nom, email, mot de passe. Le compte est créé **inactif** |
| Validation | administration Django | un administrateur coche « actif » dans la liste des comptes. Avant cela, aucun jeton n'est délivré |
| Connexion | `POST /api/auth/login/` | email et mot de passe ; rend les deux jetons |
| Renouvellement | `POST /api/auth/login/refresh/` | rend une paire neuve, l'ancien refresh passe sur liste noire. Un compte supprimé ou désactivé reçoit `401` |
| Déconnexion | `POST /api/auth/logout/` | le refresh passe sur liste noire |
| Mot de passe oublié | `POST /api/auth/password-reset/` | envoie par email un lien vers `/reset-password` du site, avec un identifiant et un jeton à usage unique. Répond toujours `200`, que le compte existe ou non |
| Nouveau mot de passe | `POST /api/auth/password-reset/confirm/` | vérifie le jeton, change le mot de passe et révoque toutes les sessions du compte |
| Changement | `POST /api/auth/password-change/` | membre connecté, ancien mot de passe redonné ; ferme les autres sessions et rend une paire neuve |
| Suppression | `DELETE /api/auth/account/` | membre connecté, mot de passe redonné ; supprime le compte et ses articles |

Le mot de passe doit faire 8 à 128 caractères, ne pas être courant ni entièrement numérique, ne
pas ressembler aux nom et email du compte, et contenir une majuscule, une minuscule et un
chiffre. Il est stocké haché par Django, jamais en clair.

### Gestion des permissions

Le visiteur n'a pas de jeton ; le membre est connecté avec un compte validé ; l'auteur a écrit
l'article visé. Un test (`backend/config/tests.py`) rejoue chaque profil sur chaque route.

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

L'auteur d'un article est toujours le compte connecté, fixé par le serveur : le client ne peut
pas publier au nom d'un autre.

### Sécurité des routes

**Fermé par défaut.** Le réglage global de DRF exige un jeton (`IsAuthenticated`). Chaque route
publique le dit explicitement dans sa vue (`AllowAny`, ou lecture libre pour les articles). Une
route oubliée est donc fermée, jamais ouverte par accident.

**Limitation de débit.** Les routes sensibles ont un quota ; au-delà, l'API répond `429`. Par
exemple 5 connexions par minute et par adresse IP, 3 demandes de réinitialisation par heure,
20 écritures d'article par heure et par compte. Les quotas se règlent dans le `.env`. En
production, les compteurs vivent dans une table de la base, partagée par les trois processus
Gunicorn : gardés en mémoire, chacun aurait les siens et le plafond réel serait triplé.

**Images envoyées.** Chaque image est jugée sur son contenu et non sur son nom, limitée en poids
et en taille, puis réenregistrée en WebP sous un nom tiré au hasard, sans ses métadonnées
(lieu, date, appareil).

**CORS.** Le CORS est la règle du navigateur qui décide quel site a le droit d'appeler l'API.
En développement, seule l'adresse de Vite est autorisée. En production, la liste est vide : le
site et l'API partagent le même domaine et n'en ont pas besoin.

**HTTPS et en-têtes.** En production, Django redirige tout vers HTTPS, marque ses cookies
`Secure` et interdit l'affichage du site dans une iframe. Le nginx du front pose une politique
de sécurité du contenu (CSP) qui bloque les scripts venus d'ailleurs. Les conteneurs ne
publient leurs ports que sur `127.0.0.1` : seul le nginx du serveur, qui gère le certificat,
est joignable depuis Internet.

**Secrets.** Clé secrète, mot de passe de la base et identifiants SMTP vivent dans des `.env`
jamais versionnés, chacun avec un modèle `.example` sans valeur réelle. La production n'a aucune
valeur de repli : une variable manquante empêche le démarrage au lieu de laisser passer une
valeur de test. Le rapport d'erreur 500 envoyé aux administrateurs masque le corps des
requêtes, les adresses IP et l'email du compte.

### RGPD

| Donnée | Quand | Finalité | Durée de conservation |
|---|---|---|---|
| prénom, nom, email, mot de passe haché | inscription | identifier le compte ; prénom et nom signent les articles publiés | tant que le compte existe |
| titre, texte, image d'un article | publication | afficher le blog | tant que l'article et le compte existent |
| prénom, nom, email, sujet, message | formulaire de contact | répondre au message | 90 jours, puis suppression automatique (`purger_contacts`, lancé chaque jour en production) |
| jetons de connexion | connexion | garder la session ouverte | dans le navigateur, effacés à la déconnexion ; le serveur garde la liste des jetons de rafraîchissement émis et révoqués, rattachés au compte, purgée chaque jour une fois expirés |
| préférence de thème | première visite, puis à chaque changement, pour tout visiteur | afficher le thème clair ou sombre | stockée dans le navigateur seulement |

L'email n'est jamais affiché aux visiteurs : les articles sont signés « Prénom Nom ». Le site ne
pose aucun cookie publicitaire et ne mesure pas l'audience. Les données ne sont cédées à aucun
tiers ; seul le relais d'envoi d'emails reçoit l'adresse et le message de réinitialisation.

**Droits des utilisateurs.** Le membre supprime lui-même son compte et ses articles depuis la page
« Supprimer mon compte ». L'accès, la rectification et toute autre demande passent par le
formulaire de contact. La page « Politique de confidentialité » du site (`/privacy`) expose ces
informations au visiteur.

### Limites actuelles

Ces points sont connus et suivis dans `AMELIORATIONS.md`. Aucun n'est corrigé à ce jour.

**Sécurité**

- **Les jetons sont lisibles par les scripts de la page.** Ils sont rangés dans le stockage local
  du navigateur. La CSP bloque les scripts injectés, mais une faille qui la contournerait
  emporterait le jeton de rafraîchissement, valable un jour. Piste : un cookie `httpOnly`.
- **L'inscription révèle si un email a déjà un compte.** La réponse `400` le dit, alors que la
  réinitialisation, elle, répond pareil dans les deux cas.
- **La réinitialisation reste mesurable au temps de réponse.** L'email part pendant la requête :
  un compte existant répond plus lentement. Le quota de 3 demandes par heure limite l'abus sans
  le supprimer.
- **La casse de l'email compte.** Un compte inscrit `Jean@x.fr` ne se connecte pas avec
  `jean@x.fr`.
- **Deux courses de quelques millisecondes** : une connexion lancée pendant un changement de mot de
  passe peut garder une session à l'ancien mot de passe ; un compte désactivé pendant ce
  changement peut redevenir actif.
- **Le mot de passe de réinitialisation n'est pas comparé à l'email du compte**, alors qu'il l'est
  à l'inscription.
- **Les pages servies par Django** (administration, API navigable) n'ont pas de CSP, et
  `/admin/` n'a aucune limite de débit ni restriction d'adresse devant lui.
- **Le rapport d'erreur 500** masque le corps des requêtes mais pas les paramètres d'URL, ni le
  message d'une erreur de base de données, qui peut citer un email.
- **HSTS est réglé à une heure** : le navigateur oublie vite qu'il doit rester en HTTPS.
- **Les actions GitHub sont visées par étiquette** et non par empreinte : une action compromise
  pourrait publier une image.

**RGPD et exploitation**

- **Aucune sauvegarde de la base.** Une perte du disque du serveur emporte comptes, articles et
  messages.
- **Les inscriptions jamais validées sont gardées sans limite**, aucune purge ne les supprime.
- **Pas d'export des données ni de modification du profil** : l'accès et la rectification passent
  par un message à l'équipe, traité à la main.
- **L'équipe voit tout depuis l'administration**, emails compris.
