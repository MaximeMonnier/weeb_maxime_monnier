# Journal de bord — projet Weeb

Une entrée par lot de `correction.md`, écrite **à sa clôture** et non reconstituée après coup.

Ce journal ne raconte pas ce qui a été fait : les issues, les pull requests et les rapports
de revue le font déjà, datés et vérifiables par un tiers. Il porte ce qu'ils ne captent pas —
le chiffre mesuré avant, l'option écartée et son motif, l'écart entre ce qui était prévu et
ce qui s'est passé.

## Format d'une entrée

```markdown
## Lot <n> — <titre>

Clos le <AAAA-MM-JJ> · Epic #<numéro> (ou Issue #<numéro>, à défaut d'epic) · Alimente : <bloc RNCP>

**Constat mesuré** — le chiffre ou la sortie de commande qui a motivé le lot, pas son résumé.

**Décision et justification** — ce qui a été retenu, ce qui a été écarté, et pourquoi.

**Ce qui a surpris** — l'écart entre le prévu et le constaté. La partie la plus utile :
aucun diff ne la redit.

**Preuve de la correction** — la commande rejouée et sa sortie, après.
```

---

## Lot 0 — Débloquer l'environnement de travail

Clos le 2026-09-04 · Issue #58 · Alimente : —

**Constat mesuré** — `npm audit` depuis `frontend/` : `15 vulnerabilities (1 low, 2 moderate,
12 high)`, sur 15 paquets. Treize relèvent de l'outillage et n'exposent que le poste de
travail. Les deux derniers partent dans le bundle servi par `weeb-frontend:prod` :
`react-router` 7.12.0, qui porte à lui seul treize avis — redirection ouverte via URL relative
au protocole, XSS stockée, CSRF, dénis de service par appariement de routes — et
`react-router-dom` 7.12.0, vulnérable par simple dépendance sur le premier.

**Décision et justification** — `npm audit fix` sans `--force`. Les correctifs tiennent tous
dans les bornes `^` déjà déclarées : `package.json` n'a pas bougé, seul le verrou est réécrit,
et la revue se limite à un diff de versions. `--force` a été écarté — il aurait imposé des
montées majeures non demandées par le ticket. Épingler les versions l'a été aussi : le projet
assume ses bornes `^`, les figer déplacerait le problème au prochain avis.

**Ce qui a surpris** — deux fois, et dans les deux cas c'est l'outil qui ment, pas le code.

`npm audit` sort en **code 0 quand l'audit lui-même échoue**. L'endpoint d'avis du registre
répondait en deux minutes ce jour-là ; trois tentatives ont fini en `503`, et la commande a
malgré tout rendu la main sur un succès apparent. Une CI qui se fierait à son code de retour
passerait au vert sans avoir rien vérifié.

Le volume anonyme sur `/app/node_modules` du conteneur de développement **n'isolait plus
rien** : un fichier témoin écrit sur la machine ressortait à l'intérieur, et Vite servait donc
le `node_modules` de l'hôte au lieu de celui de l'image. Le conteneur datait de la veille.
Sans `--renew-anon-volumes`, la vérification de `react-router` aurait porté sur des paquets
dont l'origine était indéterminée. Le comportement documenté dans le README est le bon ; c'est
un conteneur survivant qui avait dérivé.

**Preuve de la correction** — `npm audit` : `found 0 vulnerabilities`. `npm run lint` sans
erreur ; `npm run build` produit `dist/` en 2,2 s. `rm -rf node_modules && npm ci` réinstalle
201 paquets sans toucher au verrou, et le build repasse — l'avertissement `allowScripts` sur
`esbuild@0.27.2` n'y fait pas obstacle. `docker build --target prod` sort une image de 74,3 Mo
et les trois services de `compose.dev.yaml` sont `healthy`. La garde `VITE_API_URL` de
`vite.config.ts` interrompt toujours un build de production quand la variable manque.
Navigation vérifiée par un clic réel piloté en CDP : depuis `/blog`, le clic sur une carte
mène à `/articles/2`, qui affiche le bon titre **sans rechargement de page** — donc bien par
le routeur client, celui-là même qui a été mis à jour.

---

## Lot 1 — Sécurité de l'API

Clos le 2026-09-07 · Epic #65, **laissée ouverte** · Alimente : Bloc 1 — sécurité

**Constat mesuré** — `PasswordResetRequestView` rendait `{"uid": …, "token": …}` dans le corps
d'une réponse `200`, sur un endpoint `AllowAny`. Connaître une adresse email suffisait donc à
prendre le compte : un `POST` public, un lien reconstitué à la main, un mot de passe choisi. La
même vue répondait `404 "Aucun compte associé à cet email."` quand l'adresse était inconnue —
un test d'existence gratuit, illimité, en une requête. Trois voisins de la même famille :
`CustomUserAdmin` héritait de `admin.ModelAdmin`, donc affichait `password` en champ texte et
enregistrait **tel quel** ce qu'on y tapait ; `REST_FRAMEWORK` n'avait aucun
`DEFAULT_THROTTLE_CLASSES`, donc `/api/auth/login/` acceptait un nombre infini de tentatives ;
`SIMPLE_JWT` ne posait que deux durées de vie, sans rotation ni liste noire, un jeton d'accès
vivant une heure sans que rien ne puisse le révoquer.

