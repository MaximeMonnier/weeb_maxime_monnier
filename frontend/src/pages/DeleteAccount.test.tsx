import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import DeleteAccount from "./DeleteAccount";
import {
  appelReseau,
  couperLeReseau,
  dernierAppel,
  reponse,
  requeteEnvoyee,
  retablirLeReseau,
} from "../test/reseau";

function afficherPage() {
  render(
    <MemoryRouter initialEntries={["/delete-account"]}>
      <Routes>
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/" element={<p>Page d'accueil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function confirmerAvec(motDePasse: string) {
  await userEvent.type(screen.getByLabelText("Mot de passe"), motDePasse);
  await userEvent.click(screen.getByRole("button"));
}

beforeEach(couperLeReseau);

afterEach(() => {
  cleanup();
  retablirLeReseau();
  localStorage.clear();
});

describe("DeleteAccount — visiteur", () => {
  it("renvoie à la connexion sans afficher le formulaire", () => {
    afficherPage();

    expect(screen.queryByLabelText("Mot de passe")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "Connectez-vous" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});

describe("DeleteAccount — membre connecté", () => {
  beforeEach(() => {
    localStorage.setItem("access", "acces-avant");
    localStorage.setItem("refresh", "refresh-avant");
  });

  it("prévient que la suppression emporte les articles", () => {
    afficherPage();

    expect(screen.getByText(/articles que vous avez publiés/)).toHaveTextContent(
      "définitive",
    );
  });

  it("efface les jetons et ramène à l'accueil une fois le compte supprimé", async () => {
    appelReseau.mockResolvedValue(reponse(204));
    afficherPage();

    await confirmerAvec("BonSecret123");

    const { url, methode, corps } = requeteEnvoyee();
    const { entetes } = dernierAppel();
    expect(url).toMatch(/\/auth\/account\/$/);
    expect(methode).toBe("DELETE");
    expect(entetes.Authorization).toBe("Bearer acces-avant");
    expect(corps).toEqual({ password: "BonSecret123" });
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(screen.getByText("Page d'accueil")).toBeInTheDocument();
  });

  it("range le refus du mot de passe sous son champ et garde la session", async () => {
    appelReseau.mockResolvedValue(
      reponse(400, { password: ["Le mot de passe est incorrect."] }),
    );
    afficherPage();

    await confirmerAvec("MauvaisSecret789");

    expect(screen.getByLabelText("Mot de passe")).toHaveAccessibleDescription(
      "Le mot de passe est incorrect.",
    );
    expect(localStorage.getItem("access")).toBe("acces-avant");
    expect(localStorage.getItem("refresh")).toBe("refresh-avant");
  });

  it("n'appelle pas l'API sans mot de passe", async () => {
    afficherPage();

    await userEvent.click(screen.getByRole("button"));

    expect(appelReseau).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Mot de passe")).toHaveAccessibleDescription(
      "Le mot de passe est requis",
    );
  });
});
