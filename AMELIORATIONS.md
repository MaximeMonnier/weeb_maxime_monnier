# Améliorations futures

Liste des idées d'amélioration repérées en cours de développement (utile pour le rapport
et pour les prochaines itérations).

## Frontend — UX
- [ ] **Toasts de succès / d'erreur** — la moitié « erreur » est livrée par l'issue #79 :
      `lib/apiErrors.ts` traduit les refus de l'API et chaque formulaire les affiche, en
      place des `console.error`. Ce qui reste est la notification **de succès**, qui n'existe
      qu'à quatre endroits, tous écrits dans la page : le formulaire de contact, la demande de
      réinitialisation, qui affiche le message de l'API, l'inscription depuis l'issue #119,
      qui ne quitte plus la page pour cette raison même, et le changement de mot de passe. Une publication d'article ne dit rien,
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
- [ ] **Le refus d'une publication reste affiché à la réouverture de la modale.** Le
      `Modal` de `Blog.tsx` reste montée, fermée ou non : `FormArticle` garde ses erreurs, et
      qui ferme la modale après un refus le retrouve en la rouvrant. Écarté au lot 10 comme
      trop mineur. Piste : vider les seules erreurs dans le `onClose` de la `Modal` — une
      `key` changée à l'ouverture remonterait le formulaire, mais perdrait aussi le texte que
      le message du `401` invite à copier.

## Frontend — code

- [ ] **La palette garde l'écran actuel ou revient à la maquette ?** Hors les blancs et les
      deux violets clairs, les couleurs du `@theme` d'`index.css` ne rendent pas celles de la
      maquette : cinq sortent de la gamme sRGB, les gris s'affichent plus sombres et moins
      bleus. Repéré aux issues #220 et #233. Piste : garder l'écran, ou recalculer les valeurs
      depuis la maquette — puis mesurer les contrastes qui en dépendent avant de choisir.
- [ ] **Les messages du mot de passe sont recopiés dans trois formulaires.** L'issue #245 a
      mis en commun les règles dans `lib/validationRules.ts`, pas leurs textes : les refus de
      longueur, de complexité et de confirmation, et l'aide « Au moins 8 caractères avec
      majuscule, minuscule et chiffre », sont écrits à la main dans `FormSubscribe.tsx`,
      `ChangePassword.tsx` et `ResetPassword.tsx`. Chaque test lit son propre formulaire,
      aucun ne les compare : une règle qui change laisse les trois annoncer l'ancienne.
      Repéré à l'issue #246. Piste : exporter les messages et l'aide à côté des règles.

## Docker — mise en ligne

Deux critères de l'epic de dockerisation #47 qu'aucune sous-issue n'a livrés, plus une dette
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

## Intégration continue

- [ ] **Épingler les actions des workflows par SHA.** `tests.yml` et `docker-images.yml`
      les visent par étiquette (`@v7`, `@v4`), qu'un éditeur compromis peut déplacer.
      Depuis l'issue #314, `docker-images.yml` tient un jeton `packages: write` : une action
      détournée pourrait publier sur GHCR. Viser le SHA complet, l'étiquette en commentaire.

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
- [ ] **Rien ne purge les tables de `token_blacklist`.** Depuis l'issue #72, chaque connexion
      et chaque rafraîchissement y écrivent une ligne qu'aucun processus ne reprend :
      `OutstandingToken` et `BlacklistedToken` ne font que croître, y compris pour des jetons
      expirés depuis longtemps et donc sans effet. simplejwt livre la commande
      `python manage.py flushexpiredtokens` pour ce ménage, mais rien ne la déclenche — le
      dépôt n'a ni tâche planifiée ni cron dans ses conteneurs. Sans conséquence à l'échelle
      d'un projet pédagogique ; à reprendre le jour où une file de tâches entrera, la même
      qui manque à l'envoi des emails ci-dessus.
- [ ] **Une connexion à l'ancien mot de passe peut survivre au changement.** L'issue #250 a
      sérialisé la rotation de `login/refresh/` et `set_password_and_revoke` par un verrou sur
      la ligne du compte, mais `login/` ne le prend pas : une connexion lancée pendant la
      transaction du changement lit encore l'ancien hachage, puis inscrit son refresh après la
      lecture des jetons à révoquer. Même fenêtre de quelques millisecondes, même effet : une
      session ouverte avec l'ancien mot de passe vit son `REFRESH_TOKEN_LIFETIME`. Piste : le
      même `select_for_update()` dans `LoginSerializer.validate`, pris avant `authenticate()`.
