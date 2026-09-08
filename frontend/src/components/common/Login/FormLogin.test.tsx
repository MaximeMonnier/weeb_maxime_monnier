import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormLogin from "./FormLogin";

const FETCH_ORIGINAL = globalThis.fetch;

// Le réseau est coupé à `fetch` et non à `apiFetch` : le test traverse alors la
// vraie chaîne, de l'adresse et du corps que reçoit le réseau jusqu'à la
// traduction du refus.
const appelReseau = vi.fn();

// apiFetch ne lit que ok, status et json() : le doublon s'en tient là.
function reponse(status: number, corps: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => corps),
  };
}

// Le formulaire pose un Link et appelle useNavigate : sans routeur, il ne rend
// pas. La route d'accueil porte un repère, la redirection après succès n'étant
// visible que par ce qu'elle affiche.
function afficherFormulaire() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<FormLogin />} />
        <Route path="/" element={<p>Page d'accueil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Ce que le réseau a reçu au dernier appel. Le doublon répond 200 quels que
// soient ses arguments : sans cette lecture, une route ou un corps changés
// laisseraient la suite verte.
function requeteEnvoyee() {
  const [url, options] = appelReseau.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    methode: options.method,
    corps: JSON.parse(options.body as string) as unknown,
  };
}

const champEmail = () => screen.getByLabelText("Adresse email");
const champMotDePasse = () => screen.getByLabelText("Mot de passe");
const bouton = () => screen.getByRole("button");
const alerte = () => screen.getByRole("alert");

// Le chemin nominal, dont chaque cas ne change qu'une pièce.
async function remplirEtEnvoyer(email: string, motDePasse: string) {
  if (email) await userEvent.type(champEmail(), email);
  if (motDePasse) await userEvent.type(champMotDePasse(), motDePasse);
  await userEvent.click(bouton());
}

beforeEach(() => {
  appelReseau.mockReset();
  globalThis.fetch = appelReseau as unknown as typeof fetch;
});

// Le nettoyage du DOM est explicite : Testing Library ne l'inscrit lui-même que
// s'il trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(() => {
  cleanup();
  globalThis.fetch = FETCH_ORIGINAL;
  localStorage.clear();
});

describe("FormLogin — refus avant tout appel", () => {
  it("nomme les deux champs vides", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("", "");

    expect(screen.getByText("L'email est requis")).toBeInTheDocument();
    expect(screen.getByText("Le mot de passe est requis")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("refuse un email sans domaine", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example", "motdepasse123");

    expect(screen.getByText("L'email n'est pas valide")).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe de moins de huit caractères", async () => {
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "court12");

    expect(
      screen.getByText("Le mot de passe doit contenir au moins 8 caractères"),
    ).toBeInTheDocument();
    expect(appelReseau).not.toHaveBeenCalled();
  });
});

describe("FormLogin — réponse de l'API", () => {
  it("substitue son libellé au 401 anglais de simplejwt", async () => {
    appelReseau.mockResolvedValue(
      reponse(401, {
        detail: "No active account found with the given credentials",
      }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(alerte()).toHaveTextContent(/^Connexion impossible\./);
    // Le message ne dit ni lequel des deux champs est faux, ni si l'adresse est
    // inscrite : le savoir énumérerait les comptes.
    expect(alerte()).toHaveTextContent(/validé par un administrateur\.$/);
    expect(localStorage.getItem("access")).toBeNull();
  });

  it("garde les deux jetons et mène à l'accueil après un succès", async () => {
    appelReseau.mockResolvedValue(
      reponse(200, { access: "jeton-acces", refresh: "jeton-renouvellement" }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument();
    // Le chemin est vérifié par sa fin seule : le préfixe vient de VITE_API_URL,
    // et c'est apiFetch qui le pose — api.test.ts s'en charge.
    expect(requeteEnvoyee()).toEqual({
      url: expect.stringMatching(/\/auth\/login\/$/),
      methode: "POST",
      corps: {
        email: "jean.dupont@example.com",
        password: "motdepasse123",
      },
    });
    // Le premier jeton est celui qu'apiFetch relira à chaque appel ; le second
    // est la seule façon d'en obtenir un neuf.
    expect(localStorage.getItem("access")).toBe("jeton-acces");
    expect(localStorage.getItem("refresh")).toBe("jeton-renouvellement");
  });
});

describe("FormLogin — envoi en cours", () => {
  it("annonce l'attente et ferme le bouton jusqu'à la réponse", async () => {
    // La réponse est retenue à la main : « Connexion... » ne s'affiche que
    // pendant ce laps, et une promesse déjà résolue le traverserait sans arrêt.
    let repondre: (reponseHttp: unknown) => void = () => {};
    appelReseau.mockReturnValue(
      new Promise((resolve) => {
        repondre = resolve;
      }),
    );
    afficherFormulaire();

    await remplirEtEnvoyer("jean.dupont@example.com", "motdepasse123");

    expect(bouton()).toHaveTextContent("Connexion...");
    expect(bouton()).toBeDisabled();

    repondre(reponse(200, { access: "jeton-acces", refresh: "renouvellement" }));
    // Sans cette attente, le rendu déclenché par la réponse tomberait après le
    // cas, dans un DOM déjà nettoyé.
    expect(await screen.findByText("Page d'accueil")).toBeInTheDocument();
  });
});
