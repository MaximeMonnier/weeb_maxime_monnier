---
name: tickets-github
description: >-
  Use this skill when the user asks to create, write or reformulate GitHub
  issues for the Weeb project — "crée une issue", "rédige un ticket", "ouvre un
  ticket", "créer les tickets du chapitre X", "découpe cette epic en
  sub-issues", "découper ce lot", "dans quel ordre traiter les tickets", "quels
  labels", "critères d'acceptation", "reformule cette issue". Covers the French
  issue template (Contexte / Tâches / Critères d'acceptation / Dépendances), the
  epic + native sub-issues structure, the one-deliverable-per-ticket rule and
  the epic:* / type:* label taxonomy.
---

# Convention de tickets GitHub — projet Weeb

Tout est rédigé **en français**, titres de sections compris.

## Titre

- À l'**infinitif**, sans point final.
- **Sans préfixe de type** : le type est porté par le label, pas par le titre.
- Assez précis pour être compris hors contexte.

✅ `Créer l'endpoint de réinitialisation du mot de passe`
✅ `Afficher la liste des articles depuis l'API`
❌ `feat: reset password` · ❌ `Page blog` · ❌ `Correction du bug.`

## Gabarit obligatoire

Les quatre sections, dans cet ordre, toujours présentes :

```markdown
## Contexte
Pourquoi ce ticket existe. 2 à 4 phrases. Ce qui existe déjà, ce qui manque.

## Tâches
- [ ] Une action technique par case
- [ ] Formulée à l'infinitif
- [ ] Assez fine pour tenir dans un commit atomique

## Critères d'acceptation
- [ ] Vérifiable : un tiers doit pouvoir dire oui/non sans interpréter
- [ ] Observable : un appel API, un écran, une valeur de retour
- [ ] Jamais « ça marche bien » ni « le code est propre »

## Dépendances
#12, #15
```

Un critère d'acceptation décrit un **résultat constatable**, pas une tâche.
`GET /api/articles/ renvoie 200 sans authentification` ✅ ; `Bien tester l'endpoint` ❌.

## Un ticket, un livrable

Un ticket produit **une seule chose**. Deux livrables ⇒ deux tickets, même s'ils
partent ensemble.

❌ « Brancher `DATABASES` sur l'environnement **et** créer le service Compose de la base » :
c'est un changement Django et un changement d'infra, deux façons de casser, deux revues.

Le test : si les tâches se rangent en deux paquets qui pourraient être livrés à des
semaines d'écart, ce sont deux tickets.

## Nommer ce qui existe déjà

Un ticket doit être exécutable par quelqu'un qui ne connaît pas le dépôt.

- Un fichier qui **existe déjà** ou relève de l'**infra** est cité par son chemin :
  `backend/requirements.txt`, `backend/Dockerfile`, `compose.yaml`, `frontend/src/lib/api.ts`.
- Un fichier applicatif **à créer** est décrit par son besoin : c'est la skill
  `inventaire-avant-dev` qui tranchera RÉUTILISER / ÉTENDRE / CRÉER au moment du dev.
- Un critère nomme l'artefact **réel**, jamais un espace réservé. `docker run --rm
  weeb-backend id -u` ✅ ; `docker run --rm <image> id -u` ❌ — personne ne sait ce que vaut
  `<image>`, donc le critère n'est pas vérifiable.

## Dépendances

- Lister les numéros d'issues bloquantes, ou écrire `Aucune`. Ne jamais supprimer la section.
- **Exhaustif** : tout ticket qui produit un fichier que celui-ci modifie est une dépendance.
  Écrire dans `.env.example` dépend du ticket qui a créé `.env.example`.
- Cette section est lue par la commande `/ticket` pour proposer le prochain ticket
  débloqué : une dépendance oubliée fait travailler dans le désordre.

## Epics et sub-issues

- Une **epic** décrit un lot fonctionnel entier. Son corps contient `## Contexte` et
  `## Critères d'acceptation` (le résultat global attendu) ; pas de tâches techniques.
- Le découpage passe par les **sub-issues natives GitHub** : `gh issue create --parent <epic>`.
- **Interdit** : simuler le découpage avec une checklist de liens `- [ ] #12` dans le corps
  de l'epic. La relation doit être native pour remonter dans le suivi de progression.
- Chaque sub-issue est autonome : gabarit complet, traitable sans lire l'epic.
- **Couverture** : chaque critère d'acceptation de l'epic est porté par au moins une
  sub-issue. Sinon l'epic s'affichera à 100 % avec des critères jamais livrés — un critère
  sans sub-issue est soit un ticket manquant, soit un critère hors périmètre à retirer.

## Labels

Exactement **un** label `type:` — `type:feat`, `type:fix`, `type:chore`, `type:docs`,
`type:test` — repris du vocabulaire des Conventional Commits, car il annonce le préfixe des
commits de la branche (voir `workflow-git`).

Plus **un** label `epic:` si l'issue est rattachée à un lot : `epic:authentification`,
`epic:blog`, `epic:dockerisation`. Nom en minuscules, sans accent, un seul mot si possible.

⚠️ Tous ces labels n'existent pas encore dans le dépôt. Vérifier avec `gh label list` et créer
le manquant avec `gh label create` **avant** `gh issue create`, sinon la création échoue.

## Exemple — les deux sections qui portent la valeur

```markdown
Titre : Créer la page d'ajout d'un article
Labels : type:feat, epic:blog

## Tâches
- [ ] Créer un composant de formulaire d'article dans `components/common/Blog/`
- [ ] Valider titre et contenu côté client avant envoi
- [ ] Appeler `POST /api/articles/` via `apiFetch` de `frontend/src/lib/api.ts`
- [ ] Déclarer la route `/articles/new` dans `frontend/src/App.tsx`
- [ ] Rediriger vers le détail de l'article après création

## Critères d'acceptation
- [ ] Un utilisateur connecté peut créer un article depuis `/articles/new`
- [ ] Un champ vide affiche un message d'erreur en français sous le champ
- [ ] Un utilisateur non connecté reçoit une 401 et voit un message explicite
- [ ] `npm run build` et `npm run lint` passent
```
