import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import ArticleDetails from "./ArticleDetails";
import {
  appelReseau,
  couperLeReseau,
  dernierAppel,
  reponse,
  retablirLeReseau,
} from "../../test/reseau";
import type { Article } from "../../types/article";

const ARTICLE: Article = {
  id: 1,
  title: "Premier article",
  content: "Le texte entier de l'article.",
  cover: null,
  author: "Jean Dupont",
  is_author: false,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

const ARTICLE_SUIVANT = {
  ...ARTICLE,
  id: 2,
  title: "Deuxième article",
  content: "Un autre texte.",
};

function reponseArticle(article: typeof ARTICLE) {
  return reponse(200, article);
}

function reponseRefusee(status: number, corps: unknown = {}) {
  return reponse(status, corps);
}

const CHARGEMENT = "Chargement…";
const INTROUVABLE = "Article introuvable";
const SERVEUR_INJOIGNABLE =
  "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.";
const SERVICE_INDISPONIBLE =
  "Le service est momentanément indisponible. Réessayez dans un instant.";

const RETOUR_AUX_ARTICLES = { name: "Retour aux articles" };

const alerte = () => screen.getByRole("alert");

function rendreLeDetail(chemin = "/articles/1") {
  render(
    <MemoryRouter initialEntries={[chemin]}>
      <Link to={`/articles/${ARTICLE_SUIVANT.id}`}>Article suivant</Link>
      <Routes>
        <Route path="/articles/:id" element={<ArticleDetails />} />
        <Route path="/articles" element={<ArticleDetails />} />
        <Route path="/blog" element={<p>Liste des articles</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // jsdom n'implémente ni `showModal` ni `close`.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
  couperLeReseau();
  appelReseau.mockResolvedValue(reponseArticle(ARTICLE));
});

afterEach(() => {
  cleanup();
  retablirLeReseau();
});

describe("ArticleDetails — article reçu", () => {
  it("affiche le titre, l'auteur, la date et le texte", async () => {
    rendreLeDetail();

    expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();
    expect(screen.getByText(ARTICLE.content)).toBeInTheDocument();
    expect(
      screen.getByText(ARTICLE.author, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(ARTICLE.created_at).toLocaleDateString(), {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(CHARGEMENT)).not.toBeInTheDocument();
    expect(alerte()).toBeEmptyDOMElement();
    // L'adresse entière : sans barre finale, la production répond 301.
    expect(appelReseau).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/articles/1/`,
      expect.anything(),
    );
  });

  it("affiche l'image au-dessus du titre", async () => {
    const COVER = "http://localhost:8000/media/articles/couverture.jpg";
    appelReseau.mockResolvedValueOnce(reponseArticle({ ...ARTICLE, cover: COVER }));
    rendreLeDetail();

    const titre = await screen.findByRole("heading", { level: 1 });
    const image = document.querySelector("img");
    expect(image).toHaveAttribute("src", COVER);
    expect(titre.previousElementSibling).toBe(image);
  });

  it("n'affiche aucune image quand l'article n'en a pas", async () => {
    rendreLeDetail();

    expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("garde les paragraphes distincts, et une ligne simple dans le sien", async () => {
    appelReseau.mockResolvedValueOnce(
      reponseArticle({
        ...ARTICLE,
        content: "Premier.\nSuite du premier.\n\nSecond.",
      }),
    );
    rendreLeDetail();

    const second = await screen.findByText("Second.");
    const premier = screen.getByText("Premier. Suite du premier.");

    expect(premier.tagName).toBe("P");
    expect(second.tagName).toBe("P");
    expect(premier).not.toBe(second);
  });

  it("affiche une balise saisie dans le texte sans l'interpréter", async () => {
    appelReseau.mockResolvedValueOnce(
      reponseArticle({ ...ARTICLE, content: "Un mot <b>gras</b> ici." }),
    );
    rendreLeDetail();

    expect(
      await screen.findByText("Un mot <b>gras</b> ici."),
    ).toBeInTheDocument();
    expect(document.querySelector("b")).toBeNull();
  });

  it("annonce le chargement tant que la réponse n'est pas arrivée", async () => {
    let livrer: (reponse: unknown) => void = () => {};
    appelReseau.mockReturnValueOnce(
      new Promise((resolve) => {
        livrer = resolve;
      }),
    );
    rendreLeDetail();

    expect(screen.getByText(CHARGEMENT)).toBeInTheDocument();

    livrer(reponseArticle(ARTICLE));

    expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();
  });
});

describe("ArticleDetails — article absent", () => {
  it("propose le retour au blog plutôt qu'un chargement sans fin", async () => {
    appelReseau.mockResolvedValueOnce(
      reponseRefusee(404, { detail: "Pas trouvé." }),
    );
    rendreLeDetail("/articles/999999");

    expect(await screen.findByText(INTROUVABLE)).toBeInTheDocument();
    expect(screen.queryByText(CHARGEMENT)).not.toBeInTheDocument();
    expect(alerte()).toBeEmptyDOMElement();

    await userEvent.click(screen.getByRole("link", RETOUR_AUX_ARTICLES));

    expect(screen.getByText("Liste des articles")).toBeInTheDocument();
  });

  it("ne demande rien à l'API quand l'adresse ne porte pas d'identifiant", async () => {
    rendreLeDetail("/articles");

    expect(await screen.findByText(INTROUVABLE)).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("ArticleDetails — refus de l'API", () => {
  it("signale un serveur injoignable plutôt qu'un chargement figé", async () => {
    appelReseau.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    rendreLeDetail();

    await waitFor(() =>
      expect(alerte()).toHaveTextContent(SERVEUR_INJOIGNABLE),
    );
    expect(screen.queryByText(CHARGEMENT)).not.toBeInTheDocument();
    expect(screen.queryByText(INTROUVABLE)).not.toBeInTheDocument();
  });

  it("distingue la panne du serveur de l'article supprimé", async () => {
    appelReseau.mockResolvedValueOnce(reponseRefusee(500));
    rendreLeDetail();

    await waitFor(() =>
      expect(alerte()).toHaveTextContent(SERVICE_INDISPONIBLE),
    );
    expect(screen.getByRole("link", RETOUR_AUX_ARTICLES)).toBeInTheDocument();
    expect(screen.queryByText(INTROUVABLE)).not.toBeInTheDocument();
  });
});

describe("ArticleDetails — changement d'article en cours de route", () => {
  it("retire l'article affiché le temps de charger le suivant", async () => {
    let livrerLeSecond: (reponse: unknown) => void = () => {};
    appelReseau
      .mockResolvedValueOnce(reponseArticle(ARTICLE))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          livrerLeSecond = resolve;
        }),
      );
    rendreLeDetail();
    expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Article suivant" }));

    expect(screen.getByText(CHARGEMENT)).toBeInTheDocument();
    expect(screen.queryByText(ARTICLE.title)).not.toBeInTheDocument();

    livrerLeSecond(reponseArticle(ARTICLE_SUIVANT));

    expect(await screen.findByText(ARTICLE_SUIVANT.title)).toBeInTheDocument();
  });

  it("garde le dernier article demandé quand la réponse d'avant arrive après", async () => {
    let livrerLePremier: (reponse: unknown) => void = () => {};
    appelReseau
      .mockReturnValueOnce(
        new Promise((resolve) => {
          livrerLePremier = resolve;
        }),
      )
      .mockResolvedValueOnce(reponseArticle(ARTICLE_SUIVANT));
    rendreLeDetail();

    await userEvent.click(screen.getByRole("link", { name: "Article suivant" }));
    expect(await screen.findByText(ARTICLE_SUIVANT.title)).toBeInTheDocument();

    // Laisse la réponse périmée traverser ses `then` avant de conclure.
    await act(async () => {
      livrerLePremier(reponseArticle(ARTICLE));
    });

    expect(screen.getByText(ARTICLE_SUIVANT.content)).toBeInTheDocument();
    expect(screen.queryByText(ARTICLE.title)).not.toBeInTheDocument();
  });

  it("garde le dernier article demandé quand c'est un refus qui arrive après", async () => {
    let livrerLePremier: (reponse: unknown) => void = () => {};
    appelReseau
      .mockReturnValueOnce(
        new Promise((resolve) => {
          livrerLePremier = resolve;
        }),
      )
      .mockResolvedValueOnce(reponseArticle(ARTICLE_SUIVANT));
    rendreLeDetail();

    await userEvent.click(screen.getByRole("link", { name: "Article suivant" }));
    expect(await screen.findByText(ARTICLE_SUIVANT.title)).toBeInTheDocument();

    await act(async () => {
      livrerLePremier(reponseRefusee(404, { detail: "Pas trouvé." }));
    });

    expect(screen.getByText(ARTICLE_SUIVANT.content)).toBeInTheDocument();
    expect(screen.queryByText(INTROUVABLE)).not.toBeInTheDocument();
    expect(alerte()).toBeEmptyDOMElement();
  });
});

describe("ArticleDetails — modification par l'auteur", () => {
  const ARTICLE_DE_L_AUTEUR = { ...ARTICLE, is_author: true };
  const BOUTON_MODIFIER = { name: "Modifier" };

  it("ne propose ni modification ni suppression à qui n'a pas écrit l'article", async () => {
    rendreLeDetail();

    expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", BOUTON_MODIFIER),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Supprimer" }),
    ).not.toBeInTheDocument();
  });

  it("affiche l'article enregistré sans le recharger", async () => {
    const enregistre = {
      ...ARTICLE_DE_L_AUTEUR,
      title: "Titre corrigé",
      content: "Le texte corrigé de l'article.",
    };
    appelReseau
      .mockResolvedValueOnce(reponseArticle(ARTICLE_DE_L_AUTEUR))
      .mockResolvedValueOnce(reponse(200, enregistre));
    rendreLeDetail();

    await userEvent.click(await screen.findByRole("button", BOUTON_MODIFIER));
    const fenetre = within(screen.getByRole("dialog"));
    const titre = fenetre.getByLabelText("Titre de l'article");
    expect(titre).toHaveValue(ARTICLE.title);

    await userEvent.clear(titre);
    await userEvent.type(titre, enregistre.title);
    const contenu = fenetre.getByLabelText("Description de votre article");
    await userEvent.clear(contenu);
    await userEvent.type(contenu, enregistre.content);
    await userEvent.click(
      fenetre.getByRole("button", { name: "Enregistrer les modifications" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: enregistre.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(enregistre.content)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Titre de l'article"),
    ).not.toBeInTheDocument();
    expect(appelReseau).toHaveBeenCalledTimes(2);
  });
});

describe("ArticleDetails — suppression par l'auteur", () => {
  const ARTICLE_DE_L_AUTEUR = { ...ARTICLE, is_author: true };
  const SUPPRIMER = { name: "Supprimer" };

  // Page et fenêtre ont un bouton du même nom : chercher dans la fenêtre.
  async function ouvrirLaConfirmation() {
    appelReseau.mockResolvedValueOnce(reponseArticle(ARTICLE_DE_L_AUTEUR));
    rendreLeDetail();
    await userEvent.click(await screen.findByRole("button", SUPPRIMER));
    return within(screen.getByRole("dialog", { name: "Supprimer l'article" }));
  }

  it("ferme la confirmation sans rien envoyer à l'annulation", async () => {
    const fenetre = await ouvrirLaConfirmation();

    await userEvent.click(fenetre.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(appelReseau).toHaveBeenCalledTimes(1);
  });

  it("supprime l'article puis mène au blog", async () => {
    const fenetre = await ouvrirLaConfirmation();
    appelReseau.mockResolvedValueOnce(reponse(204));

    await userEvent.click(fenetre.getByRole("button", SUPPRIMER));

    expect(await screen.findByText("Liste des articles")).toBeInTheDocument();
    const { url, options } = dernierAppel();
    expect(url).toBe(`${import.meta.env.VITE_API_URL}/articles/1/`);
    expect(options.method).toBe("DELETE");
  });

  it("verrouille la confirmation tant que la suppression est en cours", async () => {
    const fenetre = await ouvrirLaConfirmation();
    let livrer: (reponse: unknown) => void = () => {};
    appelReseau.mockReturnValueOnce(
      new Promise((resolve) => {
        livrer = resolve;
      }),
    );

    await userEvent.click(fenetre.getByRole("button", SUPPRIMER));

    expect(fenetre.getByRole("button", SUPPRIMER)).toBeDisabled();
    expect(fenetre.getByRole("button", { name: "Annuler" })).toBeDisabled();
    // Échap n'atteint le dialog que par cet événement.
    const echap = new Event("cancel", { cancelable: true });
    screen.getByRole("dialog").dispatchEvent(echap);
    expect(echap.defaultPrevented).toBe(true);

    livrer(reponse(204));

    expect(await screen.findByText("Liste des articles")).toBeInTheDocument();
  });

  it.each([
    [403, "Vous n'avez pas les droits nécessaires pour cette action."],
    [404, "Cet article n'existe plus : il a déjà été supprimé."],
  ])("traduit un refus %i dans la fenêtre", async (status, message) => {
    const fenetre = await ouvrirLaConfirmation();
    appelReseau.mockResolvedValueOnce(
      reponseRefusee(status, { detail: "Refus en anglais." }),
    );

    await userEvent.click(fenetre.getByRole("button", SUPPRIMER));

    await waitFor(() =>
      expect(fenetre.getByRole("alert")).toHaveTextContent(message),
    );
    expect(fenetre.getByRole("button", SUPPRIMER)).toBeEnabled();
    expect(screen.queryByText("Liste des articles")).not.toBeInTheDocument();
  });
});
