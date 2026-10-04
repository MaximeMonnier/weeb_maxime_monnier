import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import ResetPassword from "./ResetPassword";

const FETCH_ORIGINAL = globalThis.fetch;

// Coupé à `fetch` et non à `apiFetch` : l'adresse et le corps sont ceux de la vraie chaîne.
const appelReseau = vi.fn();

function afficherPage() {
  render(
    <MemoryRouter initialEntries={["/reset-password?uid=x&token=y"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<p>Page de connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function remplirEtEnvoyer(nouveau: string, confirmation = nouveau) {
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
});

describe("ResetPassword", () => {
  it("refuse un mot de passe sans majuscule ni chiffre sans appeler l'API", async () => {
    afficherPage();

    await remplirEtEnvoyer("motdepasse");

    expect(appelReseau).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nouveau mot de passe")).toHaveAccessibleDescription(
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
    );
  });

  it("n'appelle pas l'API quand la confirmation diffère", async () => {
    afficherPage();

    await remplirEtEnvoyer("NouveauSecret456", "NouveauSecret457");

    expect(appelReseau).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("Confirmer le nouveau mot de passe"),
    ).toHaveAccessibleDescription("Les mots de passe ne correspondent pas");
  });

  it("n'envoie que l'uid, le jeton et le mot de passe, puis renvoie à la connexion", async () => {
    appelReseau.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn(async () => ({ detail: "ok" })),
    });
    afficherPage();

    await remplirEtEnvoyer("NouveauSecret456");

    const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
    expect(url).toMatch(/\/auth\/password-reset\/confirm\/$/);
    expect(JSON.parse(options.body as string)).toEqual({
      uid: "x",
      token: "y",
      new_password: "NouveauSecret456",
    });
    expect(await screen.findByText("Page de connexion")).toBeInTheDocument();
  });
});
