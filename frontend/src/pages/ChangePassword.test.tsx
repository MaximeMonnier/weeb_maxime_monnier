import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import ChangePassword from "./ChangePassword";

const FETCH_ORIGINAL = globalThis.fetch;

// Coupé à `fetch` et non à `apiFetch` : le jeton posé, l'adresse et la traduction
// du refus sont ceux de la vraie chaîne.
const appelReseau = vi.fn();

function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

function afficherPage() {
  render(
    <MemoryRouter>
      <ChangePassword />
    </MemoryRouter>,
  );
}

function requeteEnvoyee() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    entetes: options.headers as Record<string, string>,
    corps: JSON.parse(options.body as string) as unknown,
  };
}

async function remplirEtEnvoyer(actuel: string, nouveau: string, confirmation = nouveau) {
  await userEvent.type(screen.getByLabelText("Mot de passe actuel"), actuel);
  await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), nouveau);
  await userEvent.type(
    screen.getByLabelText("Confirmer le nouveau mot de passe"),
    confirmation,
  );
  await userEvent.click(screen.getByRole("button"));
}

beforeEach(() => {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = FETCH_ORIGINAL;
  localStorage.clear();
});

describe("ChangePassword — visiteur", () => {
  it("renvoie à la connexion sans afficher le formulaire", () => {
    afficherPage();

    expect(screen.queryByLabelText("Mot de passe actuel")).toBeNull();
    expect(screen.getByRole("link", { name: "Connectez-vous" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});

describe("ChangePassword — membre connecté", () => {
  beforeEach(() => {
    localStorage.setItem("access", "acces-avant");
    localStorage.setItem("refresh", "refresh-avant");
  });

  it("garde la session en posant les jetons neufs que l'API rend", async () => {
    appelReseau.mockResolvedValue(
      reponse(200, { access: "acces-neuf", refresh: "refresh-neuf" }),
    );
    afficherPage();

    await remplirEtEnvoyer("AncienSecret123", "NouveauSecret456");

    const { url, entetes, corps } = requeteEnvoyee();
    expect(url).toMatch(/\/auth\/password-change\/$/);
    expect(entetes.Authorization).toBe("Bearer acces-avant");
    expect(corps).toEqual({
      current_password: "AncienSecret123",
      new_password: "NouveauSecret456",
    });
    // L'API a révoqué le refresh d'avant : le garder éteindrait la session à
    // son prochain renouvellement.
    expect(localStorage.getItem("access")).toBe("acces-neuf");
    expect(localStorage.getItem("refresh")).toBe("refresh-neuf");
    expect(screen.getByRole("status")).toHaveTextContent("mot de passe est modifié");
  });

  it("range le refus du mot de passe actuel sous son champ", async () => {
    appelReseau.mockResolvedValue(
      reponse(400, { current_password: ["Le mot de passe actuel est incorrect."] }),
    );
    afficherPage();

    await remplirEtEnvoyer("MauvaisSecret789", "NouveauSecret456");

    expect(screen.getByLabelText("Mot de passe actuel")).toHaveAccessibleDescription(
      "Le mot de passe actuel est incorrect.",
    );
    expect(localStorage.getItem("refresh")).toBe("refresh-avant");
  });

  it("n'appelle pas l'API quand la confirmation diffère", async () => {
    afficherPage();

    await remplirEtEnvoyer("AncienSecret123", "NouveauSecret456", "NouveauSecret457");

    expect(appelReseau).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("Confirmer le nouveau mot de passe"),
    ).toHaveAccessibleDescription("Les mots de passe ne correspondent pas");
  });
});
