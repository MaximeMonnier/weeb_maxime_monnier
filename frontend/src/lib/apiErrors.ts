import type { ApiError } from "./api";

export type FormApiErrors<F extends string = string> = {
  fieldErrors: Partial<Record<F, string>>;
  formError: string | null;
};

const OFFLINE =
  "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.";
const EXPIRED = "Votre session a expiré. Reconnectez-vous, puis recommencez.";
const FORBIDDEN = "Vous n'avez pas les droits nécessaires pour cette action.";
const SERVER =
  "Le service est momentanément indisponible. Réessayez dans un instant.";
const THROTTLED = "Trop de tentatives. Patientez avant de réessayer.";
const UNEXPECTED = "Une erreur est survenue. Réessayez dans un instant.";

// Sans serveur joignable, `fetch` rejette un TypeError, pas un ApiError.
function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" && err !== null && "status" in err && "data" in err
  );
}

// Tous les messages sont rendus : un mot de passe faible en récolte trois à la fois.
function messagesOf(value: unknown): string | null {
  if (typeof value === "string") return value || null;

  if (Array.isArray(value)) {
    const messages = value
      .map(messagesOf)
      .filter((message): message is string => message !== null);
    return messages.length > 0 ? messages.join(" ") : null;
  }

  if (typeof value === "object" && value !== null) {
    return messagesOf(Object.values(value));
  }

  return null;
}

export function toFormErrors<F extends string>(
  err: unknown,
  knownFields: readonly F[],
  options: { unauthorized?: string } = {},
): FormApiErrors<F> {
  const fieldErrors: Partial<Record<F, string>> = {};

  if (!isApiError(err)) {
    return { fieldErrors, formError: OFFLINE };
  }

  const body: Record<string, unknown> =
    typeof err.data === "object" && err.data !== null
      ? (err.data as Record<string, unknown>)
      : {};

  if (err.status === 400) {
    const general: string[] = [];

    for (const [key, value] of Object.entries(body)) {
      const message = messagesOf(value);
      if (!message) continue;
      // Une clé sans champ affiché ("detail", "non_field_errors"…) resterait invisible.
      if ((knownFields as readonly string[]).includes(key)) {
        fieldErrors[key as F] = message;
      } else {
        general.push(message);
      }
    }

    if (general.length > 0) {
      return { fieldErrors, formError: general.join(" ") };
    }
    // Un 400 au corps vide laisserait le formulaire muet : mieux vaut un message vague.
    return {
      fieldErrors,
      formError:
        Object.keys(fieldErrors).length > 0 ? null : UNEXPECTED,
    };
  }

  if (err.status === 401) {
    return { fieldErrors, formError: options.unauthorized ?? EXPIRED };
  }

  if (err.status === 403) {
    return { fieldErrors, formError: FORBIDDEN };
  }

  // Repris tel quel : il porte le délai restant, qu'une reformulation perdrait.
  if (err.status === 429) {
    return { fieldErrors, formError: messagesOf(body.detail) ?? THROTTLED };
  }

  if (err.status >= 500) {
    return { fieldErrors, formError: SERVER };
  }

  return { fieldErrors, formError: messagesOf(body.detail) ?? UNEXPECTED };
}
