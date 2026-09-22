import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokens";

// L'URL vient de frontend/.env : Vite ne lit jamais le .env de la racine.
// Tout ce qui est préfixé VITE_ part en clair dans le bundle — aucun secret ici.
const API_URL = import.meta.env.VITE_API_URL;

// Pas de repli : un défaut silencieux changerait l'oubli en 404 inexplicable.
if (!API_URL) {
  throw new Error(
    "VITE_API_URL est absente : copier frontend/.env.example en frontend/.env, puis relancer Vite.",
  );
}

// DRF authentifie AVANT d'appliquer les permissions : un token périmé resté en
// localStorage fait répondre 401 à une vue AllowAny — inscription et réinitialisation
// de mot de passe en tête. Toutes les routes /auth/ sont publiques à ce jour.
function needsToken(path: string): boolean {
  return !path.startsWith("/auth/");
}

// Exporté pour `apiErrors.ts`, qui traduit ces refus en messages de formulaire.
export type ApiError = {
  status: number;
  data: unknown;
};

function envoyer(path: string, options: RequestInit, token: string | null) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // si connecté, on envoie le token : "Authorization: Bearer <token>"
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// Partagé par les 401 reçus en même temps : login/refresh/ fait tourner le jeton
// de rafraîchissement, et un second appel avec le même serait refusé.
let renouvellementEnCours: Promise<boolean> | null = null;

// Passe par apiFetch sans risque de boucle : needsToken écarte /auth/, donc un 401
// reçu ici ne relance aucun renouvellement.
async function renouvelerJetons(refresh: string): Promise<boolean> {
  try {
    saveTokens(
      await apiFetch<{ access: string; refresh: string }>("/auth/login/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),
    );
    return true;
  } catch (err) {
    // Seul un 401 dit que le jeton est mort : une panne (réseau, 5xx) le garde.
    if ((err as Partial<ApiError>).status !== 401) return false;
    // Un autre onglet a pu le faire tourner entre-temps : ses jetons neufs restent.
    if (getRefreshToken() === refresh) clearTokens();
    return true;
  }
}

// Vrai quand la requête refusée peut repartir, avec un jeton neuf ou sans jeton.
// Faux sur une panne : l'appelant reçoit alors le 401 d'origine.
async function preparerNouvelEssai(tokenRefuse: string): Promise<boolean> {
  // Un appel voisin, ou un autre onglet, a déjà renouvelé ou effacé les jetons.
  if (getAccessToken() !== tokenRefuse) return true;

  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return true;
  }

  renouvellementEnCours ??= renouvelerJetons(refresh).finally(() => {
    renouvellementEnCours = null;
  });
  return renouvellementEnCours;
}

// Fonction unique pour appeler l'API : ajoute le JSON, le token, et gère les erreurs
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = needsToken(path) ? getAccessToken() : null;
  let res = await envoyer(path, options, token);

  // Un seul nouvel essai, et sans jeton si le renouvellement est refusé : seule
  // l'API sait si la route est publique. Un second 401 remonte à l'appelant.
  if (res.status === 401 && token && (await preparerNouvelEssai(token))) {
    res = await envoyer(path, options, getAccessToken());
  }

  if (!res.ok) {
    // on tente de lire le message d'erreur renvoyé par Django (ex: "email déjà utilisé")
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, data } as ApiError;
  }

  // 204 = "No Content" (ex: après un DELETE) → rien à parser
  return (res.status === 204 ? null : await res.json()) as T;
}
