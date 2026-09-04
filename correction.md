# Plan de correction — projet Weeb

Ce fichier liste **tout ce qui doit être corrigé** dans le dépôt, dans un ordre d'exécution
raisonné. Il est issu de la revue complète du code (backend, frontend, Docker, configuration).

Chaque tâche est accompagnée d'un **prompt d'exécution** prêt à coller dans Claude Code.
Ces prompts imposent deux choses non négociables :

1. **passer par les skills du projet** (`.claude/skills/`) pour produire un plan d'implémentation
   *avant* d'écrire la moindre ligne ;
2. **réutiliser l'existant** plutôt que de recréer — c'est précisément le rôle de la skill
   `inventaire-avant-dev`, dont le tableau `RÉUTILISER / ÉTENDRE / CRÉER` est un livrable
   obligatoire.

---

## Comment utiliser ce fichier

- Traiter les lots **dans l'ordre**. Les dépendances sont explicites : le lot 2 (tests) protège
  tous les refactorings qui suivent, le lot 4 (socle des formulaires) doit précéder le lot 5.
- **Une tâche = une branche = un commit atomique** (ou quelques-uns), selon `workflow-git` :
  branche `<numéro-issue>-description-kebab-case` créée depuis `origin/preprod`,
  Conventional Commits, PR vers `preprod`.
- **Un lot = une issue GitHub** (ou une epic avec sous-issues), rédigée avec `tickets-github`.
- Cocher les cases au fur et à mesure. Le journal de bord est tenu à part, voir la section
  « Journal ».
- ⚠️ Rappel : `Closes #N` ne ferme pas l'issue au merge dans `preprod`. Fermer à la main.

---

## Journal

Chaque lot clos donne **une entrée dans `journal.md`**, à la racine et versionné — contrairement
à ce fichier, qui reste un plan de travail. L'entrée est écrite à la clôture du lot, pas
reconstituée après coup.

Quatre points, dans cet ordre :

- **Constat mesuré** — le chiffre ou la sortie de commande qui a motivé le lot, pas son résumé.
- **Décision et justification** — ce qui a été retenu, ce qui a été écarté, et pourquoi.
- **Ce qui a surpris** — l'écart entre ce qui était prévu et ce qui s'est passé. C'est la partie
  qui a le plus de valeur : aucun diff ne la redit.
- **Preuve de la correction** — la commande rejouée et sa sortie, après.

Le journal ne raconte pas *ce qui a été fait* : les issues, les PR et les rapports
`revue-avant-push` le font déjà, datés et vérifiables. Il porte ce qu'ils ne captent pas.
La colonne « Journal » du bloc d'état de chaque lot renvoie à son entrée une fois écrite.

---

## Règles communes à toutes les tâches

Ces règles sont reprises en tête de chaque prompt. Elles ne se négocient pas.

- **Aucun fichier créé sans le tableau de verdict de `inventaire-avant-dev`.** C'est une règle
  bloquante de la skill elle-même.
- **Aucun `fetch` hors de `lib/api.ts`.** Point d'appel réseau unique.
- **Toute vue DRF publique déclare explicitement sa permission.** Le défaut global est
  `IsAuthenticated` : une vue qui oublie sa permission est fermée sans que rien ne le signale.
- **Le nom du fichier ne dit pas le nom de l'export** côté front (`MainButton.tsx` exporte
  `Button`, `Card.tsx` exporte `ArticleCard`…). Inventorier les exports, pas les noms de fichiers.
- **Tout est rédigé en français** : code, commentaires, docstrings, commits, tickets.
- **Commentaires** : le *pourquoi*, jamais le *quoi*, trois lignes maximum (`commentaires-code`).
- **Avant chaque push** : dérouler `revue-avant-push`, qui rend un verdict
  `BLOQUANT / À CORRIGER / OK`.
- **Outillage** : `/plan-chapitre <lot>` pour créer les tickets du lot, puis `/ticket <n>` pour
  chaque issue. **`/lot` ne s'applique pas ici** : il lit `plan.md`, un autre fichier, et ne
  déroule pas `inventaire-avant-dev`, que les prompts de ce fichier exigent.

---

## Vue d'ensemble

| Lot | Titre | Tâches | Pourquoi à cette place |
|---|---|---|---|
| 0 | Débloquer l'environnement de travail | 2 | Rien n'est vérifiable tant que le front ne s'installe pas |
| 1 | Sécurité de l'API — **bloquant** | 6 | Prise de contrôle de compte possible en production |
| 2 | Tests automatisés | 3 | Verrouille le lot 1 et protège tous les refactorings suivants |
| 3 | Qualité et performance de l'API | 4 | Corrections backend isolées, sans impact sur le contrat d'API |
| 4 | Socle des formulaires front | 4 | Une seule extraction règle quatre copier-coller à la fois |
| 5 | Authentification côté front | 4 | S'appuie sur le socle du lot 4 |
| 6 | Pagination bout en bout | 2 | Change le contrat d'API : après la stabilisation du front |
| 7 | Navigation, liens et pages manquantes | 4 | Corrections de surface, sans dépendance |
| 8 | Dédoublonnage de la couche UI | 3 | Refactoring pur, protégé par le lot 2 |
| 9 | Code mort et conventions | 4 | Nettoyage final, une fois que plus rien n'y touche |
| 10 | Documentation et clôture | 3 | Consigne ce qui a été appris |

---

