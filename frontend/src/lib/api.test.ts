import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./api";

// Même source que le module testé : une adresse écrite en dur ferait tomber la
// suite chez qui change son frontend/.env.
const BASE = import.meta.env.VITE_API_URL;

const FETCH_ORIGINAL = globalThis.fetch;

// apiFetch ne lit que ok, status et json() : le doublon s'en tient là.
function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

const appelReseau = vi.fn();

// Ce que fetch a reçu au dernier appel du cas : adresse, options relayées et
// en-têtes posés.
function dernierAppel() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return { url, options, entetes: options.headers as Record<string, string> };
}

beforeEach(() => {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

// Le global est rendu comme on l'a trouvé. Et Vitest isole les fichiers, jamais
// les cas d'un même fichier : sans ce vidage, le jeton d'un cas vaudrait pour le suivant.
afterEach(() => {
  globalThis.fetch = FETCH_ORIGINAL;
  localStorage.clear();
});

describe("apiFetch — requête envoyée", () => {
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

  it("relaie la méthode et le corps que l'appelant donne", async () => {
    appelReseau.mockResolvedValue(reponse(201, {}));

    await apiFetch("/contact/", { method: "POST", body: '{"nom":"Ada"}' });

    expect(dernierAppel().options).toMatchObject({
      method: "POST",
      body: '{"nom":"Ada"}',
    });
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

describe("apiFetch — jeton d'accès expiré", () => {
  const RENOUVELLEMENT = `${BASE}/auth/login/refresh/`;
  const JETONS_NEUFS = { access: "acces-neuf", refresh: "refresh-neuf" };

  function appelsA(url: string) {
    return appelReseau.mock.calls.filter(([adresse]) => adresse === url);
  }

  beforeEach(() => {
    localStorage.setItem("access", "acces-perime");
    localStorage.setItem("refresh", "refresh-valide");
  });

  it("rejoue la requête avec le jeton neuf et rend son corps", async () => {
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(200, JETONS_NEUFS))
      .mockResolvedValueOnce(reponse(201, { id: 7 }));

    await expect(
      apiFetch("/articles/", { method: "POST", body: "{}" }),
    ).resolves.toEqual({ id: 7 });

    expect(dernierAppel().url).toBe(`${BASE}/articles/`);
    expect(dernierAppel().entetes.Authorization).toBe("Bearer acces-neuf");
    // Rejouée en GET, la publication répondrait 200 sans créer l'article.
    expect(dernierAppel().options).toMatchObject({ method: "POST", body: "{}" });
  });

  // Le refresh neuf compris : login/refresh/ met l'ancien en liste noire, et le
  // garder couperait la session au renouvellement suivant.
  it("stocke les deux jetons rendus par login/refresh/", async () => {
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(200, JETONS_NEUFS))
      .mockResolvedValueOnce(reponse(200, []));

    await apiFetch("/articles/");

    const [, options] = appelsA(RENOUVELLEMENT)[0] as [string, RequestInit];
    // Sans POST, le navigateur refuse l'envoi d'un corps : la panne serait permanente.
    expect(options).toMatchObject({
      method: "POST",
      body: '{"refresh":"refresh-valide"}',
    });
    expect(localStorage.getItem("access")).toBe("acces-neuf");
    expect(localStorage.getItem("refresh")).toBe("refresh-neuf");
  });

  // Le cas que StrictMode rend courant : les effets de /blog partent deux fois.
  it("ne renouvelle qu'une fois pour deux 401 simultanés", async () => {
    appelReseau.mockImplementation(async (url: string, options: RequestInit) => {
      if (url === RENOUVELLEMENT) return reponse(200, JETONS_NEUFS);
      const entetes = options.headers as Record<string, string>;
      return entetes.Authorization === "Bearer acces-perime"
        ? reponse(401)
        : reponse(200, []);
    });

    await Promise.all([apiFetch("/articles/"), apiFetch("/articles/")]);

    expect(appelsA(RENOUVELLEMENT)).toHaveLength(1);
  });

  // Un 401 de login/ dit un mot de passe faux, jamais un jeton expiré.
  it("ne renouvelle rien sur un 401 de /auth/login/", async () => {
    appelReseau.mockResolvedValue(reponse(401));

    await expect(
      apiFetch("/auth/login/", { method: "POST", body: "{}" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(appelReseau).toHaveBeenCalledTimes(1);
  });

  it("lève le 401 de la requête rejouée sans renouveler une seconde fois", async () => {
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(200, JETONS_NEUFS))
      .mockResolvedValueOnce(reponse(401));

    await expect(apiFetch("/articles/")).rejects.toMatchObject({ status: 401 });

    expect(appelReseau).toHaveBeenCalledTimes(3);
    expect(appelsA(RENOUVELLEMENT)).toHaveLength(1);
  });

  // La requête repart sans jeton : c'est ce qui rouvre /blog, dont la lecture est
  // publique, à qui garde un jeton mort.
  it("efface les jetons sur un renouvellement refusé et rejoue sans Authorization", async () => {
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(200, [{ id: 1 }]));

    await expect(apiFetch("/articles/")).resolves.toEqual([{ id: 1 }]);

    expect(dernierAppel().url).toBe(`${BASE}/articles/`);
    expect(dernierAppel().entetes.Authorization).toBeUndefined();
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
  });

  it("rejoue sans Authorization quand aucun jeton de rafraîchissement n'est stocké", async () => {
    localStorage.removeItem("refresh");
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockResolvedValueOnce(reponse(200, []));

    await apiFetch("/articles/");

    expect(appelsA(RENOUVELLEMENT)).toHaveLength(0);
    expect(dernierAppel().entetes.Authorization).toBeUndefined();
    expect(localStorage.getItem("access")).toBeNull();
  });

  // Un serveur qui redémarre ne doit pas déconnecter : seul un 401 de
  // login/refresh/ dit que le jeton est mort.
  it.each([
    ["réseau coupé", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["502 du proxy", () => Promise.resolve(reponse(502))],
  ])("garde les jetons et lève le 401 d'origine sur une panne : %s", async (_, panne) => {
    appelReseau
      .mockResolvedValueOnce(reponse(401, { detail: "Jeton expiré" }))
      .mockImplementationOnce(panne);

    await expect(apiFetch("/articles/")).rejects.toEqual({
      status: 401,
      data: { detail: "Jeton expiré" },
    });

    expect(appelReseau).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("access")).toBe("acces-perime");
    expect(localStorage.getItem("refresh")).toBe("refresh-valide");
  });

  // Le jeton a changé pendant le trajet de la requête : le renouveler encore
  // ferait tourner pour rien le refresh qu'un autre onglet vient de ranger.
  it("rejoue avec le jeton qu'un autre onglet a déjà renouvelé, sans renouveler", async () => {
    appelReseau
      .mockImplementationOnce(async () => {
        localStorage.setItem("access", "acces-autre-onglet");
        return reponse(401);
      })
      .mockResolvedValueOnce(reponse(200, []));

    await apiFetch("/articles/");

    expect(appelsA(RENOUVELLEMENT)).toHaveLength(0);
    expect(dernierAppel().entetes.Authorization).toBe("Bearer acces-autre-onglet");
  });

  // Deux onglets partagent le localStorage : celui qui perd la course au
  // renouvellement reçoit un 401, alors que le gagnant a déjà rangé des jetons valides.
  it("garde les jetons qu'un autre onglet vient de ranger malgré le refus", async () => {
    appelReseau
      .mockResolvedValueOnce(reponse(401))
      .mockImplementationOnce(async () => {
        localStorage.setItem("access", "acces-autre-onglet");
        localStorage.setItem("refresh", "refresh-autre-onglet");
        return reponse(401);
      })
      .mockResolvedValueOnce(reponse(200, []));

    await apiFetch("/articles/");

    expect(dernierAppel().entetes.Authorization).toBe("Bearer acces-autre-onglet");
    expect(localStorage.getItem("refresh")).toBe("refresh-autre-onglet");
  });
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

    const rendu = await apiFetch("/articles/1/", { method: "DELETE" });

    expect(rendu).toBeNull();
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
