# Améliorations futures

Liste des idées d'amélioration repérées en cours de développement (utile pour le rapport
et pour les prochaines itérations).

## Frontend — UX
- [ ] **Toasts de succès / d'erreur** — la moitié « erreur » est livrée par l'issue #79 :
      `lib/apiErrors.ts` traduit les refus de l'API et chaque formulaire les affiche, en
      place des `console.error`. Ce qui reste est la notification **de succès**, qui n'existe
      qu'à trois endroits, tous écrits dans la page : le formulaire de contact, la demande de
      réinitialisation, qui affiche le message de l'API, et l'inscription depuis l'issue #119,
      qui ne quitte plus la page pour cette raison même. Une publication d'article ne dit rien,
      elle — `onCreated` ferme la modale et recharge la liste, sans quitter `/blog`. Piste
      inchangée : librairie type
      `react-hot-toast` ou `sonner`, ou un composant Toast maison — c'est le point où ce
      message survivrait à la navigation.
- [ ] **La connexion ne ramène pas là d'où l'on vient.** `FormLogin.tsx` mène toujours à
      `/` après succès. Depuis l'issue #132, le blog envoie le visiteur vers `/login` par un
      lien « Se connecter pour publier » : une fois connecté, il doit retrouver `/blog` seul.
      Piste : l'origine passée dans le `state` du `Link`, que `FormLogin` relit — et non un
      paramètre `?next=` dans l'adresse, qui, recopié tel quel, ouvrirait une redirection
      vers un site tiers.
- [ ] **« Voir plus d'articles » peut en sauter un.** Depuis l'issue #111, l'API découpe la
      liste par position (`?page=N`) : un article supprimé entre deux chargements remonte
      la suite d'un cran, et le premier de la page suivante n'est jamais affiché. Le
      décalage inverse, une publication, est déjà absorbé — `Blog.tsx` écarte le doublon
      qu'elle produit. Piste : la `CursorPagination` de DRF, qui reprend après le dernier
      article vu, mais ne donne pas le `count` que l'issue exigeait.
- [x] **Les paragraphes d'un article disparaissent à la lecture** — réglé par l'issue
      #216. `ArticleDetails.tsx` découpe `content` aux lignes vides et rend un `<p>` par
      paragraphe : `whitespace-pre-line` seul aurait rétabli l'aspect, mais un lecteur
      d'écran aurait toujours annoncé un bloc unique. Il reste posé sur chaque `<p>`, pour
      qu'une ligne simple garde son retour. Aucun `dangerouslySetInnerHTML` : React échappe
      toujours le texte, un `<b>` saisi s'affiche tel quel.
- [x] **L'extrait finit toujours par « ... »** — réglé par l'issue #217. La liste rend
      `excerpt_truncated`, calculé par PostgreSQL dans le même `annotate` que l'extrait, et
      `Card.tsx` ne pose les points de suspension que s'il est vrai. Comparer la longueur de
      l'extrait côté front aurait marché aussi, mais en recopiant `LONGUEUR_EXTRAIT` dans un
      second fichier : un article d'exactement 100 caractères aurait de plus été pris pour
      coupé.
- [x] **Sur mobile, l'accueil défile en largeur** — réglé par l'issue #219. Dans
      `BrandBanner.tsx`, le `<div>` qui enveloppe `LogoBanner`, enfant d'un flex
      `items-center`, prenait la largeur de son contenu, et le masque du bandeau s'étalait
      jusqu'à ses 70rem. Il porte désormais `w-full`, comme celui du carrousel (#189). La
      mesure se fait au navigateur, jsdom ne calculant aucune mise en page : à 375 px, la
      page passe de 748 à 375 px de large.
- [ ] **Le violet du thème clair n'atteint pas le contraste minimal.** Dans `index.css`,
      `--color-light-accent-primary` vaut `oklch(0.64 0.29 305)`, hors de la gamme sRGB :
      l'écran le ramène vers `#B73BFF`, plus clair que le `#9333EA` de la maquette cité en
      commentaire. Le texte violet tombe ainsi à 4,1:1 sur fond blanc et 3,8:1 sur le fond
      secondaire, sous les 4,5:1 du niveau AA — le lien actif du menu mobile en tête. La
      maquette donnait 5,4:1 sur blanc. Repéré à l'issue #193. Piste : transcrire
      `#9333EA`, soit `oklch(0.558 0.252 302)`, et revoir avec lui
      `--color-light-accent-hover`, hors gamme lui aussi.

## Docker — mise en ligne

