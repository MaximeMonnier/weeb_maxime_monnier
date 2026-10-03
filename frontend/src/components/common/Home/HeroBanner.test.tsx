import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import { LIEN_BLOG } from "../../../lib/navigation";
import HeroBanner from "./HeroBanner";

// Ce que le seul HeroBanner.tsx ne dit pas : ses appels à l'action ont été deux
// `<button>` sans `onClick` (issue #180). Un bouton inerte ne casse ni le build
// ni le typage — seul ce test le rattrape.

function rendreLaBanniere() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <HeroBanner />
    </MemoryRouter>,
  );
}

// Le nettoyage est explicite : Testing Library ne l'inscrit lui-même que s'il
// trouve un afterEach global, et `globals: false` n'en pose aucun.
afterEach(cleanup);

describe("HeroBanner", () => {
  it("mène au blog par un lien, à la destination de lib/navigation", () => {
    rendreLaBanniere();

    expect(
      screen.getByRole("link", { name: "Découvrir les articles" }),
    ).toHaveAttribute("href", LIEN_BLOG.to);
  });

  it("ne rend aucun bouton, faute d'action à leur donner ici", () => {
    rendreLaBanniere();

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("ne promet plus de newsletter", () => {
    rendreLaBanniere();

    expect(screen.queryByText(/newsletter/i)).toBeNull();
  });
});
