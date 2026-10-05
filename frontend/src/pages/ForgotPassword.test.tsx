import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import ForgotPassword from "./ForgotPassword";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../test/reseau";

const EMAIL = "jean.dupont@exemple.fr";

const champEmail = () => screen.getByLabelText("Adresse email");
const boutonEnvoi = () =>
  screen.queryByRole("button", { name: "Réinitialiser mon mot de passe" });
const statut = () => screen.getByRole("status");
const alerte = () => screen.getByRole("alert");

async function saisirEtEnvoyer() {
  render(<ForgotPassword />);
  await userEvent.type(champEmail(), EMAIL);
  await userEvent.click(boutonEnvoi()!);
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
});

describe("ForgotPassword", () => {
  it("n'envoie que l'adresse saisie", async () => {
    appelReseau.mockResolvedValue(reponse(200, { detail: "ok" }));

    await saisirEtEnvoyer();

    await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/auth\/password-reset\/$/),
      methode: "POST",
      corps: { email: EMAIL },
    });
  });

  // Le même corps que le compte existe ou non : la page n'a rien à en déduire.
  it("affiche mot pour mot la réponse de l'API et retire le formulaire", async () => {
    const detail =
      "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.";
    appelReseau.mockResolvedValue(reponse(200, { detail }));

    await saisirEtEnvoyer();

    await waitFor(() => expect(statut().textContent).toBe(detail));
    expect(boutonEnvoi()).not.toBeInTheDocument();
  });

  it("range sous l'email le refus que l'API lui adresse", async () => {
    const refus = "Saisissez une adresse e-mail valide.";
    appelReseau.mockResolvedValue(reponse(400, { email: [refus] }));

    await saisirEtEnvoyer();

    await waitFor(() => expect(champEmail()).toHaveAccessibleDescription(refus));
    expect(boutonEnvoi()).toBeInTheDocument();
  });

  // Le délai restant n'est que dans le texte de DRF : reformulé, il se perdrait.
  it("affiche mot pour mot le refus d'un quota épuisé", async () => {
    const detail =
      "Requête ralentie. Prochaine requête disponible dans 3542 secondes.";
    appelReseau.mockResolvedValue(reponse(429, { detail }));

    await saisirEtEnvoyer();

    await waitFor(() => expect(alerte().textContent).toBe(detail));
  });
});
