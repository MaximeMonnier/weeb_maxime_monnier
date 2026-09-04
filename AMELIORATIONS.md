# Améliorations futures

Liste des idées d'amélioration repérées en cours de développement (utile pour le rapport
et pour les prochaines itérations).

## Frontend — UX
- [ ] **Toasts de succès / d'erreur** : afficher une notification (toast) après une action
      (formulaire de contact envoyé, inscription réussie, erreur API…) au lieu de se
      contenter d'un `console.error` ou d'un reset silencieux. Piste : librairie type
      `react-hot-toast` ou `sonner`, ou un petit composant Toast maison.

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
      `/admin/`. S'y ajoutent les deux chantiers qu'un domaine réel ouvre : Let's Encrypt
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
      n'envoie plus l'en-tête sur `/auth/` — les cinq routes y sont publiques, et le
      parcours de réinitialisation en dépendait — mais les publiques d'ailleurs restent
      exposées : `POST /api/contact/`, et les lectures `GET /api/articles/` et
      `/api/articles/{id}/`, que `IsAuthenticatedOrReadOnly` autorise sans jamais être
      atteint. La cause de fond demeure : aucun `logout` ne vide
      `localStorage` dans le dépôt, donc un token mort y reste indéfiniment. Pistes :
      lister les chemins publics plutôt que le seul préfixe `/auth/`, ou purger
      `localStorage.access` à la réception d'un `401`.

## Backend — sécurité

- [ ] **Envoyer les emails hors du cycle de la requête.** `PasswordResetRequestView` rend
      désormais la même réponse que le compte existe ou non, mais elle n'envoie l'email que
      dans le premier cas, et l'envoi est synchrone : mesuré sur Mailpit en local, 40 ms
      contre 10 ms, soit un oracle de temps qui rétablit ce que le corps neutre masque.
      L'écart se creuse avec un vrai serveur SMTP. Piste : une file de tâches (Celery, ou
      `django-tasks`) ; le projet n'en a aucune aujourd'hui, et en poser une pour ce seul
      envoi est disproportionné. Un `threading.Thread(daemon=True)` refermerait l'essentiel
      de l'écart en trois lignes, mais un envoi perdu le serait en silence, sans réessai ni
      trace : il déplace le problème plutôt qu'il ne le règle. À reprendre avec la limitation
      de débit de l'issue #71, qui borne l'exploitation de l'oracle sans le supprimer — et
      qui borne surtout un risque neuf : l'endpoint déclenche maintenant un aller-retour SMTP
      par requête non authentifiée, donc du mail-bombing contre n'importe quelle adresse
      inscrite. `ScopedRateThrottle` de DRF y suffit, sans nouvelle dépendance.
- [ ] **`/api/auth/register/` énumère les comptes.** L'`UniqueValidator` du champ `email`
      de `RegisterSerializer` fait répondre `400` en nommant l'adresse déjà inscrite. Le
      corps neutre posé sur `/password-reset/` par l'issue #68 ne protège donc rien tant
      que ce voisin répond : la même question se pose à l'inscription et obtient une
      réponse franche. À traiter dans l'epic sécurité #65.
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

## Intégration continue

- [ ] **Aucun job de test dans la CI.** `.github/workflows/docker-images.yml` construit les
      deux images et rien d'autre ; depuis l'issue #68 le dépôt a une suite de tests, qui ne
      tourne donc que sur la machine de qui pense à la lancer. Un job avec un service `postgres`
      et les `POSTGRES_*` en variables suffit — `config/settings/test.py` appelle
      `postgres_database()` et `env_required`, il lui faut une vraie base. À ne pas confondre
      avec l'entrée « Exécution des tests en conteneur isolé » ci-dessus, qui vise l'image
      de production et reste un chantier distinct.

## (à compléter au fil de l'eau)
