import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import Blog from "./Blog";
import { saveTokens } from "../../lib/tokens";

const FETCH_ORIGINAL = globalThis.fetch;

// Coupé à `fetch`, non à `apiFetch` : la liste arrive par le module réel, avec
// ou sans jeton selon l'état de la session.
const appelReseau = vi.fn();

const ARTICLE = {
  id: 1,
  title: "Premier article",
  content: "Un contenu de test.",
  author: "Jean Dupont",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

const ARTICLE_PLUS_ANCIEN = { ...ARTICLE, id: 2, title: "Article plus ancien" };

// Une page de la liste telle que l'API la rend. Le blog ne lit de `next` que
// sa présence, et jamais `count` ni `previous`.
function reponsePage(results: (typeof ARTICLE)[], next: string | null = null) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ count: results.length, next, previous: null, results }),
  };
}

const PAGE_2 = "http://localhost:8000/api/articles/?page=2";

// jsdom n'implémente pas `showModal` : le doublon ne prouve que l'appel,
// l'ouverture réelle de la fenêtre ne se voit que dans un navigateur.
const ouvrirFenetre = vi.fn();

// La route de connexion porte un repère : c'est par ce qu'elle affiche que le
// lien se révèle mener au bon endroit, et non par son seul attribut.
async function afficherLeBlog() {
  render(
    <MemoryRouter initialEntries={["/blog"]}>
      <Routes>
        <Route path="/blog" element={<Blog />} />
        <Route path="/login" element={<p>Page de connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
  // La liste chargée, aucun rendu ne tombe plus après le cas.
  expect(await screen.findByText(ARTICLE.title)).toBeInTheDocument();
}

const BOUTON_DE_CREATION = { name: "Créer un article" };
const LIEN_DE_CONNEXION = { name: "Se connecter pour publier" };
const BOUTON_PAGE_SUIVANTE = { name: "Voir plus d'articles" };

beforeEach(() => {
  appelReseau.mockReset();
  appelReseau.mockResolvedValue(reponsePage([ARTICLE]));
  globalThis.fetch = appelReseau as unknown as typeof fetch;
  ouvrirFenetre.mockReset();
  HTMLDialogElement.prototype.showModal = ouvrirFenetre;
});

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(() => {
  cleanup();
  globalThis.fetch = FETCH_ORIGINAL;
  localStorage.clear();
});

describe("Blog — création d'article", () => {
  it("propose au visiteur de se connecter plutôt que d'écrire", async () => {
    await afficherLeBlog();

    expect(
      screen.queryByRole("button", BOUTON_DE_CREATION),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", LIEN_DE_CONNEXION));

    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
  });

  it("ouvre la fenêtre de création à l'utilisateur connecté", async () => {
    saveTokens({ access: "jeton-acces", refresh: "jeton-renouvellement" });
    await afficherLeBlog();

    expect(
      screen.queryByRole("link", LIEN_DE_CONNEXION),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", BOUTON_DE_CREATION));

    expect(ouvrirFenetre).toHaveBeenCalledOnce();
  });
});

describe("Blog — pages suivantes", () => {
  it("ne propose rien de plus quand la liste tient en une page", async () => {
    await afficherLeBlog();

    expect(
      screen.queryByRole("button", BOUTON_PAGE_SUIVANTE),
    ).not.toBeInTheDocument();
  });

  it("ajoute la page suivante sous la première", async () => {
    appelReseau
      .mockResolvedValueOnce(reponsePage([ARTICLE], PAGE_2))
      .mockResolvedValueOnce(reponsePage([ARTICLE_PLUS_ANCIEN]));
    await afficherLeBlog();

    await userEvent.click(screen.getByRole("button", BOUTON_PAGE_SUIVANTE));

    expect(
      await screen.findByText(ARTICLE_PLUS_ANCIEN.title),
    ).toBeInTheDocument();
    expect(appelReseau).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/articles\/\?page=2$/),
      expect.anything(),
    );
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([ARTICLE.title, ARTICLE_PLUS_ANCIEN.title]);
    expect(
      screen.queryByRole("button", BOUTON_PAGE_SUIVANTE),
    ).not.toBeInTheDocument();
  });

  it("n'affiche pas deux fois l'article qu'une publication a repoussé", async () => {
    appelReseau
      .mockResolvedValueOnce(reponsePage([ARTICLE], PAGE_2))
      .mockResolvedValueOnce(reponsePage([ARTICLE, ARTICLE_PLUS_ANCIEN]));
    await afficherLeBlog();

    await userEvent.click(screen.getByRole("button", BOUTON_PAGE_SUIVANTE));

    expect(
      await screen.findByText(ARTICLE_PLUS_ANCIEN.title),
    ).toBeInTheDocument();
    expect(screen.getAllByText(ARTICLE.title)).toHaveLength(1);
  });
});
