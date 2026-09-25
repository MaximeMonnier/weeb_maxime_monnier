import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// La source d'`App.tsx`, et non une liste recopiée : recopier les routes ici
// laisserait le test vert le jour où l'une d'elles est renommée ou retirée.
import sourceDeLApp from "../../../App.tsx?raw";

import { saveTokens } from "../../../lib/tokens";
import NavBar from "./NavBar";

// Les seules destinations fixes : le `*` est le fourre-tout de `NotFound`, et
// un chemin à paramètre n'est pas une adresse qu'un lien puisse porter tel quel.
const ROUTES_DE_L_APP = [...sourceDeLApp.matchAll(/path="([^"]+)"/g)]
  .map(([, chemin]) => chemin)
  .filter((chemin) => chemin !== "*" && !chemin.includes(":"));

// jsdom n'implémente pas `matchMedia`, que `useTheme` interroge dès le premier
// rendu. Le doublon se pose ici faute d'un `setupFiles` où le poser une fois, et
// se limite au `matches` que le hook lit.
vi.stubGlobal("matchMedia", () => ({ matches: false }));

function rendreLaBarre() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <NavBar />
    </MemoryRouter>,
  );
}

// Tailwind ne masque rien sous jsdom : le bloc desktop et le menu mobile
// cohabitent dans le même `nav`, et c'est ce qui rend leur comparaison possible.
// Les destinations sont gardées avec leurs doublons — c'est leur nombre qui dit
// qu'un libellé est bien servi par les deux blocs.
function destinationsParLibelle(): Map<string, string[]> {
  const parLibelle = new Map<string, string[]>();

  for (const lien of screen.getByRole("navigation").querySelectorAll("a")) {
    const libelle = (
      lien.getAttribute("aria-label") ??
      lien.textContent ??
      ""
    ).trim();
    const destination = lien.getAttribute("href") ?? "";
    parLibelle.set(libelle, [...(parLibelle.get(libelle) ?? []), destination]);
  }

  return parLibelle;
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun. Le
// localStorage part avec, jetons et thème compris.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("NavBar — visiteur", () => {
  it("sert la même destination des deux côtés pour un même libellé", () => {
    rendreLaBarre();
    const parLibelle = destinationsParLibelle();

    // Un exemplaire par bloc. Sans ce contrôle, un bloc vidé de ses actions
    // laisserait la boucle ci-dessous passer à vide.
    expect(parLibelle.get("Se connecter")).toHaveLength(2);
    expect(parLibelle.get("Nous rejoindre")).toHaveLength(2);

    for (const [libelle, destinations] of parLibelle) {
      expect([...new Set(destinations)], `« ${libelle} »`).toHaveLength(1);
    }
  });

  it("mène à l'inscription, et à aucune route que l'application ne déclare", () => {
    rendreLaBarre();
    const parLibelle = destinationsParLibelle();

    expect(parLibelle.get("Nous rejoindre")).toEqual([
      "/subscribe",
      "/subscribe",
    ]);

    // Les ancres de défilement ne sont pas des adresses : seules les
    // destinations internes se confrontent aux routes.
    const internes = [...parLibelle.values()]
      .flat()
      .filter((destination) => destination.startsWith("/"));
    expect(internes.length).toBeGreaterThan(0);

    for (const destination of internes) {
      expect(ROUTES_DE_L_APP).toContain(destination);
    }
  });

  it("ne propose pas de déconnexion", () => {
    rendreLaBarre();

    expect(screen.queryAllByText("Se déconnecter")).toHaveLength(0);
  });
});

describe("NavBar — membre connecté", () => {
  it("remplace les deux jeux d'actions par une déconnexion", () => {
    // Lu dès le premier rendu par `useIsAuthenticated` : la session se pose
    // avant, sans quoi la barre s'afficherait en visiteur.
    saveTokens({ access: "jeton-acces", refresh: "jeton-renouvellement" });
    rendreLaBarre();

    expect(screen.getAllByText("Se déconnecter")).toHaveLength(2);
    expect(screen.queryAllByText("Se connecter")).toHaveLength(0);
    expect(screen.queryAllByText("Nous rejoindre")).toHaveLength(0);
  });
});
