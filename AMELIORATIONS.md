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

## (à compléter au fil de l'eau)
