import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";

import { useForm } from "./useForm";

// Les champs d'un formulaire de contact : deux saisies courtes et une zone de
// texte, seule forme du projet où `handleChange` reçoit autre chose qu'un input.
const CHAMPS_INITIAUX = { email: "", sujet: "", message: "" };

// Le hook ne lit que `name` et `value` de la cible : un élément jsdom suffit, et
// il porte le type réel que les formulaires passent. Le reste de l'événement
// n'est jamais touché, d'où la conversion.
function frappe(balise: "input" | "textarea", name: string, value: string) {
  const cible = document.createElement(balise);
  cible.name = name;
  cible.value = value;
  return { target: cible } as ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement
  >;
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(cleanup);

describe("useForm — écriture des champs", () => {
  it("écrit le champ que l'événement nomme, et lui seul", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() => result.current.handleChange(frappe("input", "sujet", "Devis")));

    // Le champ visé n'est pas le premier de l'état : une écriture par position
    // remplirait `email` sans que rien ne le signale.
    expect(result.current.formData).toEqual({
      email: "",
      sujet: "Devis",
      message: "",
    });
  });

  it("traite une zone de texte comme un champ de saisie", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() =>
      result.current.handleChange(frappe("textarea", "message", "Bonjour")),
    );

    expect(result.current.formData.message).toBe("Bonjour");
  });
});

describe("useForm — péremption des erreurs à la frappe", () => {
  it("efface l'erreur du champ retouché, et garde celle des autres", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() =>
      result.current.setErrors({
        email: "L'email est requis",
        message: "Le message est requis",
      }),
    );
    act(() =>
      result.current.handleChange(frappe("input", "email", "jean@example.com")),
    );

    expect(result.current.errors.email).toBeUndefined();
    // L'erreur des autres champs porte sur une saisie que la frappe n'a pas
    // touchée : la retirer masquerait un refus encore vrai.
    expect(result.current.errors.message).toBe("Le message est requis");
  });

  it("périme le message d'ensemble, qui portait sur l'envoi précédent", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() => result.current.setFormError("Connexion impossible."));
    act(() => result.current.handleChange(frappe("input", "email", "j")));

    expect(result.current.formError).toBeNull();
  });
});

describe("useForm — application des règles", () => {
  it("publie les erreurs trouvées et refuse l'envoi", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    let passe = true;
    act(() => {
      passe = result.current.validate((values) =>
        values.email ? {} : { email: "L'email est requis" },
      );
    });

    expect(passe).toBe(false);
    expect(result.current.errors.email).toBe("L'email est requis");
  });

  it("applique les règles à la saisie courante, pas aux valeurs initiales", () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() =>
      result.current.handleChange(frappe("input", "email", "jean@example.com")),
    );
    let passe = false;
    act(() => {
      passe = result.current.validate((values) =>
        values.email ? {} : { email: "L'email est requis" },
      );
    });

    expect(passe).toBe(true);
    expect(result.current.errors).toEqual({});
  });
});

describe("useForm — rappel de frappe", () => {
  it("prévient l'appelant à chaque frappe", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX, { onChange }));

    act(() => result.current.handleChange(frappe("input", "email", "j")));
    act(() => result.current.handleChange(frappe("input", "email", "je")));

    // Le hook ignore ce que ce rappel retire — un message de succès, que seuls
    // FormContact et FormSubscribe affichent.
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
