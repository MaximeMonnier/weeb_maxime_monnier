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
- **Le nom du fichier est celui de son export** côté front, depuis l'issue #242 : un composant
  s'importe sous un seul nom, que grep retrouve.
- **Tout est rédigé en français** : code, commentaires, docstrings, commits, tickets.
- **Commentaires** : le *pourquoi*, jamais le *quoi*, trois lignes maximum (`commentaires-code`).
- **Documentation** : commenter seulement ce que le code ne peut pas dire. README et
  `CLAUDE.md` : seulement pour un changement de stack, de commande ou de structure. À partir du
  lot 12, cette règle l'emporte sur toute fin de prompt qui fait mettre à jour `CLAUDE.md`, le
  README ou `AMELIORATIONS.md`.
- **Avant chaque push** : dérouler `revue-avant-push`, qui rend un verdict
  `BLOQUANT / À CORRIGER / OK`.
- **Outillage** : `/plan-chapitre <lot>` pour créer les tickets du lot, puis `/ticket <n>` pour
  chaque issue. **Jamais `/ticket lot <n>`** : ce mode lit `plan.md`, un autre fichier, et ne
  déroule pas `inventaire-avant-dev`, que les prompts de ce fichier exigent.

---

## Vue d'ensemble

| Lot | Titre | Tâches | Pourquoi à cette place |
|---|---|---|---|
| 0 | Débloquer l'environnement de travail | 2 | Rien n'est vérifiable tant que le front ne s'installe pas |
| 1 | Sécurité de l'API — **bloquant** | 6 | Prise de contrôle de compte possible en production |
| 2 | Tests automatisés | 3 (+5) | Verrouille le lot 1 et protège tous les refactorings suivants |
| 3 | Qualité et performance de l'API | 4 | Corrections backend isolées, sans impact sur le contrat d'API |
| 4 | Socle des formulaires front | 4 (+2) | Une seule extraction règle quatre copier-coller à la fois |
| 5 | Authentification côté front | 4 | S'appuie sur le socle du lot 4 |
| 6 | Pagination bout en bout | 2 (+2) | Change le contrat d'API : après la stabilisation du front |
| 7 | Navigation, liens et pages manquantes | 4 | Corrections de surface, sans dépendance |
| 8 | Dédoublonnage de la couche UI | 5 | Refactoring pur, protégé par le lot 2 |
| 9 | Code mort et conventions | 4 | Nettoyage final, une fois que plus rien n'y touche |
| 10 | Finitions issues de la revue du 2026-10-01 | 6 | Ce que la revue de fin des lots 0 à 9 a encore trouvé |
| 11 | Couper ce qui pousse à documenter | 1 | Sinon les lots suivants rajoutent ce que le 13 retire |
| 12 | Corriger les causes dans le code | 4 | Chaque cause retirée supprime un piège à documenter |
| 13 | Régime : purge et contrôle | 4 | Purge sur l'état propre, puis une mesure pour qu'il le reste |
| 14 | Documentation et clôture | 3 | Consigne ce qui a été appris |
| 15 | Sécurité : dépendances et navigateur | 4 | Seul écart de sécurité de l'audit du 2026-10-05, et le moins cher à fermer |
| 16 | Données personnelles | 3 | `/privacy` promet ce que le code ne tient pas encore |
| 17 | Tests du front : combler les trous | 2 | Le filet avant de toucher aux formulaires d'article |
| 18 | Modifier et supprimer un article depuis le front | 2 | L'API le permet depuis le lot 2, le front ne l'offre pas |
| 19 | Livraison continue et mise en ligne | 4 | Rien n'est en ligne : condition des lots 20 et 21 |
| 20 | Surveillance et exploitation | 4 | N'a de sens qu'une fois le site en ligne |
| 21 | Finitions et clôture de l'audit | 2 | Vérifie que chaque écart de l'audit est fermé ou consigné |

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
  `npm run build` s'exécutent. Le piège est documenté (voir 14.1).

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
| Clos le 2026-09-07 — 1.2 pour moitié, le reste renvoyé | #65 | Lot 1 | Bloc 1 — sécurité |

**Grain de ticket** : epic + 6 sous-issues, une par tâche.

> **Dépendances : lot 0** (pour pouvoir vérifier le front après 1.1).
> ⚠️ **Ce lot corrige une prise de contrôle de compte exploitable sans aucun prérequis.**
> Rien d'autre ne doit être livré avant lui.

## 1.1 — Réinitialisation de mot de passe : ne plus renvoyer le jeton au client

- [x] **Fichiers** : `backend/accounts/views.py`, `backend/accounts/serializers.py`,
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

- [x] **Moitié réinitialisation livrée par l'issue #68** : le `404 "Aucun compte associé à cet
  email."` a disparu, la vue rend le même corps qu'un compte soit actif, inactif ou inconnu, et
  trois tests le verrouillent.
- [ ] **Moitié inscription non livrée** : l'`UniqueValidator` du champ `email` de
  `RegisterSerializer` nomme toujours l'adresse déjà prise. L'issue #79 pose un cache côté
  front — `FormSubscribe` ne relaie pas ce message — mais la réponse HTTP n'a pas bougé, et
  c'est elle qu'un script lit. L'epic #65 a été fermée le 2026-09-25 sans ce point, ses sept
  sous-issues étant livrées : **il ne vit plus qu'à `AMELIORATIONS.md`**, § « Backend —
  sécurité ».
- **Fichiers** : `backend/accounts/views.py`, `backend/accounts/serializers.py`
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

- [x] **Fichiers** : `backend/accounts/serializers.py`, `backend/accounts/validators.py`,
  `backend/config/settings/base.py`, `backend/accounts/tests.py`,
  `frontend/src/pages/ResetPassword.tsx`
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

- [x] **Livrée par l'issue #70** : `CustomUserAdmin` hérite de `UserAdmin`, dont les deux listes
  de champs sont réécrites — celles du paquet décrivent un modèle à `username`, que `CustomUser`
  n'a pas. `list_editable = ("is_active",)` est conservé. Trois tests.
- [x] **Fichiers** : `backend/accounts/admin.py`
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

- [x] **Livrée par l'issue #71** : `ScopedRateThrottle`, quatre scopes réglables par variable
  d'environnement. `LoginView` n'existe que pour porter le sien, `throttle_scope` étant un
  attribut de vue et celle de simplejwt étant importée. Quatre tests.
- [x] **Fichiers** : `backend/config/settings/base.py`, `backend/accounts/views.py`,
  `backend/contact/views.py`, `backend/config/settings/test.py`, `.env.example`
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

- [x] **Livrée par l'issue #72** : rotation, mise en liste noire après rotation, et l'app
  `token_blacklist` qui porte les tables — trois pièces qui n'ont de sens qu'ensemble.
  `ACCESS_TOKEN_LIFETIME` passe de 60 à 15 min et `POST /api/auth/logout/` est ouvert, pour la
  tâche 5.3. Quatre tests. Aucun écran du front ne l'appelle encore : consigné à
  `AMELIORATIONS.md`.
- [x] **Fichiers** : `backend/config/settings/base.py`, `backend/accounts/urls.py`
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
| Clos le 2026-09-08 — élargi au front et à la CI | #83 | Lot 2 | Bloc 1 — qualité |

