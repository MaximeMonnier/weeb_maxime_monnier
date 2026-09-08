import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./api";

// Même source que le module testé : une adresse écrite en dur ferait tomber la
// suite chez qui change son frontend/.env.
const BASE = import.meta.env.VITE_API_URL;

const FETCH_ORIGINAL = globalThis.fetch;

// apiFetch ne lit que ok, status et json() : une Response complète n'apporterait
// rien, et jsdom n'en construit pas sans corps réel.
function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

const appelReseau = vi.fn();

// Les options passées au dernier appel, pour lire l'URL et les en-têtes posés.
function dernierAppel() {
  const [url, options] = appelReseau.mock.calls[0] as [string, RequestInit];
  return { url, entetes: options.headers as Record<string, string> };
}

beforeEach(() => {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

// Sans ce rétablissement, une suite voisine hériterait du doublon ; sans le vidage,
// le jeton d'un cas fuirait dans le suivant.
afterEach(() => {
  globalThis.fetch = FETCH_ORIGINAL;
  localStorage.clear();
});

describe("apiFetch — adresse appelée", () => {
  it("préfixe le chemin par VITE_API_URL", async () => {
    appelReseau.mockResolvedValue(reponse(200, []));

    await apiFetch("/articles/");

    expect(dernierAppel().url).toBe(`${BASE}/articles/`);
  });

  it("pose le JSON sans que l'appelant ait à le redire", async () => {
    appelReseau.mockResolvedValue(reponse(200, {}));

    await apiFetch("/contact/", { method: "POST", body: "{}" });

    expect(dernierAppel().entetes["Content-Type"]).toBe("application/json");
  });
});

describe("apiFetch — jeton d'accès", () => {
  it("pose le Bearer quand un jeton est en localStorage", async () => {
    localStorage.setItem("access", "jeton-de-test");
    appelReseau.mockResolvedValue(reponse(201, {}));

    await apiFetch("/articles/", { method: "POST", body: "{}" });

    expect(dernierAppel().entetes.Authorization).toBe("Bearer jeton-de-test");
  });

  it("n'en pose aucun quand personne n'est connecté", async () => {
    appelReseau.mockResolvedValue(reponse(200, []));

    await apiFetch("/articles/");

    expect(dernierAppel().entetes.Authorization).toBeUndefined();
  });

  // Le cas qui justifie needsToken : DRF authentifie avant d'appliquer les
  // permissions, et un jeton périmé ferait répondre 401 à ces vues AllowAny.
  it.each(["/auth/register/", "/auth/password-reset/", "/auth/login/"])(
    "l'omet sur %s, même avec un jeton en localStorage",
    async (chemin) => {
      localStorage.setItem("access", "jeton-perime");
      appelReseau.mockResolvedValue(reponse(200, {}));

      await apiFetch(chemin, { method: "POST", body: "{}" });

      expect(dernierAppel().entetes.Authorization).toBeUndefined();
    },
  );
});

describe("apiFetch — lecture de la réponse", () => {
  it("rend le corps analysé sur un succès", async () => {
    appelReseau.mockResolvedValue(reponse(200, [{ id: 1, title: "Titre" }]));

    await expect(apiFetch("/articles/")).resolves.toEqual([
      { id: 1, title: "Titre" },
    ]);
  });

  it("rend null sur un 204 sans lire le corps, qui est vide", async () => {
    const sansContenu = reponse(204);
    appelReseau.mockResolvedValue(sansContenu);

    await expect(apiFetch("/articles/1/", { method: "DELETE" })).resolves.toBeNull();
    expect(sansContenu.json).not.toHaveBeenCalled();
  });
});

describe("apiFetch — refus de l'API", () => {
  it("lève le statut et le corps, matière première d'apiErrors", async () => {
    appelReseau.mockResolvedValue(
      reponse(400, { email: ["Cette adresse est déjà utilisée."] }),
    );

    await expect(apiFetch("/auth/register/", { method: "POST" })).rejects.toEqual({
      status: 400,
      data: { email: ["Cette adresse est déjà utilisée."] },
    });
  });

  // Une page d'erreur du proxy n'est pas du JSON : sans ce repli, l'appelant
  // recevrait l'erreur d'analyse au lieu du statut, et n'aurait rien à afficher.
  it("laisse un corps illisible donner un data vide, jamais une autre erreur", async () => {
    appelReseau.mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(() => Promise.reject(new SyntaxError("Unexpected token <"))),
    });

    await expect(apiFetch("/articles/")).rejects.toEqual({
      status: 502,
      data: {},
    });
  });
});
