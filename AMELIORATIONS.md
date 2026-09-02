# Améliorations futures

Liste des idées d'amélioration repérées en cours de développement (utile pour le rapport
et pour les prochaines itérations).

## Frontend — UX
- [ ] **Toasts de succès / d'erreur** : afficher une notification (toast) après une action
      (formulaire de contact envoyé, inscription réussie, erreur API…) au lieu de se
      contenter d'un `console.error` ou d'un reset silencieux. Piste : librairie type
      `react-hot-toast` ou `sonner`, ou un petit composant Toast maison.

## Docker — mise en ligne

Quatre critères de l'epic de dockerisation qu'aucune sous-issue n'a couverts. Rien ici ne
bloque le développement, mais la pile de production n'est pas utilisable sans le premier.

- [ ] **Terminateur TLS devant la production** : le seul défaut vraiment fonctionnel.
      La sonde du backend forge `X-Forwarded-Proto: https` pour ne pas recevoir la
      redirection HTTPS, donc la pile se déclare saine sur un chemin qu'un navigateur
      n'emprunte pas. Piste : un service `proxy` (nginx ou Caddy) seul à publier des
      ports, qui **écrase** `X-Forwarded-Proto` (`proxy_set_header … $scheme`, jamais
      `$http_x_forwarded_proto`). Il fait passer le front et l'API sur la même origine :
      CORS disparaît et `VITE_API_URL` devient relative.
- [ ] **Publication des images en intégration continue** : construire et pousser les deux
      images vers un registre à chaque push sur `preprod`. Piste : GitHub Actions vers
      `ghcr.io`, étiquetage par sha court **et** tag mobile, jamais `latest` seul. À
      trancher d'abord : `VITE_API_URL` étant figée dans le bundle à la construction, une
      image de front n'est valable que pour une cible — sauf si le proxy ci-dessus rend
      l'adresse relative.
- [ ] **Logs et métriques depuis une interface unique** : piste, Grafana + Loki pour les
      logs, cAdvisor pour les métriques de conteneurs, dans un fichier Compose à part
      que la production doit pouvoir ignorer. Périmètre à réduire avant de commencer.
- [ ] **Exécution des tests en conteneur isolé** : sur l'image de production, avec un
      service `db` éphémère, jamais sur l'image de développement. À reprendre avec le
      chantier des tests, qui dépasse Docker.

## (à compléter au fil de l'eau)