**Grain de ticket** : epic + 3 sous-issues, une par app testée. **Livré en 8** : les cinq
dernières (#87 à #91) n'étaient pas au plan — voir 2.4 à 2.8.

> **Dépendances : lot 1.**
> `articles/tests.py` et `contact/tests.py` ne contiennent toujours qu'un
> `from django.test import TestCase` : aucune permission de propriété n'est vérifiée.
> `accounts/tests.py`, lui, a été écrit au fil du lot 1 — **un seul de ces tests aurait attrapé
> la faille 1.1**, ce qui est exactement l'argument de ce lot.
> Ce lot verrouille le lot 1 et protège tous les refactorings des lots 3 à 9.
>
> Rappel d'exécution : `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test`,
> avec un PostgreSQL joignable et les variables `POSTGRES_*` renseignées.

## 2.1 — Tests de l'app `accounts`

- [x] **Fichiers** : `backend/accounts/tests.py`
- **Constat** : le fichier n'est plus vide — le lot 1 y a laissé 25 tests, écrits comme verrous
  de ses propres corrections et non comme la suite demandée ici. Sont déjà couverts : le mot de
  passe faible refusé, la réponse sans `uid` ni `token`, l'identité des réponses pour un email
  inscrit et inconnu, le lien à usage unique, le hachage depuis l'admin, les quotas et la
  rotation des jetons. **Restent à écrire** les quatre cas d'inscription et de connexion :
  compte créé inactif, mot de passe absent de la réponse, compte inactif qui n'obtient pas de
  jeton, compte actif qui obtient `access` et `refresh`.
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

- [x] **Fichiers** : `backend/articles/tests.py`
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

- [x] **Fichiers** : `backend/contact/tests.py`
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

## 2.4 à 2.8 — Suite front et intégration continue (hors plan initial)

- [x] **Fichiers** : `frontend/vite.config.ts`, `frontend/src/lib/apiErrors.test.ts`,
  `frontend/src/lib/api.test.ts`,
  `frontend/src/components/common/Login/FormLogin.test.tsx`, `frontend/playwright.config.ts`,
  `frontend/tsconfig.e2e.json`, `frontend/e2e/connexion.spec.ts`, `.github/workflows/tests.yml`
- **Constat** : le plan ne prévoyait que le backend. Trois suites vertes n'empêchaient ni un
  refus d'API traduit de travers côté front — la partie que l'utilisateur lit — ni une
  régression fusionnée sans que personne n'ait rien lancé.
- **Livré** : #87 Vitest et la traduction des refus · #88 le point d'appel réseau · #89 le
  formulaire de connexion rendu · #90 le parcours de connexion en navigateur · #91 les deux
  suites en intégration continue.
- **Attendu** : atteint. Le front a 33 cas Vitest et 2 parcours Playwright, et toute pull
  request vers `preprod` ou `main` lance les suites d'elle-même.

---

# Lot 3 — Qualité et performance de l'API

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-09-09 | #105 | Lot 3 | Bloc 1 — optimisation |

**Grain de ticket** : epic + 4 sous-issues, une par tâche. **Livré tel quel** : #106, #107,
#108, #109 — aucune tâche ajoutée, aucune écartée.

> **Dépendances : lot 2** (les tests protègent ces changements).
> Aucune de ces tâches ne modifie le contrat d'API : le front n'a rien à adapter.

## 3.1 — Supprimer le N+1 sur la liste des articles

- [x] **Fichiers** : `backend/articles/views.py`
- **Constat** : `articles/views.py:11` — `Article.objects.all()` combiné au
  `StringRelatedField` sur `author` (`serializers.py:9`) déclenche **une requête par article**
  pour afficher l'email de l'auteur. 50 articles = 51 requêtes.
- **Attendu** : une seule requête, quel que soit le nombre d'articles.
- **Livré** : la vue, plus `backend/articles/admin.py`, hors plan — la question posée au point 3
  du prompt (« vérifie si le même problème existe ailleurs ») a sorti la liste de l'admin, qui
  partait en N+1 elle aussi. Les deux listes sont désormais gardées par un test chacune.

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

- [x] **Fichiers** : `backend/accounts/serializers.py`
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

- [x] **Fichiers** : `backend/contact/models.py`, `backend/contact/admin.py`,
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

- [x] **Fichiers** : `backend/contact/apps.py`, `backend/accounts/apps.py`,
  `backend/articles/apps.py`, `backend/articles/views.py`
- **Constat** :
  - `contact/apps.py:4` : la classe s'appelle `ContactesConfig` (faute de frappe) ;
  - aucune des trois apps ne déclare `default_auto_field` ; **le constat annonçait un écart
    avec les migrations, il n'y en avait pas** : sous Django 6.0.6, `DEFAULT_AUTO_FIELD` vaut
    déjà `BigAutoField`, et les trois migrations initiales posent bien un `BigAutoField`. La
    déclaration est une explicitation, pas une correction ;
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
| Clos le 2026-09-19 — élargi à la confirmation d'inscription et aux tests du socle | #116 | Lot 4 | Bloc 1 — qualité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche. 4.1 en premier. **Livré en 4, mais
pas les quatre prévues** : #117 (4.1) et #118 (4.3) ; **4.2 et 4.4 étaient déjà réglées** par
l'issue #79, le 2026-09-07, avant que l'epic ne soit écrite ; #119 et #120 se sont ajoutées en
chemin — voir 4.5 et 4.6.

> **Dépendances : lot 0.** Indépendant des lots 1 à 3, peut être mené en parallèle.
> ⚠️ **Traiter 4.1 en premier** : les trois autres tâches se règlent alors en un seul endroit
> au lieu de quatre. C'est tout l'intérêt de l'ordre.

## 4.1 — Extraire `hooks/useForm.ts`

- [x] **Fichiers** : `frontend/src/hooks/useForm.ts` (à créer),
  `FormContact.tsx`, `FormLogin.tsx`, `FormSubscribe.tsx`, `FormArticle.tsx`
- **Constat** : `handleChange`, le type `FormErrors` et le squelette de `validateForm` sont
  **copiés à l'identique dans quatre formulaires**. `CLAUDE.md` et la skill `revue-avant-push`
  posent déjà la règle : un 5ᵉ copier-coller est bloquant. Puisque les tâches 4.2, 4.3 et 4.4
  demandent de modifier les quatre, autant extraire maintenant — une correction au lieu de quatre.
- **Attendu** : un hook unique, les quatre formulaires branchés dessus, comportement inchangé.
- **Livré** : #117, sur **six** formulaires et non quatre — `pages/ForgotPassword.tsx` et
  `pages/ResetPassword.tsx` recopiaient le même `handleChange` sans que le plan les compte, et
  leur état scalaire est devenu un objet à une clé, seule forme que le hook sache indexer. Le
  regex d'adresse email est sorti ici plutôt que dans une tâche à part, dans
  `frontend/src/lib/validationRules.ts` : 4 `FormErrors`, 6 `handleChange` et 3 regex ramenés à
  1 chacun. `isSubmitting` est remonté dans le hook, ce qui a vidé la tâche 4.4 de son objet.

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

- [x] **Fichiers** : `frontend/src/hooks/useForm.ts`, les quatre formulaires,
  `frontend/src/lib/api.ts`
- **Constat** : les quatre formulaires se contentent d'un `console.error(err)`
  (`FormContact.tsx:96`, `FormLogin.tsx:79`, `FormSubscribe.tsx:99`, `FormArticle.tsx:74`).
  Mauvais mot de passe, compte non validé par l'admin, email déjà pris, article refusé faute de
  connexion : **à l'écran, rien ne se passe**. `FormContact` ne confirme pas non plus les succès.
  C'est le défaut le plus visible pour un utilisateur réel.
- **Attendu** : chaque échec produit un message lisible à l'écran, chaque succès une confirmation.
- **Dépend de** : 4.1
- **Livré hors lot** : l'issue #79 a créé `frontend/src/lib/apiErrors.ts` et branché les
  formulaires dessus le 2026-09-07, trois jours avant l'ouverture de l'epic — la tâche était
  sans objet quand le lot a démarré. Le seul succès qui manquait encore, celui de l'inscription, est
  devenu la tâche 4.5.

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

- [x] **Fichiers** : `FormContact.tsx`, `FormSubscribe.tsx`
- **Constat** : dans les deux formulaires, le champ `name="first_name"` porte le label
  **« Nom »** et le placeholder **« Dupont »**, tandis que `last_name` porte « Prénom » / « Jean »
  (`FormContact.tsx:109-130`, `FormSubscribe.tsx:113-134`). Les messages de `validateForm` sont
  inversés dans le même sens. **La base stocke donc le nom de famille dans `first_name`** — et les
  données déjà saisies sont fausses.
- **Attendu** : les labels correspondent aux champs, à l'écran comme en base.
- **Dépend de** : 4.1
- **Livré** : #118, sur les deux fichiers prévus et rien d'autre. Trois des quatre points du
  prompt se sont révélés sans objet — aucun `helperText` sur ces champs, aucun bloc à déplacer
  (`first_name` était déjà le champ de gauche, l'ordre se redresse du seul renommage), et
  l'inversion est absente de l'admin Django comme du parcours Playwright. **Aucune donnée à
  reprendre** : rien de ce qui est en base n'est venu de ces deux formulaires.

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

- [x] **Fichiers** : `FormContact.tsx`
- **Constat** : `FormContact.tsx:26` déclare `isSubmitting`, `:98` le remet à `false` dans le
  `finally` — mais **`setIsSubmitting(true)` n'est jamais appelé**. Le bouton n'est donc jamais
  désactivé, n'affiche jamais « Envoi en cours… », et un double clic crée un doublon en base. Les
  trois autres formulaires le font correctement.
- **Attendu** : le bouton est désactivé pendant l'envoi.
- **Dépend de** : 4.1 (si `isSubmitting` remonte dans le hook, la tâche disparaît d'elle-même)
- **Livré hors lot, puis rendu impossible** : l'issue #79 avait déjà posé le
  `setIsSubmitting(true)` manquant. La tâche 4.1 a ensuite fait remonter l'état d'envoi dans le
  hook, comme cette dépendance l'envisageait : aucun formulaire ne peut plus l'oublier.

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

## 4.5 et 4.6 — Confirmation d'inscription et tests du socle (hors plan initial)

- [x] **Fichiers** : `frontend/src/components/common/Subscribe/FormSubscribe.tsx`,
  `frontend/src/components/common/Subscribe/FormSubscribe.test.tsx`,
  `frontend/src/hooks/useForm.test.ts`, `AMELIORATIONS.md`
- **Constat** : deux trous que le plan ne voyait pas. `FormSubscribe.tsx:110` redirigeait vers
  `/login` dès le compte créé, alors que `RegisterSerializer` le crée inactif : l'inscription
  finissait sur un 401 que rien n'expliquait. Et le hook extrait en 4.1, socle des six
  formulaires, n'était éprouvé qu'au travers de deux d'entre eux, tous deux à champs courts.
- **Livré** : #119 la confirmation, annoncée dans une région `role="status"` sans quitter la
  page · #120 sept cas sur le hook seul, montés par `renderHook`.
- **Attendu** : atteint. Le front passe de 33 à 45 cas Vitest.

---

# Lot 5 — Authentification côté front

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-09-22 — backend touché, une demande de 5.4 renvoyée au lot 6 | #128 | Lot 5 | Bloc 1 — sécurité |

**Grain de ticket** : epic + 4 sous-issues, une par tâche. **Livré tel quel** : #129, #130,
#131, #132 — mais l'epic, qui annonçait « aucun fichier de `backend/` », en a touché sept (5.2),
et l'affichage d'une liste vide ou d'un échec de chargement, demandé en 5.4, est passé au lot 6.

> **Dépendances : lot 4** (le socle des formulaires) **et 1.6** (l'endpoint de déconnexion).
> Aujourd'hui le front n'a **aucune notion d'utilisateur connecté** : pas d'état partagé, pas de
> déconnexion, pas de route protégée, et un refresh token stocké mais jamais lu.

## 5.1 — Centraliser l'état d'authentification

- [x] **Fichiers** : `frontend/src/hooks/useAuth.ts` (à créer, nom à valider par l'inventaire),
  `frontend/src/lib/api.ts`, `frontend/src/App.tsx`
- **Constat** : la seule trace d'authentification est `localStorage.setItem("access", …)` dans
  `FormLogin.tsx:75` et `localStorage.getItem("access")` dans `api.ts:13`. Aucun composant ne sait
  si l'utilisateur est connecté.
- **Attendu** : un point unique qui répond « connecté ou non », consommable par la navigation et
  les pages.
- **Livré** : #129, sans `useAuth.ts` : `lib/tokens.ts`, seul module à toucher aux jetons, et
  `hooks/useIsAuthenticated.ts`, abonné par `useSyncExternalStore` — aucun contexte, `App.tsx`
  intact. Hors plan, `playwright.config.ts` lit `FRONTEND_PORT_DEV` au lieu d'un port en dur.

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

- [x] **Fichiers** : `frontend/src/lib/api.ts`, `frontend/src/hooks/useAuth.ts`
- **Constat** : le refresh token est stocké (`FormLogin.tsx:76`) puis **jamais relu**. L'endpoint
  `/api/auth/login/refresh/` existe pourtant (`accounts/urls.py:13`). Au bout d'une heure
  (`ACCESS_TOKEN_LIFETIME`), chaque appel authentifié part en 401 silencieux, sans message et sans
  redirection.
- **Attendu** : l'expiration est rattrapée de façon transparente ; un refresh mort déconnecte
  proprement.
- **Livré** : #130. Hors plan, deux corrections côté API : `login/refresh/` rend `401` et non
  `500` pour un compte supprimé, et les refus de simplejwt sortent en français
  (`backend/locale/`, `.mo` versionné). Le constat ci-dessous datait : le jeton d'accès valait
  déjà 15 minutes, pas 60.
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

- [x] **Fichiers** : `NavBar.tsx`, `MobileMenu.tsx`, `frontend/src/hooks/useAuth.ts`
- **Constat** : il n'existe **aucun moyen de se déconnecter**. `NavBar.tsx:81-87` affiche
  « Se connecter » et « Nous rejoindre » en permanence, y compris pour un utilisateur déjà
  connecté. Rien ne vide jamais `localStorage`.
- **Attendu** : la navigation reflète l'état de connexion, et la déconnexion invalide le jeton
  côté serveur.
- **Livré** : #131, `logout()` rangé dans `hooks/useIsAuthenticated.ts`. Hors plan, le menu
  mobile replié sort de la navigation au clavier (`inert`) : ses liens y restaient atteignables.
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

- [x] **Fichiers** : `frontend/src/pages/Blog/Blog.tsx`, `frontend/src/App.tsx`
- **Constat** : `Blog.tsx:37-43` affiche le bouton « Crée un articles » (faute de français au
  passage) à **tout visiteur**, connecté ou non. Un visiteur anonyme ouvre la modale, remplit le
  formulaire, et l'API répond 401 — que `FormArticle.tsx:74` avale dans un `console.error`.
- **Attendu** : l'action n'est proposée qu'aux utilisateurs connectés, et le libellé est correct.
- **Livré** : #132 — le visiteur voit un lien « Se connecter pour publier » à la place du
  bouton, le libellé est corrigé, et la page a son premier test. **Non livré** : la liste vide
  et l'échec de chargement (point 3 du prompt), que l'issue a renvoyés au lot 6 — voir 6.1.
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
| Clos le 2026-09-23 — 6.2 a quitté l'API au lieu de l'interroger, et a créé deux fichiers là où le plan n'en annonçait qu'un | #138 | Lot 6 | Bloc 1 — optimisation |

**Grain de ticket** : prévu en ticket unique, livré en **epic + 4 sous-issues**.
**Livré en avance, hors lot** : 6.1, par l'issue #111, ouverte le 2026-09-09 à la suite de #106.
L'epic #138 a donc porté 6.2 et les deux points que #111 n'avait pas pris, plus un cinquième
besoin qu'aucune des deux tâches ne prévoyait : de quoi peupler la base de développement, sans
quoi rien de tout cela ne se voyait à l'écran. **Livré tel quel** : #139 (commande de
peuplement), #140 (liste vide et échec de chargement), #141 (extrait), #142 (route de santé).

> **Dépendances : lots 2, 3 et 5.**
> ⚠️ Cette tâche **change le contrat de l'API** : la réponse de `/api/articles/` passe d'un
> tableau à un objet `{count, next, previous, results}`. Backend et front doivent donc bouger
> **dans la même branche**, sans quoi la liste d'articles se vide sans un mot.

## 6.1 — Paginer `/api/articles/` et adapter le front

- [x] **Fichiers** : `backend/config/settings/base.py`, `backend/articles/views.py`,
  `frontend/src/pages/Blog/Blog.tsx`, `frontend/src/lib/api.ts`, `frontend/src/types/article.ts`
- **Constat** : `/api/articles/` renvoie **toute la table** à chaque appel. `Card.tsx:25`
  télécharge le contenu entier de chaque article pour n'en afficher que 100 caractères.
  Côté front, `Blog.tsx:18` type la réponse `apiFetch<Article[]>` : l'activation de la pagination
  casse cette ligne.
- **Attendu** : liste paginée, front adapté, aucun écran vide.
- **Livré** : #111 — `PageNumberPagination` réglée dans `REST_FRAMEWORK`, pages de 12,
  `Meta.ordering` départagé par `-id` (migration `0002`), bouton « Voir plus d'articles » sur
  `/blog`. `Page<T>` reste local à `Blog.tsx`, son seul lecteur. **Non livré par #111**,
  repris dans le lot : l'affichage d'une liste vide et d'un échec de chargement, hérité de 5.4
  — #111 avait même posé un `console.error` de plus, retiré depuis, et c'est #140 qui l'a
  livré ; et le serializer allégé pour la liste, point bonus jamais chiffré — #141 l'a chiffré
  (une page de 12 passe de ~10 100 à 3 206 octets) et livré, extrait taillé en base par
  `Left("content", 100)`.

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

- [x] **Fichiers** : `backend/healthcheck.py` — **en réalité cinq**, dont deux créés :
  `backend/config/views.py`, `backend/config/tests.py`, `backend/config/urls.py` et le `README.md`
- **Constat** : `healthcheck.py:17` interroge `/api/articles/` **toutes les 30 secondes**, sur un
  endpoint non paginé qui lit toute la table. Le principe est bon — une sonde doit toucher la base,
  un Gunicorn debout devant une base morte répondrait quand même au TCP — mais le coût croît avec
  le nombre d'articles.
- **Attendu** : la sonde continue de lire la base, à coût constant.
- **Dépend de** : 6.1
- **État au 2026-09-22** : la liste étant paginée, la sonde lit un `COUNT` et 12 articles, et
  non plus toute la table — mais le `COUNT(*)` de PostgreSQL parcourt encore toutes les lignes.
  `?page_size=1` n'est **pas** accepté : #111 n'a pas posé de `page_size_query_param`, et en
  poser un laisserait tout client choisir sa taille de page, à borner alors par `max_page_size`.
- **Livré** : #142 — la sonde a **quitté l'API** au lieu d'y prendre un paramètre. Route `health/`
  servie par `config/views.py`, hors du préfixe `api/` que seul le nginx du serveur relaie, vue
  Django nue et non DRF — c'est ce qui la laisse hors du défaut `IsAuthenticated`, du jeton et
  des quotas. Un `SELECT 1`, `200` ou `503` sur `DatabaseError`. Trois cas dans `config/tests.py`,
  quatrième fichier de tests du backend. Deux corrections de fond au passage : la sonde passait
  **toutes les 5 secondes** et non 30, les deux fichiers Compose surchargeant l'`interval` du
  Dockerfile ; et la santé du conteneur ne dépend plus de la lecture publique du blog, qu'on
  pouvait fermer et rendre ainsi tous les conteneurs malades.

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

## 6.3 et 6.4 — Peupler la base et dire l'état de la liste (hors plan initial)

- [x] **Fichiers** : `backend/articles/management/commands/peupler_articles.py`,
  `backend/articles/tests.py`, `frontend/src/pages/Blog/Blog.tsx`,
  `frontend/src/pages/Blog/Blog.test.tsx`
- **Constat** : deux trous que le plan ne voyait pas. Rien ne permettait de **voir** la
  pagination : la base de développement contenait deux articles, et le dépôt n'avait aucun
  moyen de la peupler — avec des pages de 12, « Voir plus d'articles » ne s'affichait jamais.
  Et `Blog.tsx` n'affichait **rien** ni sur une liste vide ni sur un chargement refusé : le
  `catch` ne faisait qu'un `console.error`, posé par #111 lui-même. Cette seconde demande
  venait de 5.4, renvoyée au lot 6 par #132 et non reprise par #111.
- **Livré** : #139 une commande `peupler_articles` — 30 articles, auteur de démonstration
  inactif, `CommandError` avant toute écriture dès que `DEBUG` est faux · #140 une liste
  `null` tant que la première page n'est pas arrivée, donc distincte d'un blog vide, et un
  message d'échec rendu par `toFormErrors` et `ErrorAlert`, posé près du bouton qui l'a
  demandé.
- **Attendu** : atteint. Le backend passe de 65 à 70 cas, le front de 72 à 78.

---

# Lot 7 — Navigation, liens et pages manquantes

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-09-25 — quatre tâches prévues, cinq issues livrées : le pied de page remis sur les vraies routes s'est mis à contredire l'en-tête | #147 | Lot 7 | Bloc 1 — qualité |

**Grain de ticket** : prévu en epic + 4 sous-issues, une par tâche ; **livré en 5**.
**Livré tel quel** : #149 (pages légales), #150 (pied de page dans le routeur), #148 (menu
mobile), #151 (états de la page de détail). **#155 s'est ajoutée en cours de lot**, une
minute après le merge de #150 : le pied de page ne pouvait contredire l'en-tête qu'une fois
remis sur les vraies routes.

> **Dépendances : lot 5** pour 7.1 (la navigation est retouchée en 5.3).
> Les autres tâches sont indépendantes et peuvent être prises à tout moment.

## 7.1 — « Nous rejoindre » du menu mobile mène au mauvais endroit

- [x] **Fichiers** : `frontend/src/components/common/Navigation/MobileMenu.tsx`
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

- [x] **Fichiers** : `frontend/src/components/common/Footer.tsx`, `frontend/src/App.tsx`
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

- [x] **Fichiers** : `frontend/src/components/common/Subscribe/FormSubscribe.tsx`,
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

- [x] **Fichiers** : `frontend/src/pages/Blog/ArticleDetails.tsx`
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
| Clos le 2026-09-29 — cinq tâches prévues, six issues livrées : le grep de 8.5 ne voyait pas les assemblages écrits en gabarit de chaîne | #161 | Lot 8 | Bloc 1 — qualité |

**Grain de ticket** : prévu en ticket unique — trois refactorings de `ui/`, dont 8.3 qui découle
de 8.2 ; 8.4, qui déborde sur `common/` et ne dépend d'aucun des trois ; et 8.5, qui suit 8.1 et
touche les deux dossiers. **Livré en epic + 6 sous-issues** : la seule 8.5 en a demandé deux.

> **Dépendances : lot 2** (les tests backend ne couvrent pas le front, mais le lot 4 a déjà
> stabilisé les formulaires qui consomment ces composants).
> Refactoring pur : **aucun comportement visible ne doit changer**.

## 8.1 — Extraire `cx()`

- [x] **Fichiers** : `frontend/src/lib/cx.ts` (créé), `MainButton.tsx`, `Input.tsx`,
  `Textarea.tsx`, `LinkTitle.tsx` — livré par l'issue #162
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

- [x] **Fichiers** : `frontend/src/components/ui/Input/FormField.tsx` (créé), `Input.tsx`,
  `Textarea.tsx` — livré par l'issue #163 ; `index.ts` est resté inchangé, l'habillage étant
  interne au dossier
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

- [x] **Fichiers** : `Input.tsx`, `Textarea.tsx` — livré par l'issue #164 ; le support de `ref`
  est conservé en prop ordinaire, aucun consommateur n'en passant à ce jour
- **Constat** : les deux composants utilisent `forwardRef` (`Input.tsx:8`, `Textarea.tsx:13`),
  avec le `displayName` que ce pattern impose. Depuis React 19, `ref` est une prop comme une
  autre : le wrapper est du code hérité de React 18.
- **Attendu** : composants en fonctions simples, `ref` reçue en prop.
- **À traiter avec** : 8.2 (mêmes fichiers) — ou juste après, jamais dans le même commit

```
Objectif : moderniser Input et Textarea pour React 19.

Constat :
- frontend/src/components/ui/Input/Input.tsx:8 et :41 — forwardRef + displayName ;
- frontend/src/components/ui/Input/Textarea.tsx:13 et :47 — idem.
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


## 8.4 — Factoriser les libellés de navigation

- [x] **Fichiers** : `NavBar.tsx`, `MobileMenu.tsx`, `Footer.tsx` — livré par l'issue #165. La
  source unique est `frontend/src/lib/navigation.ts` ; `types/navigation.ts` n'a pas bougé, son
  `NavItem` typant les cinq couples depuis sa variante `route`
- **Constat** : deux couples libellé/destination sont écrits dans **trois** fichiers —
  « Se connecter » → `/login` et « Nous rejoindre » → `/subscribe`, que `NavBar.tsx`,
  `MobileMenu.tsx` et `Footer.tsx` recopient chacun. Trois autres le sont dans **deux** :
  « Blog » → `/blog`, « À propos de nous » → `/about` et « Contact » → `/contact`, que
  `navItems` porte déjà pour les deux menus mais que le pied de page réécrit. Cette redite a
  déjà coûté deux défauts : « Nous rejoindre » menait à `/contact` en mobile et à `/subscribe` en desktop
  (issue #148), et le pied de page disait « Connexion » quand le menu disait « Se connecter »
  (issue #155). Les deux tests posés depuis la gardent, mais ne la suppriment pas.
- **Attendu** : une source unique des liens partagés, les trois composants la lisant.

```
Objectif : supprimer la recopie des liens de navigation entre l'en-tête et le pied de page.

Constat :
- frontend/src/components/common/Navigation/NavBar.tsx — navItems, puis les deux blocs
  d'actions qui écrivent chacun « Se connecter » et « Nous rejoindre » ;
- frontend/src/components/common/Navigation/MobileMenu.tsx — le second de ces blocs ;
- frontend/src/components/common/Footer.tsx — SITE_COLUMN, ACCOUNT_COLUMN, LEGAL_COLUMN.

Deux tests gardent aujourd'hui l'accord, et ils ne visent pas la même chose :
- NavBar.test.tsx : un libellé servi des deux côtés mène au même endroit (le défaut #148) ;
- Footer.test.tsx : une destination servie par l'en-tête et le pied de page y porte le même
  libellé (le défaut #155), en les rendant ensemble.

Travail demandé :

1. Déroule `inventaire-avant-dev` : où poser une liste de liens lue par trois composants de
   common/ ? types/navigation.ts porte déjà NavItem. Produis le verdict avant d'écrire.
2. Attention : les trois jeux ne se recouvrent pas. Le pied de page a des entrées que le menu
   n'a pas (mentions légales, mot de passe oublié) et le menu a des ancres de défilement. La
   source unique doit porter le libellé et la destination, pas la mise en page.
3. Les deux tests doivent rester verts SANS être réécrits : s'ils demandent une adaptation,
   dis-le-moi avant, c'est le signe que la factorisation change un comportement.
4. Refactoring pur : aucun libellé, aucune destination, aucun ordre d'affichage ne change.

Consulte `frontend-react-ts`. Vérifie par npm run lint, npm test et npm run build, et donne-moi
la sortie des trois.
```

## 8.5 — Aligner les derniers assemblages de classes sur `cx()`

- [x] **Fichiers** : `MainTitle.tsx`, `SecondTitle.tsx`, `Logo.tsx`, `NavBar.tsx`,
  `MobileMenu.tsx`, `FeatureBlock.tsx` — livrés par l'issue #166 ; un second site de
  `MobileMenu.tsx`, plus `ThemeToggle.tsx` et
  `DesktopNav.tsx` par l'issue #172, née du constat ci-dessous : il visait les `join(" ")` et
  ne voyait pas les trois assemblages écrits en gabarit de chaîne.
- **Constat** : sept endroits, dans six fichiers, construisent leur `className` par un
  `[...].join(" ")` écrit sur place — `MainTitle.tsx:33`, `SecondTitle.tsx:49`, `Logo.tsx:25`,
  `NavBar.tsx:79`, `MobileMenu.tsx:31`, `FeatureBlock.tsx:57` et `:96`. La tâche 8.1 les signale
  mais laisse la décision ouverte, et aucun autre lot ne les reprend : sans cette tâche, le lot
  supprime quatre copies de `cx()` pour en laisser sept contournements. Trois d'entre eux
  poussent `className ?? ""` dans le tableau, où le `join` laisse une espace en trop que `cx()`
  filtre.
- **Attendu** : un seul assembleur de classes dans tout le front.
- **À traiter après** : 8.1 — `cx()` doit exister avant d'avoir des appelants.

```
Objectif : faire passer par cx() les derniers assemblages de classes écrits à la main.

Constat, une fois la tâche 8.1 faite :
- frontend/src/components/ui/Title/MainTitle.tsx:33
- frontend/src/components/ui/Title/SecondTitle.tsx:49
- frontend/src/components/ui/Logo/Logo.tsx:25
- frontend/src/components/common/Navigation/NavBar.tsx:79
- frontend/src/components/common/Navigation/MobileMenu.tsx:31
- frontend/src/components/common/Home/FeatureBlock.tsx:57 et :96
Ces numéros de ligne datent du 2026-09-25 : revérifie-les par grep avant d'agir.

Travail demandé :

1. Aucun inventaire à dérouler : rien n'est créé ici, cx() existe déjà. S'il n'existe pas, c'est
   que 8.1 n'est pas faite — arrête-toi et dis-le-moi.

2. Remplace chaque tableau suivi de join par un appel à cx(). Deux cas à ne pas confondre :
   - ceux qui poussent `className ?? ""` dans le tableau (MainTitle, SecondTitle, Logo,
     FeatureBlock:57) : le join y laisse une espace en trop dans l'attribut rendu, cx() la
     filtre. L'attribut change donc, sans rien changer à l'écran — préviens-moi si un test
     compare un className entier ;
   - ceux dont toutes les entrées sont non vides (NavBar, MobileMenu, FeatureBlock:96) : la
     chaîne produite est identique au caractère près.

3. Ne touche pas aux deux join(" ") de lib/apiErrors.ts : ils assemblent des phrases, pas des
   classes.

Consulte `frontend-react-ts`. Refactoring PUR : vérifie par npm run lint, npm test et
npm run build, et donne-moi la sortie des trois.
```

---

# Lot 9 — Code mort et conventions

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-02 — quatre tâches prévues, huit sous-issues et dix issues hors epic livrées : chaque inventaire du lot en a révélé un autre | #174 | Lot 9 | Bloc 1 — qualité |

**Grain de ticket** : prévu en epic + 4 sous-issues, une par tâche — 9.1 → #175, 9.2 → #176,
9.3 → #179, 9.4 → #178. **Ouvert en epic + 6** : #177, source unique du style des boutons et des
liens-boutons, et #180, destination des appels à l'action de la page d'accueil, se sont ajoutées
au cadrage. **Puis en epic + 8** : la livraison de 9.2 a montré que son inventaire de classes
mortes était incomplet et a ouvert #183, deux classes sans lecteur qu'il n'avait pas vues, et
#184, six survols que Tailwind ne génère pas.
**Puis dix issues hors epic**, sous le même label `epic:nettoyage` sauf #193 : #187, bandeaux
anglais d'`index.css` ; #196, test qui refuse une classe sans lecteur ; #199, vingt-deux variables
de `@theme` sans lecteur ; #200, README du design system ; et six défauts de l'accueil vus en
vérifiant les précédents — #189, #190, #192, #193, #204, #206.

> **Dépendances : lots 4 à 8.** À faire en dernier, quand plus aucune tâche ne touche à ces
> fichiers — sinon on supprime ce qu'une autre branche est en train d'utiliser.

## 9.1 — Supprimer `articles.json` et le champ fantôme `coverImg`

- [x] **Fichiers** : `frontend/src/data/articles.json`, `frontend/src/types/article.ts`,
  `frontend/src/components/common/Blog/Card.tsx`, `CLAUDE.md` — livrés par l'issue #175, plus
  `frontend/index.html`, quatrième référence morte trouvée à l'inventaire : un `<link>` vers
  `/src/style.css`, fichier absent du dépôt. `coverImg` a été **retiré** et non implémenté, au
  motif du point 2 ci-dessous. Le point 4 a été déroulé : aucun autre orphelin dans
  `frontend/src/`.
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

- [x] **Fichiers** : `frontend/src/index.css` — livrés par l'issue #176, qui a retiré les neuf
  classes, leurs variantes `.dark`, les bandeaux de section devenus vides et le `@media print`
  qui n'avait plus de règle : 81 lignes, sans toucher au bloc `@theme`. Le point 2 ci-dessous a
  été tranché dans le sens du retrait — `.btn-sm` et `.btn-lg` n'accompagnaient plus rien, le
  composant `Button` portant ses tailles en Tailwind ; la question du double emploi entre le
  système CSS des boutons et ce composant reste entière et appartient à #177. L'inventaire du
  ticket s'est révélé **incomplet** : `.section` et `.border-secondary` n'ont pas de lecteur non
  plus (#183), et six survols écrits dans le front ne produisent rien, Tailwind v4 ne déclinant
  aucune variante sur une classe écrite à la main dans `@layer utilities` (#184). La leçon vaut
  pour 9.3 et 9.4 : un inventaire fourni par le ticket se rejoue en entier, il n'est pas une
  liste à cocher.
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

- [x] **Fichiers** : `Blog.tsx`, les quatre formulaires, `components/ui/**`, `Footer.tsx` — livré
  par l'issue #179 : 47 lignes de JSDoc anglaises, 26 étiquettes de section du JSX et trois traces
  de tutoriel. Les `.ts` et `.tsx` seuls : `index.css` a suivi avec #187 et #199.
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

- [x] **Fichiers** : `frontend/src/pages/About.tsx`, `frontend/src/components/common/Home/Slider.tsx`,
  `frontend/src/components/common/Home/HeroBanner.tsx`, `FeatureBlock` (via `Home.tsx`) — le
  contenu par l'issue #178, le carrousel ramené à deux images distinctes ; les appels à l'action
  par #180, « S'abonner à la newsletter » supprimé faute d'abonnement côté API.
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

# Lot 10 — Finitions issues de la revue du 2026-10-01

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-03 — six tâches prévues, huit sous-issues livrées : deux défauts d'affichage repérés au lot 9 s'y sont ajoutés | #212 | Lot 10 | Bloc 1 — sécurité et qualité |

**Origine** : revue complète de `preprod` au merge de #195 (`755a5c6`), lots 0 à 9 livrés.
Lint, 105 tests front, 78 tests back, build et `npm audit` au vert, **aucun défaut bloquant**.
Les six tâches ci-dessous sont les défauts réels relevés et revérifiés dans le code ; chacun a
aussi son entrée dans `AMELIORATIONS.md`, à cocher à la livraison. Écartés comme trop mineurs :
la course rare entre « Voir plus » et une publication dans `Blog.tsx`, l'alerte d'erreur que la
modale de création garde à sa réouverture, et l'instance d'`Autoplay` recréée à chaque rendu
de `Slider.tsx`.

**Grain de ticket** : epic + 6 sous-issues, une par tâche — chacune a un livrable propre et se
vérifie seule. Ordre conseillé : 10.1 d'abord (le seul défaut de sécurité moyen), puis 10.2 et
10.3, qui touchent les mêmes fichiers d'`accounts` et se feront donc **l'une après l'autre** ;
10.4 à 10.6 sont indépendantes du back et entre elles.
Ouvert ainsi : 10.1 → #213, 10.2 → #214, 10.3 → #215, 10.4 → #216, 10.5 → #217, 10.6 → #218.
**Puis en epic + 8**, dès le cadrage : #219, l'accueil qui déborde en largeur sur mobile, repéré
à #189, et #220, le violet du thème clair sous le contraste minimal, repéré à #193.

> **Dépendances : lot 9 clos** (epic #174 fermée, entrée au journal) — fait le 2026-10-02. #189 et
> #192, ouvertes au cadrage, sont closes depuis sans avoir touché `components/common/Navigation/`.

## 10.1 — Révoquer les sessions ouvertes à la réinitialisation du mot de passe

- [x] **Fichiers** : `backend/accounts/views.py`, `backend/accounts/tests.py` — livré par
  l'issue #213 : `set_password_and_revoke`, partagée avec `PasswordChangeView`, change le mot de
  passe et révoque les refresh du compte dans une seule transaction.
- **Constat** : `PasswordResetConfirmView` (`accounts/views.py:111`) appelle `set_password`
  puis `save` (l. 133-134) et s'arrête. Les refresh déjà émis restent valables jusqu'à
  `REFRESH_TOKEN_LIFETIME` (1 jour, `base.py:293`), et `ROTATE_REFRESH_TOKENS` les prolonge à
  chaque renouvellement. Or réinitialiser est le geste de qui croit sa session volée : un
  attaquant qui détient un refresh — `localStorage` lu par un script, poste partagé — garde la
  session après le changement de mot de passe.
- **Attendu** : après une réinitialisation réussie, tout refresh émis avant est refusé en `401`
  au renouvellement. Le jeton d'accès, lui, vit ses 15 minutes : rien ne le révoque, c'est le
  compromis déjà assumé dans `base.py:290`.

```
Objectif : couper toutes les sessions ouvertes d'un compte quand son mot de passe est réinitialisé.

Constat :
- backend/accounts/views.py:111 — PasswordResetConfirmView vérifie le lien, puis l. 133-134
  appelle user.set_password() et user.save(), et rend 200. Aucun jeton n'est touché.
- backend/config/settings/base.py:288-297 — REFRESH_TOKEN_LIFETIME = 1 jour,
  ROTATE_REFRESH_TOKENS et BLACKLIST_AFTER_ROTATION à True. L'app
  rest_framework_simplejwt.token_blacklist est installée (base.py:120) : les tables
  OutstandingToken et BlacklistedToken existent et se remplissent à chaque connexion.
- Conséquence : un refresh volé reste utilisable, et se renouvelle, après que la victime a
  réinitialisé son mot de passe pour reprendre la main.

Consulte `backend-django-drf`, puis `inventaire-avant-dev` : aucun fichier ne devrait être créé,
dis-le dans le tableau de verdict.

Travail demandé :
1. Après set_password/save, mets en liste noire chaque OutstandingToken du compte
   (BlacklistedToken.objects.get_or_create(token=...)). Dis-moi si tu le poses dans la vue ou
   dans une fonction d'accounts que partagerait `PasswordChangeView` — livrée par l'issue #159,
   elle fait déjà cette révocation par un `bulk_create` —, et recommande, pas une question ouverte.
2. Les deux opérations (mot de passe et liste noire) doivent-elles être dans la même
   transaction ? Tranche, en une ligne de justification.
3. Tests dans accounts/tests.py, classe PasswordResetConfirmTests ou JWTRotationTests selon ce
   qui se lit le mieux : un refresh obtenu AVANT la réinitialisation est refusé en 401 sur
   login/refresh/ APRÈS ; un refresh obtenu APRÈS fonctionne. Valide le premier par mutation :
   retire la mise en liste noire, le test doit tomber (restaure par l'édition inverse, pas par
   git checkout).
4. Ne touche pas au message ni au statut des réponses : la réinitialisation ne doit rien dire de
   plus qu'aujourd'hui.

Coche ensuite l'entrée correspondante de AMELIORATIONS.md (§ « Backend — sécurité ») et mets à
jour le § « Jetons JWT » de CLAUDE.md : la révocation n'y tient plus seulement à la déconnexion.

Lance la suite complète : DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test
```

## 10.2 — Poser un quota sur la confirmation de réinitialisation

- [x] **Fichiers** : `backend/accounts/views.py`, `backend/config/settings/base.py`,
  `.env.example`, `backend/accounts/tests.py` — livré par l'issue #214 : scope
  `password_reset_confirm`, 5 par heure, réglable par `THROTTLE_PASSWORD_RESET_CONFIRM`.
- **Constat** : `PasswordResetConfirmView` est la **seule vue publique d'écriture** sans
  `throttle_scope`. Les quatre autres en portent un (`login`, `register`, `password_reset`,
  `contact`, réglables par `THROTTLE_*`, `base.py:277-282`). Le token HMAC ne se devine pas :
  l'enjeu n'est pas le forçage mais le coût, chaque appel validant un mot de passe contre cinq
  validateurs puis le hachant en PBKDF2.
- **Attendu** : un cinquième scope, réglable par variable comme les autres, et lié à sa route
  par le test qui existe déjà pour les quatre premiers.

```
Objectif : limiter le débit de POST /api/auth/password-reset/confirm/.

Constat :
- backend/accounts/views.py:111 — PasswordResetConfirmView déclare AllowAny mais aucun
  throttle_scope. DEFAULT_THROTTLE_CLASSES vaut ScopedRateThrottle : sans scope, la vue n'est
  pas limitée du tout.
- backend/config/settings/base.py:277-282 — quatre taux, chacun lu par env_str('THROTTLE_*').
- .env.example:87-94 — les quatre variables, commentées avec leur défaut.
- backend/accounts/tests.py:300 — ThrottleScopeTests.test_chaque_endpoint_public_porte_son_scope
  lie chaque route à son scope. La confirmation n'y figure pas.
- backend/config/settings/test.py:43 — éteint les TAUX de tous les scopes déclarés, jamais la
  classe : un nouveau scope y est éteint automatiquement.

Consulte `backend-django-drf`.

Travail demandé :
1. Choisis entre un scope dédié et la réutilisation de « password_reset ». Recommande : partager
   le scope ferait qu'une confirmation consomme le quota de la demande, et inversement.
2. Propose un taux par défaut et justifie-le par l'usage réel : un titulaire qui se trompe deux
   fois sur la complexité de son mot de passe ne doit pas être bloqué.
3. Ajoute la variable THROTTLE_* à base.py et à .env.example, commentée comme ses voisines.
4. Ajoute la route à ThrottleScopeTests, et un test de quota réarmé scope par scope sur le modèle
   de LoginThrottleTests (accounts/tests.py:319). Mutation : retire le throttle_scope de la vue,
   les deux doivent tomber.
5. Mets à jour CLAUDE.md, § « Quotas de débit », qui annonce « les quatre qui en portent un ».

Ne touche pas au corps des réponses de la vue.
```

## 10.3 — Borner la longueur des mots de passe et des textes longs

- [x] **Fichiers** : `backend/accounts/serializers.py`, `backend/articles/serializers.py`,
  `backend/contact/serializers.py`, les trois `tests.py` — livré par l'issue #215 : 128
  caractères par mot de passe, connexion comprise, 20 000 par article, 5 000 par message.
- **Constat** : `password` (`accounts/serializers.py:13`) et `new_password` (l. 44) sont des
  `CharField` sans `max_length` ; `Article.content` (`articles/models.py:9`) et
  `Contact.message` (`contact/models.py:11`) des `TextField`, que le `ModelSerializer` laisse
  sans plafond. Seule la limite de corps de Django (`DATA_UPLOAD_MAX_MEMORY_SIZE`, 2,5 Mo)
  arrête un envoi : un mot de passe de cette taille traverse les cinq validateurs puis PBKDF2,
  et le formulaire de contact, public, écrit 2,5 Mo par message dans la limite de son quota.
- **Attendu** : chaque champ libre a un plafond applicatif qui rend un `400` lisible, sans
  migration.

```
Objectif : donner une longueur maximale aux mots de passe et aux deux champs de texte long.

Constat :
- backend/accounts/serializers.py:13 — RegisterSerializer.password = CharField(write_only=True)
- backend/accounts/serializers.py:44 — PasswordResetConfirmSerializer.new_password, idem
- backend/articles/models.py:9 — content = TextField() ; ArticleSerializer ne le borne pas
- backend/contact/models.py:11 — message = TextField() ; ContactSerializer ne le borne pas
- Seul DATA_UPLOAD_MAX_MEMORY_SIZE (2,5 Mo par défaut) arrête aujourd'hui un corps démesuré.

Consulte `backend-django-drf`.

Travail demandé :
1. Pose le plafond dans les SERIALIZERS, pas dans les modèles : un TextField n'a pas de
   max_length en base, et en changer le type imposerait une migration pour rien. Confirme ou
   contredis ce choix.
2. Propose une valeur pour chacun et justifie-la : 128 est l'usage pour un mot de passe ; pour
   content et message, pars de ce que le front laisse saisir et de ce qu'un article de blog
   mesure réellement.
3. Côté front, les formulaires concernés (FormSubscribe, ResetPassword, FormArticle,
   FormContact) doivent-ils poser un maxLength sur leur champ ? Le refus de l'API arrive déjà
   par toFormErrors : recommande, sans dupliquer une règle sur deux fichiers si ce n'est pas
   nécessaire — et si tu la dupliques, dis où elle vit des deux côtés.
4. Un test par champ : la longueur limite passe, limite + 1 rend 400 avec l'erreur sous la clé
   du champ. Pour new_password, vérifie que l'erreur ne remonte pas imbriquée deux fois (voir
   CLAUDE.md, § « Robustesse du mot de passe »).

Lance la suite complète du backend et npm test si le front est touché.
```

## 10.4 — Préserver les paragraphes d'un article à l'affichage

- [x] **Fichiers** : `frontend/src/pages/Blog/ArticleDetails.tsx`, son test s'il existe — livré
  par l'issue #216 : un `<p>` par paragraphe, découpé aux lignes vides, et son test étendu.
- **Constat** : `ArticleDetails.tsx:115` rend `{recu.article.content}` dans un `<p>` nu. Le
  `Textarea` de `FormArticle` accepte les retours à la ligne et l'API les conserve, mais le HTML
  les écrase : un article de plusieurs paragraphes s'affiche d'un seul bloc.
- **Attendu** : les sauts de ligne saisis se retrouvent à la lecture, sans HTML interprété.

```
Objectif : afficher un article avec les paragraphes que son auteur a saisis.

Constat :
- frontend/src/pages/Blog/ArticleDetails.tsx:115 — <p className="text-secondary">
  {recu.article.content}</p>. Les \n du texte sont rendus comme des espaces.
- Le contenu est saisi dans le Textarea de FormArticle et stocké tel quel par l'API.

Consulte `frontend-react-ts`.

Travail demandé :
1. Recommande entre la classe Tailwind whitespace-pre-line sur le <p> existant et un découpage
   du texte en plusieurs <p> sur les lignes vides. Critères : sémantique pour un lecteur
   d'écran, et aucun dangerouslySetInnerHTML — React doit continuer d'échapper le texte.
2. Si tu poses une classe, vérifie qu'index.css.test.ts reste vert : c'est un utilitaire
   Tailwind, pas une classe écrite à la main, mais le test croise les deux.
3. Un test rendu qui prouve que deux paragraphes saisis restent distincts. Mutation : retire la
   correction, le test doit tomber.
4. Regarde le résultat dans le navigateur sur un article à plusieurs paragraphes, en thème clair
   et sombre.

Coche l'entrée correspondante de AMELIORATIONS.md (§ « Frontend — UX »).
```

## 10.5 — N'afficher « ... » que sous un extrait réellement coupé

- [x] **Fichiers** : `frontend/src/components/common/Blog/Card.tsx`, et selon l'option
  retenue `backend/articles/views.py`, `backend/articles/serializers.py`,
  `frontend/src/types/article.ts` — livré par l'issue #217, option API : `excerpt_truncated`
  calculé par PostgreSQL, les quatre fichiers touchés.
- **Constat** : `Card.tsx:19` (export `ArticleCard`) écrit `{article.excerpt}...` sans
  condition, alors que l'API ne coupe qu'au-delà de `LONGUEUR_EXTRAIT` = 100 caractères
  (`articles/views.py:10`, annotation `Left` l. 34). Un article court s'affiche avec des points
  de suspension alors qu'il est entier.
- **Attendu** : les points de suspension disent vrai.

```
Objectif : ne poser les points de suspension de la carte d'article que si l'extrait a été coupé.

Constat :
- frontend/src/components/common/Blog/Card.tsx:19 — <p>{article.excerpt}...</p>, toujours.
- backend/articles/views.py:10 — LONGUEUR_EXTRAIT = 100 ; l. 34 — excerpt=Left("content",
  LONGUEUR_EXTRAIT) dans get_queryset, avec un defer("content") qui garde le texte en base.
- Voir CLAUDE.md, § « La liste et le détail des articles ne rendent pas les mêmes champs » :
  annotate, defer et serializer n'ont de sens qu'ensemble.

Consulte `inventaire-avant-dev`, `backend-django-drf` et `frontend-react-ts`.

Deux options, recommande-en une :
A. Côté front seul : comparer excerpt.length à 100. Simple, mais recopie une constante du back
   dans le front — deux fichiers pour une règle, ce que le projet évite.
B. Côté API : un booléen annoté dans le même get_queryset (Length("content") >
   LONGUEUR_EXTRAIT), déclaré dans ArticleListSerializer et dans ArticleListItem. Le contrat
   d'API change : dis ce que ça coûte.

Travail demandé :
1. Tranche, puis applique. Le defer("content") doit rester efficace : vérifie que la requête de
   la liste ne charge toujours pas le texte entier.
2. Tests : côté back si l'API change (un article court, un article long) ; côté front, la carte
   avec et sans points de suspension.
3. Si l'option B est retenue, mets à jour le § de CLAUDE.md cité plus haut.
```

## 10.6 — Retirer la variante `hash` de la navigation, que plus aucun lien n'emprunte

- [x] **Fichiers** : `frontend/src/types/navigation.ts`, `frontend/src/lib/navigation.ts`,
  `NavBar.tsx`, `DesktopNav.tsx`, `MobileMenu.tsx` — livré par l'issue #218 : `NavItem` réduit
  à `{ to, label }`.
- **Constat** : `types/navigation.ts:2` déclare une variante `{ type: "hash" }` de `NavItem`, et
  trois composants la servent — `scrollToHash` et `handleHashClick` (`NavBar.tsx:50-64`), la
  prop `onHashClick` passée l. 93 et 159, la branche `<a>` de `DesktopNav.tsx:26-34` et de
  `MobileMenu.tsx:56-65`. Mais `lib/navigation.ts` ne produit que des routes, et `navItems`
  (`NavBar.tsx:66`) vaut `[LIEN_BLOG, LIEN_A_PROPOS, LIEN_CONTACT]` : la branche ne s'exécute
  jamais.
- **Attendu** : `NavItem` décrit ce que la navigation sert vraiment, et plus aucune prop ne
  traverse trois composants pour rien.

```
Objectif : supprimer la branche de navigation par ancre, que plus aucun lien n'emprunte.

Constat :
- frontend/src/types/navigation.ts:2 — | { type: "hash"; href: string; label: string }
- frontend/src/components/common/Navigation/NavBar.tsx:50-64 — scrollToHash et handleHashClick ;
  l. 93 et 159 — onHashClick passé à DesktopNav et MobileMenu.
- DesktopNav.tsx:7, 10, 26-34 et MobileMenu.tsx:13, 22, 56-65 — la prop et la branche <a>.
- frontend/src/lib/navigation.ts:3-6 — LienPartage = Extract<NavItem, { type: "route" }>,
  commenté par l'existence de la variante hash. Sans elle, le Extract n'a plus d'objet.
- Aucune entrée de lib/navigation.ts ni de navItems ne porte type: "hash".

Consulte `frontend-react-ts` et `commentaires-code`.

Travail demandé :
1. Vérifie par grep sur tout frontend/src (et e2e/) qu'aucun lien hash n'est construit
   ailleurs, ni qu'une ancre de défilement soit prévue sur l'accueil (issues ouvertes
   comprises). Si oui, arrête-toi et dis-le.
2. Retire la variante, les deux fonctions, la prop et les deux branches. Décide si NavItem garde
   son champ discriminant `type` une fois réduit à une variante, et si LienPartage et son
   commentaire disparaissent au profit de NavItem — recommande.
3. Refactoring PUR : rien ne change à l'écran. NavBar.test.tsx et Footer.test.tsx doivent
   rester verts sans modification ; index.css.test.ts aussi (la classe nav-link garde ses
   lecteurs dans la branche route).
4. npm run lint, npm test et npm run build : montre la sortie.

Coche l'entrée correspondante de AMELIORATIONS.md (§ « Frontend — code mort »).
```

---

# Lot 11 — Couper ce qui pousse à documenter

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-03 — le grep a trouvé l'incitation jusque dans la règle des trois lignes | — | Lot 11 | Bloc 1 + 2 — documentation |

**Origine** : les règles de sobriété existent déjà — 3 lignes au plus par commentaire
(`commentaires-code`), « sinon n'y touche pas » à l'étape 7 de `/ticket`, budget de 40 Ko pour
`CLAUDE.md` — et n'ont pas tenu. D'autres consignes poussent dans l'autre sens, et elles
gagnent : le Style de `/ticket` envoie « les nuances, les pièges et les arbitrages » dans le
code, le README ou `AMELIORATIONS.md` ; son étape 7 fait documenter tout piège corrigé ; et
presque chaque prompt de ce plan finit par « mets à jour CLAUDE.md » ou « coche
AMELIORATIONS.md ». Une règle de plus serait contredite par ces trois-là.

**Grain de ticket** : aucun — `.claude/` et `CLAUDE.md` ne sont pas versionnés. À faire
**avant** le lot 12 : sinon chaque ticket de code rajoute la documentation que le lot 13 retire.

> **Dépendances : lot 10 clos.**

## 11.1 — Retirer les incitations, poser la règle

- [x] **Fichiers** : `.claude/commands/ticket.md`, `CLAUDE.md`, ce fichier (§ « Règles communes »)
- **Attendu** :
  - le Style de `/ticket` ne fait plus consigner chaque nuance : un arbitrage reste dans le chat,
    sauf un piège qui ferait tomber le prochain à toucher ce code ;
  - son étape 7 se réduit à : `CLAUDE.md` et README seulement si la stack, une commande ou la
    structure change ;
  - en tête de `CLAUDE.md`, une ligne : « Commenter seulement ce que le code ne peut pas dire.
    README et CLAUDE.md : seulement pour un changement de stack, de commande ou de structure. » ;
  - dans les « Règles communes » de ce plan, la même règle pour les prompts des lots suivants.

```
Avant d'écrire, grep dans .claude/ et CLAUDE.md toute autre consigne qui fait écrire de la
documentation à chaque ticket, et liste-la. Modifie ensuite les fichiers, montre-moi le diff.
Rien ne part sur GitHub.
```

---

# Lot 12 — Corriger les causes dans le code

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-04 — quatre tâches prévues, dix sous-issues livrées, plus une issue hors epic née d'une revue | #238 | Lot 12 | Bloc 1 — qualité |

**Origine** : audit du 2026-10-03 (back 7,5/10, front 7/10, 96 tests back et 126 front au
vert). Aucune faille. Le défaut de fond : plusieurs pièges sont **documentés au lieu d'être
corrigés**, et chaque explication pèse ensuite sur `CLAUDE.md`, les tests et les commentaires.
Ce lot retire les causes ; le lot 13 retire ensuite la documentation devenue inutile.

**Grain de ticket** : epic + 4 sous-issues. 12.1 est indépendante. 12.2, 12.3 et 12.4 touchent
en partie les mêmes composants (`NavBar.tsx`, `HeroBanner.tsx`, les formulaires) : elles passent
l'une après l'autre, dans cet ordre.
Ouvert ainsi : 12.1 → #239 et #240, 12.2 → #241, 12.3 → #242 et #243, 12.4 → #244 à #248.
**Puis #250**, hors epic : la course que l'`ignore_conflicts` de #239 laissait ouverte.

> **Dépendances : lot 11 clos**, sans quoi ces tickets rajoutent la documentation que le lot 13
> doit retirer.

## 12.1 — Révocation sans conflit et clé de test valide

- [x] **Fichiers** : `backend/accounts/views.py`, `backend/accounts/tests.py`, `backend/config/settings/test.py`
  — livré par #239 (PR #249) et #240 (PR #251), puis #250 (PR #260) : un verrou sur la ligne
  du compte sérialise la rotation des refresh et leur révocation.
- **Constat** : `set_password_and_revoke` (`accounts/views.py:76`) fait un `bulk_create` de
  `BlacklistedToken` sans `ignore_conflicts`. Une rotation de refresh pendant un changement de
  mot de passe viole l'unicité : `500`, et la transaction annule le nouveau mot de passe. La clé
  de `test.py:13` fait 23 octets, sous les 32 qu'attend la signature HMAC : un
  `InsecureKeyLengthWarning` par test noie la sortie.
- **Attendu** : le conflit est ignoré, un test le prouve, la suite tourne sans avertissement.

```
Consulte `backend-django-drf`. Aucun fichier à créer.
1. Ajoute ignore_conflicts=True au bulk_create de set_password_and_revoke. Test : un refresh
   déjà en liste noire avant l'appel ne fait pas tomber le changement de mot de passe. Valide
   par mutation (retire l'option, le test tombe ; restaure par l'édition inverse).
2. Porte la clé de test.py à 32 octets au moins. Montre la sortie de la suite, sans avertissement.
```

## 12.2 — Thème en variables sémantiques

- [x] **Fichiers** — livré par #241 (PR #252) : `frontend/src/index.css`, `frontend/src/components/ui/Button/buttonClasses.ts`,
  `frontend/src/components/common/Home/Slider.tsx`, `frontend/src/index.css.test.ts`, les composants
  qui portent des paires `bg-[var(--color-light-…)] dark:bg-[var(--color-dark-…)]`
- **Constat** : chaque couleur est écrite deux fois — `.X` puis `.dark .X` dans `index.css`, et
  des paires clair/sombre dans `buttonClasses.ts`. D'où le piège des classes écrites à la main
  sans variante `hover:`, la classe de 400 caractères recopiée deux fois dans `Slider.tsx`, et
  la moitié d'`index.css.test.ts`, qui ne sert qu'à surveiller ce piège.
- **Attendu** : des variables sémantiques (`--color-surface`, `--color-text`…) déclarées dans
  `@theme` et redéfinies sous `.dark`. Une couleur s'écrit une fois, `hover:` fonctionne partout,
  le bloc de classes écrites à la main disparaît. Rendu identique dans les deux thèmes.

```
Consulte `frontend-react-ts` et `inventaire-avant-dev`.
1. Inventorie les couleurs réellement utilisées, puis propose la liste des variables
   sémantiques AVANT de toucher au code. Attends mon accord.
2. Migre. Rendu identique : capture avant/après des pages d'accueil, blog et connexion, en
   clair et en sombre.
3. Réduis index.css.test.ts à ce qui garde encore un sens (les classes mortes), supprime le reste.
4. npm run lint, npm test, npm run build : montre la sortie.
```

## 12.3 — Fichiers nommés comme leur export, routes exportées

- [x] **Fichiers** — livré par #242 (PR #253) et #243 (PR #254) : `MainButton.tsx`, `Card.tsx`, `MainTitle.tsx`, `SecondTitle.tsx`,
  `LinkTitle.tsx` et leurs 19 importeurs ; `frontend/src/App.tsx`, `Footer.test.tsx`, `NavBar.test.tsx`
- **Constat** : cinq fichiers n'exportent pas leur nom, et le même composant s'importe sous deux
  noms (`Button` dans `Blog.tsx`, `MainButton` dans `FormArticle.tsx`) : grep ne le retrouve
  plus. Deux tests lisent `App.tsx` comme du texte pour en extraire les routes par regex, et
  `App.tsx:18-20` doit prévenir le code de production qu'un test le lit.
- **Attendu** : nom de fichier = nom d'export, un seul nom d'import par composant. `App.tsx`
  exporte un tableau de routes que les deux tests importent : plus de `?raw`, plus de regex.

```
Consulte `frontend-react-ts`. Refactoring PUR : rien ne change à l'écran.
1. Renomme les cinq fichiers (git mv) et aligne chaque import. grep doit trouver chaque
   composant sous un seul nom.
2. Sors les routes d'App.tsx dans un tableau exporté ; Footer.test.tsx et NavBar.test.tsx
   l'importent. Valide par mutation : une route retirée du tableau fait tomber les deux tests.
3. Retire le commentaire d'App.tsx devenu sans objet.
4. npm run lint, npm test, npm run build : montre la sortie.
```

## 12.4 — `submit()` dans `useForm`, et quatre défauts du front

- [x] **Fichiers** — livré par #244 à #248 (PR #255 à #259) : `frontend/src/hooks/useForm.ts` et son test, les 7 formulaires,
  `frontend/src/pages/ResetPassword.tsx`, `frontend/src/pages/Blog/Blog.tsx`, `frontend/index.html`
- **Constat** : les 7 formulaires recopient le même `handleSubmit` d'environ 25 lignes
  (valider, remettre à zéro, `isSubmitting`, `try/catch` vers `toFormErrors`, `finally`).
  À côté : `ResetPassword.tsx` ne demande ni confirmation ni complexité ; `/blog` n'a pas de
  `<h1>` (`Blog.tsx:78` rend son titre en `h2`) ; `index.html:2` pose `class="dark"` et un thème
  clair voit un flash sombre au chargement ; `Blog.tsx` importe `react` deux fois.
- **Attendu** : `useForm` expose `submit(envoi)`, chaque formulaire n'écrit plus que son appel
  réseau et son succès. Les quatre défauts sont corrigés.

```
Consulte `frontend-react-ts` et `inventaire-avant-dev` : aucun fichier à créer.
1. Ajoute submit() à useForm, teste-le dans useForm.test.ts, puis migre les 7 formulaires.
   Leurs tests existants restent verts sans modification.
2. ResetPassword : confirmation et complexité, par les règles de lib/validationRules.ts.
3. /blog : un h1. index.html : script inline dans <head> qui pose le thème avant le rendu.
   Blog.tsx : un seul import de react, aucune extension .tsx dans les imports.
4. npm run lint, npm test, npm run build : montre la sortie.
```

---

# Lot 13 — Régime : purge et contrôle

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-04 — le plan comptait 31 blocs, l'epic en a mesuré 97 ; raccourcir a révélé des commentaires faux | #261 | Lot 13 | Bloc 1 + 2 — documentation |

**Origine** : depuis le 2026-09-01, 156 commits `docs` pour 34 `feat`, 6 126 lignes de Markdown
ajoutées pour environ 3 960 de code. `CLAUDE.md` pèse 39 999 octets pour un budget de 40 000,
le README 85 Ko. Le code compte 31 blocs de commentaires de plus de 3 lignes, plafond de
`commentaires-code`, et `production.py` porte plus de commentaires que de code. Des chiffres
écrits en dur se contredisent déjà : 96 tests back, 72 selon `revue-avant-push`, 59 selon le
hook de pré-push.

**Grain de ticket** : 13.1 et 13.3 en issues ; 13.2 et 13.4 sans issue ni PR, `CLAUDE.md` et
`.claude/` n'étant pas versionnés. Cette fois, **le lot ne s'étend pas** : un défaut repéré en
route va dans `AMELIORATIONS.md`.
Ouvert ainsi : epic #261, 13.3 → #262, 13.1 → #263 (backend), #264 (Docker et CI), #265
(exemples d'environnement) et #266 (frontend).

> **Dépendances : lot 12 clos**, qui rend caduques une partie des explications à retirer.

## 13.1 — Commentaires : aucun bloc de plus de 3 lignes

- [x] **Fichiers** — livré par #263 à #266 (PR #268 à #271) : en tête `backend/config/settings/*.py`,
  `compose.dev.yaml`, `compose.prod.yaml`, `backend/healthcheck.py`, puis tout le code
- **Constat** : 31 blocs de plus de 3 lignes, dont 7 dans `base.py` et 7 dans
  `compose.prod.yaml`. `production.py:34-46` consacre 13 lignes à un réglage. Restent aussi des
  paraphrases (`accounts/models.py:17`, `:39`, les fins de ligne de `config/urls.py`), des
  traces d'historique (`FormField.tsx:67`, « remplace Math.random ») et des nombres qui
  vieilliront (« neuf… trente-six » dans `ArticleCoutDesListesTests`).
- **Attendu** : 0 bloc de plus de 3 lignes, aucune paraphrase, aucun nombre ni numéro d'issue
  qui deviendra faux. Ce qui dépasse trois lignes est coupé, pas déplacé au README.

```
Consulte `commentaires-code`. Aucune ligne de code ne change.
1. Liste les 31 blocs (fichier:ligne) et, pour chacun, ta version d'une à trois lignes.
   Attends mon accord.
2. Applique, puis passe tout le code au même tri : paraphrase, historique, chiffres en dur.
3. Lint, tests front et back, build : montre la sortie.
```

## 13.2 — `CLAUDE.md` à 15 Ko, skills sans chiffres en dur

- [x] **Fichiers** — fait hors dépôt, sans issue : les consignes de travail passent de 39 682 à 14 113 octets, les skills et le hook perdent leurs comptes
- **Constat** : `CLAUDE.md` est relu à chaque session et touche son plafond. Une bonne part
  décrit ce que contiennent les fichiers de test, ou des pièges que le lot 12 a retirés. Les
  skills portent des chiffres déjà faux (72 tests, « six formulaires » contre sept).
- **Attendu** : `CLAUDE.md` ≤ 15 000 octets, ne garde que les pièges qui demandent de lire
  plusieurs fichiers et qui ont réellement coûté. Aucun compte de tests ni de fichiers dans les
  skills ou le hook : une commande qui compte, si le nombre est utile.

```
Lis la règle « Qui porte quoi » en tête de CLAUDE.md.
1. Classe chaque paragraphe : piège encore vrai et coûteux / devenu faux / se lit dans un seul
   fichier / porté par une skill. Montre-moi le tableau et la taille visée par section.
2. Réécris. Donne la taille avant et après (wc -c CLAUDE.md).
3. grep les nombres écrits en dur dans .claude/ et retire-les.
```

## 13.3 — README à 35 Ko

- [x] **Fichiers** — livré par #262 (PR #267) : `README.md`, `frontend/README.md`
- **Constat** : 85 Ko pour un site vitrine et un blog. Le README sert à qui installe et lance
  le projet ; il porte aussi le récit de choix que le journal et les PR gardent déjà.
- **Attendu** : `README.md` ≤ 35 000 octets ; installer, lancer, tester, déployer. Le reste
  disparaît ou tient en une ligne. Toute variable de `@theme` encore citée dans le tableau du
  `frontend/README.md` a toujours un lecteur.

```
Consulte `style-documentation`.
1. Propose le nouveau plan du README, section par section, avec la taille visée. Attends mon accord.
2. Réécris. Vérifie chaque commande citée en la lançant, et donne la taille avant et après.
```

## 13.4 — Contrôle au pré-push

- [x] **Fichiers** — fait hors dépôt, sans issue, dans le hook de pré-push, validé par mutation
- **Constat** : les règles écrites ont déjà dérivé sans que rien ne le montre. Seule une mesure
  le voit avant que la dérive s'installe.
- **Attendu** : le hook refuse le push si `CLAUDE.md` dépasse 15 000 octets, `README.md` 35 000,
  ou si un bloc de commentaire du code versionné dépasse 3 lignes. Un fichier qui dépasse avec
  une raison est nommé en exception, la raison en une ligne. Ni CI ni hook Claude Code
  (arbitré le 2026-10-03) : un seul endroit à tenir.

```
Mesure l'état après 13.1 à 13.3 et confirme les seuils. Ajoute les trois contrôles à
verifications.sh. Valide par mutation : un bloc de 4 lignes ajouté fait refuser le push,
retiré il passe.
```

---

# Lot 14 — Documentation et clôture

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-03 — livré sous son ancien numéro, le lot 11, avant les lots 11 à 13 ajoutés le même jour | #229 | Lot 14 | Bloc 1 + 2 — documentation |

**Grain de ticket** : ticket unique — un seul livrable, la documentation à jour.
Ouvert finalement en epic + 4 sous-issues, une par fichier livré et une pour la remontée :
14.1 → #230 (`README.md`) et #231 (`frontend/README.md`), 14.2 → #232, 14.3 → #233.

> **Dépendances : tous les lots précédents**, lots 11 à 13 compris. Le lot 13 réécrit
> `CLAUDE.md` et le README : 14.1 et 14.2 se réduisent alors à un contrôle des écarts restants.
> Livré à la fin du lot 10 : la fin du lot 13 appellera ce contrôle, puis une nouvelle remontée
> de `preprod` dans `main`.

## 14.1 — Consigner le piège `node_modules` et les écarts de `CLAUDE.md`

- [x] **Fichiers** : `CLAUDE.md`, `README.md` — livré par #230 (PR #234) et #231 (PR #235)
- **Constat** : `CLAUDE.md` recense « six pièges de la pile » Docker, mais pas celui qui bloque
  effectivement le poste de travail : le volume anonyme `/app/node_modules` de
  `compose.dev.yaml` crée côté hôte un dossier vide appartenant à `root`, ce qui fait
  échouer toute commande npm ultérieure. Le fichier annonce par ailleurs `cx()` « redéfini dans
  trois composants `ui/` » alors qu'il l'est dans quatre.
- **Attendu** : la documentation décrit le dépôt tel qu'il est après les lots 0 à 10.

```
Objectif : remettre CLAUDE.md et le README en accord avec le dépôt.

Écarts relevés pendant la revue :
1. CLAUDE.md liste « six pièges de la pile » Docker mais omet celui qui bloque réellement le
   poste : le volume anonyme /app/node_modules de compose.dev.yaml fait créer par Docker, du
   côté HÔTE, un frontend/node_modules vide appartenant à root. Toute commande npm lancée ensuite
   depuis la machine échoue en EACCES. C'est un septième piège, au même titre que les six autres.
2. DÉJÀ FAIT par l'issue #162 : le § « Duplication connue » annonçait « cx(), redéfini dans trois
   composants ui/ » là où il l'était dans quatre ; la tâche 8.1 l'ayant extrait dans lib/cx.ts, le
   § entier a été supprimé. Rien à reprendre ici, sauf si le texte est revenu.
3. DÉJÀ FAIT par l'issue #175 : le § « Pièges » documentait src/data/articles.json et
   types/Article.coverImg comme vivants ; la tâche 9.1 les ayant supprimés, le § entier a été
   retiré. Rien à reprendre ici, sauf si le texte est revenu.
4. CLAUDE.md indique « Les trois tests.py sont encore des stubs vides ». Après le lot 2, c'est faux.

Consulte la skill `style-documentation` avant d'écrire.

Travail demandé :
1. Relis CLAUDE.md ligne à ligne contre l'état réel du dépôt après les lots 0 à 10, et liste-moi
   TOUS les écarts avant de corriger — pas seulement les quatre ci-dessus.
2. Décide, pour chaque piège Docker, s'il relève de CLAUDE.md, du README, ou des deux : le README
   s'adresse à un humain qui installe le projet, CLAUDE.md à un agent qui code dedans.
3. Rappel : CLAUDE.md n'est PAS versionné (il est dans .gitignore), le README l'est. Un piège que
   la personne suivante doit connaître pour installer le projet a donc sa place dans le README.

Ne réécris pas ce qui est juste : ces deux fichiers sont d'excellente qualité, la tâche est une
mise à jour ciblée, pas une refonte.
```

## 14.2 — Mettre à jour `AMELIORATIONS.md` et le `README`

- [x] **Fichiers** : `AMELIORATIONS.md`, `README.md` — livré par #232 (PR #236)
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

## 14.3 — Revue finale et clôture

- [x] **Fichiers** : l'ensemble du diff — livré par #233 (PR #237, `preprod` → `main`)
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

# Lot 15 — Sécurité : dépendances et navigateur

| État | Epic | Journal | Alimente |
|---|---|---|---|
| Clos le 2026-10-05 — 25 avis prévus, 32 mesurés au premier ticket ; la CSP passe sans `'unsafe-inline'` | #274 | Lot 15 | Bloc 1 — sécurité |

**Origine** : audit de conformité du 2026-10-05, sur `preprod` au merge de #273 (`841ddbe`),
39 points contrôlés. 106 tests back et 135 front au vert, lint sans erreur ni avertissement,
build réussi, `check` sans problème. **Aucune faille dans le code** : le jeton de
réinitialisation part par email, les permissions sont fermées par défaut, le contenu des
articles est échappé. Les lots 15 à 21 reprennent les écarts restants, du plus urgent au plus
lointain : dépendances et CSP (15), données personnelles (16), tests et édition d'article
(17, 18), mise en ligne et surveillance (19, 20), clôture (21).

**Grain de ticket** : epic + 4 sous-issues, une par tâche. 15.1 et 15.2 sont indépendantes ;
15.3 vient après elles, sinon la CI rougit dès son ajout. 15.4 est indépendante du reste.

> **Dépendances : lots 0 à 14 clos.** 15.1 touche tout le backend par ses dépendances : à livrer
> avant les lots 16 à 18, pour qu'ils testent sur les versions corrigées.

## 15.1 — Monter les dépendances Python vulnérables

- [x] **Fichiers** : `backend/requirements.txt` — livré par #275 (PR #279)
- **Constat** : `pip-audit -r requirements.txt` remonte **25 avis sur 4 paquets** :
  - PyJWT 2.13.0 : 1 critique, 5 élevés, 7 moyens, corrigés en 2.15.0 ;
  - sqlparse 0.5.5 : 3 élevés, 2 moyens, corrigés en 0.6.0 ;
  - Django 6.0.6 : 1 élevé, 3 moyens, 1 faible, corrigés en 6.0.8 ;
  - DRF 3.17.1 : 2 moyens, corrigés en 3.17.2.

  Le risque réel est faible : les avis PyJWT visent les clés asymétriques et JWKS, alors que
  le projet signe en HS256 avec `SECRET_KEY` (défaut de simplejwt) ; l'avis élevé de Django vise
  GeoDjango, absent. Mais c'est l'écart que montre le premier `pip-audit` d'un correcteur
  (OWASP A06, composants vulnérables).
- **Attendu** : `pip-audit` sans avis, les 106 tests verts, l'image backend reconstruite et
  `healthy`.

```
Consulte `backend-django-drf` et `conventions-docker`. Aucun fichier à créer.
1. Lance pip-audit -r backend/requirements.txt (dans un venv jetable, pas celui du projet) et
   montre la sortie réelle.
2. Monte les quatre paquets à leur version corrigée. Vérifie la compatibilité de simplejwt
   5.5.1 avec PyJWT 2.15 et lis les notes de version de Django 6.0.7-6.0.8 et DRF 3.17.2 :
   dis ce qui pourrait changer pour le projet.
3. Suite Django complète, puis docker compose -f compose.dev.yaml up -d --wait --build :
   montre les deux sorties, et pip-audit rejoué à la fin.
Commit `chore:` avec requirements.txt seul.
```

## 15.2 — Corriger la vulnérabilité npm de l'outillage

- [x] **Fichiers** : `frontend/package-lock.json` — livré par #276 (PR #280)
- **Constat** : `npm audit` remonte 1 vulnérabilité élevée : `brace-expansion` 1.1.18 (via
  `eslint` → `minimatch` 3.1.5) et 2.1.4 (via `typescript-eslint` → `minimatch` 9.0.9), trois
  avis de déni de service. `npm audit --omit=dev` n'en trouve aucune : rien n'atteint le bundle.
- **Attendu** : `npm audit` à 0, lint, tests et build verts, le verrou commité.

```
Consulte `frontend-react-ts` et `conventions-docker` (l'étape deps de l'image lit ce verrou).
1. Montre npm audit, puis dis si npm audit fix suffit sans version majeure.
2. Applique. npm run lint, npm test, npm run build : montre la sortie.
Commit `chore:` séparé, avec package-lock.json seul.
```

## 15.3 — Auditer les dépendances en intégration continue

- [x] **Fichiers** : `.github/workflows/tests.yml` — livré par #277 (PR #282)
- **Constat** : `tests.yml` lance tests, lint et build, mais aucune vérification de
  dépendances. Les 25 avis de 15.1 se sont accumulés sans qu'aucune pull request ne le montre.
- **Attendu** : le job backend lance `pip-audit`, le job frontend `npm audit` ; une version
  vulnérable réintroduite fait échouer la CI.
- **Dépend de** : 15.1, 15.2

```
Consulte `conventions-docker` et `workflow-git`.
1. Tranche, et recommande : l'audit doit-il bloquer la pull request, sachant qu'un avis publié
   un mardi rougirait des PR sans rapport avec lui ? Options : étape bloquante, étape sous
   `if: !cancelled()` comme les tests, ou workflow planifié à part.
2. npm : `--omit=dev` ou tout l'arbre ? Recommande, en une ligne de justification.
3. Valide par mutation dans une PR brouillon vers preprod, fermée ensuite sans merge (une
   branche poussée seule ne déclenche pas tests.yml) : une version vulnérable remise dans
   requirements.txt fait échouer le job. Montre le lien du run.
```

## 15.4 — Poser une Content-Security-Policy sur le front servi par nginx

- [x] **Fichiers** : `frontend/nginx.conf`, `frontend/index.html`, `frontend/src/csp.test.ts` — livré par #278 (PR #283)
- **Constat** : `tokens.ts:24-25` range les deux jetons dans `localStorage`, lisible par tout
  script de la page. Le jeton d'accès vit 15 minutes, le jeton de renouvellement un jour avec
  rotation (`base.py:239-244`) : un seul XSS les emporte tous les deux. `nginx.conf:50-52` pose
  `nosniff`, `X-Frame-Options` et `Referrer-Policy`, répétés dans chaque `location` (l. 66-94),
  mais **aucune CSP**. `index.html:8-18` porte un script en ligne, celui qui pose `.dark`, et
  son commentaire (l. 10) annonce déjà qu'une CSP devra l'autoriser.
- **Attendu** : une CSP stricte dans chaque `location` qui répète les en-têtes (`'self'` pour
  scripts et connexions, le script en ligne autorisé par son hash, `object-src 'none'`,
  `frame-ancestors 'none'`). Aucune violation dans la console sur toutes les pages, en thème
  clair et sombre. Un test fait échouer la suite si le script change sans que le hash suive.

```
Consulte `conventions-docker` et `frontend-react-ts`, puis `inventaire-avant-dev` : un test
existant (index.css.test.ts lit déjà index.html) peut-il porter le contrôle du hash ?
1. Propose la politique directive par directive, avec ce qui casserait sans chacune (carrousel
   Embla, styles posés par React, polices, images). Attends mon accord.
2. Applique dans nginx.conf, sans oublier le piège de la ligne 60 : add_header ne s'hérite pas.
3. Pile de production : docker compose -f compose.prod.yaml up -d --wait --wait-timeout 60,
   puis chaque route parcourue dans le navigateur, console ouverte. Montre l'en-tête reçu
   (curl -I) et l'absence de violation.
4. Mutation : un caractère changé dans le script de index.html fait tomber le test.
Le passage du jeton de renouvellement en cookie httpOnly est hors périmètre : propose-le à
AMELIORATIONS.md s'il te paraît justifié, sans le faire.
```

---

# Lot 16 — Données personnelles

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 1 — sécurité |

**Origine** : audit du 2026-10-05, points 27 et 28. `/privacy` promet plus que le code ne
tient : la conservation des messages de contact « le temps d'y répondre » (`Privacy.tsx:82`)
sans rien qui les supprime ; l'effacement d'un compte « sans condition » (l. 90-100), mais
seulement à la main, depuis l'admin, sur demande écrite. Enfin le formulaire de contact collecte
nom et email sans un mot d'information, là où l'inscription renvoie à `/privacy`
(`FormSubscribe.tsx:199-214`).

**Grain de ticket** : epic + 3 sous-issues. Les trois sont indépendantes ; 16.2 est la plus
lourde (back, front, tests des deux côtés).

> **Dépendances : lot 15** (15.1 au moins : les tests de 16.2 tournent sur les versions
> corrigées).

## 16.1 — Informer au formulaire de contact

- [ ] **Fichiers** : `frontend/src/components/common/Contact/FormContact.tsx`
- **Constat** : `FormContact.tsx` collecte prénom, nom, email, sujet et message, et rien
  avant le bouton d'envoi (l. 179) ne dit à quoi ils servent ni ne mène à `/privacy`. C'est
  l'information due au moment de la collecte (RGPD, art. 13).
- **Attendu** : une phrase sous le formulaire, sur le modèle de celle de l'inscription : la
  finalité (vous répondre) et le lien vers `/privacy`, mêmes classes, même focus.

```
Consulte `frontend-react-ts` et `inventaire-avant-dev` : le bloc de FormSubscribe.tsx:199-214
se réutilise-t-il tel quel, ou faut-il l'extraire ? Recommande ; n'extrais pas pour deux usages
si la copie tient en quelques lignes.
Applique, regarde le rendu en clair et en sombre, puis npm run lint, npm test, npm run build.
```

## 16.2 — Supprimer son compte soi-même

- [ ] **Fichiers** : `backend/accounts/views.py`, `serializers.py`, `urls.py`, `tests.py`,
  `backend/config/settings/base.py`, `backend/config/tests.py`, `.env.example`,
  `frontend/src/lib/api.ts`, la page de compte du front, `frontend/src/pages/Privacy.tsx`,
  `README.md` (§ « Le débit »)
- **Constat** : `accounts/urls.py` n'expose aucune suppression ; seul l'admin efface un compte,
  avec ses articles en cascade (`articles/models.py:15`). Les jetons survivent sans titulaire
  (`OutstandingToken.user` passe à `NULL`), et `LoginRefreshView` les refuse déjà en `401`.
- **Attendu** : le membre connecté supprime son compte en redonnant son mot de passe. L'API
  répond `204`, le front efface les jetons et revient à l'accueil. `/privacy` le dit, et la
  matrice des droits de `config/tests.py` couvre la nouvelle route.

```
Consulte `inventaire-avant-dev`, `backend-django-drf` et `frontend-react-ts`.
1. Inventaire : PasswordChangeSerializer.validate_current_password se réutilise-t-il ? La page
   /change-password peut-elle accueillir la suppression, ou faut-il une page « Mon compte » ?
   Tableau de verdict avant tout fichier créé.
2. Plan à valider : méthode et route ; mot de passe vérifié en 400 et non en 401 (apiFetch
   renouvellerait le jeton) ; un throttle_scope et sa variable THROTTLE_* ; les messages de
   contact envoyés depuis la même adresse — supprimés ou non, recommande.
3. Pièges à traiter : la route va dans ROUTES_AUTH_PROTEGEES de lib/api.ts, sinon le jeton
   n'est pas envoyé ; et dans la matrice de config/tests.py, que
   test_chaque_route_de_l_api_figure_dans_la_matrice exige.
4. Tests back : mauvais mot de passe refusé, visiteur refusé, compte et articles supprimés,
   refresh refusé en 401 après. Test front : confirmation, jetons effacés, redirection.
   Mutation sur le contrôle du mot de passe.
5. Mets à jour la section 6 de Privacy.tsx et sa date de mise à jour (l. 21). Le tableau du
   README, § « Le débit », reçoit le nouveau quota ; CLAUDE.md (non versionné) dit encore
   « hors password-change/ » à deux endroits, que la nouvelle route rend faux.
```

## 16.3 — Fixer et appliquer la durée de conservation des messages

- [ ] **Fichiers** : une commande de gestion dans `backend/contact/`, `contact/tests.py`,
  `frontend/src/pages/Privacy.tsx`
- **Constat** : `Privacy.tsx:82` promet de garder les messages « le temps d'y répondre ». Le
  modèle `Contact` porte `created_at`, mais rien ne supprime un message, et rien ne marque qu'il
  a reçu sa réponse.
- **Attendu** : une durée chiffrée écrite dans `/privacy`, et une commande qui supprime les
  messages plus anciens, sur le modèle de `peupler_articles`. Son déclenchement planifié
  revient à 20.4.

```
Consulte `inventaire-avant-dev` et `backend-django-drf`.
1. Propose une durée et justifie-la (le temps raisonnable d'une réponse, pas un archivage).
   Dois-je la rendre réglable par variable ? Recommande. Attends mon accord.
2. Écris la commande, sur la structure de articles/management/commands/peupler_articles.py,
   avec un mode --dry-run qui compte sans supprimer.
3. Tests : un message à la limite est gardé, un message au-delà est supprimé, --dry-run ne
   supprime rien. Mutation sur la comparaison de dates.
4. Remplace « le temps d'y répondre » par la durée retenue dans Privacy.tsx, et mets à jour
   sa date (l. 21).
```

---

# Lot 17 — Tests du front : combler les trous

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 1 — qualité |

**Origine** : audit du 2026-10-05, point 30. 15 fichiers et 135 tests Vitest, mais trois
formulaires n'ont aucun test rendu : `FormContact`, `FormArticle` et `ForgotPassword`. Le
backend couvre leurs endpoints ; rien ne vérifie ce que le front envoie ni ce qu'il affiche du
refus. Le référentiel demande des scénarios sur les fonctionnalités critiques, et publier un
article en est une. `AMELIORATIONS.md` note par ailleurs, § « Tests », que huit fichiers
recopient leur substitut de `fetch`.

**Grain de ticket** : epic + 2 sous-issues, dans l'ordre : l'extraction d'abord, pour que les
trois nouveaux tests naissent sur le module partagé.

> **Dépendances : lot 16** (16.1 change `FormContact`, que 17.2 teste). Doit précéder le
> lot 18, qui étend `FormArticle`.

## 17.1 — Extraire le substitut réseau partagé des tests

- [ ] **Fichiers** : un module de test partagé, chaque fichier qui substitue
  `globalThis.fetch` — huit aujourd'hui, un de plus après le test front de 16.2
- **Constat** : `FormLogin.test.tsx`, `FormSubscribe.test.tsx`, `ChangePassword.test.tsx`,
  `ResetPassword.test.tsx`, `Blog.test.tsx`, `ArticleDetails.test.tsx`,
  `useIsAuthenticated.test.ts` et `api.test.ts` recopient chacun leur substitut de `fetch`,
  avec sa fonction `reponse()` dans sept d'entre eux. Ils modélisent le même contrat d'`apiFetch` (`ok`, `status`,
  `json()`) et dériveront séparément.
- **Attendu** : un module importé explicitement par chaque fichier (`globals` reste à
  `false`, pas de `setupFiles`). Tous les tests passent sans qu'aucune assertion ne change.

```
Consulte `inventaire-avant-dev` et `frontend-react-ts`.
1. Compare les huit copies et montre ce qui diffère réellement. Propose l'API du module.
   Attends mon accord.
2. Migre fichier par fichier ; npm test après chacun.
3. Retire d'AMELIORATIONS.md l'entrée « Doublon réseau d'un test rendu à l'autre », livrée.
npm run lint, npm test, npm run build : montre la sortie.
```

## 17.2 — Tester les formulaires de contact, d'article et de mot de passe oublié

- [ ] **Fichiers** : trois fichiers de test, à côté de `FormContact.tsx`, `FormArticle.tsx` et
  `ForgotPassword.tsx`
- **Constat** : aucun des trois n'a de test. `FormArticle` a pourtant un message de refus
  propre au `401` (l. 56-57), et `ForgotPassword` doit afficher la réponse neutre de l'API
  sans rien en déduire.
- **Attendu** : pour chacun, une saisie invalide n'envoie rien, le corps envoyé est exact
  (`FormArticle` : titre et contenu, jamais l'auteur), le succès s'affiche, et un refus de
  l'API est traduit : `400` sous le champ, et `429` repris tel quel là où l'endpoint a un
  quota (contact, mot de passe oublié ; les articles n'en ont pas). Une mutation par fichier.
- **Dépend de** : 17.1

```
Consulte `frontend-react-ts`. Pas de globales : chaque test importe describe/it/expect et
inscrit afterEach(cleanup). Le réseau est coupé à fetch par le module de 17.1, jamais à
apiFetch.
1. Liste les cas par formulaire avant d'écrire. Attends mon accord.
2. Écris, puis une mutation par fichier (une règle de validation retirée, ou le corps changé) :
   le test doit tomber. Restaure par l'édition inverse.
```

---

# Lot 18 — Modifier et supprimer un article depuis le front

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 1 — qualité |

**Origine** : audit du 2026-10-05, point 8. L'API offre le CRUD complet au propriétaire
(`ModelViewSet`, `IsOwnerOrReadOnly`, `permissions.py:12`, six tests `ArticleProprieteTests`),
mais le front ne fait que créer. Un auteur ne peut ni corriger une coquille ni retirer son
article sans passer par l'admin.

**Grain de ticket** : epic + 2 sous-issues, dans l'ordre : le front ne peut rien afficher tant
que l'API ne lui dit pas qui est l'auteur.

> **Dépendances : lot 17** (le test de `FormArticle` protège son extension).

## 18.1 — Dire au front si le lecteur est l'auteur

- [ ] **Fichiers** : `backend/articles/serializers.py`, `backend/articles/tests.py`,
  `frontend/src/types/article.ts`
- **Constat** : `ArticleSerializer` (`serializers.py:5-14`) ne rend de l'auteur que son
  `public_name`. C'est voulu : aucun email ni identifiant ne sort sur le blog public. Mais le
  front ne peut donc pas savoir si le lecteur est l'auteur, et ne sait pas qui il est
  (`AMELIORATIONS.md`, « Aucun endpoint profil »).
- **Attendu** : le détail d'un article dit au lecteur connecté s'il en est l'auteur, et
  toujours non au visiteur, sans exposer d'identifiant. La liste ne change pas.

```
Consulte `backend-django-drf` et `inventaire-avant-dev`.
1. Compare un booléen calculé sur request.user dans ArticleSerializer et l'endpoint profil
   d'AMELIORATIONS.md. Recommande ; je pars d'un booléen, l'endpoint profil reste hors
   périmètre.
2. Le champ sur le détail seulement : vérifie que ArticleListSerializer et son defer("content")
   n'en sont pas touchés.
3. Tests : visiteur → faux, autre membre → faux, auteur → vrai. Mutation : comparaison inversée.
```

## 18.2 — Modifier et supprimer depuis la page de l'article

- [ ] **Fichiers** : `frontend/src/pages/Blog/ArticleDetails.tsx`,
  `frontend/src/components/common/Blog/FormArticle.tsx`, leurs tests
- **Constat** : `ArticleDetails.tsx:119-131` affiche titre, signature et paragraphes, sans
  aucune action. `FormArticle` ne sait que créer : valeurs initiales vides, `POST` en dur.
- **Attendu** : l'auteur, et lui seul, voit « Modifier » et « Supprimer ». « Modifier » ouvre
  `FormArticle` prérempli dans une modale, envoie un `PATCH` et met la page à jour.
  « Supprimer » demande confirmation, envoie un `DELETE`, puis ramène à `/blog`. Un `403` ou un
  `404` reçu entre-temps est traduit.
- **Dépend de** : 18.1

```
Consulte `inventaire-avant-dev` et `frontend-react-ts`.
1. Plan à valider : comment FormArticle s'étend à l'édition sans dupliquer (valeurs initiales,
   méthode, URL) ; la modale de Blog.tsx:137-160 se réutilise-t-elle ; la confirmation de
   suppression dans un <dialog> plutôt que window.confirm — recommande.
2. Tests rendus : boutons absents pour un non-auteur, PATCH puis affichage mis à jour, DELETE
   puis redirection, refus traduit. Mutation sur la condition d'affichage.
3. Parcours manuel dans le navigateur avec deux comptes, en clair et en sombre.
```

---

# Lot 19 — Livraison continue et mise en ligne

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 2 — déploiement |

**Origine** : audit du 2026-10-05, points 36 et 38. L'intégration continue existe :
- `tests.yml` lance la suite Django sur un service PostgreSQL, puis lint, Vitest et build ;
- `docker-images.yml` construit les deux images, sans les publier (`push: false`, l. 64).

Rien n'est en ligne. `compose.prod.yaml` se lance à la main derrière le nginx du serveur
(README, § « Déployer »), aucun registre ne reçoit les images, et HSTS reste à 0
(`.env.prod:70`), seule alerte de `check --deploy`. `AMELIORATIONS.md` porte déjà trois de ces
écarts : images non publiées, Playwright hors CI, façade du serveur à durcir.

**Grain de ticket** : epic + 4 sous-issues, dans l'ordre. 19.1 est indépendante ; 19.2 à 19.4
dépendent d'une décision hors code : un serveur ou un compte d'hébergement.

> **Dépendances : lots 15 à 18 clos**, pour mettre en ligne la version corrigée.

## 19.1 — Lancer le parcours Playwright en intégration continue

- [ ] **Fichiers** : `.github/workflows/tests.yml`, selon le plan `frontend/playwright.config.ts`
- **Constat** : `npm run test:e2e` exige la pile de `compose.dev.yaml` et Chromium, qu'aucun
  job ne prépare. Le `forbidOnly` de `playwright.config.ts` ne s'arme donc jamais.
- **Attendu** : un job monte la pile, crée le compte de test, installe Chromium et lance
  `connexion.spec.ts`. Un `test.only` oublié fait échouer la CI.

```
Consulte `conventions-docker`. Rappels : Compose lit le .env racine, absent en CI ;
E2E_EMAIL/E2E_PASSWORD viennent de process.env ; retries reste à 0 (quota login 5/min).
1. Plan à valider : génération du .env du job, création du compte (actif), déclencheur (toute
   PR ou seulement vers main ? recommande selon la durée mesurée du job).
2. Mutation dans une PR brouillon vers preprod, fermée ensuite sans merge : un test.only
   ajouté fait échouer le job. Montre le lien du run.
3. Retire d'AMELIORATIONS.md l'entrée « Le parcours Playwright ne tourne pas en intégration
   continue », livrée.
```

## 19.2 — Choisir la cible et publier les images

- [ ] **Fichiers** : `.github/workflows/docker-images.yml`, `compose.prod.yaml`
- **Constat** : `docker-images.yml:64` construit sans pousser, écarté le 2026-09-03 faute de
  serveur (`AMELIORATIONS.md`, « Les images ne sont publiées vers aucun registre »).
  `compose.prod.yaml` nomme ses images mais les construit sur place.
- **Attendu** : la cible d'hébergement est choisie et écrite dans le ticket. Sur push `main`
  seulement, les deux images partent vers un registre (le front construit avec
  `VITE_API_URL=/api`), et `compose.prod.yaml` sait les tirer.

```
Consulte `conventions-docker`.
1. Compare un serveur où tourne compose.prod.yaml derrière son nginx, tel que le README le
   décrit déjà, et une plateforme (Render ou équivalent) : ce qui se réutilise, ce qui se
   réécrit, le coût. Recommande. Attends ma décision : elle conditionne 19.3 et 19.4.
2. Publication vers GHCR sur push main seulement, jamais sur une PR. Étiquettes : sha et
   latest — recommande.
3. compose.prod.yaml tire les images publiées sans perdre la construction locale. Vérifie
   l'ancien piège : chaque fichier nomme ses images.
```

## 19.3 — Déployer automatiquement sur `main`

- [ ] **Fichiers** : un job de déploiement dans `.github/workflows/`, le README (§ « Déployer »)
- **Constat** : la mise en production se fait à la main, commande par commande, depuis le
  README. Rien ne garantit que `main` est ce qui tourne.
- **Attendu** : après la publication de 19.2, un job déploie la nouvelle version et attend
  `healthy` (`--wait --wait-timeout 60`). Sinon il échoue en le disant. Les secrets vivent dans
  un environnement GitHub, jamais dans le dépôt.
- **Dépend de** : 19.2

```
Consulte `conventions-docker` et `workflow-git`.
1. Plan selon la cible retenue en 19.2 : accès au serveur, secrets, migrations (l'entrypoint
   les lance-t-il déjà ?), et retour en arrière si la nouvelle version ne devient pas healthy.
   Attends mon accord.
2. Un premier déploiement réel, puis un second sans changement : montre les deux runs.
3. README : seulement la commande ou l'étape qui change.
```

## 19.4 — Domaine, TLS et HSTS

- [ ] **Fichiers** : `.env.prod` (non versionné), `.env.prod.example`, la configuration du nginx du serveur
  (hors dépôt), le README si une étape change
- **Constat** : `DJANGO_HSTS_SECONDS=0` (`.env.prod:70`) tant que la pile est jointe sur
  `localhost`, ce qui laisse l'avertissement W004 de `check --deploy`. `AMELIORATIONS.md`
  (« Durcir la façade du serveur ») attend Let's Encrypt et un HSTS monté par paliers.
- **Attendu** : le site répond sur son domaine en HTTPS, `FRONTEND_URL` le vise, HSTS monte
  par paliers (3600, puis 86400, puis 31536000), et `check --deploy` ne remonte plus rien.
- **Dépend de** : 19.3

```
Consulte `conventions-docker`.
1. Liste ce qui change avec un vrai domaine : FRONTEND_URL, DJANGO_ALLOWED_HOSTS,
   CORS_ALLOWED_ORIGINS (vide, même origine), certificat, X-Forwarded-Proto $scheme.
2. Lien de réinitialisation reçu par email : il doit viser le domaine. Montre-le.
3. check --deploy avec .env et .env.prod chargés : montre la sortie. Ne monte HSTS au palier
   suivant que sur mon accord, l'engagement ne se révoque pas.
```

---

# Lot 20 — Surveillance et exploitation

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 2 — déploiement |

**Origine** : audit du 2026-10-05, point 39. Les healthchecks (`backend/Dockerfile:72`,
`frontend/Dockerfile:76`) et `restart: unless-stopped` (`compose.prod.yaml:34`, `:91`, `:135`)
relancent un conteneur tombé, mais **personne n'est prévenu**. `/health/` reste interne
(`config/urls.py:12`). `AMELIORATIONS.md` note aussi qu'il n'y a aucun `LOGGING` et aucune tâche
planifiée : les tables de `token_blacklist` ne font que croître, et la purge de 16.3 n'aura
personne pour la lancer.

**Grain de ticket** : epic + 4 sous-issues. 20.1 d'abord : sans journaux lisibles, une alerte
ne mène nulle part. 20.2 attend un site en ligne (19.3). 20.4 attend 16.3.

> **Dépendances : lot 19** pour 20.2 et 20.4 ; 20.1 et 20.3 peuvent commencer avant.

## 20.1 — Configurer les journaux du backend

- [ ] **Fichiers** : `backend/config/settings/base.py`, `.env.example`
- **Constat** : aucun `LOGGING` dans `config/settings/`. Le `logger.exception` de
  `send_password_reset_link`, seule trace d'une panne SMTP, sort par le handler de dernier
  recours de Python, sans horodatage ni niveau.
- **Attendu** : un handler console explicite, horodaté, au niveau réglable par variable, que
  `docker compose logs` rend lisible.

```
Consulte `backend-django-drf`. Lis l'environnement par les helpers env_*, jamais os.environ.
1. Propose la configuration minimale. Dis ce que deviennent les logs de Django et de Gunicorn.
2. Test : la configuration chargée donne au journal racine un handler console dont le format
   porte l'heure et le niveau. Pas assertLogs : il pose son propre handler et passerait sans
   LOGGING. Mutation : LOGGING retiré, le test tombe.
3. Retire d'AMELIORATIONS.md l'entrée « Aucun LOGGING », livrée.
```

## 20.2 — Être prévenu quand le site tombe

- [ ] **Fichiers** : selon le plan, la configuration du nginx du serveur ; un service de
  surveillance externe (hors dépôt)
- **Constat** : `/health/` vérifie la base en un `SELECT 1`, mais le nginx du serveur ne relaie
  vers le backend que `/api/` et `/admin/` : aucune sonde extérieure ne peut l'interroger. Une panne se découvre
  en visitant le site.
- **Attendu** : une sonde externe interroge le site à intervalle régulier et envoie un email à
  la première panne et au retour.
- **Dépend de** : 19.3

```
Consulte `conventions-docker`.
1. Que doit interroger la sonde : la page d'accueil, /health/ relayé par le nginx du serveur,
   ou une route de l'API ? Rappel : la tâche 6.2 a sorti /health/ de l'API, pour ne plus
   compter la table des articles à chaque passage. Recommande.
2. Choisis le service (UptimeRobot, Uptime Kuma auto-hébergé…) selon la cible de 19.2.
3. Preuve : arrête le backend, montre l'alerte reçue, puis celle du retour.
```

## 20.3 — Recevoir les erreurs du serveur

- [ ] **Fichiers** : `backend/config/settings/production.py`, `.env.prod.example`
- **Constat** : avec `DEBUG = False`, une erreur `500` laisse au mieux une trace dans les
  journaux, que personne ne lit. Le relais SMTP de production existe déjà
  (`production.py:40-52`).
- **Attendu** : toute erreur `500` en production arrive à l'équipe, sans aucune donnée
  personnelle en clair dans le message.
- **Dépend de** : 20.1

```
Consulte `backend-django-drf`.
1. Compare ADMINS + mail_admins (aucune dépendance, le SMTP est là) et un service comme Sentry.
   Recommande pour un projet de cette taille ; je pars de mail_admins. Pièges : SERVER_EMAIL
   n'est posé nulle part, et son défaut root@localhost serait refusé par le relais ; le LOGGING
   de 20.1 ne doit pas couper le handler mail_admins que Django pose par défaut.
2. Données personnelles : dis ce que le rapport d'erreur contient par défaut (corps POST, mots
   de passe, le jeton Bearer de l'en-tête Authorization) et comment Django le filtre. Les vues qui reçoivent un mot de passe
   doivent-elles se déclarer sensibles ? Recommande.
3. Preuve : un test (mail.outbox, DEBUG=False, client à raise_request_exception=False, sinon
   l'exception remonte au test avant tout envoi) montre qu'une 500 envoie un rapport sans mot
   de passe ni jeton ; puis python manage.py sendtestemail --admins en production.
```

## 20.4 — Planifier les tâches d'entretien

- [ ] **Fichiers** : selon le plan, un service dans `compose.prod.yaml` ou la crontab du serveur
  (hors dépôt), le README (§ « Déployer »)
- **Constat** : rien ne lance `flushexpiredtokens` (`AMELIORATIONS.md`, « Rien ne purge les
  tables de `token_blacklist` »), ni la purge des messages de 16.3. Les conteneurs n'ont ni
  cron ni planificateur.
- **Attendu** : les deux commandes tournent chaque nuit en production, et un échec se voit
  dans les journaux de 20.1.
- **Dépend de** : 16.3, 19.3, 20.1

```
Consulte `conventions-docker`.
1. Compare la crontab du serveur (docker compose exec) et un conteneur planificateur dans
   compose.prod.yaml. Recommande ; la pile doit démarrer sans lui.
2. Preuve : les deux commandes lancées par le planificateur, avec leur sortie dans les journaux.
3. Retire d'AMELIORATIONS.md l'entrée « Rien ne purge les tables de token_blacklist », livrée.
```

---

# Lot 21 — Finitions et clôture de l'audit

| État | Epic | Journal | Alimente |
|---|---|---|---|
| À planifier | — | — | Bloc 1 + 2 — documentation |

**Origine** : les écarts mineurs de l'audit du 2026-10-05 qu'aucun lot n'a pris, puis le
contrôle que les 39 points sont fermés ou consignés.

**Grain de ticket** : epic + 2 sous-issues ; 21.2 en dernier.

> **Dépendances : lots 15 à 20 clos.**

## 21.1 — Écarts mineurs de l'audit

- [ ] **Fichiers** : `README.md` (§ « Prérequis »), `.gitignore` selon la décision
- **Constat** :
  - le README demande « Python 3.12 ou plus récent » (`README.md:18`), alors que la CI
    (`tests.yml:81`) et l'image (`backend/Dockerfile:6`) tournent en 3.13 ; le venv local est
    en 3.12 ;
  - ce fichier est versionné, alors que sa section « Journal » le présente comme un plan de
    travail, à l'opposé de `journal.md` ;
  - l'issue #38 (« Documenter le code et compléter le rapport technique ») est la seule encore
    ouverte.
- **Attendu** : une seule version de Python partout, le statut de `correction.md` tranché,
  #38 fermée ou rattachée à un lot.

```
1. Aligne le prérequis du README sur 3.13 ; dis-moi la commande pour recréer mon venv, sans
   la lancer.
2. correction.md : versionné ou ignoré ? Recommande, en pensant à qui lira le dépôt.
3. #38 : montre son contenu ; dis si elle est faite, ou ce qui reste.
```

## 21.2 — Rejouer l'audit et remonter dans `main`

- [ ] **Fichiers** : l'ensemble du dépôt, puis une PR `preprod` → `main`
- **Attendu** : les 39 points de l'audit du 2026-10-05 rejoués avec la même méthode. Chaque
  point est ✅, ou renvoyé à `AMELIORATIONS.md` avec sa raison en une ligne. Puis un verdict
  `OK` de `revue-avant-push` et la remontée dans `main`.

```
Rejoue l'audit du 2026-10-05 point par point, en lecture seule : mêmes commandes (tests,
lint, build, check --deploy avec .env puis .env.prod chargés par python-dotenv (pas par source : la clé
secrète contient des caractères que le shell interprète), npm audit, pip-audit dans un venv jetable,
gh pr list --json). Rends le même tableau, avec une colonne « avant / après ».
Ensuite seulement, déroule `revue-avant-push`, puis `workflow-git` pour la PR vers main.
Ferme les issues à la main : Closes #N ne les ferme pas au merge dans preprod.
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
| 2.4 | Vitest et traduction des refus d'API | Structurant | 0 | Bloc 1 — qualité |
| 2.5 | Tests du point d'appel réseau | Structurant | 2.4 | Bloc 1 — qualité |
| 2.6 | Test du formulaire de connexion rendu | Structurant | 2.4 | Bloc 1 — qualité |
| 2.7 | Parcours de connexion en navigateur | Structurant | 2.6 | Bloc 1 — qualité |
| 2.8 | Suites lancées en intégration continue | Structurant | 2.1-2.7 | Bloc 1 — qualité |
| 3.1 | N+1 sur la liste des articles | Performance | 2 | Bloc 1 — optimisation |
| 3.2 | Utilisateur créé en deux écritures | Faible | 2 | Bloc 1 — optimisation |
| 3.3 | `Contact` sans horodatage | Moyen | 2 | Bloc 1 — qualité |
| 3.4 | `apps.py` et import mort | Faible | 2 | Bloc 1 — qualité |
| 4.1 | **Extraire `hooks/useForm.ts`** | Duplication | 0 | Bloc 1 — qualité |
| 4.2 | **Erreurs API jamais affichées** | Élevé (UX) | 4.1 | Bloc 1 — qualité |
| 4.3 | Nom et prénom inversés | Élevé (données) | 4.1 | Bloc 1 — qualité |
| 4.4 | `isSubmitting` jamais activé (contact) | Moyen | 4.1 | Bloc 1 — qualité |
| 4.5 | Inscription réussie sans confirmation | Moyen (UX) | 4.1 | Bloc 1 — qualité |
| 4.6 | Socle des formulaires non testé | Structurant | 4.1 | Bloc 1 — qualité |
| 5.1 | Aucun état d'authentification | Structurant | 4 | Bloc 1 — sécurité |
| 5.2 | Refresh token jamais utilisé | Élevé (UX) | 5.1, 1.6 | Bloc 1 — sécurité |
| 5.3 | Aucune déconnexion | Élevé | 5.1, 1.6 | Bloc 1 — sécurité |
| 5.4 | Création d'article offerte aux anonymes | Moyen | 5.1, 4.2 | Bloc 1 — sécurité |
| 6.1 | Pagination bout en bout | Performance | 2, 3, 5 | Bloc 1 — optimisation |
| 6.2 | Sonde de santé non paginée | Faible | 6.1 | Bloc 1 — optimisation |
| 6.3 | Base de développement impossible à peupler | Structurant | 6.1 | Bloc 1 — qualité |
| 6.4 | Liste vide et échec de chargement muets | Moyen (UX) | 6.1, 4.2 | Bloc 1 — qualité |
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
| 10.1 | Réinitialisation sans révocation des sessions | Moyen (sécurité) | 9 | Bloc 1 — sécurité |
| 10.2 | Confirmation de réinitialisation sans quota | Faible | 10.1 | Bloc 1 — sécurité |
| 10.3 | Mots de passe et textes longs sans plafond | Faible | 10.2 | Bloc 1 — sécurité |
| 10.4 | Paragraphes d'un article perdus à l'affichage | Moyen (UX) | 9 | Bloc 1 — qualité |
| 10.5 | « ... » sous un extrait non coupé | Faible (UX) | 9 | Bloc 1 — qualité |
| 10.6 | Variante `hash` de la navigation sans lien | Code mort | 9 | Bloc 1 — qualité |
| 11.1 | Consignes qui font documenter chaque ticket | Méthode | 10 | — |
| 12.1 | Révocation en `500` sur conflit, clé de test courte | Moyen | 11 | Bloc 1 — sécurité |
| 12.2 | Couleurs écrites deux fois (clair et sombre) | Structurant | 11 | Bloc 1 — qualité |
| 12.3 | Fichiers mal nommés, tests qui lisent `App.tsx` en texte | Conventions | 12.2 | Bloc 1 — qualité |
| 12.4 | `handleSubmit` recopié 7 fois, quatre défauts front | Duplication | 12.3 | Bloc 1 — qualité |
| 13.1 | 31 blocs de commentaires au-delà de 3 lignes | Conventions | 12 | Bloc 1 + 2 — documentation |
| 13.2 | `CLAUDE.md` au plafond, chiffres faux dans les skills | Documentation | 12 | Bloc 1 + 2 — documentation |
| 13.3 | README de 85 Ko | Documentation | 12 | Bloc 1 + 2 — documentation |
| 13.4 | Aucune mesure de la taille ni des commentaires | Structurant | 13.1-13.3 | Bloc 1 + 2 — qualité |
| 14.1 | `CLAUDE.md` et README en retard sur le code | Documentation | 0-13 | Bloc 1 + 2 — documentation |
| 14.2 | `AMELIORATIONS.md` et README | Documentation | 0-13 | Bloc 1 + 2 — documentation |
| 14.3 | Revue finale et fermeture des issues | Clôture | tout | Bloc 1 + 2 — documentation |
| 15.1 | **25 avis `pip-audit`, dont 1 critique** | Élevé (sécurité) | 13 | Bloc 1 — sécurité |
| 15.2 | `brace-expansion` vulnérable dans l'outillage | Faible | — | Bloc 1 — sécurité |
| 15.3 | Aucun audit de dépendances en CI | Moyen | 15.1, 15.2 | Bloc 1 — sécurité |
| 15.4 | Jetons en `localStorage` sans CSP | Élevé (sécurité) | — | Bloc 1 — sécurité |
| 16.1 | Contact sans information sur les données | Moyen (RGPD) | 15 | Bloc 1 — sécurité |
| 16.2 | Aucune suppression de compte par le membre | Moyen (RGPD) | 15.1 | Bloc 1 — sécurité |
| 16.3 | Conservation des messages promise, jamais appliquée | Moyen (RGPD) | 15 | Bloc 1 — sécurité |
| 17.1 | Substitut de `fetch` recopié dans huit tests | Duplication | 16 | Bloc 1 — qualité |
| 17.2 | Trois formulaires sans test rendu | Structurant | 17.1 | Bloc 1 — qualité |
| 18.1 | Le front ignore qui est l'auteur | Structurant | 17 | Bloc 1 — qualité |
| 18.2 | Ni modification ni suppression côté front | Moyen (fonctionnel) | 18.1 | Bloc 1 — qualité |
| 19.1 | Playwright hors intégration continue | Moyen | 15-18 | Bloc 2 — déploiement |
| 19.2 | Aucune cible, images non publiées | Élevé (livraison) | 15-18 | Bloc 2 — déploiement |
| 19.3 | Mise en production manuelle | Élevé (livraison) | 19.2 | Bloc 2 — déploiement |
| 19.4 | Ni domaine ni HSTS | Moyen (sécurité) | 19.3 | Bloc 2 — déploiement |
| 20.1 | Aucun `LOGGING` | Moyen | — | Bloc 2 — déploiement |
| 20.2 | Panne découverte en visitant le site | Élevé (exploitation) | 19.3 | Bloc 2 — déploiement |
| 20.3 | Erreurs `500` lues par personne | Moyen | 20.1 | Bloc 2 — déploiement |
| 20.4 | Aucune tâche d'entretien planifiée | Faible | 16.3, 19.3, 20.1 | Bloc 2 — déploiement |
| 21.1 | Version de Python, statut de ce fichier, issue #38 | Faible | 15-20 | Bloc 1 + 2 — documentation |
| 21.2 | Audit rejoué et remontée dans `main` | Clôture | tout | Bloc 1 + 2 — documentation |

Cinq tâches ne portent pas le bloc de leur lot : **0.2** est une remédiation de vulnérabilités
avec preuve avant/après ; **3.3** et **3.4** relèvent de la qualité dans un lot classé
optimisation, comme **6.3** et **6.4**, qui n'y sont entrées que pour rendre la pagination
visible et lisible.

---

## Ce qui n'est pas dans ce plan, et pourquoi

Ces points sont **délibérément laissés de côté** : ils fonctionnent, et les toucher ferait plus
de mal que de bien.

- **Toute la couche Docker** (Dockerfiles, `nginx.conf`, les deux fichiers Compose) : c'est la
  partie la plus solide du dépôt — multi-stage, non-root des deux côtés, sonde qui lit la base,
  entrypoint avec garde, `.dockerignore` qui met le `.env` hors contexte. Seules deux tâches y
  touchent, et par la marge (0.1 et 6.2). Les lots 15 à 20 y ajoutent sans rien refondre : la
  CSP de `nginx.conf` (15.4), la publication des images et le déploiement (19).
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
