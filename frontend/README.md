# Weeb - Plateforme Web Moderne

Application web React/TypeScript avec système de routing, authentification et design system complet.

## Table des matières

- [Technologies](#technologies)
- [Installation](#installation)
- [Pages disponibles](#pages-disponibles)
- [Features](#features)
- [Documentation](#documentation)
- [Structure du projet](#structure-du-projet)

## Technologies

- **React 19.2** - Framework UI
- **TypeScript 5.9** - Typage statique
- **Vite 7.2** - Build tool ultra-rapide
- **React Router DOM 7.12** - Routing SPA
- **Tailwind CSS 4.1** - Framework CSS utility-first
- **Lucide React** - Bibliothèque d'icônes
- **Embla Carousel 8.6** - Carrousel de l'accueil (`embla-carousel-react`, `embla-carousel-autoplay`)
- **Vitest 5** et **Testing Library** - Tests unitaires et de composants, sous `jsdom`
- **Playwright 1.63** - Parcours de bout en bout dans un navigateur

## Installation

```bash
# Installer les dépendances
npm install

# Créer la configuration locale : sans VITE_API_URL, src/lib/api.ts lève à l'import
cp .env.example .env

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Linter le code
npm run lint
```

## Pages disponibles

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil avec hero banner et sections |
| `/contact` | Formulaire de contact |
| `/login` | Page de connexion |
| `/forgot-password` | Demande d'un lien de réinitialisation, envoyé par email |
| `/reset-password` | Saisie du nouveau mot de passe. Atteinte par le lien du mail, qui porte `uid` et `token` en paramètres d'URL |
| `/change-password` | Changement du mot de passe par le membre connecté, qui reste connecté. Le visiteur y est renvoyé vers la connexion |
| `/subscribe` | Page d'inscription |
| `/about` | Page de présentation |
| `/blog` | Liste des articles |
| `/articles/:id` | Détail d'un article |
| `/terms` | Conditions d'utilisation |
| `/privacy` | Politique de confidentialité |
| `/*` | Page 404 personnalisée |

## Features

### Navigation
- ✅ Menu responsive avec version mobile
- ✅ Dark mode avec persistance localStorage
- ✅ Indicateur de page active

### Formulaires
- ✅ Validation côté client complète
- ✅ Messages d'erreur sous chaque champ, à l'envoi
- ✅ Clearing automatique des erreurs à la saisie
- ✅ Support : text, email, password, textarea
- ✅ États de chargement (isSubmitting)

### Design System
- ✅ Variables CSS pour light/dark mode
- ✅ Composants UI réutilisables
- ✅ Accessibilité (ARIA, focus states, touch targets)
- ✅ Responsive mobile-first
- ✅ Animations et transitions fluides

## Documentation

Ce fichier ne couvre que le front. Le reste est à la racine du dépôt :

- [`../README.md`](../README.md) - installation complète, API, pile Docker et intégration continue
- [`../AMELIORATIONS.md`](../AMELIORATIONS.md) - limites connues et améliorations envisagées

## Structure du projet

```
src/
├── components/                # Composants réutilisables
│   ├── common/                # Composants métier, liés à un domaine
│   │   ├── Blog/              # ArticleCard, FormArticle
│   │   ├── Contact/           # FormContact
│   │   ├── Home/              # HeroBanner, FeatureBlock, BrandBanner, Slider
│   │   ├── Login/             # FormLogin
│   │   ├── Navigation/        # NavBar, DesktopNav, MobileMenu
│   │   ├── Subscribe/         # FormSubscribe
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/                    # Composants génériques, sans métier
│       ├── Alert/             # ErrorAlert
│       ├── Button/            # Button, buttonClasses
│       ├── Input/             # Input, Textarea, FormField
│       ├── Logo/              # Logo, LogoBanner
│       └── Title/             # HeroTitle, SectionTitle, TextCtaLink
├── pages/                     # Une page par route
│   ├── Blog/                  # Blog, ArticleDetails
│   ├── About.tsx
│   ├── ChangePassword.tsx
│   ├── Contact.tsx
│   ├── ForgotPassword.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── Privacy.tsx
│   ├── ResetPassword.tsx
│   ├── Subscribe.tsx
│   └── Terms.tsx
├── layouts/
│   └── MainLayout.tsx
├── hooks/
│   ├── useForm.ts             # Socle des formulaires : champs, erreurs, envoi
│   ├── useIsAuthenticated.ts  # État de connexion, et logout
│   └── useTheme.ts
├── lib/
│   ├── api.ts                 # apiFetch, seul point d'appel réseau
│   ├── apiErrors.ts           # toFormErrors : refus de l'API -> messages du formulaire
│   ├── cx.ts                  # Assemblage de classes conditionnelles
│   ├── navigation.ts          # Liens servis par l'en-tête et le pied de page
│   ├── tokens.ts              # Lecture et écriture des jetons JWT
│   └── validationRules.ts     # Règles partagées : email, longueur, complexité et confirmation du mot de passe
├── types/
│   ├── article.ts             # Article, ArticleListItem
│   └── navigation.ts          # NavItem
├── assets/                    # Images et SVG
│   ├── img/
│   └── svg/
├── App.tsx                    # Routeur, sous MainLayout
├── routes.tsx                 # Routes : chemin et page
├── main.tsx                   # Point d'entrée
├── index.css                  # Styles globaux et design system
└── vite-env.d.ts
```

Les tests Vitest (`*.test.ts`, `*.test.tsx`) vivent à côté de leur source. Le parcours
Playwright est hors de `src/`, dans `e2e/`.

## Composants UI disponibles

### Input
```tsx
import { Input } from "./components/ui/Input";

<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="Nous ne partagerons jamais votre email"
  required
  fullWidth
/>
```

### Button
```tsx
import Button from "./components/ui/Button/Button";

<Button variant="primary" size="lg" fullWidth>
  Créer mon compte
</Button>
```

### Textarea
```tsx
import { Textarea } from "./components/ui/Input";

<Textarea
  label="Message"
  minRows={5}
  error={errors.message}
  required
  fullWidth
/>
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement sur http://localhost:5173 |
| `npm run build` | Vérifie les types (`tsc -b`), puis build de production dans `/dist` |
| `npm run preview` | Preview du build de production |
| `npm run lint` | Vérification ESLint |
| `npm test` | Lance la suite Vitest, sans base ni conteneur |
| `npm run test:e2e` | Lance le parcours Playwright contre la pile de développement de Compose ; identifiants dans `E2E_EMAIL` et `E2E_PASSWORD` |

## Design System

### Classes CSS custom

**Boutons :** aucune classe CSS. Le style vient de `buttonClasses()`
(`src/components/ui/Button/buttonClasses.ts`), qu'appellent le composant `Button` et les
liens-boutons écrits à la main.

**Formulaires :**
- `.form-label` - Label de formulaire
- `.form-label-required` - Ajoute l'astérisque rouge d'un champ obligatoire
- `.form-input` - Input/Textarea de formulaire, avec les états `.form-input.error` et `.form-input.success`
- `.form-textarea` - Hauteur minimale et redimensionnement vertical d'un textarea
- `.form-error-message` - Message d'erreur (rouge)
- `.form-helper-text` - Texte d'aide (gris)

**Alertes de formulaire :**
- `.form-alert-error` - Message d'ensemble d'un refus, encadré dès qu'il a du texte
- `.form-alert-success` - Message de succès, même comportement

**Navigation :**
- `.nav-link` - Lien de navigation
- `.nav-link.active` - Lien actif (violet)

**Pied de page :**
- `.footer` - Fond et bordure haute du pied de page
- `.footer-link` - Lien du pied de page, violet au survol

**Accessibilité :**
- `.touch-target` - Cible tactile d'au moins 44 × 44 px
- `.focus-ring-primary` - Anneau de focus violet

**Utilitaires :**
- `.container-custom` - Container responsive (max-width: 80rem)

Les couleurs ne passent par aucune classe écrite à la main : ce sont les utilitaires de
Tailwind (`bg-surface-alt`, `text-ink-soft`, `border-line`…), tirés des variables ci-dessous,
et toutes les variantes s'y posent.

**Carrousel :** `.embla__viewport`, `.embla__container`, `.embla__slide` - noms repris de la
documentation d'Embla.

**Bandeau défilant :** `.marquee-mask`, `.marquee-track` - défilement des logos de l'accueil,
arrêté quand le système demande moins d'animations.

### Variables CSS

```css
/* Couleurs : valeur claire dans @theme, redéfinie sous .dark */
--color-surface              /* fond de page */
--color-surface-alt          /* sections et cartes */
--color-surface-hover        /* fond au survol */
--color-field                /* fond de champ */
--color-field-focus          /* fond de champ actif */
--color-ink                  /* titres, étiquettes */
--color-ink-soft             /* descriptions */
--color-ink-faint            /* indications */
--color-ink-muted            /* désactivé */
--color-ink-caption          /* titres de colonne du pied de page, même valeur en sombre */
--color-line                 /* bordures */
--color-line-strong          /* bordures appuyées et champs */
--color-accent               /* violet */
--color-accent-hover
--color-success
--color-error

/* Texte */
--text-body                  /* 1rem */
--text-body-sm               /* 0.875rem */

/* Radius */
--radius-button              /* 0.5rem */
--radius-input               /* 0.5rem */

/* Shadows */
--shadow-glow-primary
--shadow-focus-primary
--shadow-focus-error
--shadow-focus-success
```

L'ombre `dark-md` de la barre de navigation est aussi déclarée dans `@theme`. Elle n'est lue
que par la classe `dark:shadow-dark-md`, seule forme sous laquelle son nom s'écrit ici :
Tailwind balaie aussi ce README, et la variable ou l'utilitaire nus lui feraient émettre une
règle que rien ne lit.

## Bonnes pratiques implémentées

- ✅ Architecture modulaire et scalable
- ✅ TypeScript strict avec JSDoc
- ✅ Composants réutilisables (DRY principle)
- ✅ Accessibilité (ARIA, labels, focus)
- ✅ Responsive design mobile-first
- ✅ Dark mode persisté
- ✅ Validation formulaires côté client
- ✅ Images hors écran chargées à la demande (`loading="lazy"` dans `FeatureBlock.tsx` et `LogoBanner.tsx`)
- ✅ Tree-shaking automatique

## Guide de prise en main

### Ajouter une nouvelle page

1. Créer le composant dans `src/pages/`
```tsx
// src/pages/MaPage.tsx
export default function MaPage() {
  return (
    <div className="container-custom mt-32">
      <h1>Ma nouvelle page</h1>
    </div>
  );
}
```

2. Ajouter la route dans `routes.tsx`, avant la ligne `*`
```tsx
import MaPage from "./pages/MaPage";

// Dans ROUTES
{ path: "/ma-page", element: <MaPage /> },
```

3. Optionnel : Ajouter un lien dans `NavBar.tsx`
```tsx
// Dans navItems — dans `lib/navigation.ts` si le pied de page le sert aussi
{ to: "/ma-page", label: "Ma Page" }
```

### Créer un formulaire

Les sept formulaires du site suivent le même patron : `useForm` porte l'état et le cycle
d'envoi, une fonction pure hors du composant porte les règles. Sa fonction `submit` valide,
bloque le bouton, appelle l'API et range un refus entre les champs et le message d'ensemble
par `toFormErrors` : le formulaire n'écrit que son appel et son succès. Seul
`ForgotPassword.tsx` n'a pas de règles : il laisse l'API juger l'adresse.

```tsx
// src/components/common/MonDomaine/MonFormulaire.tsx
import { Input } from "../../ui/Input";
import Button from "../../ui/Button/Button";
import ErrorAlert from "../../ui/Alert/ErrorAlert";
import { useForm, type FormErrors } from "../../../hooks/useForm";
import { apiFetch } from "../../../lib/api";

type FormData = {
  title: string;
};

const CHAMPS = ["title"] as const;

// Hors du composant : une fonction pure, testable sans rien rendre.
const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};
  if (!formData.title.trim()) {
    newErrors.title = "Le titre est requis";
  }
  return newErrors;
};

export default function MonFormulaire() {
  const { formData, errors, formError, isSubmitting, handleChange, submit } =
    useForm<FormData>({ title: "" });

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      send: async (values) => {
        await apiFetch("/mon-endpoint/", {
          method: "POST",
          body: JSON.stringify(values),
        });
      },
    });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorAlert message={formError} />
      <Input
        label="Titre"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        required
        fullWidth
      />
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? "Envoi en cours..." : "Envoyer"}
      </Button>
    </form>
  );
}
```

Une règle servie à plusieurs formulaires (email, longueur ou complexité du mot de passe) va dans
`src/lib/validationRules.ts`. Un message de succès se retire à la frappe suivante par
l'option `onChange` de `useForm` : voir `FormContact.tsx`. Un refus qui demande un libellé
propre au formulaire passe par les options `unauthorized` (le `401`, voir `FormLogin.tsx`)
et `translate` (tout autre cas, voir `FormSubscribe.tsx`).

## Améliorations futures

Elles sont consignées pour tout le dépôt dans [`../AMELIORATIONS.md`](../AMELIORATIONS.md).

---

**Projet réalisé dans le cadre d'un examen**
**Date :** Janvier 2026
