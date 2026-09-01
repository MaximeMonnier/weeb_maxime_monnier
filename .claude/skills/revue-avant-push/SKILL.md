---
name: revue-avant-push
description: >-
  Use this skill before pushing or opening a pull request on the Weeb project —
  "avant de pousser", "je push", "je peux pousser ?", "relis mon code",
  "revue de code", "review avant PR", "vérifie mon travail", "j'ai fini
  l'issue", "est-ce que c'est prêt". Runs a six-axis review (correction,
  duplication, sécurité, performance, bonnes pratiques, build/lint/tests) on the
  current diff and returns a BLOQUANT / À CORRIGER / OK report with an explicit
  push or no-push recommendation. Never pushes anything itself.
---

# Revue avant push — projet Weeb

> 🚫 **Cette skill ne pousse jamais.** Aucun `git push`, aucun `git commit`, aucune PR ouverte. Elle lit et elle rapporte.
> **Un seul point BLOQUANT ⇒ recommandation « NE PAS POUSSER ».**

Périmètre : le diff de la branche courante.

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

## Axe 1 — Correction fonctionnelle

- [ ] Chaque `## Critères d'acceptation` de l'issue est coché contre le code réel (gabarit : `tickets-github`).
- [ ] Chaque appel `apiFetch` est dans un `try/catch` ou suivi d'un `.catch`.
- [ ] Chaque formulaire remet `isSubmitting` à `false` dans un `finally`.
- [ ] Cas limites traités : liste vide, `useParams` sans id, 401 sur endpoint protégé, réponse 204.
- [ ] **Aucun `console.log`** → BLOQUANT.
- [ ] `console.error` en `catch` → **À CORRIGER** (pattern actuel du repo, 6 occurrences ; `AMELIORATIONS.md` prévoit les toasts). Jamais bloquant.
- [ ] Aucun code mort : import inutilisé, fichier jamais importé, commentaire démenti par le code (précédents : `src/data/articles.json`, le `{/* Placeholder */}` de `Blog.tsx`).

## Axe 2 — Duplication

**Dérouler les étapes 1 à 3 de la skill `inventaire-avant-dev` sur le diff.** Puis :

- [ ] Chaque fichier créé sous `components/`, `hooks/`, `types/` a un verdict `CRÉER` justifié. Sinon → **BLOQUANT**.
- [ ] Aucun bloc de ≥ 10 lignes identique à un autre fichier. Citer les deux chemins.
- [ ] Aucun 5ᵉ copier-coller de `handleChange` / `validateForm` → **BLOQUANT**, extraire `hooks/useForm.ts`.
- [ ] Aucun `cx()` redéfini une 4ᵉ fois.
- [ ] Aucun serializer ni view redondant avec un existant du même modèle.
- [ ] Aucune fonction de fetch en dehors de `lib/api.ts`.

## Axe 3 — Sécurité

- [ ] `git diff main...HEAD --stat | grep -i "\.env"` ne renvoie rien → sinon **BLOQUANT**.
- [ ] Aucun secret en dur :
      `grep -rn "SECRET_KEY\|api_key\|password *= *[\"']" backend/ frontend/src/`
      Dette connue : `config/settings.py` contient encore `SECRET_KEY` en clair et `DEBUG = True` — ne pas aggraver.
- [ ] **Toute nouvelle vue DRF déclare `permission_classes`** → sinon **BLOQUANT**. Le défaut global est `IsAuthenticated` : une vue publique sans `AllowAny` explicite est une erreur.
- [ ] Serializer : `fields` explicite (jamais `__all__`), mot de passe `write_only=True`, `author` / `created_at` / `updated_at` en `read_only_fields`.
- [ ] Aucun champ sensible exposé : `password`, `is_staff`, `is_superuser` absents de tout `fields`.
- [ ] Entrées validées côté serializer (`is_valid(raise_exception=True)`), pas seulement côté React.
- [ ] Aucun `dangerouslySetInnerHTML` → **BLOQUANT** sauf assainissement démontré. Le repo en compte zéro : le garder à zéro.
- [ ] `CORS_ALLOWED_ORIGINS` reste une liste explicite. `CORS_ALLOW_ALL_ORIGINS = True` → **BLOQUANT**.
- [ ] Dette connue : `accounts/views.py` renvoie `uid` + `token` dans la réponse HTTP et un 404 qui révèle l'existence d'un compte. Tout diff touchant ce fichier corrige ce point ou le laisse strictement en l'état.

