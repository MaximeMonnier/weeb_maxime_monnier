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
née du terminateur TLS — cinq entrées en tout, dont deux livrées : le terminateur TLS, seul
critère qui rendait la production inutilisable, et la construction des images en intégration
continue. Rien de ce qui reste ne bloque le développement.

- [x] **Terminateur TLS devant la production** — livré. Un service `proxy` (nginx,
      `proxy/`) est seul à publier des ports, termine le TLS et **écrase**
      `X-Forwarded-Proto` (`proxy_set_header X-Forwarded-Proto $scheme`). Le front et
      l'API sont désormais sur la même origine : CORS a disparu de la production et
      `VITE_API_URL` y vaut `/api`. Reste à faire le jour où un domaine réel existe :
      Let's Encrypt à la place du certificat local, et HSTS remonté par paliers — il est
      à 0 tant que la production est servie sur `localhost`, qu'elle partage avec la pile
      de développement.
- [ ] **Limiter ce que le proxy expose au réseau.** Depuis le point ci-dessus, la pile ne
      publie plus sur `127.0.0.1` mais sur toutes les interfaces : `/admin/` et les routes
      d'authentification (`/api/auth/login/`, `/api/auth/password-reset/`) sont donc
      joignables depuis le réseau local, sans aucune limitation de débit. Pistes : un
      `limit_req_zone` nginx sur ces chemins, et un `allow`/`deny` sur `/admin/`. Rien
      d'urgent sur un poste, indispensable avant une vraie mise en ligne.
- [x] **Construction des images en intégration continue** — livré.
      `.github/workflows/docker-images.yml` construit les **trois** images à chaque push sur
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
