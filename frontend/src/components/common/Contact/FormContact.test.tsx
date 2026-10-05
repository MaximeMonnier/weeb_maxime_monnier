import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormContact from "./FormContact";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../../../test/reseau";

function afficherFormulaire() {
  render(
    <MemoryRouter initialEntries={["/contact"]}>
      <Routes>
        <Route path="/contact" element={<FormContact />} />
        <Route path="/privacy" element={<p>Page de confidentialité</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const lienConfidentialite = () =>
  screen.getByRole("link", { name: "politique de confidentialité" });

const CHAMPS = {
  first_name: () => screen.getByLabelText("Prénom"),
  last_name: () => screen.getByLabelText("Nom"),
  email: () => screen.getByLabelText("Adresse email"),
  subject: () => screen.getByLabelText("Sujet"),
  message: () => screen.getByLabelText("Message"),
};

const statut = () => screen.getByRole("status");
const alerte = () => screen.getByRole("alert");

const SAISIE = {
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean.dupont@exemple.fr",
  subject: "Une question",
  message: "Un message assez long pour passer.",
};

// Les saisies refusées passent la validation native : dans un navigateur, `required`
// et `type="email"` arrêteraient le reste avant la règle du formulaire, que jsdom
// laisse passer.
async function remplirEtEnvoyer(modifications: Partial<typeof SAISIE> = {}) {
  const saisie = { ...SAISIE, ...modifications };
  for (const [champ, valeur] of Object.entries(saisie)) {
    await userEvent.type(CHAMPS[champ as keyof typeof SAISIE](), valeur);
  }
  await userEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
});

describe("FormContact", () => {
  // L'information est due au moment de la collecte : placée après le bouton,
  // elle serait lue une fois le message parti.
  it("informe de l'usage des données entre le message et le bouton d'envoi", () => {
    afficherFormulaire();

    const message = screen.getByLabelText("Message");
    const lien = lienConfidentialite();
    const bouton = screen.getByRole("button", { name: "Envoyer le message" });

    expect(message.compareDocumentPosition(lien)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(lien.compareDocumentPosition(bouton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("mène à la politique de confidentialité", async () => {
    afficherFormulaire();

    await userEvent.click(lienConfidentialite());

    expect(screen.getByText("Page de confidentialité")).toBeInTheDocument();
  });
});

describe("FormContact — refus avant tout appel", () => {
  it("refuse un email sans extension de domaine", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer({ email: "jean@exemple" });

    expect(screen.getByText("L'email n'est pas valide")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("refuse un message de moins de dix caractères", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer({ message: "court" });

    expect(
      screen.getByText("Le message doit contenir au moins 10 caractères"),
    ).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("FormContact — réponse de l'API", () => {
  it("envoie les cinq champs, et eux seuls", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    afficherFormulaire();

    await remplirEtEnvoyer();

    await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/contact\/$/),
      methode: "POST",
      corps: SAISIE,
    });
  });

  it("confirme l'envoi et vide les champs", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    afficherFormulaire();

    await remplirEtEnvoyer();

    await waitFor(() =>
      expect(statut()).toHaveTextContent(
        "Votre message est parti. Nous vous répondrons par email.",
      ),
    );
    for (const champ of Object.values(CHAMPS)) {
      expect(champ()).toHaveValue("");
    }
  });

  it("retire la confirmation à la première frappe du message suivant", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    afficherFormulaire();
    await remplirEtEnvoyer();
    await waitFor(() => expect(statut()).not.toBeEmptyDOMElement());

    await userEvent.type(CHAMPS.first_name(), "J");

    expect(statut()).toBeEmptyDOMElement();
  });

  it("range sous l'email le refus que l'API lui adresse", async () => {
    const refus = "Saisissez une adresse e-mail valide.";
    appelReseau.mockResolvedValue(reponse(400, { email: [refus] }));
    afficherFormulaire();

    await remplirEtEnvoyer();

    await waitFor(() =>
      expect(CHAMPS.email()).toHaveAccessibleDescription(refus),
    );
  });

  // Le délai restant n'est que dans le texte de DRF : reformulé, il se perdrait.
  it("affiche mot pour mot le refus d'un quota épuisé", async () => {
    const detail =
      "Requête ralentie. Prochaine requête disponible dans 3542 secondes.";
    appelReseau.mockResolvedValue(reponse(429, { detail }));
    afficherFormulaire();

    await remplirEtEnvoyer();

    await waitFor(() => expect(alerte().textContent).toBe(detail));
  });
});