**Décision et justification** — le lien de réinitialisation part par email et la réponse devient
neutre : même corps pour un compte actif, inactif ou inconnu, et la panne SMTP est avalée, ne
survenant que pour un compte qui existe. Les mots de passe passent par un
`validate_password_strength` appelé depuis `validate()` et non depuis un `validate_<champ>`,
qui imbriquerait la clé du champ deux fois — d'où le nom de champ passé en argument. Un
cinquième validateur réplique la regex du front, les deux devant accepter exactement les mêmes
mots de passe. Pour le débit, `ScopedRateThrottle` a été préféré à `AnonRateThrottle` : il ne
compte que les vues qui déclarent un scope, ce qui laisse la lecture des articles libre sans
avoir à l'exempter. `LoginView` n'existe que pour porter le sien, `throttle_scope` étant un
attribut de vue et celle de simplejwt étant importée telle quelle.

Deux choses écartées, et c'est ce qui distingue ce lot d'une clôture complète. Redis pour le
compteur de débit : `LocMemCache` laisse chacun des trois workers Gunicorn compter le sien, donc
un quota de 5 peut en laisser passer 15 — assumé, le but étant de rendre l'abus lent, pas
impossible. Et l'énumération à l'**inscription**, que l'`UniqueValidator` du champ `email`
produit toujours : la corriger suppose d'accepter l'inscription en silence puis d'avertir par
email, soit le parcours entier à refaire. Elle reste à l'epic #65, qui ne se ferme donc pas avec
le lot.

**Ce qui a surpris** — quatre fois, et trois fois c'est un réglage qui promet ce qu'il ne tient
pas.

`AUTH_PASSWORD_VALIDATORS` ne s'applique **pas** aux serializers DRF. Les quatre validateurs
étaient configurés depuis le début du projet, et `12345678` passait quand même à l'inscription :
ils ne valent que pour les formulaires de Django. Rien, dans les settings, ne le laisse voir —
c'est le genre de faille qu'on ne trouve pas en relisant le fichier qui devrait la contenir.

`config/settings/test.py` doit éteindre les **taux**, jamais les classes. DRF fige
`APIView.throttle_classes` à l'import : une classe retirée ne se réarme plus, là où un taux se
réarme scope par scope à l'intérieur d'un test. Neutraliser la classe est pourtant le geste
qui vient d'abord : c'est celui qui rend la suite inapte à vérifier le quota qu'elle installe.

Le `401` de simplejwt reste en **anglais** malgré `LANGUAGE_CODE = 'fr-fr'`. Le paquet n'est pas
dans `INSTALLED_APPS` — seul son `token_blacklist` y est, et sans catalogue de traduction — donc
son `django.mo` n'est jamais chargé. DRF, lui, traduit : le `429` sort en français dans la même
réponse. C'est ce qui a forcé un libellé maison côté front, à l'issue #79.

La suite de tests affiche à chaque exécution un `InsecureKeyLengthWarning: The HMAC key is 23
bytes long`. Il vient de `SECRET_KEY = 'cle-de-test-non-secrete'`, longue de 23 caractères, pas
de la production, dont la clé en fait 50. L'avertissement est donc faux là où il se lit, et
personne ne le verra là où il compterait.

**Preuve de la correction** — `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test` :
`Ran 25 tests in 15.444s`, `OK`. Rejoué contre la pile de développement, API réelle :
`POST /api/auth/password-reset/` rend `{"detail": "Si un compte existe pour cet email, un lien de
réinitialisation vient d'être envoyé."}` — corps identique au caractère près pour une adresse
inscrite et pour une inconnue, comparé par égalité de JSON. La sixième connexion d'une même
minute rend `429` avec `{"detail": "Requête ralentie. Disponible à nouveau dans 60 secondes."}`.
`POST /api/auth/register/` avec `12345678` rend `400` et les trois griefs du validateur. Le
hachage depuis l'admin, lui, n'a pas de trace côté API : c'est
`test_un_compte_cree_depuis_l_admin_peut_se_connecter` qui le tient, en créant un compte par le
formulaire de l'admin puis en demandant un jeton avec le mot de passe saisi.

---

## Lot 2 — Tests automatisés

Clos le 2026-09-08 · Epic #83 · Alimente : Bloc 1 — qualité

**Constat mesuré** — au 6 septembre, `backend/articles/tests.py` et `backend/contact/tests.py`
ne contenaient **aucun** `def test_`. La propriété d'un article et l'`AllowAny` de l'endpoint
public de contact — deux pièces dont les garanties se répartissent sur trois fichiers chacune —
n'étaient donc vérifiées par rien. `accounts` en avait 25, écrits pendant le lot 1 comme verrous
de ses propres corrections. Côté front, `frontend/package.json` n'avait ni script `test` ni le
moindre fichier de test, et aucun workflow ne lançait quoi que ce soit : `docker-images.yml`
construisait deux images, c'est tout.

**Décision et justification** — quatre arbitrages.

Les tests backend tournent sur un **PostgreSQL réel**, jamais sur SQLite, retiré du projet à
l'issue #49 : une requête qui passe en test passe en ligne. Le prix est une suite qui exige une
base joignable, y compris en intégration continue.

