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
