import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

// La source d'`App.tsx`, et non une liste recopiée : recopier les routes ici
// laisserait le test vert le jour où l'une d'elles est renommée ou retirée.
import sourceDeLApp from "../../App.tsx?raw";

import Footer from "./Footer";

// Les seules destinations fixes : le `*` est le fourre-tout de `NotFound`, et
// un chemin à paramètre n'est pas une adresse qu'un lien puisse porter tel quel.
const ROUTES_DE_L_APP = [...sourceDeLApp.matchAll(/path="([^"]+)"/g)]
  .map(([, chemin]) => chemin)
  .filter((chemin) => chemin !== "*" && !chemin.includes(":"));

// Le pied de page est rendu à côté des `Routes`, comme `MainLayout` le rend hors
// de son `Outlet` : il reste affiché après un clic, et la zone de routes montre
// la page visée.
function rendreLePiedDePage() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Footer />
      <Routes>
        <Route path="/blog" element={<p>Page du blog</p>} />
        {/* Sans cette route, React Router avertit à chaque cas que `/` ne
            correspond à rien, et ce bruit finirait par en couvrir un vrai. */}
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  );
}

// Tout le pied de page, et non la seule `nav` : un lien mort ajouté près du
// copyright échapperait sinon au contrôle des destinations.
function liensDuPiedDePage() {
  const liens = [...screen.getByRole("contentinfo").querySelectorAll("a")];
  return {
    internes: liens.filter((a) => a.getAttribute("href")?.startsWith("/")),
    externes: liens.filter((a) => !a.getAttribute("href")?.startsWith("/")),
  };
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(cleanup);

describe("Footer — liens internes", () => {
  it("ne mène qu'à des routes déclarées par l'application", () => {
    rendreLePiedDePage();

    const { internes } = liensDuPiedDePage();
    // `querySelectorAll` ne lève pas sur zéro résultat : sans ce garde-fou, un
    // pied de page vidé de ses liens passerait par une boucle muette.
    expect(internes.length).toBeGreaterThan(0);

    for (const lien of internes) {
      expect(ROUTES_DE_L_APP).toContain(lien.getAttribute("href"));
    }
  });

  it("navigue sans recharger l'application", async () => {
    rendreLePiedDePage();

    await userEvent.click(screen.getByRole("link", { name: "Blog" }));

    // Une ancre ordinaire laisserait jsdom sur place : c'est le `Link` qui rend
    // la page visée sans repartir du serveur.
    expect(screen.getByText("Page du blog")).toBeInTheDocument();
  });
});

describe("Footer — liens externes", () => {
  it("ouvre chaque destination extérieure dans un nouvel onglet", () => {
    rendreLePiedDePage();

    const { externes } = liensDuPiedDePage();
    expect(externes.length).toBeGreaterThan(0);

    for (const lien of externes) {
      expect(lien.getAttribute("href")).toMatch(/^https:\/\//);
      expect(lien).toHaveAttribute("target", "_blank");
      // Les jetons un à un : `rel="noopener noreferrer"` reste recevable.
      expect(lien.rel.split(/\s+/)).toContain("noreferrer");
    }
  });
});