Vitest est réglé **dans `vite.config.ts`** et non dans un `vitest.config.ts` séparé : la garde
`VITE_API_URL` et les réglages du serveur restent lus d'une seule source. Avec `globals: false`,
chaque fichier importe `describe`, `it` et `expect`, ce qui dispense `tsconfig.app.json` et
`eslint.config.js` de connaître ces noms. Conséquence assumée, faute d'un `setupFiles` : les
matchers de `jest-dom` et le `cleanup` entre les cas s'écrivent dans chaque fichier de test.

Playwright est un **second lanceur**, qui ne partage rien avec Vitest, et **sans bloc
`webServer`** : la pile vient de `compose.dev.yaml`. Un Vite relancé sans base ni API derrière
ferait passer un parcours qui ne prouve plus rien.

Playwright reste **hors de l'intégration continue** : il lui faudrait la pile Compose debout, un
compte actif en base et 660 Mo de navigateur. Un workflow unique a été écarté aussi : deux
fichiers donnent deux journaux, et `docker-images.yml` n'avait pas à bouger pour ça.

**Ce qui a surpris** — quatre fois, et trois fois c'est un outil qui vérifie autre chose que ce
qu'on croit.

`jsdom` n'applique **aucune feuille de style**. La règle `.form-label-required::after` ajoute
« * » aux libellés obligatoires, et un vrai navigateur verse ce contenu généré dans le nom
accessible : les champs se cherchent donc par une **part** de leur libellé, jamais par son texte
exact. Une recherche exacte passe sous Vitest et tombe sous Playwright — exactement l'écart que
le parcours en navigateur existe pour attraper.

`npm test` échoue **avant le premier cas** quand `VITE_API_URL` manque : `lib/api.ts` lève à
l'import, et deux des trois fichiers l'importent. Sur le poste, `frontend/.env` masque
entièrement le problème ; il n'apparaît que sur une machine vierge, c'est-à-dire précisément là
où la CI l'a trouvé. Le job front pose donc la variable alors même qu'il ne construisait, au
départ, aucun bundle.

Le quota de connexion posé au lot 1 **borne la suite qui le vérifie** : cinq connexions par
minute, deux consommées par parcours, d'où `retries: 0` — une reprise recevrait un 429, et le
journal montrerait un quota là où il y avait un vrai défaut.

Enfin, la raison d'abord écrite pour justifier deux workflows était fausse sur ses deux points :
des jobs réunis dans un même fichier partent en parallèle eux aussi, et le cache buildx est clé
par le contexte de build, jamais par le fichier qui déclare le job. C'est `revue-avant-push` qui
l'a relevé, sur un texte qui paraissait solide parce qu'il était plausible.

**Preuve de la correction** — `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test` :
`Ran 53 tests`, `OK` — 29 pour `accounts`, 12 pour `articles`, 12 pour `contact`. `npm test` :
`3 passed`, `33 passed`. `npm run lint` et `npm run build` verts. En intégration continue,
exécution `34240762774` sur le commit exact de la PR #102 : job `backend` vert, job `frontend`
vert sur ses trois étapes.

Les rouges ont été éprouvés autant que les verts, sur deux pull requests jetables ouvertes puis
refermées. Une assertion cassée de chaque côté rend les deux jobs rouges, chacun nommant son
test (`34238183958`) ; un style volontairement refusé laisse tourner les deux étapes suivantes
(`34240590478`) — la suite Vitest verte, le build rouge sur la même variable inutilisée, que
`tsc` refuse comme ESLint. Un `test.only` oublié est refusé par `forbidOnly` dès que `CI` est
posée, et ignoré sans elle.

---

## Lot 3 — Qualité et performance de l'API

Clos le 2026-09-09 · Epic #105 · Alimente : Bloc 1 — optimisation

**Constat mesuré** — trois défauts chiffrables et un reste de scaffold. `GET /api/articles/`
exécutait **31 requêtes pour 30 articles** contre 4 avec la jointure : le serializer rend
l'auteur par son `__str__`, qui lit son email, et la liste allait le chercher une fois par
ligne. `POST /api/auth/register/` écrivait **deux fois** — un `INSERT` par `create_user()`,
puis un `UPDATE` posant `is_active = False` — laissant entre les deux une ligne valide en base.
`backend/contact/models.py` n'avait **aucun champ de date** : les messages étaient intriables et
impurgeables. Et `contact/apps.py:4` nommait sa classe `ContactesConfig` depuis le `startapp`
d'origine.

**Décision et justification** — trois arbitrages.

Le N+1 se **prouve par mesure, jamais par un compte écrit en dur**. Les deux tests mesurent la
liste à 3 articles, puis exigent le même nombre à 30 : c'est leur égalité qui fait la preuve. Un
`assertNumQueries(4)` littéral aurait menti dès qu'une requête de session ou un filtre d'admin
se serait ajouté ailleurs.

L'écriture unique du compte se garde par les **verbes SQL**, pas par l'état final. Une assertion
sur `is_active` ne distingue pas une écriture de deux : le test capture les requêtes du `POST` et
exige un `INSERT` et aucun `UPDATE` sur la table du compte, en écartant par `\b` les tables
dérivées dont le nom contient le sien.

`created_at` reprend `Article` — `auto_now_add` et `Meta.ordering` — plutôt qu'une convention
neuve. La migration donne aux lignes déjà en base la date du jour où elle passe, avec
`preserve_default=False` : le défaut ne survit pas à un champ `auto_now_add`, et devait donc être
transitoire.

