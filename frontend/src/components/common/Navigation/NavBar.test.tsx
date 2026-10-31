import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { ROUTES } from "../../../routes";

import { saveTokens } from "../../../lib/tokens";
import NavBar from "./NavBar";

const ROUTES_DE_L_APP = ROUTES.map(({ path }) => path)
  .filter((chemin) => chemin !== "*" && !chemin.includes(":"));

function rendreLaBarre() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <NavBar />
    </MemoryRouter>,
  );
}

// Sous jsdom, bloc desktop et menu mobile cohabitent : les doublons sont attendus.
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

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("NavBar — visiteur", () => {
  it("sert la même destination des deux côtés pour un même libellé", () => {
    rendreLaBarre();
    const parLibelle = destinationsParLibelle();

    // Sans ce contrôle, un bloc vide laisserait la boucle passer à vide.
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
    saveTokens({ access: "jeton-acces", refresh: "jeton-renouvellement" });
    rendreLaBarre();

    expect(screen.getAllByText("Se déconnecter")).toHaveLength(2);
    expect(screen.queryAllByText("Se connecter")).toHaveLength(0);
    expect(screen.queryAllByText("Nous rejoindre")).toHaveLength(0);
  });
});
