---
name: tickets-github
description: >-
  Use this skill when the user asks to create, write or reformulate a GitHub
  issue for the Weeb project — "crée une issue", "rédige un ticket", "ouvre un
  ticket", "découpe cette epic en sub-issues", "quels labels", "critères
  d'acceptation", "reformule cette issue". Covers the French issue template
  (Contexte / Tâches / Critères d'acceptation / Dépendances), the epic + native
  sub-issues structure, and the epic:* / type:* label taxonomy.
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

- `## Dépendances` : lister les numéros d'issues bloquantes, ou écrire `Aucune`. Ne jamais supprimer la section.
- Un critère d'acceptation décrit un **résultat constatable**, pas une tâche. `GET /api/articles/ renvoie 200 sans authentification` ✅ ; `Bien tester l'endpoint` ❌.

## Epics et sub-issues

- Une **epic** décrit un lot fonctionnel entier. Son corps contient `## Contexte` et `## Critères d'acceptation` (le résultat global attendu) ; pas de tâches techniques.
- Le découpage passe par les **sub-issues natives GitHub** (bouton *Create sub-issue* dans l'issue parente).
- **Interdit** : simuler le découpage avec une checklist de liens `- [ ] #12` dans le corps de l'epic. La relation doit être native pour remonter dans le suivi de progression.
- Chaque sub-issue est autonome : elle a son gabarit complet et peut être traitée sans lire l'epic.

## Labels

Chaque issue porte **exactement un** label `type:` :

| Label | Usage |
|---|---|
| `type:feat` | Nouvelle fonctionnalité |
| `type:fix` | Correction d'un comportement cassé |
| `type:chore` | Outillage, dépendances, configuration |
| `type:docs` | Documentation, README, rapport |
| `type:test` | Ajout ou correction de tests |

Plus **un** label `epic:` si l'issue est rattachée à un lot : `epic:authentification`, `epic:blog`, `epic:dockerisation`. Nom d'epic en minuscules, sans accent, un seul mot si possible.

Le vocabulaire `type:` est **volontairement identique** aux types de Conventional Commits (voir la skill `workflow-git`) : le label de l'issue annonce le préfixe des commits de la branche.

## Exemple complet

```markdown
Titre : Créer la page d'ajout d'un article
Labels : type:feat, epic:blog

## Contexte
L'API expose déjà `POST /api/articles/` avec permission `IsAuthenticatedOrReadOnly`
et l'auteur injecté côté serveur. Le front affiche la liste et le détail des
articles, mais aucun écran ne permet d'en créer un.

## Tâches
- [ ] Créer le composant `FormArticle` dans `components/common/Blog/`
- [ ] Valider titre et contenu côté client avant envoi
- [ ] Appeler `POST /api/articles/` via `apiFetch`
- [ ] Déclarer la route `/articles/new` dans `App.tsx`
- [ ] Rediriger vers le détail de l'article après création

## Critères d'acceptation
- [ ] Un utilisateur connecté peut créer un article depuis `/articles/new`
- [ ] Un champ vide affiche un message d'erreur en français sous le champ
- [ ] Un utilisateur non connecté reçoit une 401 et voit un message explicite
- [ ] `npm run lint` et `npm run build` passent

## Dépendances
#28
```

## Contre-exemple à ne pas produire

```markdown
Titre : Page article
## Description
Faut faire la page pour ajouter les articles + gérer les erreurs.
```

Titre non infinitif et vague, sections hors gabarit, aucune tâche découpée, aucun critère vérifiable, dépendances absentes.