**Ce qui a surpris** — trois fois, et deux fois c'est le plan qui se trompait, pas le code.

La **liste de l'admin partait en N+1 elle aussi**, ce que le plan ne prévoyait pas : 36 requêtes
pour 30 articles, ramenées à 9. La première explication écrite était fausse — `ChangeList`
n'applique `select_related()` de lui-même que si `list_select_related` **manque** ; dès qu'elle
porte un tuple non vide, c'est elle qui décide. La revue l'a relevée sur un texte qui paraissait
solide parce qu'il était plausible.

L'**écart annoncé par la tâche 3.4 n'existait pas**. Le plan présentait `default_auto_field`
comme une divergence avec les migrations. Contrôle fait : sous Django 6.0.6,
`global_settings.DEFAULT_AUTO_FIELD` vaut déjà `django.db.models.BigAutoField`, et les trois
migrations initiales posent bien un `BigAutoField`. La déclaration n'explicite qu'un défaut, et
`makemigrations --check` le confirme en ne produisant rien. Une tâche entière du lot était une
mise en forme, pas une correction — et il valait mieux le vérifier que le supposer.

`read_only_fields` sur `created_at` s'est révélé **redondant** : `auto_now_add` suffit déjà à ce
que DRF refuse une date envoyée par le client. La ligne reste, parce qu'elle dit l'intention à un
lecteur qui ne connaît pas ce détail de DRF, mais elle ne protège rien à elle seule.

**Preuve de la correction** — `DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test` :
`Ran 59 tests`, `OK` — 53 avant le lot, 30 pour `accounts`, 14 pour `articles`, 15 pour `contact`.
`python manage.py check` : « System check identified no issues (0 silenced). »
`python manage.py makemigrations --check --dry-run` : « No changes detected ».

Les rouges ont été éprouvés autant que les verts : retirer le `select_related` de la vue fait
passer la liste de l'API de 4 à 31 requêtes, vider le `list_select_related` de l'admin la fait
passer de 9 à 36, et retirer le `Meta.ordering` de `Contact` fait tomber le cas du tri — qui crée
ses trois messages dans le désordre pour ne pas retomber par hasard sur l'ordre des identifiants.

---

## Lot 4 — Socle des formulaires front

Clos le 2026-09-19 · Epic #116 · Alimente : Bloc 1 — qualité

**Constat mesuré** — six formulaires — `FormContact`, `FormLogin`, `FormSubscribe`,
`FormArticle`, `ForgotPassword`, `ResetPassword`, 999 lignes en tout — recopiaient le même
socle : `handleChange` écrit **6 fois**, `type FormErrors` **4 fois**, le squelette de
`validateForm` **4 fois**, l'expression d'adresse email **3 fois**. Deux défauts vivaient dans
cette copie. Dans `FormContact` et `FormSubscribe`, le libellé « Nom » coiffait le champ
`first_name` et « Prénom » le champ `last_name`, messages de validation compris : un visiteur
rangeait son nom dans le prénom du modèle. Et `FormSubscribe.tsx:110` renvoyait vers `/login`
dès le compte créé, que `RegisterSerializer` pose pourtant `is_active=False` — l'inscription
finissait sur un 401 que rien n'expliquait.

**Décision et justification** — quatre arbitrages.

Le hook ne porte **aucune règle de validation**. Chacun des six formulaires garde les siennes
dans une fonction pure, hors du composant, que `validate` applique. Les faire remonter aurait
réuni six jeux de contraintes sans rapport dans un fichier commun, et lié chaque formulaire aux
cinq autres. `lib/validationRules.ts` ne reçoit que ce qui sert à plus d'un appelant :
l'adresse email, partagée par trois formulaires. La regex de complexité du mot de passe reste
chez `FormSubscribe`, son seul consommateur — et doit rester alignée sur
`PasswordComplexityValidator` côté API.

`isSubmitting` **monte dans le hook** plutôt que de rester local. C'est ce qui vide la tâche 4.4
du plan : l'oubli du `setIsSubmitting(true)` qu'elle corrigeait n'a plus d'endroit où se
produire.

L'inscription **reste sur sa page** au lieu de rediriger vers `/login`. Le message ne peut pas
voyager : la page d'arrivée ne sait pas d'où l'on vient, et rien dans le front ne fait survivre
une confirmation à la navigation. Plutôt que de tirer une librairie de toasts pour un seul
message, le formulaire garde l'utilisateur sur place et annonce l'activation à venir dans une
région `role="status"`. La piste du toast reste ouverte dans `AMELIORATIONS.md`.

Aucune **migration de données** pour l'inversion nom / prénom : rien de ce qui était en base ne
venait de ces deux formulaires.

**Ce qui a surpris** — quatre fois.

**Le plan comptait quatre formulaires, il y en avait six.** `ForgotPassword` et `ResetPassword`
portaient le même `handleChange`, mais sur un état scalaire — une chaîne à la place de l'objet
de champs. Les migrer a demandé de retyper cet état en objet à **une** clé, seule forme que le
hook sache indexer.

