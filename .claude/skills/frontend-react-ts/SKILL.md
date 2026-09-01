---
name: frontend-react-ts
description: >-
  Use this skill when the user works on the Weeb React/TypeScript frontend —
  "nouveau composant", "crée une page", "ajoute une route", "fais le
  formulaire", "appelle l'API", "gère les erreurs du formulaire", "quelle
  couleur", "dark mode", "Tailwind", "design system". Covers the ui/ vs common/
  split, the single apiFetch entry point in lib/api.ts, CSS-variable colors with
  dark: counterparts, and the typed form-validation pattern.
---

# Conventions frontend React / TypeScript — projet Weeb

React 19 · TypeScript strict · Vite 7 · Tailwind **v4** (config CSS, pas de `tailwind.config.js`) · React Router 7.

## Où va un fichier

| Dossier | Contenu |
|---|---|
| `components/ui/<Type>/` | Composant **générique et réutilisable**, sans logique métier : `Button`, `Input`, `Title`, `Logo` |
| `components/common/<Domaine>/` | Composant **métier** rattaché à un domaine : `Blog/`, `Contact/`, `Login/`, `Navigation/` |
| `pages/` | Une page = une route |
| `layouts/` | Enveloppes de page (`MainLayout`) |
| `hooks/` | Hooks personnalisés (`useTheme`) |
| `types/` | Types partagés entre plusieurs fichiers |
| `lib/` | Utilitaires transverses (`api.ts`) |

Un composant utilisé par un seul domaine ne va pas dans `ui/`. Un composant sans dépendance métier ne va pas dans `common/`.

## Routes

Toute page est déclarée dans `App.tsx`, à l'intérieur de `<Route element={<MainLayout />}>`. La route `*` vers `NotFound` reste en dernier.

## Appels API

- **Tout appel réseau passe par `apiFetch<T>()` de `lib/api.ts`.** Aucun `fetch` direct dans un composant ou une page.
- Toujours paramétrer le type de retour : `await apiFetch<Article[]>("/articles/")`.
- Le token JWT et l'en-tête `Content-Type` sont gérés par `apiFetch` : ne pas les repasser.
- Une erreur remonte sous la forme `{ status, data }` — la traiter dans un `try/catch` et afficher un message **en français**.

## TypeScript

- `type`, jamais `interface` (aucune `interface` dans le projet).
- Props d'un composant HTML : `React.XHTMLAttributes<HTMLXElement> & { … }`, puis `...props` étalé sur l'élément.
- Aucun `any`. Une valeur inconnue est `unknown`.
- `strict`, `noUnusedLocals` et `noUnusedParameters` sont actifs : pas d'import ni de variable non utilisés.

## Styles et couleurs

- **Jamais de couleur en dur** : ni hex, ni `oklch()` inline, ni couleur Tailwind par défaut (`bg-purple-600` est interdit).
- Uniquement les variables du design system définies dans `index.css` :
  `var(--color-light-*)` et `var(--color-dark-*)`.
- **Toute classe de couleur claire a sa contrepartie `dark:`** :

```tsx
"bg-[var(--color-light-bg-primary)] dark:bg-[var(--color-dark-bg-primary)]"
```

- Le mode sombre repose sur la classe `.dark` posée sur `<html>` (variant custom `@custom-variant dark`), pilotée par `useTheme`.
- Réutiliser les classes utilitaires existantes du design system quand elles couvrent le besoin : `form-input`, `form-label`, `form-error-message`, `nav-link`, `container-custom`.

## Composants

- Composant de `ui/` : `export default`, variantes typées par des `Record<Variant, string>`, classes assemblées via le helper local `cx()`.
- Champ de saisie : **toujours** `Input` / `Textarea` importés depuis `components/ui/Input`, jamais un `<input>` ou `<textarea>` nu — ils portent `forwardRef`, `useId`, `aria-invalid` et `aria-describedby`.
- Accessibilité : chaque champ a un `label` lié par `htmlFor`, chaque image un `alt`.

## Formulaires

Le patron du projet, à reproduire tel quel :

```tsx
type FormData = { first_name: string; email: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

const [formData, setFormData] = useState<FormData>({ first_name: "", email: "" });
const [errors, setErrors] = useState<FormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

- Les clés de `FormData` reprennent **exactement** les noms de champs de l'API (`first_name`, `last_name`, pas `firstName`).
- `handleChange` efface l'erreur du champ dès la saisie.
- `validateForm(): boolean` remplit `errors` et renvoie la validité ; appelée avant tout envoi.
- Messages d'erreur **en français**, affichés sous le champ via la prop `error`.
- `isSubmitting` désactive le bouton pendant l'appel et est remis à `false` dans un `finally`.

## Avant de pousser

```bash
cd frontend && npm run lint && npm run build
```
