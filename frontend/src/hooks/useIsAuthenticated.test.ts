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

const BASE = import.meta.env.VITE_API_URL;

// `result.current` ne donne que la dernière valeur : un état corrigé par un effet passerait.
function suivreLesRendus() {
  const rendus: boolean[] = [];
  const { result } = renderHook(() => {
    const connecte = useIsAuthenticated();
    rendus.push(connecte);
    return connecte;
  });
  return { rendus, result };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  retablirLeReseau();
});

describe("useIsAuthenticated — premier rendu", () => {
  it("vaut connecté dès le premier rendu quand un jeton de renouvellement est stocké", () => {
    localStorage.setItem("refresh", JETONS.refresh);

    const { rendus } = suivreLesRendus();

    expect(rendus[0]).toBe(true);
  });

  it("vaut déconnecté sans jeton stocké", () => {
    const { rendus } = suivreLesRendus();

    expect(rendus).toEqual([false]);
  });

  it("ne tient pas le seul jeton d'accès pour une session", () => {
    localStorage.setItem("access", JETONS.access);

    const { rendus } = suivreLesRendus();

    expect(rendus).toEqual([false]);
  });
});

describe("useIsAuthenticated — écritures du module", () => {
  it("passe à déconnecté quand le module efface les jetons, sans remonter le composant", () => {
    saveTokens(JETONS);
    const { rendus, result } = suivreLesRendus();

    act(() => clearTokens());

    expect(result.current).toBe(false);
    expect(rendus).toEqual([true, false]);
  });

  it("passe à connecté quand le module enregistre les jetons", () => {
    const { result } = suivreLesRendus();

    act(() => saveTokens(JETONS));

    expect(result.current).toBe(true);
  });

  // `storage` n'est émis que dans les autres onglets : envoyé à la main.
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