Quatre critères de l'epic de dockerisation qu'aucune sous-issue n'a couverts, plus une dette
née de la façade — cinq entrées en tout, dont deux livrées : le terminateur TLS, dont le
travail vit désormais hors du dépôt, et la construction des images en intégration continue.
Rien de ce qui reste ne bloque le développement.

- [x] **Terminateur TLS devant la production** — livré, puis **retiré du dépôt le
      2026-09-03**. Un service `proxy` (nginx, `proxy/`) a porté le TLS, le routage et
      l'écrasement de `X-Forwarded-Proto` jusqu'à ce qu'il apparaisse que le serveur de
      production a déjà nginx : deux terminateurs empilés, dont le second ne payait rien.
      Ce qui reste du travail est la **configuration de référence du nginx du serveur**,
      au README, § « Déployer derrière le nginx du serveur ». La pile, elle, publie le
      front et l'API en clair sur `127.0.0.1` et rien d'autre. Ce qui n'a pas bougé : le
      site et l'API sur la même origine, donc pas de CORS en production et
      `VITE_API_URL=/api`.
- [ ] **Durcir la façade du serveur.** Le nginx du serveur ne fait aujourd'hui que router :
      `/admin/` et les routes d'authentification (`/api/auth/login/`,
      `/api/auth/password-reset/`) n'y ont aucune limitation de débit ni restriction
      d'origine. Pistes : un `limit_req_zone` sur ces chemins, et un `allow`/`deny` sur
      `/admin/`. Moins urgent depuis l'issue #71 : Django limite ces deux routes lui-même.
      Le faire aussi devant garderait l'abus hors du processus Python, et couvrirait
      `/admin/`, que le throttling de DRF ne voit pas. S'y ajoutent les deux chantiers qu'un domaine réel ouvre : Let's Encrypt
      et HSTS remonté par paliers, à `0` tant que la pile est jointe sur `localhost`,
      qu'elle partage avec le développement.
- [x] **Construction des images en intégration continue** — livré.
      `.github/workflows/docker-images.yml` construit les **deux** images à chaque push sur
      `preprod` ou sur `main`, et sur chaque pull request qui vise l'une des deux — `main`
      étant la branche qui partira sur un serveur, elle est vérifiée aussi. Un job par image,
      avec un cache de layers dont la portée est propre à chacune. La machine de GitHub part
      de zéro — sans cache, sans `node_modules`, sans `.env` — ce qui est le seul endroit où
      se voient un `.dockerignore` mal réglé ou une dépendance absente de `requirements.txt`.

      **La publication vers un registre reste écartée volontairement** (décidé le 2026-09-03),
      alors que l'epic #47 la demandait. Pousser des images n'a de valeur que si quelqu'un
      fait `docker pull`, et il n'existe aucun serveur où déployer : le bénéfice serait nul
      et la dette réelle. À reprendre le jour où une mise en ligne existe — ajouter le
      `push` au workflow existant sera une dizaine de lignes.
- [ ] **Logs et métriques depuis une interface unique** : piste, Grafana + Loki pour les
      logs, cAdvisor pour les métriques de conteneurs, dans un troisième fichier Compose
      que la pile de production n'a pas à connaître : elle doit démarrer sans lui. Reste à
      trancher s'il s'ajoute par un `-f` ou s'il est autonome avec son propre `name:`.
      Périmètre à réduire avant de commencer.
- [ ] **Exécution des tests en conteneur isolé** : sur l'image de production, avec un
      service `db` éphémère, jamais sur l'image de développement. À reprendre avec le
      chantier des tests, qui dépasse Docker.

## Frontend — code mort

- [x] **La variante `hash` de `NavItem` n'a plus aucun lien** — réglé par l'issue #218.
      La variante, `scrollToHash`, `handleHashClick` et la prop `onHashClick` sont retirés,
      aucune ancre de défilement n'étant prévue. `NavItem` se réduit à `{ to, label }` : son
      champ `type` ne départageait plus rien, et `LienPartage` disparaît avec lui.

## Frontend — sécurité

- [x] **`apiFetch` joint encore le token aux endpoints publics hors `/auth/`** — réglé par
      l'issue #130, sans liste de chemins publics. simplejwt authentifie **avant**
      d'appliquer les permissions : un `localStorage.access` périmé faisait répondre `401`
      à `POST /api/contact/` et aux lectures d'articles, que `IsAuthenticatedOrReadOnly`
      autorise. `apiFetch` renouvelle désormais le jeton sur ce `401`, et si le
      renouvellement est refusé, efface les deux jetons puis rejoue la requête sans : un
      jeton mort disparaît au premier appel, qui aboutit quand même. Le prix est deux
      allers-retours de plus sur cet appel, le renouvellement puis le rejeu. `/auth/` reste
      exclu d'office, sauf ce que liste `ROUTES_AUTH_PROTEGEES` : `password-change/`, seule
      route `/auth/` réservée au membre depuis l'issue #159. Une nouvelle s'y inscrit, ou reçoit `401`.
