import { expect, test, type Page } from "@playwright/test";

// Aucun repli : un identifiant écrit ici deviendrait un compte réel sur toute
// machine qui lance la suite. Une variable présente mais vide vaut absente.
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

// Recherche partielle, et non exacte : `.form-label-required::after` ajoute « * »
// aux libellés obligatoires, et un vrai navigateur verse ce contenu généré dans
// le nom accessible. jsdom n'applique aucune feuille de style et ne le montre pas.
async function seConnecter(page: Page, motDePasse: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(EMAIL);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

// Lu dans le navigateur : localStorage n'existe que là, jamais dans le processus
// qui pilote le test.
function jeton(page: Page, nom: string) {
  return page.evaluate((cle) => localStorage.getItem(cle), nom);
}

test.describe("Connexion", () => {
  test("mène à l'accueil et garde les deux jetons", async ({ page }) => {
    await seConnecter(page, MOT_DE_PASSE);

    await expect(page).toHaveURL("/");
    // Trois segments séparés par des points, la forme d'un JWT : une valeur
    // seulement non vide laisserait passer "undefined" ou un objet sérialisé.
    expect(await jeton(page, "access")).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(await jeton(page, "refresh")).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  test("refuse un mot de passe faux sans rien stocker", async ({ page }) => {
    // Huit caractères au moins : plus court, le formulaire refuserait de lui-même
    // et l'API ne serait jamais appelée.
    await seConnecter(page, "mot-de-passe-faux-42");

    // Ce libellé est celui que le front substitue au 401 anglais de simplejwt.
    // Une pile arrêtée donnerait « Le serveur est injoignable » : ce cas tombe
    // donc si l'API n'est pas là, au lieu de passer sur un refus de façade.
    await expect(page.getByRole("alert")).toContainText("Connexion impossible.");
    await expect(page).toHaveURL("/login");
    // Les deux, et pas seulement le premier : un refus qui écrirait quand même
    // le jeton de rafraîchissement rendrait une session récupérable.
    expect(await jeton(page, "access")).toBeNull();
    expect(await jeton(page, "refresh")).toBeNull();
  });
});
