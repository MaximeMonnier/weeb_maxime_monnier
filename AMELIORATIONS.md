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
- [ ] **Deux couleurs du thème sombre ne sont pas celles que leur commentaire annonce.**
      Dans `index.css`, `--color-dark-bg-primary` et `--color-dark-accent-primary` sont hors
      de la gamme sRGB, comme l'étaient les violets clairs : le fond annoncé `#0F172A`
      s'affiche `#00112F`, le violet annoncé `#A855F7` s'affiche `#C75EFF`. Le contraste
      « 4,5:1 sur le fond principal » du survol sombre vaut contre le fond affiché, et 4,3:1
      contre `#0F172A`. Repéré à l'issue #220. Piste : décider pour chacune entre la couleur
      affichée, qui garde l'écran tel quel, et celle de la maquette, puis mesurer les
      contrastes qui en dépendent avant de choisir.

## Docker — mise en ligne

Trois critères de l'epic de dockerisation #47 qu'aucune sous-issue n'a livrés, plus une dette
née de la façade. Rien de ce qui reste ne bloque le développement.

- [ ] **Durcir la façade du serveur.** Le nginx du serveur ne fait aujourd'hui que router :
      `/admin/` et les routes d'authentification (`/api/auth/login/`,
      `/api/auth/password-reset/`) n'y ont aucune limitation de débit ni restriction
      d'origine. Pistes : un `limit_req_zone` sur ces chemins, et un `allow`/`deny` sur
      `/admin/`. Moins urgent depuis l'issue #71 : Django limite ces deux routes lui-même.
      Le faire aussi devant garderait l'abus hors du processus Python, et couvrirait
      `/admin/`, que le throttling de DRF ne voit pas. S'y ajoutent les deux chantiers qu'un domaine réel ouvre : Let's Encrypt
      et HSTS remonté par paliers, à `0` tant que la pile est jointe sur `localhost`,
      qu'elle partage avec le développement.
- [ ] **Logs et métriques depuis une interface unique** : piste, Grafana + Loki pour les
      logs, cAdvisor pour les métriques de conteneurs, dans un troisième fichier Compose
      que la pile de production n'a pas à connaître : elle doit démarrer sans lui. Reste à
      trancher s'il s'ajoute par un `-f` ou s'il est autonome avec son propre `name:`.
      Périmètre à réduire avant de commencer.
- [ ] **Exécution des tests en conteneur isolé** : sur l'image de production, avec un
      service `db` éphémère, jamais sur l'image de développement. À reprendre avec le
      chantier des tests, qui dépasse Docker.
- [ ] **Les images ne sont publiées vers aucun registre.** `docker-images.yml` les construit
      sans les pousser, écarté volontairement le 2026-09-03 alors que l'epic #47 le
      demandait : sans serveur où faire `docker pull`, une image publiée ne sert à personne.
      Piste : ajouter le `push` au workflow existant le jour où une mise en ligne existe,
      conditionné à un push sur `main`, sinon chaque pull request pousserait une image.

## Backend — sécurité

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
- [ ] **Le parcours Playwright ne tourne pas en intégration continue.** `tests.yml` lance
      les suites Django et Vitest, mais `npm run test:e2e` exige la pile de `compose.dev.yaml`
      et un navigateur, que la machine de GitHub n'a pas. Le `forbidOnly` de
      `playwright.config.ts` reste donc une garde qui ne s'arme jamais. Piste : un job qui
      monte la pile par Compose et installe Chromium, avec un compte de test créé avant le
      parcours. Distinct de « Exécution des tests en conteneur isolé », qui vise l'image de
      production.

## (à compléter au fil de l'eau)
