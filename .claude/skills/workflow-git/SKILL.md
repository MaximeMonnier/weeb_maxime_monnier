---
name: workflow-git
description: >-
  Use this skill when the user works with git or GitHub on the Weeb project —
  "crée une branche", "quel nom de branche", "fais le commit", "message de
  commit", "ouvre la PR", "je merge dans preprod", "rebase", "je pousse sur
  main", "nettoie l'historique". Covers branch naming
  (<numéro-issue>-description-kebab-case from main), Conventional Commits
  (feat/fix/refactor/style/docs/chore/test), the main/preprod integration flow
  and atomic-commit rules.
---

# Workflow Git — projet Weeb

## Branches

Format : `<numéro-issue>-description-kebab-case`

```bash
git switch main
git pull
git switch -c 36-page-ajout-article
```

- **Toujours créée depuis `main` à jour.** Jamais depuis une autre branche de travail.
- Le numéro d'issue est obligatoire et vient en premier.
- **Aucun accent ni caractère non-ASCII** : `17-page-a-propos`, pas `17-page-à-propos`. L'historique du dépôt en contient (`17-page-à-propos`, `1-identifier-les-composant-réutilisable-de-lapplication`) — ne pas reproduire.
- Description courte, 2 à 5 mots, en minuscules, séparée par des tirets.

## Commits

Format : `<type>: <description à l'impératif, en français>`

Types autorisés, **liste fermée** :

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction d'un comportement cassé |
| `refactor` | Réécriture sans changement de comportement |
| `style` | Formatage, indentation, nommage — aucun effet fonctionnel |
| `docs` | Documentation, README, commentaires |
| `chore` | Dépendances, configuration, outillage |
| `test` | Ajout ou correction de tests |

Règles :

- **Un seul type par commit.** `doc&fix:` est interdit (présent une fois dans l'historique — ne pas reproduire). Si un changement relève de deux types, faire deux commits.
- Description à l'impératif, en français, sans majuscule initiale, sans point final.
- Pas de préfixe manquant : tout commit commence par un type de la liste.

✅ `feat: ajouter l'endpoint de création d'article`
✅ `fix: corriger la validation de l'email dans le formulaire de contact`
❌ `doc&fix: ...` · ❌ `Ajout de la page blog` · ❌ `update`

## Commits atomiques

- Un commit = **un changement cohérent**, qui laisse le dépôt dans un état fonctionnel.
- **Aucun `wip` dans l'historique final.** L'historique actuel n'en contient pas : le tenir ainsi.
- Nettoyer avant d'ouvrir la PR si nécessaire :

```bash
git rebase -i main   # squash/reword des commits de travail
```

- Ne jamais réécrire l'historique d'une branche déjà mergée, ni celui de `main` ou `preprod`.

## Flux de branches

```
<numéro>-description  →  PR  →  preprod  →  PR  →  main
```

- **`preprod` est la branche d'intégration.** Toute branche d'issue est mergée dans `preprod`, jamais directement dans `main`.
- **`main` est stable et déployable en permanence.** Aucun commit direct dessus : tout passe par une PR.
- L'historique contient 5 PR de branche d'issue vers `main` (#39 à #43) : c'est l'écart à ne plus reproduire, pas un précédent à suivre.
- La PR `preprod` → `main` regroupe un ensemble cohérent et testé.

## Pull requests

- Titre de la PR = titre de l'issue.
- Corps contenant `Closes #<numéro>` pour fermer l'issue automatiquement au merge.
- Base de la PR explicitement vérifiée : `preprod` pour une branche d'issue.

## Avant de pousser

**Dérouler d'abord la skill `revue-avant-push`** : six axes (correction, duplication, sécurité, performance, bonnes pratiques, vérifications exécutables) et un rapport BLOQUANT / À CORRIGER / OK. Les commandes ci-dessous en sont l'axe 6.

Ces trois commandes doivent passer :

```bash
cd frontend && npm run lint && npm run build
cd backend  && python manage.py check
```

Un échec de l'une d'elles bloque la PR : `main` doit rester déployable.
