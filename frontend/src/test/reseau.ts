import { vi } from "vitest";

// Coupé à `fetch` et non à `apiFetch` : le test traverse la vraie chaîne, du
// jeton posé et de l'adresse jusqu'à la traduction du refus.
export const appelReseau = vi.fn();

const FETCH_ORIGINAL = globalThis.fetch;

export function couperLeReseau() {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
}

// Vitest isole les fichiers, jamais les cas d'un même fichier.
export function retablirLeReseau() {
  globalThis.fetch = FETCH_ORIGINAL;
}

// apiFetch ne lit que ok, status et json() : le substitut s'en tient là.
export function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

// Les en-têtes restent hors de `requeteEnvoyee()` : des tests comparent son
// objet entier.
export function dernierAppel() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return { url, options, entetes: options.headers as Record<string, string> };
}

// Le substitut répond quels que soient ses arguments : sans cette lecture, une
// route ou un corps changés laisseraient la suite verte.
export function requeteEnvoyee() {
  const { url, options } = dernierAppel();
  return {
    url,
    methode: options.method,
    corps: JSON.parse(options.body as string) as unknown,
  };
}
