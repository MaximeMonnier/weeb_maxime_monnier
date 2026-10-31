import { describe, expect, it } from "vitest";

// Lu grâce au `css: true` de `vite.config.ts` : sans lui, une chaîne vide.
import sourceDuCss from "./index.css?raw";

// `.dark` n'est posée par aucun `className` : c'est le script d'index.html, hors de `src/`.
import sourceDuHtml from "../index.html?raw";

const SOURCES = import.meta.glob<string>("./**/*.{ts,tsx}", {
  query: "?raw",
  eager: true,
  import: "default",
});

// Tout `.nom` d'index.css compte, commentaires compris : un `fichier.ext` y serait une classe.
const CLASSES_MAISON = new Set(
  [...sourceDuCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, nom]) => nom),
);

function chainesDe(source: string): string[] {
  // Pas d'expression régulière : l'apostrophe de `alt="Vue d'une…"` avalerait la ligne.
  const chaines: string[] = [];
  let i = 0;

  while (i < source.length) {
    // Commentaires sautés : leurs apostrophes ouvriraient des chaînes.
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
      if (source[j] === "\n" && guillemet !== "`") break;
      if (source[j] === "\\") j += 1;
      contenu += source[j];
      j += 1;
    }

    // Apostrophe de prose JSX (« L'équipe ») : on repart du caractère suivant.
    if (!fermee) {
      i = debut;
      continue;
    }

    chaines.push(contenu);
    i = j + 1;
  }

  return chaines;
}

function jetonsDe(source: string): string[] {
  // Coupe aussi aux guillemets, sinon une classe dans un `${}` garderait les siens.
  return chainesDe(source).flatMap((chaine) => chaine.split(/[\s"'`]+/));
}

function utilitaireDe(jeton: string): string | null {
  // Dernier deux-points hors crochets : Tailwind en met dedans (`[&>svg]:h-4`).
  let profondeur = 0;
  let coupe = -1;
  for (let i = 0; i < jeton.length; i += 1) {
    if (jeton[i] === "[") profondeur += 1;
    else if (jeton[i] === "]") profondeur -= 1;
    else if (jeton[i] === ":" && profondeur === 0) coupe = i;
  }
  if (coupe === -1) return null;

  const utilitaire = jeton
    .slice(coupe + 1)
    .replace(/!$/, "")
    .replace(/\/[^/]*$/, "");
  return /^[a-z][a-z0-9-]*$/.test(utilitaire) ? utilitaire : null;
}

function variantesDe(source: string) {
  return jetonsDe(source)
    .map((jeton) => ({ jeton, utilitaire: utilitaireDe(jeton) }))
    .filter((v): v is { jeton: string; utilitaire: string } =>
      Boolean(v.utilitaire),
    );
}

function jetonsDuHtml(source: string): string[] {
  // Hors des `<script>`, `//` ouvre une URL et non un commentaire.
  return [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].flatMap(
    ([, code]) => jetonsDe(code),
  );
}

const FICHIERS = Object.entries(SOURCES).filter(
  ([chemin]) => !/\.test\.tsx?$/.test(chemin),
);

const VARIANTES = FICHIERS.flatMap(([chemin, source]) =>
  variantesDe(source).map((v) => ({ chemin, ...v })),
);

const CLASSES_POSEES = new Set([
  ...FICHIERS.flatMap(([, source]) => jetonsDe(source)),
  ...jetonsDuHtml(sourceDuHtml),
]);

describe("index.css", () => {
  // Tailwind v4 ne produit aucune variante sur une classe écrite à la main.
  it("ne laisse aucune variante posée sur une classe écrite à la main", () => {
    const fautifs = VARIANTES.filter(({ utilitaire }) =>
      CLASSES_MAISON.has(utilitaire),
    ).map(({ chemin, jeton }) => `${chemin} → ${jeton}`);

    expect(fautifs).toEqual([]);
  });

  it("ne garde aucune classe sans lecteur", () => {
    const orphelines = [...CLASSES_MAISON].filter(
      (nom) => !CLASSES_POSEES.has(nom),
    );

    expect(orphelines).toEqual([]);
  });

  // Sans ce cas, une glob muette rendrait les précédents verts.
  it("lit bien les sources qu'il prétend contrôler", () => {
    expect(CLASSES_MAISON).toContain("nav-link");
    expect(FICHIERS.length).toBeGreaterThan(40);
    expect(VARIANTES.map(({ jeton }) => jeton)).toContain("hover:underline");
    expect(jetonsDuHtml(sourceDuHtml)).toContain("dark");
  });
});

function blocDe(selecteur: string): string {
  const debut = sourceDuCss.indexOf(`${selecteur} {`);
  if (debut === -1) throw new Error(`bloc ${selecteur} introuvable`);
  return sourceDuCss.slice(debut, sourceDuCss.indexOf("}", debut));
}

const PALETTES = { clair: blocDe("@theme"), sombre: blocDe(".dark") };

function oklchDe(
  theme: keyof typeof PALETTES,
  variable: string,
): [number, number, number] {
  // Prettier coupe parfois la valeur sur trois lignes.
  const trouve = PALETTES[theme].match(
    new RegExp(
      `--${variable}:\\s*oklch\\(\\s*([\\d.]+) ([\\d.]+) ([\\d.]+)\\s*\\)`,
    ),
  );
  if (!trouve) {
    throw new Error(`--${variable} introuvable en ${theme} ou hors oklch()`);
  }
  return [Number(trouve[1]), Number(trouve[2]), Number(trouve[3])];
}

// ΔE OKLab.
function ecartOklab(
  [l1, c1, h1]: [number, number, number],
  [l2, c2, h2]: [number, number, number],
): number {
  const rad = Math.PI / 180;
  return Math.hypot(
    l1 - l2,
    c1 * Math.cos(h1 * rad) - c2 * Math.cos(h2 * rad),
    c1 * Math.sin(h1 * rad) - c2 * Math.sin(h2 * rad),
  );
}

describe("palette de index.css", () => {
  // Sous 0,02, l'œil ne voit pas le survol de `surface-alt` à `surface-hover`.
  it.each(["clair", "sombre"] as const)(
    "sépare à l'œil le fond de survol du fond secondaire (%s)",
    (theme) => {
      const repos = oklchDe(theme, "color-surface-alt");
      const survol = oklchDe(theme, "color-surface-hover");

      expect(ecartOklab(repos, survol)).toBeGreaterThan(0.02);
    },
  );
});
