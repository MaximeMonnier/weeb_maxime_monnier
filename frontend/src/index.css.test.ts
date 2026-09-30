import { describe, expect, it } from "vitest";

// La source d'`index.css`, et non une liste recopiée : une classe ajoutée là-bas
// entre d'elle-même dans le contrôle. L'import n'est lu que grâce au `css: true`
// de `vite.config.ts` — sans lui Vitest rend une chaîne vide, et le contrôle
// passerait sans avoir rien lu.
import sourceDuCss from "./index.css?raw";

// Tout le front, faute d'un endroit où les listes de classes seraient réunies.
const SOURCES = import.meta.glob<string>("./**/*.{ts,tsx}", {
  query: "?raw",
  eager: true,
  import: "default",
});

// Aucune valeur de propriété du fichier ne porte d'identifiant pointé — ni
// `0.75rem` ni `oklch(0.97 0 0)` n'ont de lettre après le point. Tout `.nom`
// du fichier est donc un sélecteur de classe.
const CLASSES_MAISON = new Set(
  [...sourceDuCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, nom]) => nom),
);

/** Rend l'utilitaire visé par un jeton de classe, ou null s'il n'en porte pas. */
function utilitaireDe(jeton: string): string | null {
  // Le découpage se fait au dernier deux-points HORS crochets : Tailwind en met
  // à l'intérieur (`bg-[var(--x)]`, `[&>svg]:h-4`), et couper dessus
  // trancherait la valeur au lieu de la variante.
  let profondeur = 0;
  let coupe = -1;
  for (let i = 0; i < jeton.length; i += 1) {
    if (jeton[i] === "[") profondeur += 1;
    else if (jeton[i] === "]") profondeur -= 1;
    else if (jeton[i] === ":" && profondeur === 0) coupe = i;
  }
  if (coupe === -1) return null;

  // Un utilitaire est un identifiant nu. Ce qui n'en est pas un vient d'une
  // chaîne qui n'est pas une liste de classes : une adresse, une phrase.
  const utilitaire = jeton.slice(coupe + 1);
  return /^[a-z][a-z0-9-]*$/.test(utilitaire) ? utilitaire : null;
}

/** Rend les couples jeton/utilitaire porteurs d'une variante, dans un fichier. */
function variantesDe(source: string) {
  // Les chaînes littérales seulement, jamais les commentaires : un commentaire
  // qui cite `hover:bg-tertiary` pour en expliquer le piège ferait tomber le test.
  return [...source.matchAll(/(["'`])([^"'`\n]*)\1/g)]
    .flatMap(([, , chaine]) => chaine.split(/\s+/))
    .map((jeton) => ({ jeton, utilitaire: utilitaireDe(jeton) }))
    .filter((v): v is { jeton: string; utilitaire: string } =>
      Boolean(v.utilitaire),
    );
}

// Les fichiers de test s'écartent : l'un d'eux peut citer une classe fautive
// pour vérifier qu'elle est bien refusée.
const FICHIERS = Object.entries(SOURCES).filter(
  ([chemin]) => !/\.test\.tsx?$/.test(chemin),
);

const VARIANTES = FICHIERS.flatMap(([chemin, source]) =>
  variantesDe(source).map((v) => ({ chemin, ...v })),
);

describe("index.css", () => {
  // Tailwind v4 ne décline de variante que sur les utilitaires qu'il connaît.
  // Une classe écrite à la main dans `@layer utilities` n'en est pas un : la
  // variante posée dessus ne produit aucune règle, et rien dans le build, le
  // lint ou le typage ne le dit. Six ont ainsi vécu jusqu'à l'issue #184.
  it("ne laisse aucune variante posée sur une classe écrite à la main", () => {
    const fautifs = VARIANTES.filter(({ utilitaire }) =>
      CLASSES_MAISON.has(utilitaire),
    ).map(({ chemin, jeton }) => `${chemin} → ${jeton}`);

    expect(fautifs).toEqual([]);
  });

  // Sans ce cas, une glob muette ou un extracteur cassé rendrait le précédent
  // vert sans avoir rien lu.
  it("lit bien les sources qu'il prétend contrôler", () => {
    expect(CLASSES_MAISON).toContain("nav-link");
    expect(FICHIERS.length).toBeGreaterThan(40);
    expect(VARIANTES.map(({ jeton }) => jeton)).toContain("hover:underline");
  });
});
