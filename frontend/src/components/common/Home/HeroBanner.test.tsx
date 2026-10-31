import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import { LIEN_BLOG } from "../../../lib/navigation";
import HeroBanner from "./HeroBanner";

// Un appel à l'action en `<button>` sans `onClick` ne casse ni build ni typage.

function rendreLaBanniere() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <HeroBanner />
    </MemoryRouter>,
  );
}

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
