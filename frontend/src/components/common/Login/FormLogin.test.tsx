import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormLogin from "./FormLogin";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../../../test/reseau";

function afficherFormulaire() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<FormLogin />} />
        <Route path="/" element={<p>Page d'accueil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const champEmail = () => screen.getByLabelText("Adresse email");
const champMotDePasse = () => screen.getByLabelText("Mot de passe");
const bouton = () => screen.getByRole("button");
const alerte = () => screen.getByRole("alert");

async function remplirEtEnvoyer(email: string, motDePasse: string) {
  if (email) await userEvent.type(champEmail(), email);
  if (motDePasse) await userEvent.type(champMotDePasse(), motDePasse);
  await userEvent.click(bouton());
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
  localStorage.clear();
});

describe("FormLogin — refus avant tout appel", () => {
  it("nomme les deux champs vides", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("", "");

    expect(screen.getByText("L'email est requis")).toBeInTheDocument();
    expect(screen.getByText("Le mot de passe est requis")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("refuse un email sans domaine", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example", "motdepasse123");

    expect(screen.getByText("L'email n'est pas valide")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("FormLogin — réponse de l'API", () => {
  it("substitue son libellé au 401 de simplejwt", async () => {
    appelReseau.mockResolvedValue(
      reponse(401, {
        detail: "Aucun compte actif n'a été trouvé avec les identifiants fournis",
      }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(alerte()).toHaveTextContent(/^Connexion impossible\./);
    // Ni le champ fautif ni l'existence du compte : sinon énumération des comptes.
    expect(alerte()).toHaveTextContent(/validé par un administrateur\.$/);
    expect(localStorage.getItem("access")).toBeNull();
  });

  it("garde les deux jetons et mène à l'accueil après un succès", async () => {
    appelReseau.mockResolvedValue(
      reponse(200, { access: "jeton-acces", refresh: "jeton-renouvellement" }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument();
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/auth\/login\/$/),
      methode: "POST",
      corps: {
        email: "jean.dupont@example.com",
        password: "motdepasse123",
      },
    });
    expect(localStorage.getItem("access")).toBe("jeton-acces");
    expect(localStorage.getItem("refresh")).toBe("jeton-renouvellement");
  });

  // La longueur minimale ne vaut qu'à la création : un compte du shell peut être plus court.
  it("envoie un mot de passe de moins de huit caractères", async () => {
    appelReseau.mockResolvedValue(
      reponse(200, { access: "jeton-acces", refresh: "jeton-renouvellement" }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "court12");

    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument();
    expect(requeteEnvoyee().corps).toEqual({
      email: "jean.dupont@example.com",
      password: "court12",
    });
  });
});

describe("FormLogin — envoi en cours", () => {
  it("annonce l'attente et ferme le bouton jusqu'à la réponse", async () => {
    // Réponse retenue : « Connexion... » ne s'affiche que pendant l'attente.
    let repondre: (reponseHttp: unknown) => void = () => {};
    appelReseau.mockReturnValue(
      new Promise((resolve) => {
        repondre = resolve;
      }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(bouton()).toHaveTextContent("Connexion...");
    expect(bouton()).toBeDisabled();

    repondre(reponse(200, { access: "jeton-acces", refresh: "renouvellement" }));
    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument();
  });
});
