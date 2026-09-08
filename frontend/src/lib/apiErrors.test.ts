import { describe, expect, it } from "vitest";

import { toFormErrors } from "./apiErrors";

// Les champs qu'affiche un formulaire de connexion : toute autre clé du corps est
// inconnue de lui et doit remonter au message d'ensemble.
const CHAMPS = ["email", "password"] as const;

describe("toFormErrors — refus de validation (400)", () => {
  it("range le message sous le champ que l'API nomme", () => {
    const { fieldErrors, formError } = toFormErrors(
      { status: 400, data: { email: ["Cette adresse est déjà utilisée."] } },
      CHAMPS,
    );

    expect(fieldErrors.email).toBe("Cette adresse est déjà utilisée.");
    expect(formError).toBeNull();
  });

  it("rend tous les messages d'un champ, pas seulement le premier", () => {
    const { fieldErrors } = toFormErrors(
      {
        status: 400,
        data: {
          password: [
            "Ce mot de passe est trop court.",
            "Ce mot de passe est trop courant.",
          ],
        },
      },
      CHAMPS,
    );

    expect(fieldErrors.password).toBe(
      "Ce mot de passe est trop court. Ce mot de passe est trop courant.",
    );
  });

  it("descend dans un champ imbriqué, dont les clés ne diraient rien au lecteur", () => {
    const { fieldErrors } = toFormErrors(
      { status: 400, data: { email: { adresse: ["Domaine inconnu."] } } },
      CHAMPS,
    );

    expect(fieldErrors.email).toBe("Domaine inconnu.");
  });

  it("remonte une clé que le formulaire n'affiche pas au message d'ensemble", () => {
    const { fieldErrors, formError } = toFormErrors(
      { status: 400, data: { non_field_errors: ["Les deux champs diffèrent."] } },
      CHAMPS,
    );

    expect(fieldErrors).toEqual({});
    expect(formError).toBe("Les deux champs diffèrent.");
  });

  it("sert les deux à la fois quand le corps mêle champ connu et clé inconnue", () => {
    const { fieldErrors, formError } = toFormErrors(
      {
        status: 400,
        data: {
          email: ["Adresse invalide."],
          detail: ["Le formulaire est incomplet."],
        },
      },
      CHAMPS,
    );

    expect(fieldErrors.email).toBe("Adresse invalide.");
    expect(formError).toBe("Le formulaire est incomplet.");
  });

  it("parle quand même sur un corps vide, plutôt que de laisser le formulaire muet", () => {
    const { fieldErrors, formError } = toFormErrors(
      { status: 400, data: {} },
      CHAMPS,
    );

    expect(fieldErrors).toEqual({});
    expect(formError).toBe("Une erreur est survenue. Réessayez dans un instant.");
  });
});

describe("toFormErrors — refus d'authentification et de droits", () => {
  it("affiche le libellé que l'appelant donne au 401", () => {
    const { formError } = toFormErrors({ status: 401, data: {} }, CHAMPS, {
      unauthorized: "Identifiants incorrects, ou compte pas encore validé.",
    });

    expect(formError).toBe("Identifiants incorrects, ou compte pas encore validé.");
  });

  it("retombe sur la session expirée quand l'appelant n'en donne aucun", () => {
    const { formError } = toFormErrors({ status: 401, data: {} }, CHAMPS);

    expect(formError).toBe(
      "Votre session a expiré. Reconnectez-vous, puis recommencez.",
    );
  });

  it("traduit le 403 en défaut de droits", () => {
    const { fieldErrors, formError } = toFormErrors(
      { status: 403, data: { detail: "You do not have permission." } },
      CHAMPS,
    );

    expect(fieldErrors).toEqual({});
    expect(formError).toBe("Vous n'avez pas les droits nécessaires pour cette action.");
  });
});

describe("toFormErrors — quota de débit (429)", () => {
  it("reprend le message de l'API tel quel, délai restant compris", () => {
    const { formError } = toFormErrors(
      {
        status: 429,
        data: { detail: "Requête bloquée. Réessayez dans 42 secondes." },
      },
      CHAMPS,
    );

    expect(formError).toBe("Requête bloquée. Réessayez dans 42 secondes.");
    expect(formError).toContain("42");
  });

  it("n'invente pas de délai quand l'API n'en donne pas", () => {
    const { formError } = toFormErrors({ status: 429, data: {} }, CHAMPS);

    expect(formError).toBe("Trop de tentatives. Patientez avant de réessayer.");
  });
});

describe("toFormErrors — panne du service et du réseau", () => {
  it("annonce une indisponibilité passagère à partir de 500", () => {
    const { formError } = toFormErrors({ status: 502, data: {} }, CHAMPS);

    expect(formError).toBe(
      "Le service est momentanément indisponible. Réessayez dans un instant.",
    );
  });

  it("reprend le detail d'un statut qu'aucune branche ne traite", () => {
    const { formError } = toFormErrors(
      { status: 404, data: { detail: "Article introuvable." } },
      CHAMPS,
    );

    expect(formError).toBe("Article introuvable.");
  });

  it("traite le rejet de fetch, qui n'est pas un ApiError, comme un serveur injoignable", () => {
    const { fieldErrors, formError } = toFormErrors(
      new TypeError("Failed to fetch"),
      CHAMPS,
    );

    expect(fieldErrors).toEqual({});
    expect(formError).toBe(
      "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.",
    );
  });
});
