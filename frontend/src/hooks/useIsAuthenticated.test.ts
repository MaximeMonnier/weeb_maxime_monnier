import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { logout, useIsAuthenticated } from "./useIsAuthenticated";
import { clearTokens, saveTokens } from "../lib/tokens";
import {
  appelReseau,
  couperLeReseau,
  reponse,
  retablirLeReseau,
} from "../test/reseau";

const JETONS = { access: "jeton-acces", refresh: "jeton-renouvellement" };

// Même source que `apiFetch` : une adresse écrite en dur ferait tomber la suite
// chez qui change son frontend/.env.
const BASE = import.meta.env.VITE_API_URL;

// Chaque valeur rendue, dans l'ordre : `result.current` ne donne que la
// dernière, et un état corrigé par un effet aurait d'abord rendu l'autre.
function suivreLesRendus() {
  const rendus: boolean[] = [];
  const { result } = renderHook(() => {
    const connecte = useIsAuthenticated();
    rendus.push(connecte);
    return connecte;
  });
  return { rendus, result };
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(() => {
  cleanup();
  localStorage.clear();
  retablirLeReseau();
});

describe("useIsAuthenticated — premier rendu", () => {
  // Écrit directement, comme l'a laissé la page d'avant le rechargement :
  // aucun abonné n'est prévenu, seule la lecture initiale peut le voir.
  it("vaut connecté dès le premier rendu quand un jeton de renouvellement est stocké", () => {
    localStorage.setItem("refresh", JETONS.refresh);

    const { rendus } = suivreLesRendus();

    expect(rendus[0]).toBe(true);
  });

  it("vaut déconnecté sans jeton stocké", () => {
    const { rendus } = suivreLesRendus();

    expect(rendus).toEqual([false]);
  });

  // Il expire au bout de 15 minutes : le prendre pour témoin déconnecterait
  // l'interface bien avant la fin de la session.
  it("ne tient pas le seul jeton d'accès pour une session", () => {
    localStorage.setItem("access", JETONS.access);

    const { rendus } = suivreLesRendus();

    expect(rendus).toEqual([false]);
  });
});

// `act` ne sert qu'à laisser React finir le rendu : les écritures, elles,
// viennent du module, comme celles d'un code hors de React, sans aucun setState.
describe("useIsAuthenticated — écritures du module", () => {
  it("passe à déconnecté quand le module efface les jetons, sans remonter le composant", () => {
    saveTokens(JETONS);
    const { rendus, result } = suivreLesRendus();

    act(() => clearTokens());

    // Aucun `rerender` : seule la souscription au module a pu relancer le rendu.
    expect(result.current).toBe(false);
    expect(rendus).toEqual([true, false]);
  });

  it("passe à connecté quand le module enregistre les jetons", () => {
    const { result } = suivreLesRendus();

    act(() => saveTokens(JETONS));

    expect(result.current).toBe(true);
  });

  // Le navigateur n'émet `storage` que dans les autres onglets : l'événement
  // est donc envoyé à la main, après l'effacement qu'il annonce.
  it("suit un effacement fait dans un autre onglet", () => {
    saveTokens(JETONS);
    const { result } = suivreLesRendus();

    localStorage.removeItem("refresh");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "refresh" }));
    });

    expect(result.current).toBe(false);
  });
});

describe("logout", () => {
  beforeEach(() => {
    saveTokens(JETONS);
    couperLeReseau();
  });

  it("révoque le jeton de renouvellement auprès de l'API, puis efface les deux", async () => {
    appelReseau.mockResolvedValue(reponse(200));
    const { result } = suivreLesRendus();

    await act(() => logout());

    const [url, options] = appelReseau.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/auth/logout/`);
    expect(options).toMatchObject({
      method: "POST",
      body: JSON.stringify({ refresh: JETONS.refresh }),
    });
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(result.current).toBe(false);
  });

  // Garder les jetons sur un échec laisserait l'interface connectée, sans
  // aucun moyen d'en sortir tant que l'API ne répond pas.
  const ECHECS = {
    "le réseau est coupé": () => Promise.reject(new TypeError("Failed to fetch")),
    "l'API refuse": async () => reponse(401),
  };

  it.each(Object.entries(ECHECS))(
    "efface quand même les deux jetons, sans lever, quand %s",
    async (_cas, echec) => {
      appelReseau.mockImplementation(echec);
      const { result } = suivreLesRendus();

      await act(() => logout());

      expect(localStorage.getItem("access")).toBeNull();
      expect(localStorage.getItem("refresh")).toBeNull();
      expect(result.current).toBe(false);
    },
  );
});