# Lot 0 — Débloquer l'environnement de travail

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-09-04 | — (issue #58, sans epic) | Lot 0 | — |

**Grain de ticket** : epic + 2 sous-issues, une par tâche.

> **Dépendances : aucune. Tout le reste en dépend.**
> En l'état, `npm ci`, `npm run dev`, `npm run lint` et `npm run build` échouent tous sur cette
> machine. Aucune vérification front n'est possible avant ce lot.

## 0.1 — Reprendre la main sur `frontend/node_modules`

- [x] **Fichiers** : `frontend/node_modules/` (hôte), `compose.dev.yaml`, `CLAUDE.md`, `README.md`
- **Constat** : `frontend/node_modules` est un dossier **vide appartenant à `root`**. Il a été créé
  par Docker comme point de montage du volume anonyme `/app/node_modules` déclaré dans
  `compose.dev.yaml`. Toute commande npm lancée depuis la machine échoue en `EACCES`.
- **Attendu** : le dossier est rendu à l'utilisateur, `npm ci` passe, `npm run lint` et
  `npm run build` s'exécutent. Le piège est documenté (voir 10.1).

```
Contexte : `frontend/node_modules` est un dossier vide appartenant à root, créé par le volume
anonyme `/app/node_modules` de `compose.dev.yaml` quand la pile de développement tourne.
Conséquence : npm ci, npm run dev, npm run lint et npm run build échouent tous en EACCES.

Consulte d'abord la skill `conventions-docker` pour confirmer que le volume anonyme est bien
nécessaire tel qu'il est déclaré, et qu'il n'existe pas d'alternative (montage nommé, uid) qui
éviterait l'effet de bord côté hôte.

Puis propose-moi un plan en deux temps :
1. la remise en état immédiate de la machine (commande exacte, en me disant précisément ce
   qu'elle supprime avant de la lancer) ;
2. la prévention — soit un ajustement de compose.dev.yaml si une option propre existe,
   soit, si le volume anonyme reste la bonne solution, la simple consigne à documenter.

Ne lance aucune commande destructive sans me la montrer d'abord. Termine en vérifiant que
`npm ci`, `npm run lint` et `npm run build` passent, et rapporte-moi leur sortie réelle.
```

## 0.2 — Corriger les vulnérabilités des dépendances front

- [x] **Fichiers** : `frontend/package.json`, `frontend/package-lock.json`
- **Constat** : `npm audit` remonte **7 vulnérabilités « high »** sur `vite` 7.2.4 (traversée de
  chemin, lecture de fichier arbitraire via le WebSocket du serveur de dev, contournement de
  `server.fs.deny`). Elles ne concernent que le serveur de développement, pas l'image de
  production servie par nginx — ce qui les rend sérieuses sans être bloquantes.
- **Attendu** : `npm audit` propre, `npm run build` toujours vert, `package-lock.json` committé.
- **Dépend de** : 0.1

```
Objectif : corriger les 7 vulnérabilités « high » que `npm audit` remonte sur vite 7.2.4 dans
frontend/.

Avant toute chose : lance `npm audit` et montre-moi la sortie réelle, pas un résumé de mémoire.
Vérifie si `npm audit fix` suffit ou s'il exige un changement de version majeure.

Consulte la skill `conventions-docker` : l'image de production du front est construite à partir
de ce même package-lock.json (`npm ci` dans l'étape `deps`). Confirme que la montée de version
ne casse ni l'étape `build` du Dockerfile ni `vite.config.ts` — en particulier la garde sur
VITE_API_URL et l'option `server.watch.usePolling`.

Après correction : `npm run lint` et `npm run build` doivent passer. Donne-moi leur sortie.
Commit `chore:` séparé, avec le package-lock.json.
```

---

# Lot 1 — Sécurité de l'API (bloquant)

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — sécurité |

**Grain de ticket** : epic + 6 sous-issues, une par tâche.

> **Dépendances : lot 0** (pour pouvoir vérifier le front après 1.1).
> ⚠️ **Ce lot corrige une prise de contrôle de compte exploitable sans aucun prérequis.**
> Rien d'autre ne doit être livré avant lui.

## 1.1 — Réinitialisation de mot de passe : ne plus renvoyer le jeton au client

- [ ] **Fichiers** : `backend/accounts/views.py`, `backend/accounts/serializers.py`,
  `backend/config/settings/base.py`, `development.py`, `production.py`, `test.py`,
  `frontend/src/pages/ForgotPassword.tsx`, `.env.example`
- **Constat** : `accounts/views.py:41` renvoie `uid` et `token` dans le corps de la réponse, sur
  un endpoint `AllowAny`. Enchaîné avec `/password-reset/confirm/`, **n'importe qui change le mot
  de passe de n'importe quel compte** sans jamais accéder à la boîte mail. `ForgotPassword.tsx:30`
  s'appuie sur ce comportement comme fonctionnement nominal.
- **Cause racine** : aucun `EMAIL_BACKEND` n'est configuré — le jeton a été renvoyé au client
  faute de pouvoir être envoyé.
- **Attendu** : le lien de réinitialisation part par email ; l'API répond un 200 neutre sans
  jamais exposer `uid` ni `token` ; le front passe à un parcours en deux pages
  (demande → lien reçu par mail portant `uid` et `token` en paramètres d'URL).

```
FAILLE CRITIQUE à corriger. Contexte précis :

backend/accounts/views.py:41 — PasswordResetRequestView renvoie {"uid": ..., "token": ...} dans
la réponse HTTP, sur un endpoint AllowAny. Enchaîné avec PasswordResetConfirmView, cela permet à
n'importe qui de prendre le contrôle de n'importe quel compte sans accéder à la boîte mail.
frontend/src/pages/ForgotPassword.tsx:30 consomme ce jeton comme fonctionnement normal.

Cause racine : aucun EMAIL_BACKEND n'est configuré dans config/settings/.

Travail demandé, dans cet ordre :

1. Déroule la skill `inventaire-avant-dev` (étapes 1 à 3) sur le périmètre : app accounts côté
   backend, et pages + routes côté front. Produis le tableau RÉUTILISER / ÉTENDRE / CRÉER avant
   toute création de fichier.

2. Consulte la skill `backend-django-drf` pour les conventions de vues, serializers et
   permissions, et `frontend-react-ts` pour le parcours côté front.

3. Présente-moi un plan d'implémentation couvrant :
   - la configuration email par environnement — en respectant la règle du projet : base.py ne
     pose aucun secret ni aucune valeur propre à une machine, chaque environnement dit d'où vient
     la sienne, et on passe par les helpers env_* (env_required, env_str, env_bool), jamais par
     os.environ directement ;
   - l'envoi du lien de réinitialisation par email, contenant uid et token en paramètres d'URL
     d'une page du front ;
   - la réponse de l'API, qui doit devenir un 200 neutre identique que le compte existe ou non
     (voir aussi la tâche 1.2, à traiter dans le même lot) ;
   - la refonte de ForgotPassword.tsx : étape 1 = demande par email seule, étape 2 = page
     distincte atteinte depuis le lien, qui lit uid et token dans l'URL. Réutilise l'Input
     existant (components/ui/Input) et le MainButton existant, ne crée aucun champ maison ;
   - la nouvelle route à déclarer dans App.tsx ;
   - les variables à ajouter dans .env.example, avec leur commentaire — le projet impose que
     toute variable lue par le code y figure.

4. Attends ma validation du plan avant d'écrire le code.

Critères d'acceptation :
- POST /api/auth/password-reset/ ne renvoie JAMAIS uid ni token, quel que soit l'email envoyé ;
- en développement, le mail arrive dans Mailpit — service `mailpit` de `compose.dev.yaml`,
  interface sur http://127.0.0.1:8025 — et le lien qu'il porte est utilisable ;
- l'ancien parcours en deux étapes sur une seule page n'existe plus ;
- .env.example documente chaque nouvelle variable.
```

## 1.2 — Neutraliser l'énumération de comptes

- [ ] **Fichiers** : `backend/accounts/views.py`, `backend/accounts/serializers.py`
- **Constat** : `accounts/views.py:35-36` répond `404 "Aucun compte associé à cet email."` — on
  apprend qui est inscrit. Même fuite à l'inscription : l'unicité de l'email produit un 400
  explicite. Côté front, `ForgotPassword.tsx:33` affiche le message.
- **Attendu** : réponse identique que le compte existe ou non, sur la demande de réinitialisation
  comme sur l'inscription.
- **À traiter avec** : 1.1 (même fichier, même parcours)

```
Objectif : supprimer l'énumération de comptes sur l'API.

Constat :
- backend/accounts/views.py:35 renvoie un 404 « Aucun compte associé à cet email. » — cela révèle
  quels emails sont inscrits ;
- l'inscription fuit la même information via l'erreur d'unicité de l'email ;
- frontend/src/pages/ForgotPassword.tsx:33 affiche « Aucun compte associé à cet email. ».

Consulte la skill `backend-django-drf` avant d'écrire, puis propose un plan qui traite :
1. la demande de réinitialisation : même réponse 200 neutre dans les deux cas, l'email n'étant
   envoyé que si le compte existe ;
2. l'inscription : décide, en me l'argumentant, entre masquer la collision et l'assumer — pour
   un formulaire d'inscription grand public, la fuite est souvent acceptée en échange de l'UX.
   Donne-moi ta recommandation plutôt qu'une liste d'options ;
3. le message affiché côté front, à aligner sur la nouvelle réponse.

Cette tâche touche les mêmes fichiers que la correction de la faille de réinitialisation
(tâche 1.1 de correction.md) : traite les deux ensemble, dans la même branche.

Critère d'acceptation : deux requêtes de réinitialisation, l'une sur un email inscrit, l'autre
sur un email inconnu, produisent exactement le même code HTTP et le même corps de réponse.
```

## 1.3 — Appliquer les validateurs de mot de passe de Django

- [ ] **Fichiers** : `backend/accounts/serializers.py`
- **Constat** : `AUTH_PASSWORD_VALIDATORS` est déclaré (`base.py:190`) mais **aucun code ne
  l'appelle**. `RegisterSerializer` (`serializers.py:9`) ne pose que `min_length=8`, et
  `PasswordResetConfirmSerializer` (`serializers.py:32`) idem. `12345678` passe à l'inscription et
  au reset. Le front (`FormSubscribe.tsx:63`) est plus strict que l'API — et une validation
  côté client seule ne protège rien.
- **Attendu** : `validate_password()` appliqué à l'inscription **et** à la réinitialisation, avec
  des messages d'erreur exploitables par le front.

```
Objectif : faire réellement appliquer AUTH_PASSWORD_VALIDATORS, aujourd'hui déclaré dans
backend/config/settings/base.py:190 mais jamais appelé par le code.

Constat :
- backend/accounts/serializers.py:9 — RegisterSerializer ne valide que min_length=8 ;
- backend/accounts/serializers.py:32 — PasswordResetConfirmSerializer non plus ;
- conséquence : « 12345678 » est accepté à l'inscription comme à la réinitialisation ;
- frontend/src/components/common/Subscribe/FormSubscribe.tsx:63 impose déjà majuscule, minuscule
  et chiffre côté client — l'API est donc plus permissive que le formulaire.

Consulte la skill `backend-django-drf` pour les conventions de serializers du projet, puis
propose un plan qui :
1. branche django.contrib.auth.password_validation.validate_password sur les DEUX serializers,
   sans dupliquer la logique entre eux — cherche d'abord s'il existe un point de factorisation
   naturel avant de créer quoi que ce soit ;
2. me dit si les validateurs configurés suffisent ou s'il faut en ajouter un pour rejoindre
   l'exigence du front (majuscule + minuscule + chiffre), et me recommande une réponse ;
3. vérifie que les messages d'erreur DRF remontés restent lisibles par le front, qui les
   affichera après la tâche 4.2.

Ne touche pas au formulaire front dans cette tâche.

Critère d'acceptation : POST /api/auth/register/ avec le mot de passe « 12345678 » renvoie 400.
```

## 1.4 — Sécuriser l'administration des utilisateurs

- [ ] **Fichiers** : `backend/accounts/admin.py`
- **Constat** : `accounts/admin.py:6` — `CustomUserAdmin` hérite de `admin.ModelAdmin` et non de
  `UserAdmin`. Le champ `password` s'affiche donc comme un input texte : le hash est visible, et
  **tout ce qui est tapé est enregistré tel quel, non hashé**. Le compte devient inconnectable et
  le mot de passe est stocké en clair.
- **Attendu** : le mot de passe n'est plus modifiable en clair depuis l'admin ; la validation
  d'un compte en un clic (`list_editable = ("is_active",)`) est conservée.

```
Objectif : corriger backend/accounts/admin.py.

Constat : CustomUserAdmin (ligne 6) hérite de admin.ModelAdmin au lieu de
django.contrib.auth.admin.UserAdmin. Le champ password est donc rendu comme un simple input
texte : le hash est visible dans le formulaire, et toute saisie est enregistrée telle quelle,
non hashée — le compte devient inconnectable et le mot de passe finit en clair en base.

Contrainte à préserver : le modèle est accounts.CustomUser, identifié par email, SANS champ
username. UserAdmin de Django suppose un username : ses fieldsets, add_fieldsets, ordering et
list_display doivent donc être redéfinis. C'est le point délicat de cette tâche, ne le survole pas.

Contrainte fonctionnelle : la validation d'un compte en un clic depuis la liste
(list_editable = ("is_active",)) doit rester possible — c'est le seul moyen actuel d'activer un
compte, puisque l'inscription crée l'utilisateur inactif.

Consulte la skill `backend-django-drf`, puis présente-moi le plan avant d'écrire. Termine par
`python manage.py check` et dis-moi comment tu as vérifié que le formulaire d'édition n'expose
plus le mot de passe.
```

## 1.5 — Limiter le débit des endpoints publics

- [ ] **Fichiers** : `backend/config/settings/base.py`, `backend/accounts/views.py`,
  `backend/contact/views.py`, `.env.example`
- **Constat** : aucun `DEFAULT_THROTTLE_CLASSES` dans `base.py:231`. `/api/auth/login/` accepte
  une infinité de tentatives → bruteforce du mot de passe. `/api/contact/` est public et sans
  quota → spam illimité, table qui grossit sans borne. `/api/auth/password-reset/` devient un
  envoyeur d'emails gratuit une fois la tâche 1.1 livrée.
- **Attendu** : quotas distincts sur connexion, inscription, réinitialisation et contact.
- **Dépend de** : 1.1 (l'endpoint de réinitialisation change de nature)

```
Objectif : ajouter une limitation de débit (throttling) sur les endpoints publics de l'API, qui
n'en a aucune aujourd'hui.

Endpoints concernés et raison :
- /api/auth/login/ (TokenObtainPairView) — bruteforce du mot de passe ;
- /api/auth/register/ — création de comptes en masse ;
- /api/auth/password-reset/ — après la tâche 1.1, c'est un envoyeur d'emails gratuit ;
- /api/contact/ — spam illimité, la table Contact grossit sans borne.

Consulte la skill `backend-django-drf` avant d'écrire, puis propose un plan qui traite :
1. l'emplacement du réglage — REST_FRAMEWORK est dans config/settings/base.py:231, mais rappelle
   que base.py ne doit contenir aucune valeur propre à un environnement. Les tests
   (config/settings/test.py) ne doivent pas se faire refuser des requêtes par le throttling :
   dis-moi comment tu le neutralises là-bas ;
2. le choix entre AnonRateThrottle global et ScopedRateThrottle par vue, avec ta recommandation
   argumentée plutôt qu'un catalogue ;
3. les quotas retenus, endpoint par endpoint ;
4. le cas de TokenObtainPairView, qui vient de simplejwt et n'est pas une vue du projet : dis-moi
   comment tu lui appliques un scope sans la réécrire entièrement ;
5. les variables à ajouter dans .env.example si les quotas deviennent configurables.

Attention : DEFAULT_PERMISSION_CLASSES vaut IsAuthenticated dans ce projet. Vérifie que ton
ajout ne modifie aucune permission existante par effet de bord.

Critère d'acceptation : la 6e tentative de connexion échouée depuis la même IP renvoie 429.
```

## 1.6 — Rotation et invalidation des jetons JWT

- [ ] **Fichiers** : `backend/config/settings/base.py`, `backend/requirements.txt`
- **Constat** : `SIMPLE_JWT` (`base.py:247`) ne définit que les durées de vie. Ni
  `ROTATE_REFRESH_TOKENS`, ni blacklist. Conséquence : après un changement de mot de passe, les
  jetons d'accès déjà émis restent valides jusqu'à une heure. Il n'existe par ailleurs aucun
  endpoint de déconnexion.
- **Attendu** : rotation du refresh token, invalidation possible, et un endpoint de déconnexion
  utilisable par la tâche 5.3.
- **Dépend de** : 1.1

```
Objectif : durcir la configuration JWT du projet.

Constat : backend/config/settings/base.py:247 — SIMPLE_JWT ne définit que ACCESS_TOKEN_LIFETIME
(60 min) et REFRESH_TOKEN_LIFETIME (1 jour). Pas de rotation, pas de blacklist, pas d'endpoint de
déconnexion. Après un changement de mot de passe, un jeton d'accès volé reste valide jusqu'à 1 h.

Consulte la skill `backend-django-drf`, puis propose un plan qui traite :
1. ROTATE_REFRESH_TOKENS et BLACKLIST_AFTER_ROTATION, et ce qu'ils impliquent côté front — le
   refresh renvoie alors un nouveau refresh token, que la tâche 5.2 devra stocker ;
2. l'app rest_framework_simplejwt.token_blacklist : elle ajoute deux modèles et donc une
   migration. Dis-moi si tu la juges justifiée pour ce projet, ou si la rotation seule suffit —
   recommandation argumentée, pas un catalogue ;
3. un endpoint de déconnexion sous /api/auth/, qui invalide le refresh token. Il sera consommé
   par la tâche 5.3. Respecte le routage existant : accounts/urls.py est monté sous /api/auth/
   par config/urls.py ;
4. l'impact sur requirements.txt (versions épinglées, comme le reste du fichier) ;
5. l'impact sur la durée de vie de l'access token — 60 min est long pour un jeton stocké dans
   localStorage ; dis-moi si tu la réduis et pourquoi.

Rappelle-moi, avant d'écrire, si une migration est produite : `python manage.py makemigrations`
doit être lancé et le fichier committé.
```

---

# Lot 2 — Tests automatisés (le filet)

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — qualité |

**Grain de ticket** : epic + 3 sous-issues, une par app testée.

> **Dépendances : lot 1.**
> Les trois `tests.py` ne contiennent aujourd'hui qu'un `from django.test import TestCase`.
> Zéro test sur un projet qui a une authentification, des permissions de propriété et une
> réinitialisation de mot de passe. **Un seul test aurait attrapé la faille 1.1.**
> Ce lot verrouille le lot 1 et protège tous les refactorings des lots 3 à 9.
>
> Rappel d'exécution : `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test`,
> avec un PostgreSQL joignable et les variables `POSTGRES_*` renseignées.

## 2.1 — Tests de l'app `accounts`

- [ ] **Fichiers** : `backend/accounts/tests.py`
- **Constat** : fichier vide (une ligne d'import).
- **Attendu** : l'inscription, la connexion, la réinitialisation et l'énumération sont couvertes,
  et la faille 1.1 ne peut plus revenir sans faire échouer la suite.

```
Objectif : écrire la suite de tests de l'app accounts, aujourd'hui vide
(backend/accounts/tests.py ne contient qu'un import).

Ces tests doivent verrouiller les corrections du lot 1 de correction.md. Ils sont donc à écrire
APRÈS elles, et doivent échouer si quelqu'un les défait.

Consulte la skill `backend-django-drf` pour les conventions du projet (modèle CustomUser
identifié par email sans username, permissions explicites sur les vues publiques), puis propose
le plan de la suite avant de l'écrire.

Cas à couvrir au minimum :
- inscription : le compte est créé INACTIF (RegisterSerializer le fait explicitement) ;
- inscription : le mot de passe n'apparaît jamais dans la réponse (il est write_only) ;
- inscription : un mot de passe faible comme « 12345678 » est refusé — verrouille la tâche 1.3 ;
- connexion : un compte inactif ne peut pas obtenir de jeton ;
- connexion : un compte actif obtient bien access et refresh ;
- réinitialisation : la réponse ne contient NI uid NI token — c'est le test qui verrouille la
  faille critique 1.1 ;
- réinitialisation : la réponse est identique pour un email inscrit et pour un email inconnu —
  verrouille la tâche 1.2 ;
- réinitialisation : un token invalide est refusé ;
- réinitialisation : après changement, l'ancien mot de passe ne fonctionne plus.

Contraintes :
- réutilise le manager existant (CustomUser.objects.create_user) pour fabriquer les comptes de
  test, ne réécris pas la création d'utilisateur ;
- utilise APITestCase de DRF plutôt que le TestCase nu si cela simplifie les appels ;
- si le throttling de la tâche 1.5 fait échouer des tests par excès de requêtes, ce n'est pas
  aux tests de contourner le problème : c'est config/settings/test.py qui doit le neutraliser.

Lance la suite et donne-moi sa sortie réelle. Ne me dis pas qu'elle passe sans me la montrer.
```

## 2.2 — Tests de l'app `articles` (permissions de propriété)

- [ ] **Fichiers** : `backend/articles/tests.py`
- **Constat** : fichier vide. Or `IsOwnerOrReadOnly` + l'injection de l'auteur dans
  `perform_create` sont la pièce la plus délicate du backend, et ne sont vérifiées par rien.
- **Attendu** : le modèle de propriété est prouvé par des tests.

```
Objectif : écrire la suite de tests de l'app articles, aujourd'hui vide
(backend/articles/tests.py ne contient qu'un import).

Le cœur de cette app est son modèle de propriété : ArticleViewSet combine
IsAuthenticatedOrReadOnly et IsOwnerOrReadOnly (articles/permissions.py), et perform_create
injecte l'auteur côté serveur. Rien ne le vérifie aujourd'hui.

Consulte la skill `backend-django-drf` avant d'écrire, puis présente le plan de la suite.

Cas à couvrir au minimum :
- lecture : un visiteur NON authentifié peut lister et consulter les articles ;
- écriture : un visiteur non authentifié reçoit 401 en création ;
- création : l'auteur enregistré est l'utilisateur du jeton, PAS un champ envoyé par le client —
  envoie explicitement un champ author falsifié dans le corps et vérifie qu'il est ignoré ;
- modification : l'auteur peut modifier son propre article ;
- modification : un autre utilisateur authentifié reçoit 403 ;
- suppression : mêmes deux cas ;
- ordre : la liste est bien rendue du plus récent au plus ancien (Meta.ordering = ["-created_at"]) ;
- serializer : author, created_at et updated_at sont en lecture seule.

Contraintes :
- réutilise CustomUser.objects.create_user pour les comptes de test ;
- n'introduis aucun helper de test dupliqué entre accounts/tests.py et articles/tests.py sans me
  le signaler : si un besoin commun apparaît, dis-le-moi et propose où le placer plutôt que de
  copier-coller.

Lance la suite et donne-moi sa sortie réelle.
```

## 2.3 — Tests de l'app `contact`

- [ ] **Fichiers** : `backend/contact/tests.py`
- **Constat** : fichier vide.
- **Attendu** : l'endpoint public est couvert, y compris son quota (tâche 1.5).

```
Objectif : écrire la suite de tests de l'app contact, aujourd'hui vide
(backend/contact/tests.py ne contient qu'un import).

Rappel du contexte : ContactCreateView est un CreateAPIView explicitement AllowAny — le défaut
global du projet étant IsAuthenticated, cette permission explicite est justement ce qu'il faut
vérifier, car son oubli fermerait l'endpoint sans que rien ne le signale.

Consulte la skill `backend-django-drf`, puis propose le plan avant d'écrire.

Cas à couvrir :
- un visiteur non authentifié peut poster un message (201) ;
- un champ obligatoire manquant renvoie 400 ;
- un email malformé renvoie 400 ;
- l'endpoint n'expose AUCUNE lecture : GET /api/contact/ ne doit pas lister les messages ;
- si la tâche 1.5 a posé un quota, la limite est atteinte au bon rang.

Si tu constates que le modèle Contact n'a aucun horodatage (c'est la tâche 3.3 de
correction.md), ne le corrige pas ici : signale-le simplement et écris les tests sur le modèle
tel qu'il est.

Lance la suite et donne-moi sa sortie réelle.
```

---

# Lot 3 — Qualité et performance de l'API

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — optimisation |

**Grain de ticket** : epic + 4 sous-issues, une par tâche.

> **Dépendances : lot 2** (les tests protègent ces changements).
> Aucune de ces tâches ne modifie le contrat d'API : le front n'a rien à adapter.

## 3.1 — Supprimer le N+1 sur la liste des articles

- [ ] **Fichiers** : `backend/articles/views.py`
- **Constat** : `articles/views.py:11` — `Article.objects.all()` combiné au
  `StringRelatedField` sur `author` (`serializers.py:9`) déclenche **une requête par article**
  pour afficher l'email de l'auteur. 50 articles = 51 requêtes.
- **Attendu** : une seule requête, quel que soit le nombre d'articles.

```
Objectif : supprimer le N+1 sur GET /api/articles/.

Constat : backend/articles/views.py:11 déclare `queryset = Article.objects.all()`, et
backend/articles/serializers.py:9 rend l'auteur via StringRelatedField, dont le __str__ lit
l'email. Résultat : une requête supplémentaire par article. 50 articles = 51 requêtes.

Consulte la skill `backend-django-drf`, puis :
1. corrige le queryset ;
2. PROUVE la correction plutôt que de l'affirmer : utilise assertNumQueries dans un test de
   backend/articles/tests.py (écrit au lot 2) avec plusieurs articles de plusieurs auteurs, de
   sorte que le nombre de requêtes ne dépende plus du nombre d'articles. C'est ce test qui
   empêchera la régression, pas le commentaire ;
3. vérifie au passage si le même problème existe ailleurs dans le projet et dis-le-moi.

Ne change ni le serializer ni la forme de la réponse : cette tâche ne doit rien casser côté front.
```

## 3.2 — Créer l'utilisateur en une seule écriture

- [ ] **Fichiers** : `backend/accounts/serializers.py`
- **Constat** : `serializers.py:17-20` — `create_user()` puis `is_active = False` puis `save()`.
  Deux écritures, et une fenêtre pendant laquelle le compte est **actif** en base.
- **Attendu** : une seule écriture, compte inactif dès l'INSERT.

```
Objectif : corriger backend/accounts/serializers.py:15-21.

Constat : RegisterSerializer.create appelle CustomUser.objects.create_user(**validated_data),
puis pose user.is_active = False et refait un save(). Cela produit deux écritures, et surtout une
fenêtre pendant laquelle le compte existe ACTIF en base.

Consulte la skill `backend-django-drf`, puis corrige en passant is_active dès l'appel au manager.
Vérifie avant d'écrire que UserManager.create_user (backend/accounts/models.py:12) accepte bien
is_active via **extra_fields — lis le code, ne le suppose pas.

Vérifie ensuite que create_superuser (models.py:21) n'est pas affecté : il pose is_active=True
via setdefault, ce comportement doit rester intact.

Le test d'inscription du lot 2 (« le compte est créé inactif ») doit continuer à passer. Lance la
suite et donne-moi sa sortie.
```

## 3.3 — Horodater les messages de contact

- [ ] **Fichiers** : `backend/contact/models.py`, `backend/contact/admin.py`,
  `backend/contact/serializers.py`, migration
- **Constat** : le modèle `Contact` n'a **aucun champ de date**. Impossible de trier les messages,
  de savoir quand ils sont arrivés, ni de purger les anciens. L'admin
  (`contact/admin.py:9`) ne peut donc pas les classer.
- **Attendu** : un `created_at` en `auto_now_add`, un ordre par défaut du plus récent au plus
  ancien, et l'admin qui l'affiche et le filtre.

```
Objectif : ajouter un horodatage au modèle Contact.

Constat : backend/contact/models.py — le modèle Contact n'a aucun champ de date. Les messages
sont donc intriables et impurgeables, et ContactAdmin (contact/admin.py:9) ne peut pas les
classer par arrivée.

Consulte la skill `backend-django-drf`, puis propose un plan qui traite :
1. le champ created_at — aligne-toi sur ce que fait déjà le modèle Article
   (backend/articles/models.py:19-20), qui utilise auto_now_add. Reprends la même convention
   plutôt que d'en inventer une ;
2. un Meta.ordering, à calquer sur celui d'Article ;
3. la migration : elle ajoute un champ non nullable à une table qui peut déjà contenir des
   lignes. Dis-moi comment tu traites la valeur par défaut des lignes existantes AVANT de
   générer la migration ;
4. ContactAdmin : ajouter le champ à list_display et le proposer en list_filter ;
5. le serializer : décide si created_at doit être exposé dans la réponse, et argumente. S'il
   l'est, il doit être en lecture seule — regarde comment ArticleSerializer déclare
   read_only_fields et fais pareil.

Lance `python manage.py makemigrations`, montre-moi le fichier produit avant de l'appliquer, puis
lance la suite de tests.
```

## 3.4 — Assainir la configuration des trois apps

- [ ] **Fichiers** : `backend/contact/apps.py`, `backend/accounts/apps.py`,
  `backend/articles/apps.py`, `backend/articles/views.py`
- **Constat** :
  - `contact/apps.py:4` : la classe s'appelle `ContactesConfig` (faute de frappe) ;
  - aucune des trois apps ne déclare `default_auto_field`, alors que les migrations existantes
    utilisent `BigAutoField` — l'écart est silencieux aujourd'hui, il ne le restera pas ;
  - `articles/views.py:1` : `from django.shortcuts import render` n'est jamais utilisé (reste du
    scaffold Django).
- **Attendu** : trois `apps.py` cohérents, plus aucun import mort.

```
Objectif : assainir la configuration des trois apps Django, sans changer aucun comportement.

Trois points, tous vérifiables :
1. backend/contact/apps.py:4 — la classe s'appelle ContactesConfig, faute de frappe pour
   ContactConfig. Vérifie avant de renommer si ce nom est référencé ailleurs (INSTALLED_APPS
   liste 'contact' sans chemin de config explicite, mais confirme-le par un grep plutôt que de le
   supposer).
2. Aucune des trois apps ne déclare default_auto_field, alors que les migrations initiales
   utilisent BigAutoField. Dis-moi d'où vient cet écart et si le corriger produit une migration —
   si oui, montre-la-moi avant de l'appliquer.
3. backend/articles/views.py:1 — `from django.shortcuts import render` n'est jamais utilisé.
   Supprime-le, et profites-en pour vérifier s'il reste d'autres imports morts dans le backend.

Consulte la skill `backend-django-drf` pour les conventions, et `commentaires-code` si tu touches
à des commentaires.

Cette tâche ne doit RIEN changer au comportement : `python manage.py check`,
`python manage.py makemigrations --check --dry-run` et la suite de tests doivent tous rester au
même état qu'avant. Donne-moi leur sortie.
```

---

# Lot 4 — Socle des formulaires front

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — qualité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche. 4.1 en premier.

> **Dépendances : lot 0.** Indépendant des lots 1 à 3, peut être mené en parallèle.
> ⚠️ **Traiter 4.1 en premier** : les trois autres tâches se règlent alors en un seul endroit
> au lieu de quatre. C'est tout l'intérêt de l'ordre.

## 4.1 — Extraire `hooks/useForm.ts`

- [ ] **Fichiers** : `frontend/src/hooks/useForm.ts` (à créer),
  `FormContact.tsx`, `FormLogin.tsx`, `FormSubscribe.tsx`, `FormArticle.tsx`
- **Constat** : `handleChange`, le type `FormErrors` et le squelette de `validateForm` sont
  **copiés à l'identique dans quatre formulaires**. `CLAUDE.md` et la skill `revue-avant-push`
  posent déjà la règle : un 5ᵉ copier-coller est bloquant. Puisque les tâches 4.2, 4.3 et 4.4
  demandent de modifier les quatre, autant extraire maintenant — une correction au lieu de quatre.
- **Attendu** : un hook unique, les quatre formulaires branchés dessus, comportement inchangé.

```
Objectif : extraire la logique de formulaire dupliquée dans un hook réutilisable.

Constat : handleChange, le type FormErrors et le squelette de validateForm sont copiés à
l'identique dans quatre fichiers :
- frontend/src/components/common/Contact/FormContact.tsx:28-68
- frontend/src/components/common/Login/FormLogin.tsx:26-53
- frontend/src/components/common/Subscribe/FormSubscribe.tsx:32-76
- frontend/src/components/common/Blog/FormArticle.tsx:25-51

Le fichier CLAUDE.md et la skill `revue-avant-push` posent déjà la règle : un 5e copier-coller
est BLOQUANT et impose d'extraire hooks/useForm.ts. La skill `inventaire-avant-dev` cite même ce
hook comme exemple de verdict CRÉER.

Travail demandé :

1. Déroule `inventaire-avant-dev` (étapes 1 à 3). Le seul hook existant est hooks/useTheme.ts :
   lis-le d'abord, la forme de son API (état + action retournés dans un objet) est la convention
   du projet, aligne-toi dessus. Produis le tableau de verdict.

2. Consulte `frontend-react-ts` pour le pattern de validation typée du projet.

3. Présente-moi le plan AVANT d'écrire, en traitant explicitement :
   - le typage générique : les quatre formulaires ont des FormData différentes, le hook doit
     rester typé sans `any` ;
   - handleChange doit accepter à la fois HTMLInputElement et HTMLTextAreaElement — deux des
     quatre formulaires utilisent Textarea ;
   - où va la validation : chaque formulaire a ses propres règles, elles ne doivent pas remonter
     dans le hook. Propose une signature qui les laisse au formulaire ;
   - isSubmitting fait-il partie du hook ou reste-t-il local ? Tranche et argumente ;
   - le regex d'email `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` est lui aussi copié trois fois : dis-moi si
     tu le sors ici ou dans une tâche séparée.

4. Migre les QUATRE formulaires. À la fin, plus aucune définition locale de handleChange ni de
   FormErrors ne doit subsister.

Contrainte forte : cette tâche est un refactoring PUR. Le comportement visible ne change pas —
l'affichage des erreurs serveur est la tâche 4.2, l'inversion nom/prénom la tâche 4.3. Ne les
traite pas ici, ou le diff deviendra illisible.
```

## 4.2 — Afficher les erreurs et les succès de l'API

- [ ] **Fichiers** : `frontend/src/hooks/useForm.ts`, les quatre formulaires,
  `frontend/src/lib/api.ts`
- **Constat** : les quatre formulaires se contentent d'un `console.error(err)`
  (`FormContact.tsx:96`, `FormLogin.tsx:79`, `FormSubscribe.tsx:99`, `FormArticle.tsx:74`).
  Mauvais mot de passe, compte non validé par l'admin, email déjà pris, article refusé faute de
  connexion : **à l'écran, rien ne se passe**. `FormContact` ne confirme pas non plus les succès.
  C'est le défaut le plus visible pour un utilisateur réel.
- **Attendu** : chaque échec produit un message lisible à l'écran, chaque succès une confirmation.
- **Dépend de** : 4.1

```
Objectif : afficher à l'utilisateur les erreurs et les succès renvoyés par l'API. Aujourd'hui les
quatre formulaires les avalent dans un console.error.

Constat, ligne par ligne :
- FormContact.tsx:96, FormLogin.tsx:79, FormSubscribe.tsx:99, FormArticle.tsx:74 — tous font
  `console.error(err)` et rien d'autre ;
- conséquence : « mot de passe incorrect », « compte non validé par un administrateur », « email
  déjà utilisé », « connexion requise » ne s'affichent jamais ;
- FormContact vide son formulaire en cas de succès sans afficher la moindre confirmation.

AMELIORATIONS.md classe ce point en « idée d'amélioration » avec une piste de librairie de
toasts. Avant de tirer une dépendance, dis-moi honnêtement si elle est justifiée ici ou si un
affichage inline suffit — le projet a déjà la classe CSS `form-error-message` (voir
frontend/src/index.css et son usage dans components/ui/Input/Input.tsx:91 et
pages/ForgotPassword.tsx:104). Recommandation argumentée, pas un catalogue d'options.

Travail demandé :

1. Déroule `inventaire-avant-dev` : regarde ce qui existe déjà pour afficher une erreur
   (form-error-message, la prop `error` de Input et Textarea, le pattern de ForgotPassword.tsx
   qui gère DÉJÀ un state `error` affiché — c'est le seul des cinq formulaires à le faire, prends-le
   comme référence). Produis le tableau de verdict.

2. Consulte `frontend-react-ts`.

3. Plan avant code, traitant :
   - la forme des erreurs DRF : apiFetch (lib/api.ts:41) lève `{ status, data }` où data est le
     corps JSON de Django, soit `{"champ": ["message"]}` soit `{"detail": "message"}`. Il faut
     traduire ça en erreurs de champ ET en erreur globale. C'est le cœur de la tâche ;
   - où placer cette traduction : dans useForm (créé en 4.1), dans lib/api.ts, ou dans un
     utilitaire ? Tranche et argumente ;
   - les messages : ils doivent être en français et compréhensibles. Un 401 sur /auth/login/ veut
     dire « identifiants incorrects OU compte non validé » — dis à l'utilisateur les deux ;
   - la confirmation de succès, au moins pour FormContact et FormSubscribe.

4. Applique aux quatre formulaires, et vérifie que ForgotPassword.tsx reste cohérent avec le
   nouveau pattern plutôt que de garder le sien dans son coin.

Critère d'acceptation : une connexion avec un mauvais mot de passe affiche un message à l'écran,
sans ouvrir la console.
```

## 4.3 — Corriger l'inversion nom / prénom

- [ ] **Fichiers** : `FormContact.tsx`, `FormSubscribe.tsx`
- **Constat** : dans les deux formulaires, le champ `name="first_name"` porte le label
  **« Nom »** et le placeholder **« Dupont »**, tandis que `last_name` porte « Prénom » / « Jean »
  (`FormContact.tsx:109-130`, `FormSubscribe.tsx:113-134`). Les messages de `validateForm` sont
  inversés dans le même sens. **La base stocke donc le nom de famille dans `first_name`** — et les
  données déjà saisies sont fausses.
- **Attendu** : les labels correspondent aux champs, à l'écran comme en base.
- **Dépend de** : 4.1

```
Objectif : corriger l'inversion nom / prénom dans deux formulaires.

Constat précis :
- frontend/src/components/common/Contact/FormContact.tsx:109-130
- frontend/src/components/common/Subscribe/FormSubscribe.tsx:113-134

Dans les deux, le champ `name="first_name"` porte le label « Nom » et le placeholder « Dupont »
(un nom de famille), tandis que `name="last_name"` porte « Prénom » et « Jean ». Les messages de
validateForm sont inversés dans le même sens (« Le nom est requis » sur first_name).

Conséquence : la base stocke le nom de famille dans first_name et le prénom dans last_name, pour
les utilisateurs comme pour les messages de contact.

Consulte `frontend-react-ts`, puis :

1. Corrige les labels, placeholders, helperText et messages de validation pour que first_name =
   prénom et last_name = nom, dans les deux formulaires. Vérifie aussi l'ORDRE d'affichage des
   deux champs, qui suit l'inversion.

2. Vérifie que le backend est bien la référence : CustomUser (accounts/models.py:32-33) et
   Contact (contact/models.py:7-8) déclarent first_name puis last_name. Ne renomme AUCUN champ
   côté backend — c'est le front qui est faux, pas le modèle.

3. Point important à ne pas passer sous silence : les données déjà en base sont inversées.
   Dis-moi combien de lignes sont concernées et propose une marche à suivre (migration de
   données, correction manuelle via l'admin, ou acceptation si le volume est nul en
   développement). Ne lance rien sur la base sans mon accord.

4. Cherche si la même inversion existe ailleurs (admin Django, autres composants).
```

## 4.4 — Corriger l'état d'envoi de `FormContact`

- [ ] **Fichiers** : `FormContact.tsx`
- **Constat** : `FormContact.tsx:26` déclare `isSubmitting`, `:98` le remet à `false` dans le
  `finally` — mais **`setIsSubmitting(true)` n'est jamais appelé**. Le bouton n'est donc jamais
  désactivé, n'affiche jamais « Envoi en cours… », et un double clic crée un doublon en base. Les
  trois autres formulaires le font correctement.
- **Attendu** : le bouton est désactivé pendant l'envoi.
- **Dépend de** : 4.1 (si `isSubmitting` remonte dans le hook, la tâche disparaît d'elle-même)

```
Objectif : corriger l'état d'envoi de FormContact.

Constat : frontend/src/components/common/Contact/FormContact.tsx déclare isSubmitting (ligne 26)
et le remet à false dans le finally (ligne 98), mais setIsSubmitting(true) n'est appelé NULLE
PART dans le fichier. Le bouton n'est donc jamais désactivé et n'affiche jamais « Envoi en
cours… ». Un double clic envoie deux fois le message.

Les trois autres formulaires (FormLogin.tsx:62, FormSubscribe.tsx:85, FormArticle.tsx:60) le font
correctement — prends-les comme référence, ne réinvente pas le pattern.

Si la tâche 4.1 a fait remonter isSubmitting dans hooks/useForm.ts, cette correction se règle
dans le hook et disparaît du composant : vérifie-le d'abord avant d'éditer FormContact.

Consulte `frontend-react-ts`. La skill `revue-avant-push` impose par ailleurs que chaque
formulaire remette isSubmitting à false dans un finally : vérifie que les quatre le font, pas
seulement celui-ci.
```

---

# Lot 5 — Authentification côté front

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — sécurité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche.

> **Dépendances : lot 4** (le socle des formulaires) **et 1.6** (l'endpoint de déconnexion).
> Aujourd'hui le front n'a **aucune notion d'utilisateur connecté** : pas d'état partagé, pas de
> déconnexion, pas de route protégée, et un refresh token stocké mais jamais lu.

## 5.1 — Centraliser l'état d'authentification

- [ ] **Fichiers** : `frontend/src/hooks/useAuth.ts` (à créer, nom à valider par l'inventaire),
  `frontend/src/lib/api.ts`, `frontend/src/App.tsx`
- **Constat** : la seule trace d'authentification est `localStorage.setItem("access", …)` dans
  `FormLogin.tsx:75` et `localStorage.getItem("access")` dans `api.ts:13`. Aucun composant ne sait
  si l'utilisateur est connecté.
- **Attendu** : un point unique qui répond « connecté ou non », consommable par la navigation et
  les pages.

```
Objectif : donner au front une notion d'utilisateur connecté, qu'il n'a pas du tout aujourd'hui.

Constat :
- frontend/src/components/common/Login/FormLogin.tsx:75-76 écrit access et refresh dans
  localStorage ;
- frontend/src/lib/api.ts:13 relit access ;
- entre les deux, RIEN. Aucun composant ne sait si l'utilisateur est connecté, aucune
  déconnexion n'existe, aucune route n'est protégée.

Travail demandé :

1. Déroule `inventaire-avant-dev` (étapes 1 à 3) sur : hooks/, lib/, types/, App.tsx et les
   composants de navigation. Le seul hook existant est useTheme.ts — lis-le, il montre la
   convention du projet pour un hook qui synchronise un état React avec localStorage. Le tableau
   de verdict est obligatoire avant toute création.

2. Consulte `frontend-react-ts`.

3. Plan avant code, traitant explicitement :
   - hook seul ou hook + contexte React ? Plusieurs composants éloignés en ont besoin (NavBar,
     Blog, futures routes protégées) : tranche et argumente, ne liste pas les deux ;
   - où vivent les clés localStorage ("access", "refresh") : elles sont aujourd'hui écrites en dur
     dans deux fichiers différents. Centralise-les ;
   - lib/api.ts doit rester le SEUL point d'appel réseau (règle du projet) : le hook ne fait pas
     de fetch lui-même ;
   - quelles informations sont exposées : un booléen suffit-il, ou faut-il l'email de
     l'utilisateur ? Attention : l'API n'expose actuellement AUCUN endpoint « profil / me ». Si
     tu en veux un, c'est un ajout backend à me proposer explicitement, pas à glisser en douce ;
   - le cas du premier chargement : la page se monte avant de savoir si le jeton est valide.

4. Branche FormLogin.tsx dessus : il ne doit plus écrire dans localStorage directement.

Ne traite dans cette tâche NI le rafraîchissement du jeton (5.2), NI la déconnexion (5.3), NI la
protection des routes (5.4). Cette tâche pose seulement le socle.
```

## 5.2 — Rafraîchir le jeton expiré dans `apiFetch`

- [ ] **Fichiers** : `frontend/src/lib/api.ts`, `frontend/src/hooks/useAuth.ts`
- **Constat** : le refresh token est stocké (`FormLogin.tsx:76`) puis **jamais relu**. L'endpoint
  `/api/auth/login/refresh/` existe pourtant (`accounts/urls.py:13`). Au bout d'une heure
  (`ACCESS_TOKEN_LIFETIME`), chaque appel authentifié part en 401 silencieux, sans message et sans
  redirection.
- **Attendu** : l'expiration est rattrapée de façon transparente ; un refresh mort déconnecte
  proprement.
- **Dépend de** : 5.1, et de la décision prise en 1.6 sur la rotation

```
Objectif : utiliser le refresh token, aujourd'hui stocké puis jamais relu.

Constat :
- frontend/src/components/common/Login/FormLogin.tsx:76 stocke le refresh token ;
- aucun fichier ne le relit jamais ;
- l'endpoint existe pourtant : backend/accounts/urls.py:13 monte TokenRefreshView sur
  /api/auth/login/refresh/ ;
- ACCESS_TOKEN_LIFETIME vaut 60 minutes (config/settings/base.py:248). Au-delà, chaque appel
  authentifié part en 401 sans message ni redirection.

Travail demandé :

1. Relis d'abord lib/api.ts en entier : apiFetch est le SEUL point d'appel réseau du projet, la
   logique de rafraîchissement doit y vivre et nulle part ailleurs.

2. Vérifie ce que la tâche 1.6 a décidé côté backend : si ROTATE_REFRESH_TOKENS est activé,
   l'appel de refresh renvoie AUSSI un nouveau refresh token, qu'il faut stocker. Si la rotation
   n'a pas été retenue, seul l'access token change. Adapte-toi à ce qui a réellement été livré,
   ne suppose pas.

3. Consulte `frontend-react-ts`, puis présente le plan avant d'écrire, traitant :
   - la détection : on tente le refresh sur un 401, mais pas sur les 401 de l'endpoint de
     connexion lui-même, sinon on boucle. Comment distingues-tu les deux ?
   - la boucle infinie : un refresh qui échoue ne doit pas rappeler apiFetch qui rappelle le
     refresh. Décris ta garde ;
   - les appels concurrents : plusieurs requêtes peuvent recevoir un 401 en même temps et lancer
     chacune leur refresh. Traite le cas ou dis-moi explicitement que tu l'acceptes et pourquoi ;
   - l'échec définitif : refresh expiré ou invalidé → purge du stockage et redirection vers
     /login. apiFetch ne connaît pas le routeur : dis comment tu t'y prends proprement.

Critère d'acceptation : avec un access token expiré et un refresh valide, un appel à
/api/articles/ en création réussit sans que l'utilisateur ait à se reconnecter.
```

## 5.3 — Déconnexion et navigation conditionnelle

- [ ] **Fichiers** : `NavBar.tsx`, `MobileMenu.tsx`, `frontend/src/hooks/useAuth.ts`
- **Constat** : il n'existe **aucun moyen de se déconnecter**. `NavBar.tsx:81-87` affiche
  « Se connecter » et « Nous rejoindre » en permanence, y compris pour un utilisateur déjà
  connecté. Rien ne vide jamais `localStorage`.
- **Attendu** : la navigation reflète l'état de connexion, et la déconnexion invalide le jeton
  côté serveur.
- **Dépend de** : 5.1, 1.6

```
Objectif : ajouter la déconnexion et rendre la navigation consciente de l'état de connexion.

Constat :
- aucun moyen de se déconnecter n'existe dans tout le front (aucune occurrence de logout,
  removeItem ou équivalent) ;
- frontend/src/components/common/Navigation/NavBar.tsx:81-87 affiche « Se connecter » et « Nous
  rejoindre » en permanence, même pour un utilisateur connecté ;
- MobileMenu.tsx:57-71 fait pareil.

Travail demandé :

1. Déroule `inventaire-avant-dev` sur les composants de navigation. Attention : NavBar,
   DesktopNav et MobileMenu se partagent déjà le type NavItem (types/navigation.ts) et les
   handlers passés en props. Comprends cette répartition AVANT de la modifier, et respecte-la —
   NavBar détient l'état, les deux autres l'affichent.

2. Consulte `frontend-react-ts`.

3. Plan avant code, traitant :
   - ce qu'affiche la navigation quand l'utilisateur est connecté (à minima un bouton de
     déconnexion à la place des deux liens actuels) ;
   - la cohérence desktop / mobile : les deux menus doivent afficher la même chose. Attention, ils
     divergent déjà aujourd'hui, c'est la tâche 7.1 ;
   - l'appel à l'endpoint de déconnexion livré en 1.6, qui invalide le refresh token côté serveur.
     Il passe par lib/api.ts comme tout appel réseau ;
   - ce qui se passe si cet appel échoue : le stockage local doit être purgé QUAND MÊME, sinon
     l'utilisateur reste bloqué en état connecté ;
   - la redirection après déconnexion ;
   - réutilise le composant Button existant (components/ui/Button/MainButton.tsx, qui exporte
     `Button`) ou les classes CSS de navigation existantes, ne crée pas un bouton maison.

Critère d'acceptation : après déconnexion, la navigation réaffiche « Se connecter », et une
requête authentifiée échoue.
```

## 5.4 — Protéger la création d'article

- [ ] **Fichiers** : `frontend/src/pages/Blog/Blog.tsx`, `frontend/src/App.tsx`
- **Constat** : `Blog.tsx:37-43` affiche le bouton « Crée un articles » (faute de français au
  passage) à **tout visiteur**, connecté ou non. Un visiteur anonyme ouvre la modale, remplit le
  formulaire, et l'API répond 401 — que `FormArticle.tsx:74` avale dans un `console.error`.
- **Attendu** : l'action n'est proposée qu'aux utilisateurs connectés, et le libellé est correct.
- **Dépend de** : 5.1, 4.2

```
Objectif : ne proposer la création d'article qu'aux utilisateurs connectés.

Constat :
- frontend/src/pages/Blog/Blog.tsx:37-43 affiche le bouton « Crée un articles » à tout visiteur ;
- le libellé lui-même est fautif : « Crée un articles » → « Créer un article » ;
- un visiteur anonyme peut donc ouvrir la modale, remplir le formulaire et déclencher un 401 que
  FormArticle.tsx:74 avale silencieusement.

Côté API le comportement est correct et ne doit pas changer : ArticleViewSet combine
IsAuthenticatedOrReadOnly et IsOwnerOrReadOnly — la lecture reste publique, seule l'écriture est
fermée. C'est le front qui ment sur ce qui est possible.

Travail demandé :

1. Consulte `frontend-react-ts`, et appuie-toi sur l'état d'authentification livré en 5.1.

2. Propose un plan qui tranche entre :
   - masquer le bouton pour un visiteur anonyme,
   - ou l'afficher en invitant à se connecter (lien vers /login).
   Donne-moi ta recommandation argumentée du point de vue de l'utilisateur, pas les deux options.

3. Pendant que tu es dans ce fichier, la skill `revue-avant-push` demande de traiter les cas
   limites : Blog.tsx n'affiche rien de particulier quand la liste d'articles est VIDE, et
   n'affiche aucune erreur si le chargement échoue (ligne 18, `.catch(console.error)`). Traite
   les deux, en réutilisant le pattern d'affichage d'erreur retenu en 4.2.

4. Regarde aussi si une route protégée générique (un composant de garde) est justifiée pour la
   suite du projet, ou si c'est prématuré ici. Dis-moi franchement.

Ne modifie pas FormArticle.tsx dans cette tâche au-delà de ce que 4.1 et 4.2 ont déjà fait.
```

---

# Lot 6 — Pagination bout en bout

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — optimisation |

**Grain de ticket** : ticket unique — 6.1 est atomique par construction, 6.2 en découle.

> **Dépendances : lots 2, 3 et 5.**
> ⚠️ Cette tâche **change le contrat de l'API** : la réponse de `/api/articles/` passe d'un
> tableau à un objet `{count, next, previous, results}`. Backend et front doivent donc bouger
> **dans la même branche**, sans quoi la liste d'articles se vide sans un mot.

## 6.1 — Paginer `/api/articles/` et adapter le front

- [ ] **Fichiers** : `backend/config/settings/base.py`, `backend/articles/views.py`,
  `frontend/src/pages/Blog/Blog.tsx`, `frontend/src/lib/api.ts`, `frontend/src/types/article.ts`
- **Constat** : `/api/articles/` renvoie **toute la table** à chaque appel. `Card.tsx:25`
  télécharge le contenu entier de chaque article pour n'en afficher que 100 caractères.
  Côté front, `Blog.tsx:18` type la réponse `apiFetch<Article[]>` : l'activation de la pagination
  casse cette ligne.
- **Attendu** : liste paginée, front adapté, aucun écran vide.

```
Objectif : paginer la liste des articles, côté API ET côté front, dans la même branche.

⚠️ Cette tâche change le contrat de l'API. Aujourd'hui GET /api/articles/ renvoie un tableau JSON
brut ; avec la pagination DRF il renverra {count, next, previous, results}. Le front consomme la
forme actuelle en frontend/src/pages/Blog/Blog.tsx:18 (`apiFetch<Article[]>("/articles/")`).
Livrer le backend seul viderait la page Blog sans le moindre message d'erreur.

Constat complémentaire : frontend/src/components/common/Blog/Card.tsx:25 télécharge le contenu
COMPLET de chaque article pour n'en afficher que les 100 premiers caractères.

Travail demandé :

1. Déroule `inventaire-avant-dev` sur les deux côtés : ce qui existe dans lib/api.ts, dans
   types/article.ts, et ce que consomme Blog.tsx. Tableau de verdict obligatoire.

2. Consulte `backend-django-drf` puis `frontend-react-ts`.

3. Plan avant code, traitant explicitement :
   - le choix de la classe de pagination DRF et la taille de page, argumentés ;
   - l'emplacement du réglage : REST_FRAMEWORK vit dans config/settings/base.py:231. Vérifie que
     l'activation ne casse aucun test du lot 2, qui suppose peut-être une réponse en tableau ;
   - le typage front : faut-il un type générique de réponse paginée dans types/ ? Propose-le,
     mais seulement si plus d'un endpoint en bénéficiera — sinon dis-le ;
   - Blog.tsx : lecture de `.results`, et décision sur la suite (bouton « charger plus »,
     pagination visible, ou simple première page pour l'instant). Tranche, ne liste pas ;
   - la sonde de santé : backend/healthcheck.py:17 interroge /api/articles/. Elle bénéficiera de
     la pagination, c'est la tâche 6.2 — signale l'interaction mais ne la traite pas ici ;
   - point bonus à me chiffrer, pas à décider seul : faut-il un serializer allégé pour la liste
     (titre + extrait) et le serializer complet pour le détail ? Ce serait le vrai gain de
     performance, mais c'est un changement de contrat supplémentaire.

Critère d'acceptation : la page /blog affiche toujours des articles après le changement, et
`curl /api/articles/` renvoie bien un objet paginé. Montre-moi les deux.
```

## 6.2 — Alléger la sonde de santé du conteneur

- [ ] **Fichiers** : `backend/healthcheck.py`
- **Constat** : `healthcheck.py:17` interroge `/api/articles/` **toutes les 30 secondes**, sur un
  endpoint non paginé qui lit toute la table. Le principe est bon — une sonde doit toucher la base,
  un Gunicorn debout devant une base morte répondrait quand même au TCP — mais le coût croît avec
  le nombre d'articles.
- **Attendu** : la sonde continue de lire la base, à coût constant.
- **Dépend de** : 6.1

```
Objectif : réduire le coût de la sonde de santé du conteneur backend.

Constat : backend/healthcheck.py:17 interroge http://127.0.0.1:8000/api/articles/ toutes les 30
secondes (HEALTHCHECK du Dockerfile). L'endpoint n'étant pas paginé, la sonde lit toute la table
à chaque passage.

Le PRINCIPE est bon et doit être préservé : la sonde vise volontairement un endpoint qui lit la
base, parce qu'un Gunicorn debout devant une base injoignable répondrait quand même au TCP. Le
fichier l'explique en tête, ne casse pas ce raisonnement — c'est le coût qu'il faut réduire, pas
la garantie.

Consulte la skill `conventions-docker` avant de toucher à ce fichier.

Une fois la tâche 6.1 livrée, la pagination rend possible un `?page_size=1`. Vérifie d'abord que
la classe de pagination retenue accepte ce paramètre côté client — certaines l'ignorent si
PAGE_SIZE_QUERY_PARAM n'est pas configuré. Lis la configuration réelle, ne la suppose pas.

Traite aussi :
- l'en-tête X-Forwarded-Proto que la sonde envoie déjà (ligne 27) et sa raison, expliquée dans le
  fichier : ne la supprime pas par mégarde ;
- le fait que 127.0.0.1 doit rester dans DJANGO_ALLOWED_HOSTS, sinon Django répond 400 et le
  conteneur est déclaré malade à tort.

Vérifie ensuite que le conteneur passe bien `healthy` :
`docker compose -f compose.dev.yaml up -d --wait` puis
`docker compose -f compose.dev.yaml ps`. Donne-moi la sortie.
```

---

# Lot 7 — Navigation, liens et pages manquantes

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — qualité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche.

> **Dépendances : lot 5** pour 7.1 (la navigation est retouchée en 5.3).
> Les autres tâches sont indépendantes et peuvent être prises à tout moment.

## 7.1 — « Nous rejoindre » du menu mobile mène au mauvais endroit

- [ ] **Fichiers** : `frontend/src/components/common/Navigation/MobileMenu.tsx`
- **Constat** : `MobileMenu.tsx:66` — le bouton « Nous rejoindre » pointe vers `/contact`, alors
  que la version desktop (`NavBar.tsx:85`) pointe vers `/subscribe`. Sur mobile, l'inscription est
  donc inatteignable depuis la navigation.
- **Attendu** : les deux menus proposent les mêmes destinations.

```
Objectif : corriger la divergence entre le menu mobile et le menu desktop.

Constat :
- frontend/src/components/common/Navigation/MobileMenu.tsx:66 — le bouton « Nous rejoindre »
  pointe vers /contact ;
- frontend/src/components/common/Navigation/NavBar.tsx:85 — le même bouton pointe vers
  /subscribe.
Sur mobile, l'inscription est donc inatteignable depuis la navigation.

Consulte `frontend-react-ts`, puis :

1. Corrige la destination.

2. Va plus loin que le symptôme : compare systématiquement les entrées du menu desktop
   (NavBar.tsx:78-88 + DesktopNav.tsx) et du menu mobile (MobileMenu.tsx:27-71), et liste-moi
   TOUTES les divergences avant de corriger. La cause de fond est que les deux menus dupliquent
   les liens d'action au lieu de les partager comme ils partagent déjà navItems (types/navigation.ts).

3. Dis-moi si tu recommandes de factoriser ces liens d'action de la même façon que navItems, ou
   si c'est prématuré. Recommandation argumentée. Attention : la tâche 5.3 modifie ces mêmes
   blocs pour la déconnexion — si elle est déjà livrée, aligne-toi sur ce qu'elle a posé plutôt
   que de le défaire.
```

## 7.2 — Remettre le footer dans le routeur

- [ ] **Fichiers** : `frontend/src/components/common/Footer.tsx`, `frontend/src/App.tsx`
- **Constat** : `Footer.tsx:85` utilise `<a href>` pour ses 16 liens. Résultat : même `/blog` et
  `/about`, qui existent, **rechargent toute l'application** au lieu de naviguer côté client. Pire,
  14 des 16 destinations (`/pricing`, `/overview`, `/help`, `/careers`…) **n'existent pas** et
  tombent sur la page 404.
- **Attendu** : plus aucun lien mort, plus aucun rechargement complet.

```
Objectif : corriger les liens du pied de page.

Deux problèmes distincts dans frontend/src/components/common/Footer.tsx :

1. Ligne 85 — les liens sont des `<a href>` et non des `<Link>` de react-router-dom. Même /blog
   et /about, qui existent bien dans App.tsx, provoquent un rechargement complet de
   l'application au lieu d'une navigation côté client.

2. Le tableau `columns` (lignes 19-56) déclare 16 liens dont la grande majorité pointe vers des
   routes qui n'existent pas : /pricing, /overview, /browse, /accessibility, /five,
   /solutions/*, /help, /tutorials, /press, /events, /careers. Toutes tombent sur NotFound.

Consulte `inventaire-avant-dev` (étape 1 suffit : la liste des routes de App.tsx) puis
`frontend-react-ts`.

Plan attendu :
- passage en <Link> pour toutes les destinations internes ;
- pour les 14 routes inexistantes, tranche et argumente : les retirer du footer, ou les garder en
  créant des pages « bientôt disponible ». Pour un site vitrine de démonstration, dis-moi ce que
  tu recommandes VRAIMENT, ne me renvoie pas la décision sans avis ;
- attention aux liens externes des réseaux sociaux (lignes 103-127) : ils doivent RESTER des <a>
  avec target="_blank" et rel — ne les convertis pas.

Vérifie aussi si le même problème existe ailleurs : cherche les <a href="/..."> dans tout
frontend/src.
```

## 7.3 — Les liens « conditions d'utilisation » et « confidentialité »

- [ ] **Fichiers** : `frontend/src/components/common/Subscribe/FormSubscribe.tsx`,
  `frontend/src/App.tsx`
- **Constat** : `FormSubscribe.tsx:182` et `:189` renvoient vers `/terms` et `/privacy`, qui
  n'existent pas. Un utilisateur qui veut lire ce qu'il accepte tombe sur une 404.
- **Attendu** : soit les pages existent, soit les liens disparaissent — pas de troisième voie.

```
Objectif : traiter les deux liens morts du formulaire d'inscription.

Constat : frontend/src/components/common/Subscribe/FormSubscribe.tsx:182 et :189 renvoient vers
/terms et /privacy, deux routes absentes de App.tsx. L'utilisateur à qui on demande d'accepter
des conditions tombe sur une 404 quand il veut les lire.

Consulte `inventaire-avant-dev` (liste des routes existantes) puis `frontend-react-ts`.

Deux issues possibles, tranche et argumente :
- créer deux pages minimales sous pages/ et les router — en réutilisant la structure des pages
  existantes (regarde pages/About.tsx pour le gabarit d'une page de contenu, et MainTitle pour le
  titre) ;
- ou retirer la mention si le projet ne prétend pas avoir de conditions.

Si tu crées les pages : le tableau de verdict de inventaire-avant-dev est obligatoire avant, et
elles doivent passer par MainLayout comme toutes les autres routes.

Signale-moi au passage tout autre lien vers une route inexistante que tu croiserais hors du
footer (traité en 7.2).
```

## 7.4 — `ArticleDetails` reste bloqué sur « Chargement… »

- [ ] **Fichiers** : `frontend/src/pages/Blog/ArticleDetails.tsx`
- **Constat** : `ArticleDetails.tsx:11-15` — le `.catch(console.error)` laisse `article` à `null`,
  donc un identifiant inexistant affiche **« Chargement… » indéfiniment**. Aucune protection non
  plus contre la condition de course si l'`id` change pendant une requête en vol.
- **Attendu** : trois états distincts — chargement, erreur, article — et pas de réponse périmée.

```
Objectif : corriger la page de détail d'un article.

Constat : frontend/src/pages/Blog/ArticleDetails.tsx:10-15.
- le `.catch(console.error)` laisse l'état `article` à null : un id inexistant (404) affiche donc
  « Chargement… » à l'infini, sans jamais dire ce qui s'est passé ;
- aucune garde contre la condition de course : si l'id change pendant qu'une requête est en vol,
  la réponse de l'ancien id peut écraser celle du nouveau ;
- useParams peut rendre un id undefined, ce qui n'est pas traité.

La skill `revue-avant-push` liste précisément ces cas limites (« useParams sans id », « chaque
appel apiFetch dans un try/catch ou suivi d'un .catch »).

Consulte `frontend-react-ts`, puis propose un plan traitant :
- les trois états à distinguer : chargement, erreur, succès ;
- le message d'erreur : réutilise le pattern retenu en 4.2, ne réinvente pas un affichage ;
- la condition de course : AbortController ou drapeau d'annulation dans le cleanup du useEffect —
  tranche et argumente ;
- le cas 404 spécifiquement : proposer un retour vers /blog est plus utile qu'un message sec ;
- l'id manquant.

Vérifie si le même pattern fragile existe dans pages/Blog/Blog.tsx:18 (`.catch(console.error)`) —
si la tâche 5.4 ne l'a pas déjà traité, signale-le.
```

---

# Lot 8 — Dédoublonnage de la couche UI

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — qualité |

**Grain de ticket** : ticket unique — trois refactorings de la même couche, 8.3 découle de 8.2.

> **Dépendances : lot 2** (les tests backend ne couvrent pas le front, mais le lot 4 a déjà
> stabilisé les formulaires qui consomment ces composants).
> Refactoring pur : **aucun comportement visible ne doit changer**.

## 8.1 — Extraire `cx()`

- [ ] **Fichiers** : `frontend/src/lib/cx.ts` (à créer, nom à valider par l'inventaire),
  `MainButton.tsx`, `Input.tsx`, `Textarea.tsx`, `LinkTitle.tsx`
- **Constat** : la fonction `cx()` est redéfinie **à l'identique quatre fois** —
  `MainButton.tsx:40`, `Input.tsx:29`, `Textarea.tsx:32`, `LinkTitle.tsx:24`. `CLAUDE.md` en
  annonce trois : il y en a quatre, et la skill `revue-avant-push` interdit explicitement une
  quatrième redéfinition.
- **Attendu** : une seule définition, quatre consommateurs.

```
Objectif : supprimer les quatre définitions identiques de la fonction cx().

Constat, ligne par ligne :
- frontend/src/components/ui/Button/MainButton.tsx:40
- frontend/src/components/ui/Input/Input.tsx:29
- frontend/src/components/ui/Input/Textarea.tsx:32
- frontend/src/components/ui/Title/LinkTitle.tsx:24

Les quatre corps sont identiques. CLAUDE.md n'en mentionne que trois : la documentation est en
retard sur le code, signale-le-moi. La skill `revue-avant-push` pose la règle « aucun cx()
redéfini une 4e fois ».

Travail demandé :

1. Déroule `inventaire-avant-dev` (étape 1) : où placer une fonction utilitaire pure et sans
   dépendance ? lib/ contient aujourd'hui uniquement api.ts. Attention à la règle du projet :
   components/ui/ est générique et réutilisable hors projet, components/common/ dès qu'on touche
   à lib/api.ts, un type métier ou react-router-dom. cx() ne touche à rien de tout ça. Produis le
   tableau de verdict et justifie l'emplacement retenu.

2. Consulte `frontend-react-ts`.

3. Extrais, puis remplace les quatre définitions par un import. Vérifie qu'aucun autre fichier ne
   réimplémente la même chose sous un autre nom (certains composants font
   `[...].join(" ")` en ligne : NavBar.tsx:55, MobileMenu.tsx:19, MainTitle.tsx:29,
   SecondTitle.tsx:44, Logo.tsx:20, FeatureBlock.tsx:57). Dis-moi s'ils doivent basculer aussi ou
   si c'est hors périmètre — recommandation, pas une question ouverte.

4. Mets à jour CLAUDE.md, qui annonce « trois composants ui/ » : après cette tâche, la
   duplication n'existe plus du tout.

Refactoring PUR : rien ne doit changer à l'écran. `npm run lint` et `npm run build` doivent
passer, donne-moi leur sortie.
```

## 8.2 — Fusionner `Input` et `Textarea`

- [ ] **Fichiers** : `frontend/src/components/ui/Input/Input.tsx`, `Textarea.tsx`, `index.ts`
- **Constat** : les deux composants sont **identiques à environ 90 %** : mêmes props (`label`,
  `error`, `helperText`, `required`, `variant`, `fullWidth`), même génération d'`id` par `useId`,
  même logique `aria-invalid` / `aria-describedby`, même rendu du message d'erreur et du texte
  d'aide. Seuls le tag rendu et la prop `minRows` diffèrent.
- **Attendu** : la logique commune vit à un seul endroit, l'API publique des deux composants ne
  change pas.

```
Objectif : supprimer la duplication entre Input et Textarea.

Constat : frontend/src/components/ui/Input/Input.tsx (104 lignes) et
frontend/src/components/ui/Input/Textarea.tsx (112 lignes) sont identiques à environ 90 % :
- mêmes props : label, error, helperText, required, variant, fullWidth ;
- même génération d'id via useId ;
- même calcul de hasError / hasSuccess ;
- même logique aria-invalid et aria-describedby ;
- même rendu du message d'erreur et du texte d'aide, mêmes classes CSS.
Seuls le tag rendu (input / textarea) et la prop minRows diffèrent.

⚠️ Contrainte forte : ces deux composants sont consommés par quatre formulaires
(FormContact, FormLogin, FormSubscribe, FormArticle) et par ForgotPassword.tsx, via l'index de
barrel `components/ui/Input/index.ts`. Leur API publique ne doit PAS changer : `import { Input,
Textarea } from ".../ui/Input"` doit continuer à fonctionner à l'identique.

Travail demandé :

1. Déroule `inventaire-avant-dev` et liste tous les consommateurs des deux composants avant de
   toucher quoi que ce soit.

2. Consulte `frontend-react-ts`.

3. Plan avant code. Tranche entre les approches (composant de champ englobant partagé, composant
   polymorphe via une prop `as`, ou extraction du seul habillage label/erreur/aide) et
   ARGUMENTE ton choix — n'expose pas trois options en me laissant décider. Le critère : la
   solution la plus lisible pour un projet pédagogique, pas la plus astucieuse.

4. Point à traiter explicitement : la tâche 8.3 propose de retirer forwardRef (inutile en React
   19). Si tu la traites en même temps, dis-le ; sinon garde forwardRef tel quel ici pour ne pas
   mélanger deux refactorings dans un même diff.

Refactoring PUR : aucun changement visible. Vérifie que les cinq consommateurs compilent
(`npm run build`) et que le lint passe. Donne-moi la sortie.
```

## 8.3 — Retirer `forwardRef` (React 19)

- [ ] **Fichiers** : `Input.tsx`, `Textarea.tsx`
- **Constat** : les deux composants utilisent `forwardRef` (`Input.tsx:37`, `Textarea.tsx:40`),
  avec le `displayName` que ce pattern impose. Depuis React 19, `ref` est une prop comme une
  autre : le wrapper est du code hérité de React 18.
- **Attendu** : composants en fonctions simples, `ref` reçue en prop.
- **À traiter avec** : 8.2 (mêmes fichiers) — ou juste après, jamais dans le même commit

```
Objectif : moderniser Input et Textarea pour React 19.

Constat :
- frontend/src/components/ui/Input/Input.tsx:37 et :106 — forwardRef + displayName ;
- frontend/src/components/ui/Input/Textarea.tsx:40 et :111 — idem.
Le projet est en React 19 (frontend/package.json : "react": "^19.2.0"), où ref est une prop
normale. Le wrapper forwardRef et le displayName qu'il impose sont du code hérité de React 18.

Avant de modifier : vérifie si un consommateur passe réellement une ref à ces composants
(grep sur `ref=` dans frontend/src). Si personne ne le fait, dis-le-moi — la question devient
alors de savoir s'il faut conserver le support des refs ou le retirer entièrement. Recommandation
argumentée.

Consulte `frontend-react-ts`.

Contrainte : cette tâche touche les mêmes fichiers que 8.2. Fais-la APRÈS, dans un commit
`refactor:` séparé — mélanger les deux rendrait le diff illisible.

Vérifie ensuite que `npm run build` (qui lance `tsc -b`) passe : c'est le typage qui prouve ici
que rien n'est cassé. Donne-moi la sortie.
```

---

# Lot 9 — Code mort et conventions

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 — qualité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche.

> **Dépendances : lots 4 à 8.** À faire en dernier, quand plus aucune tâche ne touche à ces
> fichiers — sinon on supprime ce qu'une autre branche est en train d'utiliser.

## 9.1 — Supprimer `articles.json` et le champ fantôme `coverImg`

- [ ] **Fichiers** : `frontend/src/data/articles.json`, `frontend/src/types/article.ts`,
  `frontend/src/components/common/Blog/Card.tsx`, `CLAUDE.md`
- **Constat** :
  - `src/data/articles.json` n'est plus importé nulle part (`CLAUDE.md` le documente comme mort) ;
  - `types/article.ts:8` déclare `coverImg?: string`, **qui n'existe pas** dans `ArticleSerializer`
    — le champ n'est jamais renvoyé par l'API ;
  - `Card.tsx:12` contient donc une branche `{article.coverImg && …}` qui ne s'exécute jamais.
- **Attendu** : le fichier mort disparaît, et le type décrit ce que l'API renvoie réellement.

```
Objectif : supprimer du code mort documenté comme tel.

Trois éléments liés :
1. frontend/src/data/articles.json — plus importé nulle part. CLAUDE.md le documente déjà comme
   mort (« ne pas le réactiver »). Un fichier mort se supprime, il ne se documente pas.
2. frontend/src/types/article.ts:8 — `coverImg?: string` est déclaré mais n'existe PAS dans
   backend/articles/serializers.py, dont les fields sont (id, title, content, author, created_at,
   updated_at). L'API ne renvoie donc jamais ce champ.
3. frontend/src/components/common/Blog/Card.tsx:12-18 — la branche `{article.coverImg && <img/>}`
   ne s'exécute jamais.

Travail demandé :

1. Vérifie par grep, avant de supprimer, qu'aucun import ne subsiste vers articles.json et
   qu'aucun autre fichier ne lit coverImg. Ne supprime rien sur la foi de la documentation.

2. Tranche sur coverImg et argumente : soit on retire le champ du type et la branche de Card
   (le plus honnête aujourd'hui), soit on l'implémente réellement côté API — ce qui est une
   fonctionnalité, pas un nettoyage, et devrait alors devenir une issue distincte. Donne-moi ta
   recommandation.

3. Mets à jour CLAUDE.md : la section « Pièges » mentionne ces deux points, ils n'auront plus
   lieu d'être. Consulte `style-documentation` pour la mise à jour.

4. Profite du passage pour vérifier s'il reste d'autres fichiers jamais importés dans
   frontend/src/ et signale-les-moi sans les supprimer d'office.
```

## 9.2 — Purger les classes CSS jamais utilisées

- [ ] **Fichiers** : `frontend/src/index.css`
- **Constat** : neuf classes définies dans `index.css` (793 lignes) et employées **nulle part**
  dans `src/` : `.btn-sm`, `.btn-lg`, `.card`, `.card-hover`, `.section-secondary`,
  `.smooth-scroll`, `.scrollbar-hide`, `.no-print`, `.text-accent-secondary`.
- **Attendu** : la feuille de style décrit ce que le projet utilise vraiment.

```
Objectif : nettoyer les classes CSS mortes de frontend/src/index.css (793 lignes).

Neuf classes sont définies et jamais utilisées dans src/ :
.btn-sm, .btn-lg, .card, .card-hover, .section-secondary, .smooth-scroll, .scrollbar-hide,
.no-print, .text-accent-secondary

Avant de supprimer quoi que ce soit :
1. Reverifie toi-même par grep, sur .tsx ET .ts ET index.html. Une classe peut être construite
   par concaténation et échapper à une recherche naïve — sois explicite sur ta méthode.
2. Distingue deux cas et traite-les différemment :
   - les classes réellement mortes, à supprimer ;
   - celles qui font partie d'un système cohérent dont une partie sert (.btn-sm et .btn-lg
     accompagnent .btn-primary/.btn-secondary/.btn-ghost qui, eux, sont utilisés ; le composant
     Button gère déjà ses propres tailles en Tailwind). Là, la question est de savoir si le
     système CSS et le composant Button font double emploi. Dis-moi ce que tu en penses.

Consulte `frontend-react-ts` pour la convention de thème du projet : les couleurs sont des
variables @theme dans index.css et chaque couleur claire a sa contrepartie dark-*. Ne supprime
AUCUNE variable de couleur, même apparemment inutilisée : elles forment un système documenté.

Le périmètre de cette tâche, ce sont les classes utilitaires et de composants, pas les variables.

Vérifie ensuite `npm run build` et regarde l'application dans le navigateur avant de conclure.
```

## 9.3 — Nettoyer les commentaires et la documentation de code

- [ ] **Fichiers** : `Blog.tsx`, les quatre formulaires, `components/ui/**`, `Footer.tsx`
- **Constat** :
  - `Blog.tsx:68` : `{/* Placeholder — le vrai formulaire viendra ici */}` placé **juste au-dessus
    du vrai formulaire** ; `Blog.tsx:58` : `{/* 4️⃣ Le bouton fermer */}` — traces de tutoriel ;
  - `// Clear error when user starts typing` répété dans les quatre formulaires, en anglais, et paraphrasant la ligne suivante ;
  - environ **43 lignes de JSDoc en anglais** dans `components/ui/` et `Footer.tsx`
    (« Props for the… », « Represents a single link… »), alors que le dépôt est intégralement en
    français.
- **Attendu** : plus une seule trace de tutoriel, plus un seul commentaire en anglais.

```
Objectif : mettre les commentaires du front en conformité avec les conventions du projet.

Le dépôt impose que TOUT soit rédigé en français : code, docstrings, commits, tickets. La skill
`commentaires-code` impose en plus des commentaires courts, qui disent le POURQUOI et non le
QUOI, avec un plafond de trois lignes, et la suppression des paraphrases, bannières décoratives,
code commenté et traces de conversation ou de tutoriel.

Constats :
1. frontend/src/pages/Blog/Blog.tsx:68 — « {/* Placeholder — le vrai formulaire viendra ici */} »
   est placé juste au-dessus du vrai formulaire, qui est bien là. Le commentaire est démenti par
   le code.
2. frontend/src/pages/Blog/Blog.tsx:58 — « {/* 4️⃣ Le bouton fermer */} » : numérotation de
   tutoriel.
3. « // Clear error when user starts typing » apparaît dans les quatre formulaires (FormContact,
   FormLogin, FormSubscribe, FormArticle) — en anglais, et il paraphrase le code juste en
   dessous. Note : si la tâche 4.1 a bien extrait useForm.ts, ces quatre-là ont déjà disparu ;
   vérifie avant d'agir.
4. Environ 43 lignes de JSDoc en anglais dans components/ui/ (Input, Textarea, MainTitle,
   SecondTitle, LinkTitle, Logo) et dans Footer.tsx : « Props for the… », « Represents a single
   link in the footer », « Display text for the link »…

Travail demandé :
1. Applique la skill `commentaires-code` sur tout frontend/src/ et rends-moi la liste de ce que
   tu comptes supprimer, traduire ou réécrire AVANT de le faire.
2. Pour les JSDoc : la question n'est pas seulement la langue. Beaucoup paraphrasent le type
   TypeScript juste en dessous (« /** URL for the link */ href: string »). Ces commentaires-là
   ne se traduisent pas, ils se suppriment. Distingue les deux cas.
3. Consulte `style-documentation` pour ce qui relève des docstrings plutôt que des commentaires.

Ne touche pas au backend dans cette tâche : ses commentaires sont déjà en français et de bonne
qualité.
```

## 9.4 — Contenu de remplissage

- [ ] **Fichiers** : `frontend/src/pages/About.tsx`, `frontend/src/components/common/Home/Slider.tsx`,
  `frontend/src/components/common/Home/HeroBanner.tsx`, `FeatureBlock` (via `Home.tsx`)
- **Constat** :
  - `About.tsx` : le même paragraphe est répété **trois fois**, dont deux dans le même bloc ;
  - `Slider.tsx:43-63` : trois slides affichant **la même image** ;
  - `Home.tsx:44` : une description tronquée en plein milieu (« Chaque semaine, nous analysons les
    nouveautés du web... ») ;
  - `HeroBanner.tsx:29-34` : deux boutons d'appel à l'action sans aucun `onClick` ni lien.
- **Attendu** : le site vitrine ne montre plus de contenu manifestement provisoire.

```
Objectif : remplacer le contenu de remplissage visible du site vitrine.

Constats :
1. frontend/src/pages/About.tsx — le même paragraphe (« Nous sommes passionnés par le
   développement web… ») est répété trois fois, dont deux fois d'affilée dans le même bloc.
2. frontend/src/components/common/Home/Slider.tsx:43-63 — les trois slides affichent la MÊME
   image (ImageBanner), avec le même alt.
3. frontend/src/pages/Home.tsx:44 — la description du second FeatureBlock est tronquée en plein
   milieu : « Chaque semaine, nous analysons les nouveautés du web... ».
4. frontend/src/components/common/Home/HeroBanner.tsx:29-34 — les deux boutons « Découvrir les
   articles » et « S'abonner à la newsletter » n'ont ni onClick ni lien : ils ne font rien.

Consulte `frontend-react-ts`.

Travail demandé :
1. Pour les points 1 à 3, c'est du contenu : propose-moi des textes, je validerai. Ne réécris pas
   la structure des composants, elle est correcte.
2. Pour le point 4, c'est du comportement : « Découvrir les articles » devrait mener à /blog.
   Attention, HeroBanner utilise MainButton (qui exporte `Button`), un <button> et non un lien —
   dis-moi comment tu t'y prends proprement (Link enveloppant, useNavigate, ou prop `as`),
   avec une recommandation. Pour la newsletter, aucune fonctionnalité d'abonnement n'existe côté
   API : dis-moi franchement si le bouton doit disparaître ou devenir une issue à part.
3. Pour le Slider : soit trois images distinctes, soit un slider à une slide, soit sa suppression.
   Recommande, ne me laisse pas la liste.

Cette tâche est la moins technique du plan mais la plus visible pour quelqu'un qui découvre le
site. Ne la bâcle pas.
```

---

# Lot 10 — Documentation et clôture

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À faire | — | — | Bloc 1 + 2 — documentation |

**Grain de ticket** : ticket unique — un seul livrable, la documentation à jour.

> **Dépendances : tous les lots précédents.**

## 10.1 — Consigner le piège `node_modules` et les écarts de `CLAUDE.md`

- [ ] **Fichiers** : `CLAUDE.md`, `README.md`
- **Constat** : `CLAUDE.md` recense « six pièges de la pile » Docker, mais pas celui qui bloque
  effectivement le poste de travail : le volume anonyme `/app/node_modules` de
  `compose.dev.yaml` crée côté hôte un dossier vide appartenant à `root`, ce qui fait
  échouer toute commande npm ultérieure. Le fichier annonce par ailleurs `cx()` « redéfini dans
  trois composants `ui/` » alors qu'il l'est dans quatre.
- **Attendu** : la documentation décrit le dépôt tel qu'il est après les lots 0 à 9.

```
Objectif : remettre CLAUDE.md et le README en accord avec le dépôt.

Écarts relevés pendant la revue :
1. CLAUDE.md liste « six pièges de la pile » Docker mais omet celui qui bloque réellement le
   poste : le volume anonyme /app/node_modules de compose.dev.yaml fait créer par Docker, du
   côté HÔTE, un frontend/node_modules vide appartenant à root. Toute commande npm lancée ensuite
   depuis la machine échoue en EACCES. C'est un septième piège, au même titre que les six autres.
2. CLAUDE.md indique « cx(), redéfini dans trois composants ui/ » — il l'est dans quatre
   (MainButton, Input, Textarea, LinkTitle). Après la tâche 8.1, il ne l'est plus du tout.
3. CLAUDE.md documente src/data/articles.json et types/Article.coverImg comme des pièges. Après la
   tâche 9.1, ils n'existent plus.
4. CLAUDE.md indique « Les trois tests.py sont encore des stubs vides ». Après le lot 2, c'est faux.

Consulte la skill `style-documentation` avant d'écrire.

Travail demandé :
1. Relis CLAUDE.md ligne à ligne contre l'état réel du dépôt après les lots 0 à 9, et liste-moi
   TOUS les écarts avant de corriger — pas seulement les quatre ci-dessus.
2. Décide, pour chaque piège Docker, s'il relève de CLAUDE.md, du README, ou des deux : le README
   s'adresse à un humain qui installe le projet, CLAUDE.md à un agent qui code dedans.
3. Rappel : CLAUDE.md n'est PAS versionné (il est dans .gitignore), le README l'est. Un piège que
   la personne suivante doit connaître pour installer le projet a donc sa place dans le README.

Ne réécris pas ce qui est juste : ces deux fichiers sont d'excellente qualité, la tâche est une
mise à jour ciblée, pas une refonte.
```

## 10.2 — Mettre à jour `AMELIORATIONS.md` et le `README`

- [ ] **Fichiers** : `AMELIORATIONS.md`, `README.md`
- **Constat** : `AMELIORATIONS.md` ne contient qu'une seule entrée — les toasts — traitée par la
  tâche 4.2. Le README ne mentionne ni la configuration email (tâche 1.1), ni les quotas
  (tâche 1.5), ni la façon de lancer la suite de tests désormais non vide.
- **Attendu** : les deux fichiers décrivent le projet livré.

```
Objectif : mettre la documentation à jour après les corrections.

Constats :
1. AMELIORATIONS.md ne contient qu'une entrée — les toasts de succès / d'erreur — qui est traitée
   par la tâche 4.2 de correction.md. Elle doit être retirée ou marquée comme faite.
2. Le README ne mentionne pas les nouvelles variables d'environnement introduites par les lots 1
   (configuration email, quotas de throttling) alors que le projet impose que toute variable lue
   par le code figure dans le .env.example correspondant — et le README documente déjà les quatre
   valeurs exigées par la pile de production.
3. Le README décrit la commande de test, mais la suite était vide : maintenant qu'elle ne l'est
   plus, vérifie que les instructions (PostgreSQL joignable, variables POSTGRES_*) sont exactes
   et suffisantes pour quelqu'un qui clone le dépôt.

Consulte la skill `style-documentation`.

Travail demandé :
1. Passe en revue le README section par section contre l'état réel du dépôt et liste-moi les
   écarts avant de corriger.
2. Vide AMELIORATIONS.md de ce qui a été livré, et propose-moi d'y verser ce que le plan de
   correction a délibérément laissé de côté (par exemple : le serializer allégé pour la liste
   d'articles évoqué en 6.1, l'endpoint « profil » évoqué en 5.1, les images de couverture
   d'articles évoquées en 9.1). Le fichier retrouve ainsi son rôle : ce qui est repéré mais pas
   fait.
3. Vérifie que .env.example (racine) et frontend/.env.example listent bien CHAQUE variable lue
   par le code après les corrections. C'est une règle explicite du projet.
```

## 10.3 — Revue finale et clôture

- [ ] **Fichiers** : l'ensemble du diff
- **Attendu** : un verdict `OK` sur les six axes, puis les issues fermées à la main.

```
Objectif : revue finale avant la mise en preprod de l'ensemble des corrections.

Déroule intégralement la skill `revue-avant-push` sur le cumul des branches livrées, et rends le
rapport BLOQUANT / À CORRIGER / OK sur les six axes : correction, duplication, sécurité,
performance, bonnes pratiques, build/lint/tests.

Points à vérifier spécifiquement, parce que ce sont les régressions les plus probables de ce
plan :
- aucune vue DRF publique n'a perdu sa permission explicite (le défaut global est
  IsAuthenticated : l'oubli ferme l'endpoint en silence) ;
- l'API ne renvoie plus jamais uid ni token sur la réinitialisation, et un test le prouve ;
- la pagination (lot 6) n'a laissé aucun consommateur front sur l'ancienne forme de réponse ;
- aucun `console.log` nulle part ;
- `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test` passe — montre la sortie ;
- `npm run lint` et `npm run build` passent — montre la sortie ;
- `python manage.py check --deploy` ne remonte rien de nouveau ;
- les deux piles démarrent toujours, tous services `healthy` :
  `docker compose -f compose.dev.yaml up -d --wait` et
  `docker compose -f compose.prod.yaml up -d --wait --wait-timeout 60`.

Ensuite seulement, consulte `workflow-git` pour la marche à suivre : PR vers preprod, et
FERMETURE MANUELLE des issues — `Closes #N` ne les ferme pas au merge dans preprod, GitHub ne
l'applique qu'à la branche par défaut. C'est ce qui a laissé les issues #48 et #49 ouvertes après
livraison.

Cette skill ne pousse jamais rien : elle lit et elle rapporte. Le push reste ma décision.
```

---

## Récapitulatif des tâches

| # | Tâche | Gravité | Dépend de | Alimente |
|---|---|---|---|---|
| 0.1 | Reprendre la main sur `frontend/node_modules` | Bloquant outillage | — | — |
| 0.2 | Vulnérabilités npm (`vite`) | Moyen | 0.1 | Bloc 1 — sécurité |
| 1.1 | **Réinitialisation : ne plus renvoyer le jeton** | **Critique** | 0 | Bloc 1 — sécurité |
| 1.2 | Énumération de comptes | Élevé | 1.1 | Bloc 1 — sécurité |
| 1.3 | Validateurs de mot de passe non appliqués | Élevé | — | Bloc 1 — sécurité |
| 1.4 | Admin : mot de passe modifiable en clair | Élevé | — | Bloc 1 — sécurité |
| 1.5 | Aucune limitation de débit | Élevé | 1.1 | Bloc 1 — sécurité |
| 1.6 | Rotation et invalidation des JWT | Moyen | 1.1 | Bloc 1 — sécurité |
| 2.1 | Tests `accounts` | Structurant | 1 | Bloc 1 — qualité |
| 2.2 | Tests `articles` (propriété) | Structurant | 1 | Bloc 1 — qualité |
| 2.3 | Tests `contact` | Structurant | 1 | Bloc 1 — qualité |
| 3.1 | N+1 sur la liste des articles | Performance | 2 | Bloc 1 — optimisation |
| 3.2 | Utilisateur créé en deux écritures | Faible | 2 | Bloc 1 — optimisation |
| 3.3 | `Contact` sans horodatage | Moyen | 2 | Bloc 1 — qualité |
| 3.4 | `apps.py` et import mort | Faible | 2 | Bloc 1 — qualité |
| 4.1 | **Extraire `hooks/useForm.ts`** | Duplication | 0 | Bloc 1 — qualité |
| 4.2 | **Erreurs API jamais affichées** | Élevé (UX) | 4.1 | Bloc 1 — qualité |
| 4.3 | Nom et prénom inversés | Élevé (données) | 4.1 | Bloc 1 — qualité |
| 4.4 | `isSubmitting` jamais activé (contact) | Moyen | 4.1 | Bloc 1 — qualité |
| 5.1 | Aucun état d'authentification | Structurant | 4 | Bloc 1 — sécurité |
| 5.2 | Refresh token jamais utilisé | Élevé (UX) | 5.1, 1.6 | Bloc 1 — sécurité |
| 5.3 | Aucune déconnexion | Élevé | 5.1, 1.6 | Bloc 1 — sécurité |
| 5.4 | Création d'article offerte aux anonymes | Moyen | 5.1, 4.2 | Bloc 1 — sécurité |
| 6.1 | Pagination bout en bout | Performance | 2, 3, 5 | Bloc 1 — optimisation |
| 6.2 | Sonde de santé non paginée | Faible | 6.1 | Bloc 1 — optimisation |
| 7.1 | « Nous rejoindre » mobile → `/contact` | Moyen | 5.3 | Bloc 1 — qualité |
| 7.2 | Footer hors routeur, 14 liens morts | Moyen | — | Bloc 1 — qualité |
| 7.3 | `/terms` et `/privacy` inexistantes | Faible | — | Bloc 1 — qualité |
| 7.4 | `ArticleDetails` bloqué sur « Chargement… » | Moyen | 4.2 | Bloc 1 — qualité |
| 8.1 | `cx()` redéfini quatre fois | Duplication | 4 | Bloc 1 — qualité |
| 8.2 | `Input` et `Textarea` identiques à 90 % | Duplication | 4 | Bloc 1 — qualité |
| 8.3 | `forwardRef` inutile en React 19 | Legacy | 8.2 | Bloc 1 — qualité |
| 9.1 | `articles.json` et `coverImg` morts | Code mort | 4-8 | Bloc 1 — qualité |
| 9.2 | Neuf classes CSS mortes | Code mort | 4-8 | Bloc 1 — qualité |
| 9.3 | Commentaires de tutoriel et JSDoc anglais | Conventions | 4-8 | Bloc 1 — qualité |
| 9.4 | Contenu de remplissage visible | Moyen (vitrine) | — | Bloc 1 — qualité |
| 10.1 | `CLAUDE.md` et README en retard sur le code | Documentation | 0-9 | Bloc 1 + 2 — documentation |
| 10.2 | `AMELIORATIONS.md` et README | Documentation | 0-9 | Bloc 1 + 2 — documentation |
| 10.3 | Revue finale et fermeture des issues | Clôture | tout | Bloc 1 + 2 — documentation |

Trois tâches ne portent pas le bloc de leur lot : **0.2** est une remédiation de vulnérabilités
avec preuve avant/après ; **3.3** et **3.4** relèvent de la qualité dans un lot classé
optimisation.

---

## Ce qui n'est pas dans ce plan, et pourquoi

Ces points sont **délibérément laissés de côté** : ils fonctionnent, et les toucher ferait plus
de mal que de bien.

- **Toute la couche Docker** (Dockerfiles, `nginx.conf`, les deux fichiers Compose) : c'est la
  partie la plus solide du dépôt — multi-stage, non-root des deux côtés, sonde qui lit la base,
  entrypoint avec garde, `.dockerignore` qui met le `.env` hors contexte. Seules deux tâches y
  touchent, et par la marge (0.1 et 6.2).
- **Le découpage des settings Django** et les helpers `env_*` : l'absence volontaire de
  `SECRET_KEY` et de `DATABASES` dans `base.py` est un choix juste, documenté, à ne pas
  « corriger ».
- **Les réglages de sécurité de production** (`sslmode`, HSTS progressif,
  `SECURE_PROXY_SSL_HEADER` conditionné, publication sur `127.0.0.1`) : `check --deploy` ne
  remonte rien de réel.
- **Le modèle de permissions DRF** : défaut fermé, vues publiques explicites, auteur injecté dans
  `perform_create`. C'est le bon réflexe, il est déjà en place.
- **La séparation `ui/` vs `common/`** et le point d'appel réseau unique dans `lib/api.ts` : la
  règle est respectée partout, aucune exception trouvée.
- **L'accessibilité des composants `ui/`** (`aria-invalid`, `aria-describedby`, `useId`,
  `focus-visible`, `aria-label` sur chaque bouton icône) : au-dessus de ce qu'on voit
  habituellement, à préserver lors du refactoring du lot 8.
