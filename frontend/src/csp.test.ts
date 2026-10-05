// @vitest-environment node
// Le `crypto` de jsdom n'a pas de `subtle` : le hash se calcule sous Node.
import { describe, expect, it } from "vitest";

import sourceDuHtml from "../index.html?raw";
import sourceDeNginx from "../nginx.conf?raw";

/** Rend le hash CSP d'un script en ligne : SHA-256 de son texte exact, en base64. */
async function hashCsp(script: string): Promise<string> {
  const empreinte = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(script),
  );
  return `'sha256-${btoa(String.fromCharCode(...new Uint8Array(empreinte)))}'`;
}

// Le second `<script>` porte un `type` : seul le script en ligne est retenu.
const SCRIPTS_EN_LIGNE = [
  ...sourceDuHtml.matchAll(/<script>([\s\S]*?)<\/script>/g),
].map(([, code]) => code);

const VALEUR_DE_CSP = sourceDeNginx.match(/set \$csp "([^"]+)";/)?.[1];

const ENTETES_CSP = [
  ...sourceDeNginx.matchAll(/add_header Content-Security-Policy (\S+) always;/g),
].map(([, valeur]) => (valeur === "$csp" ? VALEUR_DE_CSP : valeur));

describe("Content-Security-Policy de nginx.conf", () => {
  it("autorise le script en ligne d'index.html par son hash", async () => {
    const hash = await hashCsp(SCRIPTS_EN_LIGNE[0]);

    for (const entete of ENTETES_CSP) {
      expect(entete).toContain(hash);
    }
  });

  // Un bloc qui déclare ses propres `add_header` n'hérite plus de ceux du `server` :
  // celui qui oublierait la CSP la perdrait sans rien signaler.
  it("pose la CSP dans chaque bloc qui pose les autres en-têtes", () => {
    const blocsAvecEntetes = sourceDeNginx.match(/add_header X-Frame-Options/g);

    expect(ENTETES_CSP).toHaveLength(blocsAvecEntetes?.length ?? -1);
  });

  // Sans ce cas, une expression qui ne trouverait plus rien rendrait les
  // précédents verts sans avoir rien comparé.
  it("lit bien le script et les en-têtes qu'il prétend contrôler", () => {
    expect(SCRIPTS_EN_LIGNE).toHaveLength(1);
    expect(SCRIPTS_EN_LIGNE[0]).toContain('classList.add("dark")');
    expect(ENTETES_CSP).toHaveLength(4);
    expect(VALEUR_DE_CSP).toContain("default-src 'self'");
  });
});