- [x] **Le front ne rafraîchit pas ses jetons, et la session dure 15 minutes** — réglé par
      l'issue #130. `apiFetch` appelle `/api/auth/login/refresh/` sur un `401` et **range le
      `refresh` rendu**, que la rotation de l'issue #72 rend obligatoire. La session dure
      désormais jusqu'à un jour sans renouvellement. La déconnexion a suivi avec l'issue
      #131 : le menu appelle `POST /api/auth/logout/`, et efface les deux jetons même si
      l'appel échoue.

## Backend — sécurité

- [x] **Réinitialiser son mot de passe ne coupe pas les sessions ouvertes** — réglé par
      l'issue #213. `PasswordResetConfirmView` met désormais en liste noire chaque refresh du
      compte, par la même fonction que `PasswordChangeView` : `set_password_and_revoke`, qui
      change le mot de passe et révoque dans une seule transaction. Le jeton d'accès, lui,
      vit toujours ses 15 minutes : rien ne le révoque, voir `base.py`.
- [x] **La confirmation de réinitialisation n'a pas de quota** — réglé par l'issue #214.
      `PasswordResetConfirmView` porte le scope `password_reset_confirm`, 5 par heure et par
      adresse IP, réglable par `THROTTLE_PASSWORD_RESET_CONFIRM`. Scope à part pour que la
      demande et la confirmation ne se consomment pas leur quota l'une l'autre.
- [x] **Aucune borne de longueur sur les mots de passe ni sur les textes longs** — réglé
      par l'issue #215. Les mots de passe s'arrêtent à 128 caractères, connexion comprise,
      `Article.content` à 20 000 et `Contact.message` à 5 000. La borne vit dans les
      serializers et non dans les modèles : un `TextField` n'a pas de longueur en base, et
      rien n'est à migrer. La connexion passe pour cela par `LoginSerializer`, qui sous-classe
      celui de simplejwt.
- [ ] **Envoyer les emails hors du cycle de la requête.** `PasswordResetRequestView` rend
      désormais la même réponse que le compte existe ou non, mais elle n'envoie l'email que
      dans le premier cas, et l'envoi est synchrone : mesuré sur Mailpit en local, 40 ms
      contre 10 ms, soit un oracle de temps qui rétablit ce que le corps neutre masque.
      L'écart se creuse avec un vrai serveur SMTP. Piste : une file de tâches (Celery, ou
      `django-tasks`) ; le projet n'en a aucune aujourd'hui, et en poser une pour ce seul
      envoi est disproportionné. Un `threading.Thread(daemon=True)` refermerait l'essentiel
      de l'écart en trois lignes, mais un envoi perdu le serait en silence, sans réessai ni
      trace : il déplace le problème plutôt qu'il ne le règle. La moitié « débit » de cette
      entrée est livrée par l'issue #71 : `ScopedRateThrottle` limite la demande de
      réinitialisation à 3 appels par heure et par adresse IP, ce qui borne l'exploitation de
      l'oracle sans le supprimer, et ferme surtout le mail-bombing que l'envoi SMTP par
      requête non authentifiée avait ouvert. L'écart de temps, lui, reste entier.
- [ ] **Le validateur de similarité est muet à la réinitialisation.** `UserAttributeSimilarityValidator`
      compare le mot de passe aux attributs du compte, et l'issue #69 le lui donne à
      l'inscription — mais pas à la confirmation : `PasswordResetConfirmSerializer` valide
      avant que la vue n'ait décodé l'`uid`, donc sans titulaire, et Django ignore alors ce
      validateur en silence. Un compte peut ainsi reprendre son propre email comme mot de
      passe, ce que l'inscription lui refuse — dès lors que cet email porte une majuscule et
      un chiffre et huit caractères, la complexité et la longueur filtrant les autres. Lui passer l'utilisateur suppose de décoder
      l'`uid` et de vérifier le token **avant** la validation du mot de passe, donc de
      déplacer dans le serializer ce que la vue tient aujourd'hui — et l'issue #68 vient d'y
      régler l'indistinguabilité des deux échecs, qu'un tel déplacement rejouerait. À
      reprendre avec l'epic sécurité #65, d'un seul tenant.
