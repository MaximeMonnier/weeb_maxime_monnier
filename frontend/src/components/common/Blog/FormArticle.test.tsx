import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import FormArticle from "./FormArticle";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../../../test/reseau";

// Aucun jeton n'est posé : avec un jeton, apiFetch tenterait un renouvellement
// sur le 401 et ferait un second appel.
function afficherFormulaire() {
  const onCreated = vi.fn();
  render(<FormArticle onCreated={onCreated} />);
  return onCreated;
}

const champTitre = () => screen.getByLabelText("Titre de l'article");
const champContenu = () => screen.getByLabelText("Description de votre article");
const alerte = () => screen.getByRole("alert");

const TITRE = "Mon premier article";
const CONTENU = "Un contenu assez long pour passer.";

// Les saisies refusées restent non vides : dans un navigateur, `required` arrête
// le vide avant la règle du formulaire, que jsdom laisse passer.
async function remplirEtEnvoyer(titre: string, contenu: string) {
  await userEvent.type(champTitre(), titre);
  await userEvent.type(champContenu(), contenu);
  await userEvent.click(screen.getByRole("button"));
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
  localStorage.clear();
});

describe("FormArticle — refus avant tout appel", () => {
  it("refuse un titre fait d'espaces", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("   ", CONTENU);

    expect(screen.getByText("Le titre est requis")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("refuse un contenu de moins de dix caractères", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer(TITRE, "court");

    expect(
      screen.getByText("Le contenu doit contenir au moins 10 caractères"),
    ).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("FormArticle — réponse de l'API", () => {
  it("n'envoie que le titre et le contenu", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    afficherFormulaire();

    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/articles\/$/),
      methode: "POST",
      corps: { title: TITRE, content: CONTENU },
    });
  });

  it("prévient la page et vide les champs après la publication", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    const onCreated = afficherFormulaire();

    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(champTitre()).toHaveValue("");
    expect(champContenu()).toHaveValue("");
  });

  it("range sous le titre le refus que l'API lui adresse", async () => {
    const refus = "Assurez-vous que ce champ comporte au plus 200 caractères.";
    appelReseau.mockResolvedValue(reponse(400, { title: [refus] }));
    const onCreated = afficherFormulaire();

    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(champTitre()).toHaveAccessibleDescription(refus));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("annonce une session finie sur un 401", async () => {
    appelReseau.mockResolvedValue(reponse(401, { detail: "Token invalide" }));
    afficherFormulaire();

    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() =>
      expect(alerte()).toHaveTextContent(
        /^Vous devez être connecté pour publier,.*il ne sera pas conservé\.$/,
      ),
    );
    expect(appelReseau).toHaveBeenCalledTimes(1);
  });
});

describe("FormArticle — modification d'un article", () => {
  const ARTICLE = {
    id: 7,
    title: "Titre actuel",
    content: "Le texte actuel de l'article.",
    author: "Jean Dupont",
    is_author: true,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
  };

  function afficherEdition() {
    const onUpdated = vi.fn();
    render(<FormArticle article={ARTICLE} onUpdated={onUpdated} />);
    return onUpdated;
  }

  async function remplacerEtEnregistrer(titre: string, contenu: string) {
    await userEvent.clear(champTitre());
    await userEvent.type(champTitre(), titre);
    await userEvent.clear(champContenu());
    await userEvent.type(champContenu(), contenu);
    await userEvent.click(
      screen.getByRole("button", { name: "Enregistrer les modifications" }),
    );
  }

  it("préremplit les champs avec l'article actuel", () => {
    afficherEdition();

    expect(champTitre()).toHaveValue(ARTICLE.title);
    expect(champContenu()).toHaveValue(ARTICLE.content);
  });

  it("envoie le titre et le contenu seuls en PATCH vers l'article", async () => {
    const enregistre = { ...ARTICLE, title: TITRE, content: CONTENU };
    appelReseau.mockResolvedValue(reponse(200, enregistre));
    const onUpdated = afficherEdition();

    await remplacerEtEnregistrer(TITRE, CONTENU);

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(enregistre));
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/articles\/7\/$/),
      methode: "PATCH",
      corps: { title: TITRE, content: CONTENU },
    });
  });

  it("annonce en français un article supprimé entre-temps", async () => {
    appelReseau.mockResolvedValue(
      reponse(404, { detail: "No Article matches the given query." }),
    );
    const onUpdated = afficherEdition();

    await remplacerEtEnregistrer(TITRE, CONTENU);

    await waitFor(() =>
      expect(alerte()).toHaveTextContent(
        "Cet article n'existe plus : il a été supprimé entre-temps.",
      ),
    );
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("garde le message des droits sur un 403", async () => {
    appelReseau.mockResolvedValue(
      reponse(403, { detail: "You do not have permission." }),
    );
    afficherEdition();

    await remplacerEtEnregistrer(TITRE, CONTENU);

    await waitFor(() =>
      expect(alerte()).toHaveTextContent(
        "Vous n'avez pas les droits nécessaires pour cette action.",
      ),
    );
  });
});