**Deux des quatre tâches du lot étaient déjà faites** trois jours avant que l'epic ne soit
écrite : l'issue #79 avait créé `lib/apiErrors.ts` (tâche 4.2) et posé au passage le
`setIsSubmitting(true)` manquant de `FormContact` (tâche 4.4). Le plan, lui, datait du
2026-09-03, et rien ne l'en avertissait. Trois des quatre points de la tâche 4.3 se sont révélés sans objet de la
même façon : aucun `helperText` sur ces champs, aucun bloc à déplacer, et l'inversion absente
de l'admin Django comme du parcours Playwright.

**L'extraction n'a pas fait maigrir les formulaires** : 999 lignes avant, 1007 après, plus 70
pour le hook et les règles. Le gain n'est pas le volume, c'est qu'il ne reste qu'un seul
endroit où ce socle puisse être faux.

**Le doublon s'est déplacé dans les tests.** `FormSubscribe.test.tsx`, deuxième test de
composant rendu, a recopié de `FormLogin.test.tsx` la trentaine de lignes qui substituent
`globalThis.fetch` et modélisent le contrat d'`apiFetch`. Le seuil d'extraction est posé à un
troisième formulaire testé, dans `AMELIORATIONS.md`.

**Preuve de la correction** — depuis `frontend/` : `npm run lint` ne rend rien, `npm test` rend
`Test Files  5 passed (5)` et `Tests  45 passed (45)` — 33 avant le lot —, et `npm run build`
`✓ built in 3.23s`. Les quatre contrôles de l'epic #116 : `grep -rn "type FormErrors"
frontend/src` ne sort que `hooks/useForm.ts`, `grep -rn "const handleChange" frontend/src`
aucune ligne, `grep -rnF 's@' frontend/src` la seule ligne de `lib/validationRules.ts`, et les
six formulaires importent le hook. Le parcours Playwright a été rejoué à la livraison de #117
et de #118, pile `compose.dev.yaml` levée ; il ne couvre pas l'inscription, et n'a donc pas été
relancé après #119.

---

## Lot 5 — Authentification côté front

Clos le 2026-09-22 · Epic #128 · Alimente : Bloc 1 — sécurité

**Constat mesuré** — le front ne savait pas qui était connecté. Les jetons tenaient en trois
lignes : `FormLogin.tsx:78-79` écrivait `access` et `refresh` dans `localStorage`, `api.ts:13`
relisait `access`. Le jeton de rafraîchissement n'était relu **nulle part** hors d'un test,
`git grep -i logout -- frontend/src` ne rendait **rien**, et `/blog` proposait « Crée un
articles » à tout visiteur. Le jeton d'accès valant 15 minutes, la session mourait au quart
d'heure sans un mot. Et un jeton mort resté dans `localStorage` faisait répondre `401` aux
lectures publiques, `/blog` en tête : DRF authentifie avant d'appliquer les permissions.

**Décision et justification** — quatre arbitrages.

**Un module et un hook, pas de contexte React.** `lib/tokens.ts` est seul à toucher aux jetons,
et `useIsAuthenticated` s'y abonne par `useSyncExternalStore`. L'état est lu dès le premier
rendu, sans effet, et une écriture faite hors de React — par `apiFetch`, quand un
renouvellement échoue — prévient les composants sans qu'aucun ne soit remonté. `App.tsx` n'a
pas été touché. Le témoin est le jeton de **rafraîchissement**, celui d'accès expirant toutes
les 15 minutes. Les clés `access` et `refresh` sont restées telles quelles : les renommer
aurait déconnecté toutes les sessions ouvertes au déploiement, et quatre fichiers de test les
gardent en dur pour que ce renommage fasse tomber la suite.

**Seul un `401` dit qu'un jeton est mort.** `apiFetch` renouvelle sur un `401` reçu avec un
jeton, puis rejoue la requête une fois. Un renouvellement refusé efface les deux jetons et
rejoue sans jeton — c'est ce qui rend `/blog` au visiteur porteur d'un jeton périmé. Une panne,
réseau ou `5xx`, garde les jetons : les effacer déconnecterait à chaque coupure. Les `401`
simultanés partagent un seul renouvellement, la rotation de l'issue #72 refusant un second
appel fait avec le même jeton. Les routes `/auth/` n'y entrent jamais, ce qui ferme la boucle.

**La déconnexion ne lève jamais.** `logout()` envoie le jeton à `logout/`, puis efface les deux
dans un `finally`, que l'API réponde ou non : une erreur remontée laisserait l'interface
connectée, sans autre moyen d'en sortir.

**Au visiteur, un lien à la place du bouton.** Sur `/blog`, « Se connecter pour publier »
remplace le bouton de création au lieu de le faire disparaître. Il a ouvert une entrée dans
`AMELIORATIONS.md` : une fois connecté, `FormLogin` ramène à `/`, et non à `/blog`.

**Ce qui a surpris** — quatre fois.

**Le lot devait laisser `backend/` intact, il a touché sept fichiers.** L'epic l'annonçait
noir sur blanc. Mais `login/refresh/` répondait `500` pour un compte supprimé : simplejwt
laissait passer l'erreur, et le front, qui tient une panne pour passagère, aurait gardé des
jetons morts jusqu'à l'échéance du refresh. `LoginRefreshView` la ramène à `401`. Les refus de
simplejwt sortaient aussi en anglais : l'app manquait à `INSTALLED_APPS`, son catalogue n'était
donc pas chargé, et les libellés qu'il marque fuzzy n'y sont pas compilés. D'où
`backend/locale/` et un `.mo` versionné, l'image n'ayant pas `gettext`.

**Le plan était en retard sur le code.** Il donnait au jeton d'accès 60 minutes, que le lot 1
avait déjà ramenées à 15, et prévoyait un `hooks/useAuth.ts` devenu un module et un hook.

**Un défaut d'accessibilité attendait sous le menu mobile.** Replié, il n'était caché que par
sa hauteur et son opacité : ses liens restaient atteignables au clavier, et « Se déconnecter »
l'aurait été aussi, activable sans être vu. `inert` le retire de la navigation au clavier tant
qu'il est fermé. Le parcours Playwright, lui, avait `127.0.0.1:5173` en dur, alors que ce port
était pris sur la machine par un autre projet : il lit désormais `FRONTEND_PORT_DEV`.

**Une demande est restée en route.** Le prompt de 5.4 voulait aussi qu'une liste vide et un
échec de chargement s'affichent sur `/blog`. L'issue #132 l'a renvoyé au lot 6, qui réécrivait
ce chargement pour la pagination — et #111, qui a livré cette pagination le même jour, ne l'a
pas repris. Le lot 6 en hérite.

**Preuve de la correction** — rejouée à l'état du merge de #136 (`38a0bad`), dernier du lot,
dans un worktree jetable. Depuis `frontend/` : `npm run lint` ne rend rien, `npm test` rend
`Test Files  7 passed (7)` et `Tests  67 passed (67)` — 45 avant le lot. Depuis `backend/` :
`Ran 64 tests`, `OK` — 59 avant. `grep -rn 'localStorage\.' frontend/src --exclude='*.test.*'`
ne sort que `lib/tokens.ts` et `hooks/useTheme.ts`, premier critère de l'epic #128. Le parcours
Playwright — connexion, mot de passe faux, déconnexion puis refus de l'ancien refresh en `401` —
a tourné à la livraison de #133, #134 et #135 ; il n'a pas été rejoué à la clôture, faute
d'identifiants de test sur la machine.

---

## Lot 6 — Pagination bout en bout

Clos le 2026-09-23 · Epic #138 · Alimente : Bloc 1 — optimisation

**Constat mesuré** — `GET /api/articles/` rendait **toute la table** : ni
`DEFAULT_PAGINATION_CLASS` ni `PAGE_SIZE` dans `REST_FRAMEWORK`, et aucune vue n'en posait.
L'issue #106 avait borné le **nombre de requêtes** de cette liste à une seule, jamais son
volume. Côté front, `Card.tsx:25` téléchargeait le texte entier de chaque article pour en
afficher cent caractères — `{article.content.slice(0, 100)}...` — et `Blog.tsx:18` typait la
réponse `apiFetch<Article[]>`, ligne que la pagination casserait. `healthcheck.py:17`
interrogeait `/api/articles/`. Rien ne permettait de voir tout cela à l'écran : la base de
développement contenait **deux** articles sur la machine où le lot a été préparé, et le dépôt
n'avait aucun moyen de la peupler — ni fixture, ni commande, ni migration de données.

Le seul poids réellement mesuré l'a été **après** la pagination, à la livraison de l'extrait :
une page de 12 articles de démonstration passe de **~10 100 à 3 206 octets**, et de 7 702 à
1 200 caractères de texte transporté. Le volume d'avant le lot n'a jamais été chiffré.

**Décision et justification** — sept arbitrages.

**Pages de 12, et `PageNumberPagination`.** Douze remplit sans trou la grille du blog, qu'elle
ait deux ou trois colonnes. La `CursorPagination` a été écartée : elle reprend après le dernier
article vu, mais ne donne pas le `count` que l'issue exigeait. Son défaut est assumé et
consigné dans `AMELIORATIONS.md` — un article supprimé entre deux chargements est sauté par
« Voir plus ». Le décalage inverse, une publication, est absorbé par un `Set` d'ids.

**L'ordre a dû être départagé.** `Meta.ordering` passe de `["-created_at"]` à
`["-created_at", "-id"]`, migration `0002` sans table touchée : deux articles publiés dans la
même seconde laissaient la base les ordonner à son gré, et une liste paginée peut alors montrer
l'un sur deux pages et l'autre jamais.

**`Page<T>` reste local à `Blog.tsx`.** Le prompt de 6.1 le conditionnait à un second lecteur ;
un seul endpoint est paginé. Le type générique attendra le deuxième.

**L'extrait est taillé par la base**, `Left("content", 100)` posé par `annotate()`, avec le
`defer("content")` qui va avec : le texte entier ne quitte plus PostgreSQL. Le tronquer en
Python l'aurait fait voyager pour le jeter. Les trois pièces — annotation, `defer`, champ
déclaré à la main dans le serializer — n'ont de sens qu'ensemble. La longueur de 100 est reprise
telle quelle du `slice(0, 100)` qu'affichait déjà la carte : **aucune autre valeur n'a été
discutée**, ni dans l'issue ni dans la PR.

**Deux types côté front, et non un type affaibli.** `ArticleListItem` à côté d'`Article`,
plutôt qu'un `Omit<Article, "content">` ou des champs rendus optionnels : la liste et le détail
ne rendent pas le même objet, et un `Article` complet promettrait un `content` absent.

**La sonde a quitté l'API.** Une route dédiée `health/`, vue Django nue et non DRF — le défaut
`IsAuthenticated` la fermerait, et ni le jeton ni les quotas n'ont de sens pour une sonde qui
s'appelle elle-même —, hors du préfixe `api/` que seul le nginx du serveur relaie. Son
`SELECT 1` coûte le même prix quel que soit le nombre d'articles. Effet de bord recherché : la
santé du conteneur ne dépend plus de la lecture publique du blog, qu'on pouvait fermer et
rendre ainsi tous les conteneurs malades.

**Le peuplement refuse de tourner en production.** 30 articles engendrés par 10 sujets × 3
angles, `bulk_create` dans une transaction, auteur de démonstration inactif et sans mot de
passe utilisable, et un `CommandError` avant toute écriture dès que `DEBUG` est faux — c'est
`production.py`, qui fige `DEBUG=False`, qui ferme la commande à la base de production.

**Ce qui a surpris** — six fois.

**La fréquence de la sonde était fausse d'un facteur six.** Le plan et le prompt de 6.2
disaient « toutes les 30 secondes (HEALTHCHECK du Dockerfile) ». C'est vrai de
`backend/Dockerfile:88`, mais les **deux** fichiers Compose surchargent l'`interval` à 5 s. Les
piles réelles payaient donc le `COUNT(*)` six fois plus souvent que le plan ne le croyait.

**6.2 devait ne toucher qu'un fichier, elle en a créé deux.** Le plan annonçait
« **Fichiers** : `backend/healthcheck.py` ». La livraison a créé `config/views.py` et
`config/tests.py` : `backend/` passe de trois à quatre fichiers de tests, et
`manage.py test config` devient une cible qui n'existait pas. La piste que le plan avait
préparée — un `?page_size=1` sur l'API — a été abandonnée avant même l'écriture du ticket : la
poser aurait exigé un `page_size_query_param`, qui laisse tout client choisir sa taille de page
et se borne alors par `max_page_size`.

**Une demande de 5.4 a fait deux sauts, et le lot 6 l'a d'abord aggravée.** L'affichage d'une
liste vide et d'un échec de chargement, renvoyé du lot 5 au lot 6 par #132, n'a pas été repris
par #111 — qui a en plus posé le `console.error` du 404 de première page que #140 a dû retirer
le lendemain.

**Deux défauts ne sont apparus qu'une fois le test écrit.** #140 a découvert après coup qu'un
message d'échec survivait à la disparition du bouton qui l'avait provoqué — « un échec
précédent inviterait à réessayer un bouton disparu » — et que le passage de la liste à `null`
cassait le cas d'une page suivante sur liste non chargée. #141, de son côté, a resserré son
propre test : vérifier l'`excerpt` et l'absence de `content` ne suffisait pas, un `fields`
raccourci aurait fait afficher « Par undefined le Invalid Date » sans qu'aucun test ne tombe.
D'où l'assertion sur le **jeu de champs complet**.

**Un champ a disparu que personne n'avait listé.** `updated_at` ne sort plus de la liste. Ni
l'issue ni le plan ne le mentionnaient : seul `content` était visé. Il a fallu un commit dédié
pour le dire au README.

**Le lot n'a rien ajouté à `AMELIORATIONS.md`** — le premier dans ce cas. La seule entrée de sa
matière avait été posée par #111, hors lot. Et l'epic #138 est restée **ouverte** alors que ses
quatre sous-issues étaient closes une à une : le piège du `Closes #N` qui ne ferme pas au merge
dans `preprod`, cette fois au niveau de l'epic.

