import { useSyncExternalStore } from "react";

import { getRefreshToken, subscribeToTokens } from "../lib/tokens";

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
