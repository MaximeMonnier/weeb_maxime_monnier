import { useSyncExternalStore } from "react";

import { apiFetch } from "../lib/api";
import {
  clearTokens,
  getRefreshToken,
  subscribeToTokens,
} from "../lib/tokens";

// Le jeton d'accès expire toutes les 15 minutes : c'est celui de
// renouvellement qui dit qu'une session est ouverte.
function aUneSession(): boolean {
  return getRefreshToken() !== null;
}

// Lu dès le premier rendu, sans effet : une page rechargée n'affiche pas un
// instant l'état déconnecté.
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribeToTokens, aUneSession);
}

// Les jetons s'effacent même sur un réseau coupé ou un refus : l'interface
// resterait sinon connectée, sans autre moyen d'en sortir. Le jeton que l'API
// n'a pas révoqué reste valable jusqu'à son échéance, un jour au plus.
export async function logout(): Promise<void> {
  try {
    await apiFetch<unknown>("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: getRefreshToken() }),
    });
  } catch {
    // Rien à montrer : dans le navigateur, la déconnexion a lieu quand même.
  } finally {
    clearTokens();
  }
}
