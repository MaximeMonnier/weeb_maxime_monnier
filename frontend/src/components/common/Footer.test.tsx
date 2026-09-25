import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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

const RESEAUX_SOCIAUX = [
  "YouTube",
  "Facebook",
  "Twitter / X",
  "Instagram",
  "LinkedIn",
];

// Le pied de page est rendu à côté des `Routes`, comme `MainLayout` le rend hors
// de son `Outlet` : il reste affiché après un clic, et la zone de routes montre
// la page visée.
function rendreLePiedDePage() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Footer />
      <Routes>
        <Route path="/blog" element={<p>Page du blog</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const liensDeNavigation = () =>
  within(
    screen.getByRole("navigation", { name: "Footer navigation" }),
  ).getAllByRole("link");

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(cleanup);

describe("Footer — liens de navigation", () => {
  it("ne mène qu'à des routes déclarées par l'application", () => {
    rendreLePiedDePage();

    const liens = liensDeNavigation();
    // Sans ce garde-fou, une colonne vidée rendrait la boucle suivante muette.
    expect(liens.length).toBeGreaterThan(0);

    for (const lien of liens) {
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

describe("Footer — réseaux sociaux", () => {
  it("ouvre chaque réseau dans un nouvel onglet", () => {
    rendreLePiedDePage();

    for (const nom of RESEAUX_SOCIAUX) {
      const lien = screen.getByRole("link", { name: nom });
      expect(lien).toHaveAttribute("target", "_blank");
      expect(lien).toHaveAttribute("rel", "noreferrer");
      expect(lien.getAttribute("href")).toMatch(/^https:\/\//);
    }
  });
});