- [ ] **`set_password_and_revoke` réécrit tout le compte.** `user.save()` enregistre chaque
      champ de l'instance lue avant le verrou — `request.user`, ou celle de la confirmation. Un
      compte désactivé par un administrateur pendant le changement repasse donc `is_active=True`.
      `user.save(update_fields=["password"])` suffirait. Repéré à la revue de l'issue #250.
- [ ] **Les deux jetons restent lisibles par tout script de la page.** `lib/tokens.ts` les
      range dans `localStorage` : la CSP posée par l'issue #278 ferme les scripts injectés,
      mais un seul XSS qui la contournerait emporterait encore le refresh, valable un jour.
      Piste : le refresh en cookie `httpOnly`, `Secure`, `SameSite=Strict`, posé et lu par
      `login/` et `login/refresh/`, l'accès restant en mémoire. Cela touche `apiFetch`, la
      déconnexion et le CORS, et ouvre la question du CSRF que le Bearer seul évitait.
- [ ] **Les pages servies par Django n'ont aucune CSP.** Celle de l'issue #278 vit dans
      `frontend/nginx.conf` et ne couvre que le front : l'admin et l'API navigable de DRF
      passent par le nginx du serveur jusqu'à Django, sans en-tête. Piste : `SECURE_CSP` et
      `ContentSecurityPolicyMiddleware`, livrés par Django 6.0, dans `production.py` —
      après avoir mesuré ce que l'admin exige en scripts et styles en ligne.
- [ ] **Le rapport des 500 reprend le message de l'exception et les paramètres d'URL.**
      L'issue #319 y masque le corps POST, les IP, le Referer et la ligne `USER`, pas le
      reste : le message d'une `IntegrityError` PostgreSQL cite la valeur en cause, un email
      par exemple, et les paramètres `GET` sortent en clair, dans l'URL comme dans leur section.
      Piste : étendre `RapportSansUtilisateur` (`config/rapport_erreurs.py`) pour masquer
      les valeurs `GET` et ne garder que le type des erreurs de base de données.

## Backend — code

- [ ] **Des fins de ligne redisent encore le code.** L'issue #263 a retiré celles que son
      ticket nommait, pas les autres : dans `config/settings/base.py`, celles de
      `rest_framework`, `corsheaders`, de l'authentification JWT et de
      `REFRESH_TOKEN_LIFETIME` ; dans `production.py`, les cinq des réglages de sécurité ; dans
      `accounts/models.py`, celles d'`is_active`, `is_staff`, `USERNAME_FIELD` et
      `REQUIRED_FIELDS`. Repéré à la revue de l'issue #263. Piste : ne garder que celles qui
      disent un pourquoi, comme « demandés en plus par createsuperuser ».

## Fonctionnalités écartées

- [ ] **Aucun endpoint profil.** L'API n'expose ni `GET /api/auth/me/` ni équivalent : le
      front sait qu'un membre est connecté, jamais qui il est, et `routes.tsx` n'a pas de page de
      profil. La tâche 5.1 de `correction.md` a tranché pour un simple booléen, l'ajout
      backend devant être proposé à part. Piste : une `RetrieveUpdateAPIView` sur
      `request.user`, réservée au membre, dont le serializer ne rend que le prénom, le nom et
      l'email — rendre l'email modifiable y ajouterait un second point d'énumération, voir
      « `/api/auth/register/` énumère les comptes » ci-dessus.
- [ ] **Images de couverture d'article.** `coverImg` a été retiré du type et de `ArticleCard.tsx` par
      l'issue #175 (tâche 9.1) : ni le modèle `Article` ni les deux serializers de
      `backend/articles/serializers.py` n'ont de champ image, et la branche d'affichage ne
      s'exécutait jamais. C'est une fonctionnalité, pas un nettoyage. Piste : un `ImageField`
      (donc Pillow), des médias servis par le conteneur du front comme `/static/`, et le champ
      ajouté aux types `Article` et `ArticleListItem` en même temps qu'aux serializers.

## (à compléter au fil de l'eau)
