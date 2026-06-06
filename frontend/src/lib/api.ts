const API_URL = "http://localhost:8000/api";

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
