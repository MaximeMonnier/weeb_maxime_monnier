# CLAUDE.md — Weeb (Blog sur le Web)

> Fichier de contexte pour Claude. Lu à chaque session pour comprendre le projet
> sans avoir à tout re-explorer. **À mettre à jour quand l'architecture évolue.**

---

## 0. Mode de travail attendu (IMPORTANT)

Maxime est **développeur junior** et veut que je joue le rôle d'un **mentor / dev
senior**. Concrètement :

- **Expliquer le "pourquoi"**, pas seulement donner du code. Vulgariser les concepts.
- **Proposer, conseiller, challenger** ses choix plutôt que foncer.
- Avant d'écrire beaucoup de code, **vérifier qu'il a compris** et qu'il est d'accord
  avec l'approche.
- Privilégier des **petites étapes compréhensibles** plutôt qu'un gros bloc tout fait.
- Répondre à **toutes ses questions**, même "basiques", sans condescendance.
- C'est un **projet d'examen** présenté devant un jury → il doit pouvoir **expliquer
  chaque ligne**. Ne pas produire de code "magique" qu'il ne saurait pas défendre.

Langue de travail : **français**.

---

## 1. Contexte du projet

**Weeb** est un blog sur le web (thème : « explorer le web sous toutes ses facettes »).
C'est un projet scolaire (cursus *Software Engineer*) découpé en **6 étapes/semaines**.

- **Semaine 1 (FAIT)** : Frontend — React/TypeScript. Landing page, design system,
  routing, formulaires (validation côté client uniquement, pas encore branchés).
- **Semaine 2 (EN COURS — étape actuelle)** : Backend — **API REST avec Django**,
  testée avec **Postman**. + 4 interfaces frontend à finaliser.
- Semaines 3 à 6 : non communiquées pour l'instant.

### ⚠️ Piège dans l'énoncé à signaler
La section « Livrables et Documentation » de l'énoncé parle de **machine learning**
(« origine des données pour l'entraînement du modèle », « choix du modèle ML »,
« métriques : précision, rappel »). **Il n'y a AUCun machine learning dans ce projet** :
c'est un blog CRUD classique. C'est très probablement un **copier-coller du template
de l'école** issu d'un autre sujet. → À confirmer avec le formateur ; ne pas perdre de
temps à inventer un modèle ML. Le rapport doit en revanche bien couvrir : prise en main,
décomposition de l'app, structure du projet Django.

---

## 2. Objectifs de la Semaine 2 (checklist)

### Backend (travail de groupe) — API REST Django
- [ ] **Contact** : enregistrer en base les soumissions du formulaire de contact.
- [ ] **Articles** :
  - [ ] Créer un article (auth requise + compte validé).
  - [ ] Lister tous les articles.
  - [ ] Récupérer un article par id (détail).
  - [ ] Mettre à jour / supprimer un article **uniquement par son propriétaire**.
- [ ] **Authentification** :
  - [ ] Sign Up / inscription (prénom, nom, email, mot de passe).
  - [ ] Log In / connexion.
  - [ ] Reset password (réinitialisation du mot de passe).
- [ ] **Rôles & permissions** (voir §5).
- [ ] **Admin Django** auto-généré pour gérer users + articles (valider les comptes).

### Frontend (travail individuel) — 4 interfaces à finaliser
- [ ] Page **Blog** (liste des articles depuis la BDD).
- [ ] Page **détail d'un article** (template).
- [ ] Page **ajout d'un article** (réservée aux users validés).
- [ ] Page **réinitialisation du mot de passe**.

### Critères de validation du jury
- Tous les endpoints présents et fonctionnels, API sans erreur/warning bloquant.
- CRUD opérationnel en base.
- Droits d'accès respectés selon le type d'user.
- Routes d'auth opérationnelles.
- Code propre : indentation, **docstrings + commentaires pertinents**, conventions de
  nommage (variables, fonctions, classes, **commits**).
- **Workflow Git** : issue → branche → modifs → Pull Request → validation → suppression
  de la branche. (Déjà bien appliqué sur la partie front, cf. historique git.)

---

## 3. Stack technique

### Frontend (existant)
- **React 19.2** + **TypeScript 5.9** (strict)
- **Vite 7.2** (build/dev)
- **React Router DOM 7.12** (routing SPA)
- **Tailwind CSS 4.1** (via plugin `@tailwindcss/vite`, config dans `src/index.css`)
- **lucide-react** (icônes)
- ESLint configuré (`eslint.config.js`)
- Node v22.20.0

