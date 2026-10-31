import { expect, test, type Page } from "@playwright/test";

// Aucun repli : un identifiant écrit ici deviendrait un compte réel partout.
function variableRequise(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `${nom} est absente : voir le README, § « Le parcours en navigateur ».`,
    );
  }
  return valeur;
}

const EMAIL = variableRequise("E2E_EMAIL");
const MOT_DE_PASSE = variableRequise("E2E_PASSWORD");

// Recherche partielle : le navigateur ajoute le « * » du `::after` au nom accessible.
async function seConnecter(page: Page, motDePasse: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(EMAIL);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

function jeton(page: Page, nom: string) {
  return page.evaluate((cle) => localStorage.getItem(cle), nom);
}

test.describe("Connexion", () => {
  test("mène à l'accueil et garde les deux jetons", async ({ page }) => {
    await seConnecter(page, MOT_DE_PASSE);

    await expect(page).toHaveURL("/");
    expect(await jeton(page, "access")).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(await jeton(page, "refresh")).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test("refuse un mot de passe faux sans rien stocker", async ({ page }) => {
    await seConnecter(page, "mot-de-passe-faux-42");

    // Libellé du 401 : une pile arrêtée donnerait « injoignable » et ferait tomber le cas.
    await expect(page.getByRole("alert")).toContainText("Connexion impossible.");
    await expect(page).toHaveURL("/login");
    expect(await jeton(page, "access")).toBeNull();
    expect(await jeton(page, "refresh")).toBeNull();
  });
});

test.describe("Déconnexion", () => {
  test("révoque la session et rend le menu d'un visiteur", async ({ page }) => {
    await seConnecter(page, MOT_DE_PASSE);
    await expect(page).toHaveURL("/");
    await page.goto("/blog");
    const refresh = await jeton(page, "refresh");

    const reponseLogout = page.waitForResponse(
      (r) => r.url().endsWith("/auth/logout/") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    const logout = await reponseLogout;

    expect(logout.status()).toBe(200);
    await expect(page).toHaveURL("/");
    // Dans l'en-tête : le pied de page sert le même lien, Playwright refuse deux résultats.
    await expect(
      page
        .getByRole("navigation", { name: "Navigation principale" })
        .getByRole("link", { name: "Se connecter" }),
    ).toBeVisible();
    expect(await jeton(page, "access")).toBeNull();
    expect(await jeton(page, "refresh")).toBeNull();

    // L'API doit aussi refuser le refresh ; son adresse vient de l'appel du front.
    const renouvellement = await page.request.post(
      logout.url().replace(/logout\/$/, "login/refresh/"),
      { data: { refresh } },
    );
    expect(renouvellement.status()).toBe(401);
  });
});
