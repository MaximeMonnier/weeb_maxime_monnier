import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";

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

// Le hook n'appelle que `preventDefault` sur l'événement d'envoi.
function envoi() {
  return { preventDefault: vi.fn() } as unknown as FormEvent;
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
  it("efface l'erreur du champ retouché, et garde celle des autres", async () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        rules: () => ({
          email: "L'email est requis",
          message: "Le message est requis",
        }),
        fields: [],
        send: vi.fn(),
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

  it("périme le message d'ensemble, qui portait sur l'envoi précédent", async () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        fields: [],
        send: () => Promise.reject({ status: 500, data: {} }),
      }),
    );
    expect(result.current.formError).not.toBeNull();
    act(() => result.current.handleChange(frappe("input", "email", "j")));

    expect(result.current.formError).toBeNull();
  });
});

describe("useForm — application des règles", () => {
  it("publie les erreurs trouvées et n'appelle pas l'API", async () => {
    const send = vi.fn();
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        rules: (values) => (values.email ? {} : { email: "L'email est requis" }),
        fields: [],
        send,
      }),
    );

    expect(send).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe("L'email est requis");
  });

  it("applique les règles à la saisie courante, pas aux valeurs initiales", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    act(() =>
      result.current.handleChange(frappe("input", "email", "jean@example.com")),
    );
    await act(() =>
      result.current.submit(envoi(), {
        rules: (values) => (values.email ? {} : { email: "L'email est requis" }),
        fields: [],
        send,
      }),
    );

    expect(send).toHaveBeenCalledWith({
      email: "jean@example.com",
      sujet: "",
      message: "",
    });
    expect(result.current.errors).toEqual({});
  });
});

describe("useForm — cycle d'envoi", () => {
  it("bloque l'envoi pendant l'appel et le relâche après un succès", async () => {
    let termine = () => {};
    const send = () =>
      new Promise<void>((resolve) => {
        termine = resolve;
      });
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    let enCours: Promise<void> = Promise.resolve();
    act(() => {
      enCours = result.current.submit(envoi(), { fields: [], send });
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      termine();
      await enCours;
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("relâche l'envoi après un refus", async () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        fields: [],
        send: () => Promise.reject({ status: 500, data: {} }),
      }),
    );

    // Resté à `true`, le bouton désactivé interdirait de corriger et de renvoyer.
    expect(result.current.isSubmitting).toBe(false);
  });

  it("range un refus de l'API sous les champs connus, le reste au message d'ensemble", async () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        fields: ["email"],
        send: () =>
          Promise.reject({
            status: 400,
            data: {
              email: ["Saisissez une adresse email valide."],
              detail: "Requête incomplète.",
            },
          }),
      }),
    );

    expect(result.current.errors).toEqual({
      email: "Saisissez une adresse email valide.",
    });
    expect(result.current.formError).toBe("Requête incomplète.");
  });

  it("donne au 401 le libellé que le formulaire lui choisit", async () => {
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        fields: [],
        send: () => Promise.reject({ status: 401, data: {} }),
        unauthorized: "Connexion impossible.",
      }),
    );

    expect(result.current.formError).toBe("Connexion impossible.");
  });

  it("publie la traduction propre au formulaire, qui reçoit le refus réparti et l'erreur", async () => {
    const refusApi = { status: 400, data: { email: ["Adresse déjà prise."] } };
    const translate = vi.fn(() => ({
      fieldErrors: {},
      formError: "Impossible de créer ce compte.",
    }));
    const { result } = renderHook(() => useForm(CHAMPS_INITIAUX));

    await act(() =>
      result.current.submit(envoi(), {
        fields: ["email"],
        send: () => Promise.reject(refusApi),
        translate,
      }),
    );

    expect(translate).toHaveBeenCalledWith(
      { fieldErrors: { email: "Adresse déjà prise." }, formError: null },
      refusApi,
    );
    expect(result.current.errors).toEqual({});
    expect(result.current.formError).toBe("Impossible de créer ce compte.");
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
