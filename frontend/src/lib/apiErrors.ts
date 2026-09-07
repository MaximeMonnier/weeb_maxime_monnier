import type { ApiError } from "./api";

/** Refus de l'API réparti entre les champs du formulaire et un message d'ensemble. */
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

// `apiFetch` lève cette forme, mais `fetch` lui-même rejette sur un TypeError quand
// la requête n'atteint pas le serveur : les deux arrivent dans le même `catch`.
function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" && err !== null && "status" in err && "data" in err
  );
}

// DRF range les erreurs de validation en listes, et les autres refus dans une chaîne
// unique sous "detail". Un seul message suffit à l'affichage : les suivants répètent.
function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);
      if (message) return message;
    }
  }
  return null;
}

/**
 * Traduit un refus de l'API en messages affichables, les clés connues allant au champ
 * correspondant et le reste au message d'ensemble.
 */
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
      const message = firstMessage(value);
      if (!message) continue;
      // Une clé que le formulaire n'affiche pas — "detail", "non_field_errors", ou un
      // champ qu'il n'a pas — resterait invisible si on ne la remontait pas ici.
      if ((knownFields as readonly string[]).includes(key)) {
        fieldErrors[key as F] = message;
      } else {
        general.push(message);
      }
    }

    if (general.length > 0) {
      return { fieldErrors, formError: general.join(" ") };
    }
    // Un 400 au corps vide ou illisible laisserait le formulaire muet, le défaut même
    // que ce module corrige : mieux vaut un message vague qu'aucun.
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

  // Seul message de l'API repris tel quel : il porte le délai restant en secondes,
  // que le réécrire ferait perdre. DRF le rend déjà en français.
  if (err.status === 429) {
    return { fieldErrors, formError: firstMessage(body.detail) ?? THROTTLED };
  }

  if (err.status >= 500) {
    return { fieldErrors, formError: SERVER };
  }

  return { fieldErrors, formError: firstMessage(body.detail) ?? UNEXPECTED };
}
