# Weeb - Plateforme Web Moderne

Application web React/TypeScript avec système de routing, authentification et design system complet.

## 📋 Table des matières

- [Technologies](#technologies)
- [Installation](#installation)
- [Pages disponibles](#pages-disponibles)
- [Features](#features)
- [Documentation](#documentation)
- [Structure du projet](#structure-du-projet)

## 🚀 Technologies

- **React 19.2** - Framework UI
- **TypeScript 5.9** - Typage statique
- **Vite 7.2** - Build tool ultra-rapide
- **React Router DOM 7.12** - Routing SPA
- **Tailwind CSS 4.1** - Framework CSS utility-first
- **Lucide React** - Bibliothèque d'icônes

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Linter le code
npm run lint
```

## 🌐 Pages disponibles

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil avec hero banner et sections |
| `/contact` | Formulaire de contact |
| `/login` | Page de connexion |
| `/forgot-password` | Demande d'un lien de réinitialisation, envoyé par email |
| `/reset-password` | Saisie du nouveau mot de passe. Atteinte par le lien du mail, qui porte `uid` et `token` en paramètres d'URL |
| `/subscribe` | Page d'inscription |
| `/about` | Page de présentation |
| `/blog` | Liste des articles |
| `/articles/:id` | Détail d'un article |
| `/*` | Page 404 personnalisée |

## ✨ Features

### Navigation
- ✅ Menu responsive avec version mobile
- ✅ Navigation smooth scroll pour les ancres (#section)
- ✅ Dark mode avec persistance localStorage
- ✅ Indicateur de page active

### Formulaires
- ✅ Validation côté client complète
- ✅ Messages d'erreur en temps réel
- ✅ Clearing automatique des erreurs à la saisie
- ✅ Support : text, email, password, textarea
- ✅ États de chargement (isSubmitting)

### Design System
- ✅ Variables CSS pour light/dark mode
- ✅ Composants UI réutilisables
- ✅ Accessibilité (ARIA, focus states, touch targets)
- ✅ Responsive mobile-first
- ✅ Animations et transitions fluides

## 📚 Documentation

Pour une documentation complète, consultez **`RAPPORT_TECHNIQUE.md`** qui contient :

- 📂 Architecture détaillée des dossiers
- 🔧 Justification des choix techniques
- 📖 Guide de prise en main complet
- 🎨 Documentation du design system
- ✅ Bonnes pratiques implémentées
- 🔮 Améliorations futures possibles

## 📁 Structure du projet

```
src/
├── components/           # Composants réutilisables
│   ├── common/          # Composants métier spécifiques
│   │   ├── Navigation/  # NavBar, DesktopNav, MobileMenu
│   │   ├── Home/        # HeroBanner, FeatureBlock, BrandBanner
│   │   ├── Contact/     # FormContact
│   │   ├── Login/       # FormLogin
│   │   ├── Subscribe/   # FormSubscribe
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/              # Composants UI génériques
│       ├── Button/      # MainButton
│       ├── Input/       # Input, Textarea
│       ├── Logo/        # Logo, LogoBanner
│       └── Title/       # MainTitle, SecondTitle, LinkTitle
├── pages/               # Pages de l'application
│   ├── Home.tsx
│   ├── Contact.tsx
│   ├── Login.tsx
│   ├── Subscribe.tsx
│   └── NotFound.tsx
├── layouts/             # Layouts
│   └── MainLayout.tsx
├── hooks/               # Hooks personnalisés
│   └── useTheme.ts
├── types/               # Types TypeScript
│   └── navigation.ts
├── assets/              # Images et SVG
│   ├── img/
│   └── svg/
├── App.tsx              # Composant racine
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux et design system
```

## 🎨 Composants UI disponibles

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
import MainButton from "./components/ui/Button/MainButton";

<MainButton variant="primary" size="lg" fullWidth>
  Créer mon compte
</MainButton>
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

## 🎯 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement sur http://localhost:5173 |
| `npm run build` | Build de production dans `/dist` |
| `npm run preview` | Preview du build de production |
| `npm run lint` | Vérification ESLint |

## 🎨 Design System

### Classes CSS custom

**Boutons :**
- `.btn-primary` - Bouton violet principal avec effet hover
- `.btn-secondary` - Bouton outline
- `.btn-ghost` - Bouton transparent

**Formulaires :**
- `.form-label` - Label de formulaire
- `.form-input` - Input/Textarea de formulaire
- `.form-error-message` - Message d'erreur (rouge)
- `.form-helper-text` - Texte d'aide (gris)

**Navigation :**
- `.nav-link` - Lien de navigation
- `.nav-link.active` - Lien actif (violet)

**Utilitaires :**
- `.container-custom` - Container responsive (max-width: 80rem)
- `.text-primary`, `.text-secondary`, `.text-accent`
- `.bg-primary`, `.bg-secondary`, `.bg-tertiary`

### Variables CSS

```css
/* Couleurs Light Mode */
--color-light-bg-primary     /* #FFFFFF */
--color-light-text-primary   /* #0F172A */
--color-light-accent-primary /* #9333EA */

/* Couleurs Dark Mode */
--color-dark-bg-primary      /* #0F172A */
--color-dark-text-primary    /* #FFFFFF */
--color-dark-accent-primary  /* #A855F7 */

/* Radius */
--radius-button              /* 0.5rem */
--radius-card                /* 0.75rem */
--radius-input               /* 0.5rem */

/* Shadows */
--shadow-glow-primary
--shadow-focus-primary
```

## ✅ Bonnes pratiques implémentées

- ✅ Architecture modulaire et scalable
- ✅ TypeScript strict avec JSDoc
- ✅ Composants réutilisables (DRY principle)
- ✅ Accessibilité (ARIA, labels, focus)
- ✅ Responsive design mobile-first
- ✅ Dark mode persisté
- ✅ Code splitting avec React Router
- ✅ Validation formulaires côté client
- ✅ Performance optimisée (lazy loading)
- ✅ Tree-shaking automatique

## 📖 Guide de prise en main

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

2. Ajouter la route dans `App.tsx`
```tsx
import MaPage from "./pages/MaPage";

// Dans <Routes>
<Route path="/ma-page" element={<MaPage />} />
```

3. Optionnel : Ajouter un lien dans `NavBar.tsx`
```tsx
// Dans navItems
{ type: "route", to: "/ma-page", label: "Ma Page" }
```

### Créer un formulaire

```tsx
import { useState } from "react";
import { Input } from "../components/ui/Input";

type FormData = {
  field: string;
};

export default function MonFormulaire() {
  const [formData, setFormData] = useState<FormData>({ field: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.field.trim()) {
      newErrors.field = "Ce champ est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // API call
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Mon champ"
        name="field"
        value={formData.field}
        onChange={(e) => setFormData({ ...formData, field: e.target.value })}
        error={errors.field}
        required
        fullWidth
      />
      <button type="submit">Envoyer</button>
    </form>
  );
}
```

## 🔮 Améliorations futures

- [ ] Connexion à une API backend
- [ ] Authentification JWT
- [ ] Tests (Vitest + React Testing Library)
- [ ] Internationalisation (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Optimisation des images (WebP)

## 📝 License

MIT

---

**Projet réalisé dans le cadre d'un examen**
**Date :** Janvier 2026
