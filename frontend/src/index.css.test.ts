import { describe, expect, it } from "vitest";

// La source d'`index.css`, et non une liste recopiée. L'import n'est lu que grâce
// au `css: true` de `vite.config.ts` : sans lui Vitest rend une chaîne vide, d'où
// le second cas, qui refuse de conclure sans avoir lu.
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

/** Rend le contenu de chaque chaîne littérale d'une source TypeScript. */
function chainesDe(source: string): string[] {
  // Un parcours caractère par caractère, et non une expression régulière :
  // `alt="Vue d'une interface"` lui ferait apparier l'apostrophe, et toutes les
  // classes de la ligne partiraient avec, sans que rien ne le signale.
  const chaines: string[] = [];
  let i = 0;

  while (i < source.length) {
    // Les commentaires sont sautés : l'un d'eux peut citer une classe fautive pour
    // en expliquer le piège, et l'apostrophe du français y ouvrirait une chaîne.
    if (source[i] === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (source[i] === "/" && source[i + 1] === "*") {
      const fin = source.indexOf("*/", i + 2);
      if (fin === -1) break;
      i = fin + 2;
      continue;
    }

    const guillemet = source[i];
    if (guillemet !== '"' && guillemet !== "'" && guillemet !== "`") {
      i += 1;
      continue;
    }

    const debut = i + 1;
    let j = debut;
    let contenu = "";
    let fermee = false;
    while (j < source.length) {
      if (source[j] === guillemet) {
        fermee = true;
        break;
      }
      // Seul le gabarit passe la ligne.
      if (source[j] === "\n" && guillemet !== "`") break;
      if (source[j] === "\\") j += 1;
      contenu += source[j];
      j += 1;
    }

    // L'apostrophe de la prose JSX — « L'équipe » — n'ouvre aucune chaîne : sans
    // fermeture avant le saut de ligne, on repart du caractère suivant au lieu
    // d'avaler le `className` qui vient après sur la même ligne.
    if (!fermee) {
      i = debut;
      continue;
    }

    chaines.push(contenu);
    i = j + 1;
  }

  return chaines;
}

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

  // Un utilitaire est un identifiant nu, le `!` d'importance et le modificateur
  // d'opacité retirés. Ce qui n'en est pas un vient d'une chaîne qui n'est pas une
  // liste de classes : une adresse, une phrase.
  const utilitaire = jeton
    .slice(coupe + 1)
    .replace(/!$/, "")
    .replace(/\/[^/]*$/, "");
  return /^[a-z][a-z0-9-]*$/.test(utilitaire) ? utilitaire : null;
}

/** Rend les couples jeton/utilitaire porteurs d'une variante, dans un fichier. */
function variantesDe(source: string) {
  // Le découpage prend aussi les guillemets, et pas seulement les espaces : une
  // classe posée dans un `${}` de gabarit garderait les siens et échapperait au
  // test d'identifiant. Ce qui échappe encore est listé au README.
  return chainesDe(source)
    .flatMap((chaine) => chaine.split(/[\s"'`]+/))
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
  // Tailwind v4 ne décline de variante que sur ses propres utilitaires : une classe
  // écrite à la main dans `index.css` n'en est pas un, et la variante posée dessus ne
  // produit aucune règle. Six ont vécu ainsi jusqu'à #184. Détail au README.
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
