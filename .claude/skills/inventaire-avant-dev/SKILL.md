---
name: inventaire-avant-dev
description: >-
  Use this skill BEFORE writing any code for a new feature on the Weeb project —
  "nouvelle fonctionnalité", "je commence l'issue", "ajoute un composant",
  "nouveau composant", "crée une page", "nouveau hook", "nouveau type",
  "nouvel endpoint", "nouveau serializer", "éviter les doublons", "est-ce que ça
  existe déjà", "par quoi je commence". Forces an inventory of the existing
  frontend (components/ui, components/common, hooks/, types/, lib/api.ts,
  App.tsx routes) and backend (models, serializers, views, permissions, urls per
  app), then a written RÉUTILISER / ÉTENDRE / CRÉER verdict before any file is
  created.
---

# Inventaire avant développement — projet Weeb

> 🚫 **RÈGLE BLOQUANTE**
> **Interdiction de créer le moindre fichier tant que le tableau de verdict de l'étape 3 n'a pas été produit ET présenté à l'utilisateur.**
> Si la demande arrive sans inventaire, produire l'inventaire d'abord. Aucune exception, y compris pour « un petit composant vite fait ».

But unique : ne pas recréer ce qui existe. Les conventions de rédaction du code ne sont pas ici → `frontend-react-ts` et `backend-django-drf`.

## Étape 1 — Inventaire frontend

Exécuter, ne pas deviner :

```bash
grep -rn "^export" frontend/src/components/ui/
grep -rn "^export default\|^export function\|^export const" frontend/src/components/common/
grep -rn "^export" frontend/src/hooks/ frontend/src/types/ frontend/src/lib/
grep -n "path=" frontend/src/App.tsx
```

Restituer en 5 listes : composants `ui/`, composants `common/`, hooks, types, fonctions d'appel API, puis les routes déjà déclarées.

⚠️ Le nom du fichier ne dit pas le nom de l'export : `MainButton.tsx` exporte `Button`, `Card.tsx` exporte `ArticleCard`, `MainTitle.tsx` exporte `HeroTitle`, `SecondTitle.tsx` exporte `SectionTitle`, `LinkTitle.tsx` exporte `TextCtaLink`. Inventorier les **exports**, pas les noms de fichiers.

## Étape 2 — Inventaire backend

```bash
grep -rn "^class" backend/accounts/models.py backend/accounts/serializers.py backend/accounts/views.py
grep -rn "^class" backend/articles/models.py backend/articles/serializers.py backend/articles/views.py backend/articles/permissions.py
grep -rn "^class" backend/contact/models.py backend/contact/serializers.py backend/contact/views.py
grep -rn "path(\|router.register" backend/config/urls.py backend/accounts/urls.py backend/articles/urls.py backend/contact/urls.py
```

Restituer un tableau par app (`accounts`, `articles`, `contact`) : models · serializers · views · permissions · routes.

## Étape 3 — Tableau de verdict (livrable obligatoire)

Une ligne par élément nécessaire à la feature. Format imposé :

| Élément requis | Verdict | Cible | Justification |
|---|---|---|---|
| Champ de saisie | RÉUTILISER | `components/ui/Input/Input.tsx` | — |
| Carte d'article | ÉTENDRE | `components/common/Blog/Card.tsx` | ajouter une prop `compact` |
| Gestion de formulaire | CRÉER | `hooks/useForm.ts` | `useTheme` est le seul hook ; logique copiée dans 4 formulaires |

Règles :

- `RÉUTILISER` et `ÉTENDRE` citent le **chemin exact** du fichier visé.
- **`CRÉER` exige une justification d'une ligne** nommant le candidat existant le plus proche et la raison de son rejet. « Ça n'existe pas » n'est pas une justification recevable.
- Arbitrage : un existant qui couvre **≥ 70 %** du besoin → `ÉTENDRE`, jamais `CRÉER`.
- Aucun élément de la feature ne reste hors du tableau, y compris les routes et les types.

## Étape 4 — Contrôle de placement

**Frontend — `ui/` ou `common/` ?** Trois questions binaires :

1. Le composant importe-t-il `lib/api.ts`, un type métier ou `react-router-dom` ? → `components/common/<Domaine>/`
2. Est-il utilisable tel quel dans un autre projet sans renommer ses props ? → `components/ui/<Type>/`
3. Ne sert-il qu'à un seul domaine ? → `components/common/`, **même s'il paraît générique**.

Autres couches : une route va dans `App.tsx` sous `MainLayout` · une page dans `pages/` · un type partagé par ≥ 2 fichiers dans `types/` · jamais de `fetch` ailleurs que dans `lib/api.ts`.

**Backend** : un modèle qui n'appartient ni à `accounts`, ni à `articles`, ni à `contact` → **nouvelle app**, jamais rangé « dans la plus proche ».

## Étape 5 — Pièges connus de ce repo

Vérifier ces cinq points avant tout verdict `CRÉER` :

- **Formulaire** : `handleChange` + `validateForm` + `FormErrors` sont déjà copiés à l'identique dans `FormContact.tsx`, `FormLogin.tsx`, `FormSubscribe.tsx`, `FormArticle.tsx`. Un 5ᵉ formulaire ⇒ verdict `CRÉER hooks/useForm.ts`, pas un 5ᵉ copier-coller.
- **`cx()`** : déjà redéfini dans `MainButton.tsx`, `Input.tsx`, `Textarea.tsx`. Besoin d'un 4ᵉ ⇒ l'extraire dans `lib/`.
- **Appel API** : `apiFetch` est la **seule** fonction d'appel. Un nouvel endpoint = un appel à `apiFetch`, jamais une nouvelle fonction de fetch.
- **Type** : `types/` ne contient que `Article` et `NavItem`. Avant d'ajouter un champ, le confronter à `backend/articles/serializers.py` — `Article.coverImg` est déjà un champ typé qui n'existe pas côté API.
- **Fichier mort** : `src/data/articles.json` n'est plus importé nulle part. Ne pas s'en inspirer, ne pas le réactiver.

## Sortie attendue

Dans cet ordre, dans le chat : inventaire frontend → inventaire backend → tableau de verdict → placement retenu. **Puis demander le feu vert avant d'écrire.**