**Preuve de la correction** — rejouée sur `preprod` au merge de #146 (`2f11c57`), dernier du
lot. Depuis `backend/` : `Ran 75 tests`, `OK` — 64 avant le lot —, et `manage.py test config`
est une cible neuve, 3 cas. Depuis `frontend/` : `npm run lint` ne rend rien, `npm test` rend
`Test Files  7 passed (7)` et `Tests  79 passed (79)` — 67 avant le lot, **aucun fichier de
test créé**, tout est passé par `Blog.test.tsx`, de 7 à 14 cas —, et `npm run build`
`✓ built in 2.57s`. À la livraison de #142, les deux piles montées avec `--build` : `backend`
`healthy` en développement comme en production, `/health/` à `200` (et `301` sans
`X-Forwarded-Proto`, comportement attendu), sonde exécutée dans les deux conteneurs en code 0.
`grep -n "api/articles" backend/healthcheck.py` ne rend aucune ligne. Le parcours Playwright
n'a pas été rejoué : il ne couvre pas le blog.

---

## Lot 7 — Navigation, liens et pages manquantes

Clos le 2026-09-25 · Epic #147 · Alimente : Bloc 1 — qualité

**Constat mesuré** — quatre défauts visibles à l'écran, aucun couvert par un test. Le pied de
page portait **16 liens en `<a href>`, dont 14 vers des routes qu'`App.tsx` ne déclarait pas** :
le seul endroit du dépôt où un lien interne rechargeait encore la page entière, pour arriver sur
`NotFound`. « Nous rejoindre » menait à `/contact` en mobile et à `/subscribe` en desktop,
l'inscription étant donc inatteignable depuis un téléphone. `/terms` et `/privacy`, cités par le
formulaire d'inscription, n'existaient pas. Et `ArticleDetails.tsx` restait figé sur
« Chargement… » à la moindre erreur, son `.catch(console.error)` laissant l'état à `null`. Filet
de départ : `npm test` rendait **7 fichiers, 79 cas**, aucun sur la navigation.

