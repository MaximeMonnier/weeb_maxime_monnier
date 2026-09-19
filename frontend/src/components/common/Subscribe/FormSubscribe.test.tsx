import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormSubscribe from "./FormSubscribe";

const FETCH_ORIGINAL = globalThis.fetch;

// Le réseau est coupé à `fetch` et non à `apiFetch` : le test traverse alors la
// vraie chaîne, du corps que reçoit le réseau jusqu'à la traduction du refus.
const appelReseau = vi.fn();

// apiFetch ne lit que ok, status et json() : le doublon s'en tient là.
function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

// Le formulaire pose des Link : sans routeur, il ne rend pas. La route de
// connexion porte un repère, l'absence de redirection ne se voyant qu'ainsi.
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

// Ce que le réseau a reçu au dernier appel. Le doublon répond 201 quels que
// soient ses arguments : sans cette lecture, une route ou un corps changés
// laisseraient la suite verte.
function requeteEnvoyee() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    methode: options.method,
    corps: JSON.parse(options.body as string) as unknown,
  };
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

// Le texte est attendu DANS la région annoncée, et non n'importe où dans la page :
// un message rendu à côté d'une région restée vide passerait autrement pour annoncé.
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

// Le chemin nominal, dont chaque cas ne change qu'une pièce.
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

beforeEach(() => {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

// Le nettoyage du DOM est explicite : Testing Library ne l'inscrit lui-même que
// s'il trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(() => {
  cleanup();
  globalThis.fetch = FETCH_ORIGINAL;
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

    // Le compte naît inactif : sans cette phrase, la connexion qui suit
    // renverrait un refus que rien n'explique.
    await attendreLaConfirmation();
    expect(zoneDeSucces()).toHaveClass("form-alert-success");
    expect(screen.queryByText("Page de connexion")).not.toBeInTheDocument();
    // `confirmPassword` reste au formulaire : l'API ne le connaît pas.
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

    // La région reste montée et se vide : apparue avec son texte, elle ne serait
    // pas annoncée de façon fiable.
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
    // Pointer le champ dirait déjà que l'adresse est prise.
    expect(champEmail()).toHaveAttribute("aria-invalid", "false");
    expect(zoneDeSucces()).toBeEmptyDOMElement();
  });
});
