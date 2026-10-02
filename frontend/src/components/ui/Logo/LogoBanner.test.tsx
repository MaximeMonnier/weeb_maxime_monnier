import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import LogoBanner from "./LogoBanner";

// Ce que le seul LogoBanner.tsx ne dit pas : le bandeau est rendu deux fois pour
// que l'animation boucle, et chaque logo nommait sa marque dans l'`alt` comme
// dans le texte — un lecteur d'écran lisait chaque nom quatre fois (issue #204).

const MARQUES = ["SmartFinder", "Zoomerr", "SHELLS", "WAVES", "ArtVenue"];

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
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
