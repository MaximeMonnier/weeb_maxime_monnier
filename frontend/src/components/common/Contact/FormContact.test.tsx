import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import FormContact from "./FormContact";

function afficherFormulaire() {
  render(
    <MemoryRouter initialEntries={["/contact"]}>
      <Routes>
        <Route path="/contact" element={<FormContact />} />
        <Route path="/privacy" element={<p>Page de confidentialité</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const lienConfidentialite = () =>
  screen.getByRole("link", { name: "politique de confidentialité" });

describe("FormContact", () => {
  afterEach(cleanup);

  // L'information est due au moment de la collecte : placée après le bouton,
  // elle serait lue une fois le message parti.
  it("informe de l'usage des données entre le message et le bouton d'envoi", () => {
    afficherFormulaire();

    const message = screen.getByLabelText("Message");
    const lien = lienConfidentialite();
    const bouton = screen.getByRole("button", { name: "Envoyer le message" });

    expect(message.compareDocumentPosition(lien)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(lien.compareDocumentPosition(bouton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("mène à la politique de confidentialité", async () => {
    afficherFormulaire();

    await userEvent.click(lienConfidentialite());

    expect(screen.getByText("Page de confidentialité")).toBeInTheDocument();
  });
});
