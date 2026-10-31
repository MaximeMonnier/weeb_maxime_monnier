# Weeb — frontend

Site vitrine et blog en React/TypeScript. Installation complète, API, Docker et CI :
[`../README.md`](../README.md). Limites connues : [`../AMELIORATIONS.md`](../AMELIORATIONS.md).

[Technologies](#technologies) · [Installation](#installation) · [Scripts disponibles](#scripts-disponibles) ·
[Pages disponibles](#pages-disponibles) · [Structure du projet](#structure-du-projet) ·
[Conventions](#conventions) · [Design System](#design-system)

## Technologies

React 19.2 · TypeScript 5.9 · Vite 7.3 · React Router DOM 7.12 · Tailwind CSS 4.1 (config dans
`index.css`, aucun `tailwind.config.js`) · Lucide React · Embla Carousel 8.6 · Vitest 5 +
Testing Library (`jsdom`) · Playwright 1.63.

## Installation

```bash
npm install
cp .env.example .env   # sans VITE_API_URL, src/lib/api.ts lève au chargement
npm run dev
```

## Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement, http://localhost:5173 |
| `npm run build` | `tsc -b`, puis build de production dans `dist/` |
| `npm run preview` | Sert le build |
| `npm run lint` | ESLint |
| `npm test` | Vitest, sans base ni conteneur |
| `npm run test:e2e` | Playwright contre la pile Compose de développement ; identifiants dans `E2E_EMAIL` et `E2E_PASSWORD` |

## Pages disponibles

| Route | Page |
|---|---|
| `/` | Accueil |
| `/about` | Présentation |
| `/contact` | Formulaire de contact |
| `/blog`, `/articles/:id` | Liste et détail des articles |
| `/login`, `/subscribe` | Connexion, inscription |
| `/forgot-password` | Demande du lien de réinitialisation |
| `/reset-password` | Nouveau mot de passe, depuis le lien du mail (`uid`, `token`). Ne pas renommer : les liens déjà envoyés casseraient |
| `/change-password`, `/delete-account` | Membre connecté seulement ; le visiteur est renvoyé vers la connexion |
| `/terms`, `/privacy` | Conditions d'utilisation, confidentialité |
| `/*` | 404 |

## Structure du projet

```
src/
├── components/
│   ├── common/      # métier, par domaine : Blog, Contact, Home, Login, Navigation, Subscribe, Footer, ThemeToggle
│   └── ui/          # générique, sans métier : Alert, Button, Input, Logo, Modal, Title
├── pages/           # une page par route
├── layouts/         # MainLayout
├── hooks/           # useForm, useIsAuthenticated, useTheme
├── lib/
│   ├── api.ts             # apiFetch, seul point d'appel réseau
│   ├── apiErrors.ts       # toFormErrors : refus de l'API -> messages du formulaire
│   ├── cx.ts              # assemblage de classes conditionnelles
│   ├── navigation.ts      # liens de l'en-tête et du pied de page
│   ├── tokens.ts          # seul accès aux jetons JWT
│   └── validationRules.ts # règles partagées entre formulaires
├── types/           # types partagés
├── test/reseau.ts   # substitut de fetch partagé par les tests
├── routes.tsx       # ROUTES : chemin et page, la ligne * en dernier
├── App.tsx          # routeur, sous MainLayout
└── index.css        # thème et classes maison
e2e/                 # parcours Playwright
```

Un test Vitest (`*.test.ts(x)`) vit à côté de sa source.

## Conventions

- **Réseau** : tout passe par `apiFetch<T>()`. Une liste revient paginée
  (`{count, next, previous, results}`), jamais en tableau.
- **Jetons** : seul `lib/tokens.ts` écrit dans `localStorage`, sinon `useIsAuthenticated` n'est
  pas prévenu.
- **Formulaires** : `useForm` porte champs, erreurs et envoi ; les règles sont une fonction pure
  hors du composant, passée à `submit(e, { rules, fields, send })`. Un refus de l'API passe par
  `toFormErrors` ; un libellé propre au formulaire par les options `unauthorized` (le `401`) ou
  `translate`. Modèle : `FormContact.tsx`.
- **Liens de navigation** : dans `lib/navigation.ts`, jamais réécrits dans `NavBar`, `MobileMenu`
  ou `Footer`.
- **Boutons** : aucune classe CSS, tout vient de `buttonClasses()`, y compris pour un lien-bouton.
- **Tests** : aucune globale. Chaque fichier importe `describe`/`it`/`expect` de `vitest`, et un
  test rendu inscrit `afterEach(cleanup)`. Couper le réseau à `globalThis.fetch`, jamais à
  `apiFetch`.

## Design System

### Classes maison

Dans `index.css` : `.form-label`, `.form-label-required`, `.form-input` (`.error`, `.success`),
`.form-textarea`, `.form-error-message`, `.form-helper-text`, `.form-alert-error`,
`.form-alert-success`, `.nav-link` (`.active`), `.footer`, `.footer-link`, `.touch-target`,
`.focus-ring-primary`, `.container-custom`, `.embla__viewport`, `.embla__container`,
`.embla__slide`, `.marquee-mask`, `.marquee-track`.

Tailwind n'y décline **aucune variante** : `hover:nav-link` ne produit rien, et
`index.css.test.ts` le refuse.

### Variables CSS

Valeur claire dans `@theme`, redéfinie sous `.dark`. Une couleur absente de `.dark` garde sa
valeur claire sans rien signaler. On lit les utilitaires (`bg-surface-alt`, `text-ink-soft`,
`border-line`), jamais de paire `dark:` ni de `bg-[var(…)]`.

```css
--color-surface --color-surface-alt --color-surface-hover   /* fonds */
--color-field --color-field-focus                           /* champs */
--color-ink --color-ink-soft --color-ink-faint --color-ink-muted
--color-ink-caption                                         /* même valeur en sombre */
--color-line --color-line-strong                            /* bordures */
--color-accent --color-accent-hover --color-success --color-error
--text-body --text-body-sm
--radius-button --radius-input
--shadow-glow-primary --shadow-focus-primary --shadow-focus-error --shadow-focus-success
```

**Tailwind balaie aussi ce README** : toute classe ou variable citée ici sort dans le CSS, même
sans lecteur. Retirer une variable, c'est retirer sa ligne ici. L'ombre `dark-md` ne s'écrit que
sous la forme `dark:shadow-dark-md`, son seul usage.
