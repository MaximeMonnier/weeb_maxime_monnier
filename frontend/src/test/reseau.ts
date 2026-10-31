import { expect, vi } from "vitest";

// Coupé à `fetch` et non à `apiFetch` : le test traverse la vraie chaîne.
export const appelReseau = vi.fn();

const FETCH_ORIGINAL = globalThis.fetch;

export function couperLeReseau() {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
}

export function retablirLeReseau() {
  globalThis.fetch = FETCH_ORIGINAL;
}

export function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

// En-têtes hors de `requeteEnvoyee()` : des tests comparent son objet entier.
export function dernierAppel() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return { url, options, entetes: options.headers as Record<string, string> };
}

export function requeteEnvoyee() {
  const { url, options } = dernierAppel();
  return {
    url,
    methode: options.method,
    corps: JSON.parse(options.body as string) as unknown,
  };
}

export function champsMultipart() {
  const { options } = dernierAppel();
  expect(options.body).toBeInstanceOf(FormData);
  return Object.fromEntries(options.body as FormData);
}