### Backend (à créer)
- **Django** + très probablement **Django REST Framework (DRF)** pour l'API REST.
- **Python 3.12.3** dispo, **pip 24** dispo.
- BDD : **SQLite** par défaut (suffisant pour l'examen), Postgres possible plus tard.
- Tests manuels via **Postman**.
- Auth : à décider (session DRF, **token DRF**, ou **JWT** via `djangorestframework-simplejwt`).
  → JWT est le plus courant avec un front SPA React. À discuter avec Maxime.

---

## 4. Architecture frontend (existant)

Point d'entrée : `src/main.tsx` → `src/App.tsx` (définit les routes).

```
src/
├── App.tsx                 # Routes (BrowserRouter + Routes/Route)
├── main.tsx                # Point d'entrée React
├── index.css               # Tailwind + design system (variables CSS, classes custom)
├── layouts/
│   └── MainLayout.tsx      # NavBar + <Outlet/> + Footer (layout commun)
├── pages/                  # 1 fichier = 1 page
│   ├── Home.tsx  About.tsx  Contact.tsx  Login.tsx  Subscribe.tsx  NotFound.tsx
├── components/
│   ├── common/             # Composants métier
│   │   ├── Navigation/     # NavBar, DesktopNav, MobileMenu
│   │   ├── Home/           # HeroBanner, FeatureBlock, BrandBanner
│   │   ├── Contact/FormContact.tsx
│   │   ├── Login/FormLogin.tsx
│   │   ├── Subscribe/FormSubscribe.tsx
│   │   ├── Footer.tsx  ThemeToggle.tsx
│   │   └── ui/             # Composants UI génériques (Button, Input, Logo, Title)
├── hooks/useTheme.ts       # Dark mode + persistance localStorage
├── types/navigation.ts     # type NavItem (hash | route)
├── routes/   lib/          # DOSSIERS VIDES (prévus, pas encore utilisés)
└── assets/                 # img/, svg/
```

### Routes actuelles (`App.tsx`)
`/` `/contact` `/login` `/subscribe` `/about` `*`(404).
**Manquantes (à ajouter)** : `/blog`, `/blog/:id` (détail), `/articles/new` (ajout),
`/forgot-password` (le lien existe déjà dans `FormLogin` mais la route n'existe pas !).

### ⚠️ État des formulaires (à brancher au backend)
Les 3 formulaires **simulent** l'appel API : `await new Promise(setTimeout 1500)` +
`console.log(...)`. **Aucun appel réseau réel.** Ce sont eux qu'il faudra connecter à
l'API Django (`fetch`/`axios`).

- `FormContact` → champs : `name, surname, email, subject, message` → POST `/api/contact/`
- `FormLogin` → `email, password` → POST `/api/auth/login/`
- `FormSubscribe` → `name, surname, email, password, confirmPassword` → POST `/api/auth/register/`

> Note : le front utilise `name`/`surname`. En base Django on aura sûrement
> `first_name`/`last_name` → prévoir le mapping côté API ou côté front.

### Design system (`src/index.css`)
Variables CSS pour light/dark mode. Classes utilitaires custom réutilisables :
- Boutons : `.btn-primary` `.btn-secondary` `.btn-ghost`
- Formulaires : `.form-label` `.form-input` `.form-error-message` `.form-helper-text`
- Nav : `.nav-link` (+ `.active`)
- Layout : `.container-custom` (max-width 80rem), `.text-primary/secondary/accent`,
  `.bg-primary/secondary/tertiary`, `.focus-ring-primary`
- Couleur accent : violet (`#9333EA` light / `#A855F7` dark)

Composants UI réutilisables (props typées) : `Input`, `Textarea` (`src/components/ui/Input`),
`MainButton` (`variant`, `size`, `fullWidth`), `Logo`, `MainTitle/SecondTitle/LinkTitle`.
**Toujours réutiliser ces composants** pour les nouvelles pages (cohérence + DRY).

---

## 5. Rôles utilisateurs & permissions (cœur de la sécurité)

Trois types d'utilisateurs :

| Type | Accès |
|------|-------|
| **Non authentifié** | Home, Contact, Log In/Sign Up, Blog, détail article (lecture seule) |
| **Inscrit en attente de validation** | Idem + son compte existe mais **`is_active=False`** → ne peut PAS poster d'article |
| **Inscrit validé** (`is_active=True`) | + accès à l'interface d'ajout d'article |
| **Admin** | Dashboard Django auto-généré : gère users (valide les comptes) + articles |

Règle clé : **seuls les users authentifiés ET validés peuvent créer un article.**
Un article ne peut être **modifié/supprimé que par son propriétaire** (ou l'admin).

> ⚠️ Attention au champ `is_active` : dans Django, `is_active=False` **empêche aussi de
> se connecter** via l'auth standard. L'énoncé propose `is_active`, mais il faudra
> décider : soit on s'en sert tel quel (le user ne peut pas login tant qu'il n'est pas
> validé), soit on crée un champ dédié type `is_approved`/`is_validated` pour séparer
> "compte actif" et "compte approuvé par l'admin". **À discuter avec Maxime** — c'est un
> point que le jury peut tout à fait challenger.

---

## 6. Plan backend proposé (à valider ensemble, non figé)

Structure Django typique envisagée (à la racine ou dans un dossier `backend/`) :

```
backend/
├── manage.py
├── requirements.txt
├── config/                 # projet Django (settings, urls, wsgi)
│   ├── settings.py
│   └── urls.py
├── accounts/               # app : utilisateurs, auth, rôles
│   ├── models.py           # CustomUser (email comme identifiant ?)
│   ├── serializers.py
│   ├── views.py            # register, login, reset password
│   └── urls.py
├── articles/               # app : articles du blog (CRUD)
│   ├── models.py           # Article (title, content, author FK, timestamps)
│   ├── serializers.py
│   ├── views.py            # ViewSet CRUD + permissions IsOwnerOrReadOnly
│   └── urls.py
└── contact/                # app : messages du formulaire de contact
    ├── models.py           # ContactMessage
    ├── serializers.py
    └── views.py
```

Endpoints REST cibles (préfixe `/api/`) — *proposition* :
- `POST /api/auth/register/` — inscription
- `POST /api/auth/login/` — connexion (retourne token/JWT)
- `POST /api/auth/password-reset/` — demande de reset
- `POST /api/auth/password-reset/confirm/` — confirmation reset
- `POST /api/contact/` — enregistrer un message de contact
- `GET  /api/articles/` — liste
- `POST /api/articles/` — créer (auth + validé)
- `GET  /api/articles/{id}/` — détail
- `PUT/PATCH /api/articles/{id}/` — modifier (propriétaire)
- `DELETE /api/articles/{id}/` — supprimer (propriétaire)

### ✅ Décisions actées (2026-06-04)
1. **Mono-repo** : le backend Django vit dans un dossier **`backend/`** de CE repo.
2. **Auth = JWT** via **`djangorestframework-simplejwt`** (standard SPA React).
3. **CustomUser** : login par **email** (le front n'a pas de "username"). On crée le
   `CustomUser` **dès le départ** (très pénible à migrer après les premières migrations).
4. **CORS** : `django-cors-headers` requis (front sur :5173, API sur :8000).
5. **Niveau Django de Maxime** : « quelques bases » → expliquer les concepts clés
   (apps, models, migrations, serializers, permissions, JWT) en avançant, sans repartir
   totalement de zéro.

---

## 7. Workflow Git (déjà en place, à respecter)

Le repo suit un vrai workflow par branches + PR (cf. historique). Convention observée :
- Branches nommées `<numéro-issue>-description-kebab-case`
  (ex: `13-ajouter-page-blog-avec-navigation`).
- Commits en **français**, préfixe type `feat:` (Conventional Commits).
- Branche par défaut : `main`. Branche d'intégration : `preprod`.
- Cycle : **issue → branche → commits → Pull Request → review/validation → merge →
  suppression de la branche**.

→ Pour chaque nouvelle fonctionnalité backend : créer une issue, une branche dédiée, une PR.

### Commandes utiles
```bash
# Frontend
npm install          # installer les deps
npm run dev          # serveur dev http://localhost:5173
npm run build        # build prod (tsc -b && vite build)
npm run lint         # ESLint

# Backend (une fois Django installé)
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver      # http://localhost:8000
python backend/manage.py createsuperuser
```

---

## 8. Prochaines étapes immédiates

1. **Valider les choix d'archi backend** (§6) avec Maxime (auth, CustomUser, mono-repo).
2. Initialiser le projet Django + DRF + CORS dans `backend/`.
3. Créer le `CustomUser` et l'app `accounts` (register/login) en premier.
4. App `articles` (CRUD + permission propriétaire), puis `contact`.
5. Brancher les formulaires React sur l'API.
6. Créer les 4 pages front manquantes (Blog, détail, ajout article, reset password).
7. Documenter (docstrings) + étoffer le rapport.

---

*Dernière mise à jour : 2026-06-04 — création initiale (analyse projet, avant tout code backend).*
