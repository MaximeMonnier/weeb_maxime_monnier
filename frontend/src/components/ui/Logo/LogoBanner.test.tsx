import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import LogoBanner from "./LogoBanner";

// Bandeau rendu deux fois pour boucler : un `alt` nommé ferait lire chaque marque quatre fois.

const MARQUES = ["SmartFinder", "Zoomerr", "SHELLS", "WAVES", "ArtVenue"];

afterEach(cleanup);

describe("LogoBanner", () => {
  it.each(MARQUES)("affiche %s dans les deux copies du bandeau", (marque) => {
    render(<LogoBanner />);

    expect(screen.getAllByText(marque)).toHaveLength(2);
  });

  it.each(MARQUES)("n'expose %s qu'une fois aux lecteurs d'écran", (marque) => {
    render(<LogoBanner />);

    const exposes = screen
      .getAllByText(marque)
      .filter((element) => !isInaccessible(element));

    expect(exposes).toHaveLength(1);
  });

  it("ne nomme aucune marque par l'image, que le texte nomme déjà", () => {
    render(<LogoBanner />);

    expect(screen.queryAllByRole("img", { hidden: true })).toHaveLength(0);
  });
});