**Décision et justification** — quatre alternatives étaient ouvertes, toutes tranchées vers le
moins de code :

- les 14 destinations mortes du pied de page ont été **retirées**, non comblées par des pages
  « bientôt disponible » : une page vide est un lien mort qui a l'air vivant ;
- `/terms` et `/privacy` ont au contraire été **créées** plutôt que retirées du formulaire — un
  site qui collecte des données ne peut pas ne pas les annoncer ;
- la factorisation des liens d'action, cause de fond de la divergence mobile/desktop, a été
  **écartée vers le lot 8** : la traiter au passage aurait mêlé un refactoring à quatre
  corrections. Elle y est désormais inscrite, en 8.4 ;
- `AbortController` a été **écarté** pour la condition de course du détail d'article : il lève
  une `DOMException` qu'`isApiError` ne reconnaît pas, et `toFormErrors` l'aurait traduite par un
  message hors-ligne. Un drapeau dans le `cleanup` fait le même travail sans mentir sur la cause.

**Ce qui a surpris** — six fois, et jamais là où le plan regardait.

**Deux pages statiques ont fait sortir une faille de sécurité.** #149 ne demandait que d'écrire
des conditions d'utilisation et une politique de confidentialité sur le gabarit d'`About.tsx`.
Confrontées au code, **neuf affirmations écrites de bonne foi** se sont révélées fausses : le
site collecte aussi le prénom, le nom, le sujet du message et le titre de l'article ; le compte
naît inactif et un administrateur l'ouvre ; et surtout **l'adresse électronique de l'auteur est
publiée sous chaque article**, `CustomUser.__str__` rendant l'email que `StringRelatedField` sert
à tout visiteur. Les textes le disent désormais plutôt que de promettre une confidentialité que
le code ne tient pas. L'issue **#153** est née 28 secondes après la clôture de #149 — hors de ce
lot, dans l'epic sécurité, et **toujours ouverte** : les deux pages livrées portent aujourd'hui
l'aveu écrit d'un défaut non corrigé.

