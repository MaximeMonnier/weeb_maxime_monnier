// L'adresse de l'API n'est plus écrite ici : elle vient de VITE_API_URL, lue
// par Vite dans frontend/.env — et non dans le .env de la racine, que Vite ne
// regarde pas. Seules les variables préfixées VITE_ sont exposées au
// navigateur ; ce préfixe est une sécurité, car tout ce qui passe par là finit
// en clair dans le JavaScript public. Aucun secret ici.
//
// La substitution est faite par Vite au démarrage, pas lue à l'exécution :
// changer la variable impose de relancer le serveur.
const API_URL = import.meta.env.VITE_API_URL;

// Pas de repli sur une valeur en dur. Un défaut silencieux ferait porter au
// premier appel réseau la faute d'une configuration absente, sous la forme
// d'un 404 inexplicable ; ici l'erreur tombe au chargement du module, et elle
// nomme son remède.
if (!API_URL) {
  throw new Error(
    "VITE_API_URL est absente : copier frontend/.env.example en frontend/.env, puis relancer Vite.",
  );
}

function getToken(): string | null {
  return localStorage.getItem("access");
}

type ApiError = {
  status: number;
  data: unknown;
};

// Fonction unique pour appeler l'API : ajoute le JSON, le token, et gère les erreurs
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // si connecté, on envoie le token : "Authorization: Bearer <token>"
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // on tente de lire le message d'erreur renvoyé par Django (ex: "email déjà utilisé")
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, data } as ApiError;
  }

  // 204 = "No Content" (ex: après un DELETE) → rien à parser
  return (res.status === 204 ? null : await res.json()) as T;
}
