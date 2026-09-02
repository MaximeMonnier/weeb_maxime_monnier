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
bloque le développement, et le premier — le seul qui rendait la production inutilisable —
est livré.

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
- [ ] **Publication des images en intégration continue** : construire et pousser les deux
      images vers un registre à chaque push sur `preprod`. Piste : GitHub Actions vers
      `ghcr.io`, étiquetage par sha court **et** tag mobile, jamais `latest` seul. Le
      point à trancher est levé : `VITE_API_URL` valant `/api` depuis le proxy ci-dessus,
      l'image du front n'est plus liée à une cible.
- [ ] **Logs et métriques depuis une interface unique** : piste, Grafana + Loki pour les
      logs, cAdvisor pour les métriques de conteneurs, dans un fichier Compose à part
      que la production doit pouvoir ignorer. Périmètre à réduire avant de commencer.
- [ ] **Exécution des tests en conteneur isolé** : sur l'image de production, avec un
      service `db` éphémère, jamais sur l'image de développement. À reprendre avec le
      chantier des tests, qui dépasse Docker.

## (à compléter au fil de l'eau)