**Le lot a fabriqué le défaut qu'il a ensuite corrigé.** Tant que le pied de page pointait vers
14 routes mortes, il ne pouvait pas contredire l'en-tête. Remis sur les vraies routes par #150,
il proposait « Connexion » et « Inscription » à un membre connecté à qui l'en-tête offrait
« Se déconnecter ». #155 a été ouverte **une minute après le merge de #154**.

**Et le correctif de #155 a cassé le parcours Playwright.** Aligner le libellé du pied de page
sur celui du menu a donné **deux** correspondances à « Se connecter », et Playwright s'arrête sur
une résolution ambiguë au lieu d'en choisir une — mesuré au navigateur, deux avant, une après. Il
a fallu nommer les **deux** `nav` de la page là où l'issue n'en demandait qu'une. Parti corriger
la navigation, le lot a fini par la nommer.

**Masquer une entrée de menu a failli fermer le seul chemin de changement de mot de passe.**
Retirer toute la colonne COMPTE au membre connecté paraissait cohérent — jusqu'à ce que la revue
de la PR #158 rappelle qu'`App.tsx` n'a pas de page de profil et `accounts/urls.py` pas de route
de changement : `/forgot-password` est le seul recours, et le masquer obligeait à se déconnecter
pour changer son mot de passe. La colonne est restée, réduite à cette entrée. L'issue #159 ouvre
le vrai sujet.

**Un test a fait reparaître le défaut qu'il venait de couvrir.** #151 corrigeait la page figée sur
« Chargement… » ; le test écrit ensuite a montré qu'un refus arrivé après avoir quitté l'article
la figeait de nouveau, par un autre chemin. Dans le même lot, la revue de #150 a relevé qu'un
**garde-fou de test ne pouvait pas échouer** — et celle de #158, qu'un second ancrait sa garde
sur `/blog`, la seule destination qui n'avait jamais divergé.

**Le plan pointait des lignes qui n'existaient plus.** 7.1 citait `MobileMenu.tsx:66` et
`NavBar.tsx:85`, le code en était à `:86` et `:110` ; 7.3 citait `FormSubscribe.tsx:182` et
`:189`, le code en était à `:213` et `:220`. Les lots 4 et 5 avaient déplacé ces lignes entre la
rédaction du plan et sa mise en œuvre : le constat restait juste, l'adresse non.

**Preuve de la correction** — rejouée sur `preprod` au merge de #158 (`335d17e`), dernier du lot.
Depuis `frontend/` : `npm run lint` ne rend rien, `npm test` rend `Test Files  10 passed (10)` et
`Tests  99 passed (99)` — **7 fichiers et 79 cas avant le lot**, soit +3 fichiers et +20 cas, tous
dans des fichiers neufs —, et `npm run build` `✓ built in 2.84s`. Le diff du lot pèse
`1020 insertions(+), 67 deletions(-)` pour **5 fichiers créés sous `frontend/src/` : 2 pages et
3 tests**, soit 566 lignes de test pour 226 lignes de page. Le backend n'a pas été touché. Le
parcours Playwright n'a pas été rejoué faute de pile montée : la seule ligne que le lot y change,
la résolution du lien de connexion, a été mesurée dans un Chromium réel.