- [ ] **`/api/auth/register/` énumère les comptes.** L'`UniqueValidator` du champ `email`
      de `RegisterSerializer` fait répondre `400` en nommant l'adresse déjà inscrite. Le
      corps neutre posé sur `/password-reset/` par l'issue #68 ne protège donc rien tant
      que ce voisin répond : la même question se pose à l'inscription et obtient une
      réponse franche. À traiter dans l'epic sécurité #65. L'issue #79 a posé un cache
      côté front — `FormSubscribe` remplace ce message par un libellé qui ne nomme pas
      l'adresse — mais il ne vaut que pour qui passe par le formulaire : la réponse HTTP,
      elle, n'a pas changé, et c'est elle qu'un script lit.
- [ ] **Comparaison d'email sensible à la casse.** `CustomUser.objects.get(email=...)` est
      exact sous Postgres, et `normalize_email` ne minuscule que le domaine : un compte
      enregistré `Jean@x.fr` ne se reconnaît pas sous `jean@x.fr`, ni au login ni à la
      réinitialisation. Depuis #68 la réinitialisation n'a plus de 404 pour le signaler,
      la panne est donc muette. À trancher globalement — normaliser à l'inscription, ou
      passer login et réinitialisation en `iexact` ensemble — jamais d'un seul côté.
- [ ] **Aucun `LOGGING` dans `config/settings/`.** `send_password_reset_link` avale la
      panne SMTP pour ne pas trahir l'existence du compte, et `logger.exception` est alors
      sa seule trace ; faute de configuration, elle sort par le handler de dernier recours
      de Python, sans horodatage ni niveau, hors de portée de `mail_admins`. Un handler
      console explicite suffirait à rendre ce chemin d'échec lisible.
- [ ] **Rien ne purge les tables de `token_blacklist`.** Depuis l'issue #72, chaque connexion
      et chaque rafraîchissement y écrivent une ligne qu'aucun processus ne reprend :
      `OutstandingToken` et `BlacklistedToken` ne font que croître, y compris pour des jetons
      expirés depuis longtemps et donc sans effet. simplejwt livre la commande
      `python manage.py flushexpiredtokens` pour ce ménage, mais rien ne la déclenche — le
      dépôt n'a ni tâche planifiée ni cron dans ses conteneurs. Sans conséquence à l'échelle
      d'un projet pédagogique ; à reprendre le jour où une file de tâches entrera, la même
      qui manque à l'envoi des emails ci-dessus.
- [ ] **Le commentaire des quotas dans `base.py` dit « comptés par IP ».** C'est faux pour
      `password_change` : `ScopedRateThrottle` compte par compte dès que le membre est
      connecté, ce que le README et `.env.example` disent justement. Un lecteur de `base.py`
      en conclurait qu'un membre derrière la même IP qu'un autre partage son quota. Repéré
      à la revue de l'issue #214.

## Intégration continue

- [x] **Aucun job de test dans la CI** — réglé par l'issue #91, au lot 2.
      `.github/workflows/tests.yml` lance les deux suites à chaque push sur `preprod` ou
      `main` et sur chaque pull request qui vise l'une des deux, le back contre un service
      `postgres`. Le parcours Playwright n'y tourne pas, faute de pile Compose et de
      navigateur. L'entrée « Exécution des tests en conteneur isolé » ci-dessus reste un
      chantier distinct : elle vise l'image de production.

## Tests

- [ ] **Doublon réseau d'un test rendu à l'autre.** `FormLogin.test.tsx` et
      `FormSubscribe.test.tsx` portent chacun leur `reponse()`, leur `requeteEnvoyee()` et le
      couple `beforeEach`/`afterEach` qui substitue `globalThis.fetch` — une trentaine de
      lignes identiques. Elles modélisent le contrat d'`apiFetch` (`ok`, `status`, `json()`) :
      à deux endroits, elles dériveront séparément le jour où `lib/api.ts` changera. Un
      troisième formulaire testé impose l'extraction. Piste : un module de test partagé,
      importé explicitement par chaque fichier — surtout pas un `setupFiles`, `globals`
      restant à `false`. Repéré à l'issue #119. Depuis, `useIsAuthenticated.test.ts` et
      `Blog.test.tsx` (#132) substituent `fetch` à leur tour, sans formulaire. Le seuil est franchi depuis l'issue #159 :
      `ChangePassword.test.tsx` est le troisième formulaire testé, et `ArticleDetails.test.tsx`
      substitue aussi `fetch` — sept fichiers au total, `api.test.ts` compris.

## (à compléter au fil de l'eau)
