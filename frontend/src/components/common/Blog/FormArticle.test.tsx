import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import FormArticle from "./FormArticle";
import {
  appelReseau,
  champsMultipart,
  couperLeReseau,
  dernierAppel,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../../../test/reseau";

// Sans jeton : sinon apiFetch renouvellerait sur le 401 et ferait un second appel.
function afficherFormulaire() {
  const onCreated = vi.fn();
  render(<FormArticle onCreated={onCreated} />);
  return onCreated;
}

const champTitre = () => screen.getByLabelText("Titre de l'article");
const champContenu = () => screen.getByLabelText("Description de votre article");
const alerte = () => screen.getByRole("alert");
const champImage = () => screen.getByLabelText("Image de couverture");
const apercu = () => screen.queryByAltText("Aperçu de l'image de couverture");
const boutonRetirer = () => screen.getByRole("button", { name: "Retirer l'image" });

function image(nom: string, type: string, octets = 1024) {
  return new File([new Uint8Array(octets)], nom, { type });
}
const PHOTO = image("photo.jpg", "image/jpeg");

// Sinon user-event filtrerait le GIF, que « Tous les fichiers » laisse passer.
const utilisateur = () => userEvent.setup({ applyAccept: false });

const TITRE = "Mon premier article";
const CONTENU = "Un contenu assez long pour passer.";

// Saisies non vides : en navigateur, `required` arrêterait le vide avant la règle.
async function remplirEtEnvoyer(titre: string, contenu: string) {
  await userEvent.type(champTitre(), titre);
  await userEvent.type(champContenu(), contenu);
  await userEvent.click(screen.getByRole("button", { name: "Publier l'article" }));
}

beforeEach(() => {
  couperLeReseau();
  // jsdom n'a pas d'URL d'objet.
  URL.createObjectURL = vi.fn((fichier: Blob) => `blob:${(fichier as File).name}`);
  URL.revokeObjectURL = vi.fn();
});

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

describe("FormArticle — image de couverture", () => {
  it("envoie l'image choisie en multipart avec le titre et le contenu", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    const onCreated = afficherFormulaire();

    await utilisateur().upload(champImage(), PHOTO);
    expect(apercu()).toHaveAttribute("src", "blob:photo.jpg");
    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(dernierAppel().options.method).toBe("POST");
    expect(champsMultipart()).toEqual({ title: TITRE, content: CONTENU, cover: PHOTO });
    expect(apercu()).not.toBeInTheDocument();
  });

  it("revient au JSON quand l'image choisie est retirée", async () => {
    appelReseau.mockResolvedValue(reponse(201));
    afficherFormulaire();

    await utilisateur().upload(champImage(), PHOTO);
    await userEvent.click(boutonRetirer());
    expect(apercu()).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo.jpg");
    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
    expect(requeteEnvoyee().corps).toEqual({ title: TITRE, content: CONTENU });
  });

  it.each([
    ["de plus de 5 Mo", image("photo.jpg", "image/jpeg", 6 * 1024 * 1024), "L'image dépasse 5 Mo."],
    ["hors des trois formats", image("anime.gif", "image/gif"), "Formats acceptés : JPEG, PNG et WebP."],
  ])("refuse une image %s sans rien envoyer", async (_cas, fichier, message) => {
    afficherFormulaire();

    await utilisateur().upload(champImage(), fichier);
    await remplirEtEnvoyer(TITRE, CONTENU);

    expect(champImage()).toHaveAccessibleDescription(message);
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("efface le refus quand une autre image est choisie", async () => {
    afficherFormulaire();

    await utilisateur().upload(champImage(), image("anime.gif", "image/gif"));
    await remplirEtEnvoyer(TITRE, CONTENU);
    await utilisateur().upload(champImage(), PHOTO);

    expect(champImage()).toHaveAccessibleDescription("JPEG, PNG ou WebP, 5 Mo au plus.");
  });

  it("range sous le champ le refus que l'API adresse à l'image", async () => {
    const refus = "Formats acceptés : JPEG, PNG et WebP.";
    appelReseau.mockResolvedValue(reponse(400, { cover: [refus] }));
    afficherFormulaire();

    await utilisateur().upload(champImage(), image("faux.png", "image/png"));
    await remplirEtEnvoyer(TITRE, CONTENU);

    await waitFor(() => expect(champImage()).toHaveAccessibleDescription(refus));
    expect(alerte()).toBeEmptyDOMElement();
  });
});

describe("FormArticle — modification d'un article", () => {
  const ARTICLE = {
    id: 7,
    title: "Titre actuel",
    content: "Le texte actuel de l'article.",
    cover: null,
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

  describe("avec une image enregistrée", () => {
    const ILLUSTRE = { ...ARTICLE, cover: "http://api.test/media/couverture.webp" };

    function afficherIllustre() {
      const onUpdated = vi.fn();
      render(<FormArticle article={ILLUSTRE} onUpdated={onUpdated} />);
      return onUpdated;
    }

    const enregistrer = () =>
      userEvent.click(
        screen.getByRole("button", { name: "Enregistrer les modifications" }),
      );

    it("montre l'image actuelle", () => {
      afficherIllustre();

      expect(apercu()).toHaveAttribute("src", ILLUSTRE.cover);
    });

    it("garde le JSON quand l'image n'est pas touchée", async () => {
      appelReseau.mockResolvedValue(reponse(200, ILLUSTRE));
      afficherIllustre();

      await enregistrer();

      await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
      expect(requeteEnvoyee().corps).toEqual({
        title: ILLUSTRE.title,
        content: ILLUSTRE.content,
      });
    });

    it("envoie un champ image vide quand elle est retirée", async () => {
      const enregistre = { ...ILLUSTRE, cover: null };
      appelReseau.mockResolvedValue(reponse(200, enregistre));
      const onUpdated = afficherIllustre();

      await userEvent.click(boutonRetirer());
      expect(apercu()).not.toBeInTheDocument();
      await enregistrer();

      await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(enregistre));
      expect(dernierAppel().options.method).toBe("PATCH");
      expect(champsMultipart()).toEqual({
        title: ILLUSTRE.title,
        content: ILLUSTRE.content,
        cover: "",
      });
    });

    it("envoie la nouvelle image à la place de l'actuelle", async () => {
      appelReseau.mockResolvedValue(reponse(200, ILLUSTRE));
      afficherIllustre();

      await utilisateur().upload(champImage(), PHOTO);
      expect(apercu()).toHaveAttribute("src", "blob:photo.jpg");
      await enregistrer();

      await waitFor(() => expect(appelReseau).toHaveBeenCalledTimes(1));
      expect(champsMultipart()).toMatchObject({ cover: PHOTO });
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
