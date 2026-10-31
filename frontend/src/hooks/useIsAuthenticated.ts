import { useSyncExternalStore } from "react";

import { apiFetch } from "../lib/api";
import {
  clearTokens,
  getRefreshToken,
  subscribeToTokens,
} from "../lib/tokens";

// Le jeton d'accès expire en 15 minutes : seul le refresh dit qu'une session est ouverte.
function aUneSession(): boolean {
  return getRefreshToken() !== null;
}

// Sans effet : une page rechargée n'affiche pas un instant l'état déconnecté.
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribeToTokens, aUneSession);
}

// Jetons effacés même sur panne ou refus, sinon l'interface resterait connectée.
export async function logout(): Promise<void> {
  try {
    await apiFetch<unknown>("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: getRefreshToken() }),
    });
  } catch {
    // La déconnexion locale a lieu quand même.
  } finally {
    clearTokens();
  }
}