## Axe 4 — Performance

- [ ] Tout `queryset` traversant une ForeignKey utilise `select_related` (ou `prefetch_related` en many-to-many).
      **`ArticleViewSet` est en N+1 aujourd'hui** (`Article.objects.all()` + `author = StringRelatedField`, aucun `select_related` dans le backend). Un diff touchant `articles/views.py` corrige ou signale.
- [ ] Liste pouvant dépasser ~50 objets → pagination DRF.
      ⚠️ **Cohérence obligatoire** : activer `DEFAULT_PAGINATION_CLASS` change la forme de la réponse et casse `apiFetch<Article[]>` dans `Blog.tsx`. Back et front dans le **même diff**, sinon **BLOQUANT**.
- [ ] Champ utilisé en `filter()` ou `order_by` fréquent → `db_index=True` (aucun index dans le repo à ce jour).
- [ ] Chaque `useEffect` a un tableau de dépendances présent et exhaustif. Précédent correct : `ArticleDetails.tsx` avec `[id]`.
- [ ] Aucune fonction recréée à chaque rendu puis passée en prop à un composant lourd (`Slider`, `NavBar`).
- [ ] Imports tree-shakeables : `import { Menu } from "lucide-react"`, jamais l'import global.

## Axe 5 — Bonnes pratiques

- [ ] **Zéro `any`** (`: any`, `as any`, `<any>`) → **BLOQUANT**. Le repo n'en contient aucun. Utiliser `unknown` puis affiner.
- [ ] `type` et non `interface`.
- [ ] Pour tout **nouveau** fichier : nom du fichier = nom de l'export. Les 5 divergences existantes (`MainButton`→`Button`, `Card`→`ArticleCard`…) ne sont pas à corriger ici, mais pas à reproduire.
- [ ] Aucun fichier hors de sa couche : pas de logique métier dans `components/ui/`, pas de `fetch` dans un composant, pas de modèle ni de vue dans `backend/config/`.
- [ ] Un seul import par module (`Blog.tsx` importe `react` deux fois : à ne pas suivre) et imports sans extension `.tsx`.
- [ ] Nom de branche et messages de commit conformes → skill `workflow-git`.

## Axe 6 — Vérifications exécutables

Chaque échec est **BLOQUANT** :

```bash
cd frontend && npm run lint && npm run build
cd backend  && python manage.py check
cd backend  && python manage.py makemigrations --check --dry-run
cd backend  && python manage.py test
```

- `makemigrations --check` non vide = migration oubliée, à committer avec le changement de modèle.
- `manage.py test` : les `tests.py` des trois apps sont encore vides — la commande passe donc à vide et **ce succès ne prouve aucune couverture**. Dès qu'un test existe, tout échec est bloquant, et un diff qui ajoute un endpoint sans test passe en **À CORRIGER**.

## Format du rapport (imposé)

```markdown
## Revue avant push — <nom-de-la-branche>

### 🔴 BLOQUANT
- [sécurité] `backend/articles/views.py:12` — nouvelle vue sans `permission_classes`

### 🟠 À CORRIGER
- [perf] `backend/articles/views.py:10` — `select_related("author")` manquant (N+1)
- [correction] `frontend/src/pages/Blog/Blog.tsx:18` — `console.error` en gestion d'erreur

### 🟢 OK
- lint, build, check, migrations : passent
- aucun secret, aucun `any`, aucune duplication détectée

**Recommandation : NE PAS POUSSER** — 1 point bloquant.
```

Règles de sortie :

- Une ligne par constat, format `[axe] chemin:ligne — constat`. Pas de prose, pas de paragraphe d'introduction.
- Les 6 axes apparaissent : un axe sans problème est listé en 🟢 OK, jamais omis.
- Terminer **toujours** par `POUSSER` ou `NE PAS POUSSER`, jamais un avis nuancé.
- Ne jamais corriger et pousser dans la foulée : rapporter, puis attendre la décision.
