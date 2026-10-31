import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormSubscribe from "./FormSubscribe";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../../../test/reseau";

function afficherFormulaire() {
  render(
    <MemoryRouter initialEntries={["/subscribe"]}>
      <Routes>
        <Route path="/subscribe" element={<FormSubscribe />} />
        <Route path="/login" element={<p>Page de connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const champPrenom = () => screen.getByLabelText("Prénom");
const champNom = () => screen.getByLabelText("Nom");
const champEmail = () => screen.getByLabelText("Adresse email");
const champMotDePasse = () => screen.getByLabelText("Mot de passe");
const champConfirmation = () =>
  screen.getByLabelText("Confirmer le mot de passe");
const bouton = () => screen.getByRole("button");
const alerte = () => screen.getByRole("alert");
const zoneDeSucces = () => screen.getByRole("status");

const CONFIRMATION_ATTENDUE =
  "Un administrateur doit l'activer avant votre première connexion.";

// Le texte est attendu dans la région annoncée, pas ailleurs dans la page.
async function attendreLaConfirmation() {
  await waitFor(() =>
    expect(zoneDeSucces()).toHaveTextContent(CONFIRMATION_ATTENDUE),
  );
}

const SAISIE_VALIDE = {
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean.dupont@example.com",
  password: "MotDePasse1",
  confirmPassword: "MotDePasse1",
};

async function remplirEtEnvoyer(saisie: Partial<typeof SAISIE_VALIDE> = {}) {
  const valeurs = { ...SAISIE_VALIDE, ...saisie };

  if (valeurs.first_name) await userEvent.type(champPrenom(), valeurs.first_name);
  if (valeurs.last_name) await userEvent.type(champNom(), valeurs.last_name);
  if (valeurs.email) await userEvent.type(champEmail(), valeurs.email);
  if (valeurs.password) await userEvent.type(champMotDePasse(), valeurs.password);
  if (valeurs.confirmPassword) {
    await userEvent.type(champConfirmation(), valeurs.confirmPassword);
  }

  await userEvent.click(bouton());
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
});

describe("FormSubscribe — refus avant tout appel", () => {
  it("refuse deux mots de passe différents", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer({ confirmPassword: "AutreMotDePasse1" });

    expect(
      screen.getByText("Les mots de passe ne correspondent pas"),
    ).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("FormSubscribe — inscription acceptée", () => {
  beforeEach(() => {
    appelReseau.mockResolvedValue(
      reponse(201, { id: 1, email: SAISIE_VALIDE.email }),
    );
  });

  it("annonce l'activation par un administrateur sans quitter la page", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer();

    await attendreLaConfirmation();
    expect(zoneDeSucces()).toHaveClass("form-alert-success");
    expect(screen.queryByText("Page de connexion")).not.toBeInTheDocument();
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/auth\/register\/$/),
      methode: "POST",
      corps: {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "MotDePasse1",
      },
    });
  });

  it("vide les champs, une seconde inscription n'étant pas celle-là", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer();
    await attendreLaConfirmation();

    expect(champPrenom()).toHaveValue("");
    expect(champNom()).toHaveValue("");
    expect(champEmail()).toHaveValue("");
    expect(champMotDePasse()).toHaveValue("");
    expect(champConfirmation()).toHaveValue("");
  });

  it("retire la confirmation dès la frappe suivante", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer();
    await attendreLaConfirmation();

    await userEvent.type(champEmail(), "a");

    expect(zoneDeSucces()).toBeEmptyDOMElement();
  });
});

describe("FormSubscribe — refus de l'API", () => {
  it("ne nomme pas l'adresse déjà inscrite", async () => {
    appelReseau.mockResolvedValue(
      reponse(400, {
        email: ["custom user with this email already exists."],
      }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer();

    expect(alerte()).toHaveTextContent(/^Impossible de créer un compte/);
    expect(champEmail()).toHaveAttribute("aria-invalid", "false");
    expect(zoneDeSucces()).toBeEmptyDOMElement();
  });
});
