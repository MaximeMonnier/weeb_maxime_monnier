import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokens";

// Lue dans frontend/.env, jamais celui de la racine ; tout VITE_ part en clair dans le bundle.
const API_URL = import.meta.env.VITE_API_URL;

// Pas de repli : un défaut silencieux changerait l'oubli en 404 inexplicable.
if (!API_URL) {
  throw new Error(
    "VITE_API_URL est absente : copier frontend/.env.example en frontend/.env, puis relancer Vite.",
  );
}

// DRF authentifie avant les permissions : un jeton périmé ferait répondre 401 à une vue
// AllowAny. Les routes /auth/ partent donc sans jeton, sauf celles-ci.
const ROUTES_AUTH_PROTEGEES = new Set(["/auth/password-change/", "/auth/account/"]);

function needsToken(path: string): boolean {
  return !path.startsWith("/auth/") || ROUTES_AUTH_PROTEGEES.has(path);
}

export type ApiError = {
  status: number;
  data: unknown;
};

function envoyer(path: string, options: RequestInit, token: string | null) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // Un FormData garde le Content-Type du navigateur : sans sa boundary, l'API ne lit rien.
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// Partagé par les 401 simultanés : le refresh tourne, un second appel serait refusé.
let renouvellementEnCours: Promise<boolean> | null = null;

// Pas de boucle : needsToken écarte /auth/, un 401 ici ne relance aucun renouvellement.
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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = needsToken(path) ? getAccessToken() : null;
  let res = await envoyer(path, options, token);

  // Un seul nouvel essai, sans jeton si le renouvellement est refusé : seule l'API sait
  // si la route est publique.
  if (res.status === 401 && token && (await preparerNouvelEssai(token))) {
    res = await envoyer(path, options, getAccessToken());
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, data } as ApiError;
  }

  return (res.status === 204 ? null : await res.json()) as T;
}
