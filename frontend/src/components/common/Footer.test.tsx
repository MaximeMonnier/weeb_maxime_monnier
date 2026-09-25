import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

// La source d'`App.tsx`, et non une liste recopiée : recopier les routes ici
// laisserait le test vert le jour où l'une d'elles est renommée ou retirée.
import sourceDeLApp from "../../App.tsx?raw";

import { saveTokens } from "../../lib/tokens";
import NavBar from "./Navigation/NavBar";
import Footer from "./Footer";

// Les seules destinations fixes : le `*` est le fourre-tout de `NotFound`, et
// un chemin à paramètre n'est pas une adresse qu'un lien puisse porter tel quel.
const ROUTES_DE_L_APP = [...sourceDeLApp.matchAll(/path="([^"]+)"/g)]
  .map(([, chemin]) => chemin)
  .filter((chemin) => chemin !== "*" && !chemin.includes(":"));

// jsdom n'implémente pas `matchMedia`, que `useTheme` interroge dès le premier
// rendu de la barre de navigation. Le doublon se pose ici faute d'un
// `setupFiles` où le poser une fois, et se limite au `matches` que le hook lit.
vi.stubGlobal("matchMedia", () => ({ matches: false }));

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

// L'en-tête et le pied de page d'une même page, comme `MainLayout` les rend :
// c'est le seul rendu où leurs libellés se confrontent.
function rendreLEnTeteEtLePiedDePage() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <NavBar />
      <Footer />
    </MemoryRouter>,
  );
}

// Les liens porteurs d'un `aria-label` sont écartés : le logo et les icônes
// sociales nomment leur destination autrement qu'un libellé de menu. Les
// doublons sont gardés — c'est leur nombre qui dit qu'aucun lien n'a quitté le
// relevé, un `aria-label` posé sur l'un d'eux l'en sortant en silence.
function libellesParDestination(): Map<string, string[]> {
  const parDestination = new Map<string, string[]>();

  for (const lien of document.querySelectorAll("a")) {
    if (lien.hasAttribute("aria-label")) continue;

    const destination = lien.getAttribute("href") ?? "";
    const libelle = (lien.textContent ?? "").trim();
    parDestination.set(destination, [
      ...(parDestination.get(destination) ?? []),
      libelle,
    ]);
  }

  return parDestination;
}

function navigationDuPiedDePage() {
  return screen.getByRole("navigation", { name: "Navigation du pied de page" });
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun. Les jetons
// partent avec : ils décident de ce que le pied de page affiche.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

describe("Footer — visiteur", () => {
  it("propose les trois entrées de compte", () => {
    rendreLePiedDePage();

    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Nous rejoindre" }),
    ).toHaveAttribute("href", "/subscribe");
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié" }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});

describe("Footer — membre connecté", () => {
  it("ne garde de la colonne du compte que la réinitialisation", () => {
    // Lu dès le premier rendu par `useIsAuthenticated` : la session se pose
    // avant, sans quoi le pied de page s'afficherait en visiteur.
    saveTokens({ access: "jeton-acces", refresh: "jeton-renouvellement" });
    rendreLePiedDePage();

    for (const libelle of ["Se connecter", "Nous rejoindre"]) {
      expect(screen.queryByRole("link", { name: libelle })).toBeNull();
    }

    // Le seul chemin de changement de mot de passe du site : le retirer au
    // membre l'obligerait à se déconnecter pour changer le sien.
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié" }),
    ).toHaveAttribute("href", "/forgot-password");

    expect(screen.getByRole("link", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
  });
});

describe("Footer — accord avec l'en-tête", () => {
  it("annonce sa navigation en français", () => {
    rendreLePiedDePage();

    expect(navigationDuPiedDePage()).toBeInTheDocument();
  });

  it("nomme comme le menu une destination servie des deux côtés", () => {
    rendreLEnTeteEtLePiedDePage();
    const parDestination = libellesParDestination();

    // Trois exemplaires de chaque destination servie des deux côtés : le menu
    // desktop, le menu mobile et le pied de page. Sans ce repère, un lien
    // disparu ou sorti du relevé laisserait la boucle passer à vide.
    for (const destination of [
      "/blog",
      "/about",
      "/contact",
      "/login",
      "/subscribe",
    ]) {
      expect(parDestination.get(destination), destination).toHaveLength(3);
    }

    for (const [destination, libelles] of parDestination) {
      expect([...new Set(libelles)], `« ${destination} »`).toHaveLength(1);
    }
  });
});
