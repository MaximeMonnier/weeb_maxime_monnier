import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import ArticleDetails from "./ArticleDetails";

const FETCH_ORIGINAL = globalThis.fetch;

// Coupé à `fetch`, non à `apiFetch` : le refus traverse la chaîne entière
// jusqu'à `toFormErrors`, qui en tire le message affiché.
const appelReseau = vi.fn();

// Ce que rend le détail, et non la liste : `content` entier, pas d'`excerpt`.
const ARTICLE = {
  id: 1,
  title: "Premier article",
  content: "Le texte entier de l'article.",
  author: "Jean Dupont",
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
  return { ok: true, status: 200, json: async () => article };
}

function reponseRefusee(status: number, corps: unknown = {}) {
  return { ok: false, status, json: async () => corps };
}

const CHARGEMENT = "Chargement…";
const INTROUVABLE = "Article introuvable";
const SERVEUR_INJOIGNABLE =
  "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.";
const SERVICE_INDISPONIBLE =
  "Le service est momentanément indisponible. Réessayez dans un instant.";

const RETOUR_AUX_ARTICLES = { name: "Retour aux articles" };

// Rendue à tous les écrans, vide ou non : c'est son texte, et non sa présence,
// qui dit l'échec.
const alerte = () => screen.getByRole("alert");

// La route du blog porte un repère : c'est ce qu'elle affiche qui prouve que le
// lien de retour mène au bon endroit, et non son seul attribut.
function rendreLeDetail(chemin = "/articles/1") {
  render(
    <MemoryRouter initialEntries={[chemin]}>
      {/* Hors des routes : la page de détail ne propose elle-même aucun voisin,
          et le passage d'un article à l'autre est ce qui met la course à nu. */}
      <Link to={`/articles/${ARTICLE_SUIVANT.id}`}>Article suivant</Link>
      <Routes>
        <Route path="/articles/:id" element={<ArticleDetails />} />
        {/* Sans `:id` : la forme que `useParams` rend `undefined`. */}
        <Route path="/articles" element={<ArticleDetails />} />
        <Route path="/blog" element={<p>Liste des articles</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  appelReseau.mockReset();
  appelReseau.mockResolvedValue(reponseArticle(ARTICLE));
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(() => {
  cleanup();
  globalThis.fetch = FETCH_ORIGINAL;
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
    // `fetch` rejette sans réponse quand la requête n'atteint pas le serveur.
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
    expect(
      screen.queryByRole("link", RETOUR_AUX_ARTICLES),
    ).not.toBeInTheDocument();
  });
});

describe("ArticleDetails — changement d'article en cours de route", () => {
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

    // La réponse périmée traverse ses `then` en microtâches : sans ce tour, le
    // test conclurait avant qu'elle ait eu l'occasion d'écraser l'affichage.
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

    // L'article quitté a pu disparaître entre-temps : son 404 ne concerne plus
    // la page affichée, et l'annoncer effacerait un article bien présent.
    await act(async () => {
      livrerLePremier(reponseRefusee(404, { detail: "Pas trouvé." }));
    });

    expect(screen.getByText(ARTICLE_SUIVANT.content)).toBeInTheDocument();
    expect(screen.queryByText(INTROUVABLE)).not.toBeInTheDocument();
    expect(alerte()).toBeEmptyDOMElement();
  });
});
