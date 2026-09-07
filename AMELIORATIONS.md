# Améliorations futures

Liste des idées d'amélioration repérées en cours de développement (utile pour le rapport
et pour les prochaines itérations).

## Frontend — UX
- [ ] **Toasts de succès / d'erreur** — la moitié « erreur » est livrée par l'issue #79 :
      `lib/apiErrors.ts` traduit les refus de l'API et chaque formulaire les affiche, en
      place des `console.error`. Ce qui reste est la notification **de succès**, qui n'existe
      qu'au formulaire de contact et à la demande de réinitialisation, chacune en dur dans sa
      page. Une inscription ou une publication d'article réussies ne disent toujours rien :
      elles changent de page, et l'écran d'arrivée ne sait pas d'où l'on vient. Piste
      inchangée : librairie type `react-hot-toast` ou `sonner`, ou un composant Toast maison
      — c'est le point où ce message survivrait à la navigation.

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

## Frontend — sécurité

- [ ] **`apiFetch` joint encore le token aux endpoints publics hors `/auth/`.** simplejwt
      authentifie **avant** d'appliquer les permissions : un `localStorage.access` périmé
      fait répondre `401` à une vue `AllowAny`, sans que rien ne le dise. `lib/api.ts`
      n'envoie plus l'en-tête sur `/auth/` — les six routes y sont publiques, et le
      parcours de réinitialisation en dépendait — mais les publiques d'ailleurs restent
      exposées : `POST /api/contact/`, et les lectures `GET /api/articles/` et
      `/api/articles/{id}/`, que `IsAuthenticatedOrReadOnly` autorise sans jamais être
      atteint. La cause de fond demeure : l'issue #72 a ouvert
      `POST /api/auth/logout/` côté API, mais aucun écran du front ne l'appelle ni ne vide
      `localStorage`, donc un token mort y reste indéfiniment. Pistes :
      lister les chemins publics plutôt que le seul préfixe `/auth/`, ou purger
      `localStorage.access` à la réception d'un `401`.
- [ ] **Le front ne rafraîchit pas ses jetons, et la session dure 15 minutes.**
      `FormLogin.tsx` range `access` et `refresh` dans `localStorage`, mais aucun fichier
      n'appelle `/api/auth/login/refresh/` : le jeton d'accès expire sans être renouvelé et
      l'utilisateur se retrouve déconnecté. L'issue #72 a resserré `ACCESS_TOKEN_LIFETIME`
      de 60 à 15 minutes — le bon arbitrage pour un jeton logé dans `localStorage`, mais il
      raccourcit d'autant une session que rien ne prolonge. Le lot 5.2 doit poser ce
      rafraîchissement, et **stocker le `refresh` renvoyé en réponse** : depuis la même
      issue, `login/refresh/` en rend un neuf et révoque celui qui a servi, donc un client
      qui garde l'ancien se coupe lui-même au deuxième appel. La déconnexion existe côté
      API, `POST /api/auth/logout/`, et attend le même geste côté front.

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

## Intégration continue

- [ ] **Aucun job de test dans la CI.** `.github/workflows/docker-images.yml` construit les
      deux images et rien d'autre ; depuis l'issue #68 le dépôt a une suite de tests, qui ne
      tourne donc que sur la machine de qui pense à la lancer. Un job avec un service `postgres`
      et les `POSTGRES_*` en variables suffit — `config/settings/test.py` appelle
      `postgres_database()` et `env_required`, il lui faut une vraie base. À ne pas confondre
      avec l'entrée « Exécution des tests en conteneur isolé » ci-dessus, qui vise l'image
      de production et reste un chantier distinct.

## (à compléter au fil de l'eau)
