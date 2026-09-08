// Réglages du parcours en navigateur, lus par `npm run test:e2e` seul. Vitest,
// lui, se règle dans vite.config.ts : les deux lanceurs ne partagent rien.
import { defineConfig, devices } from "@playwright/test";

// Le serveur Vite de compose.dev.yaml, publié sur la boucle locale seule. Pas de
// `webServer` ici : Playwright relancerait Vite sans la base ni l'API derrière,
// et le parcours cesserait de prouver que le front et l'API se parlent.
const ADRESSE_DU_SITE = "http://127.0.0.1:5173";

export default defineConfig({
  // Hors de src/ : ces fichiers ne partent pas dans le bundle, et vite.config.ts
  // les retire de Vitest, qui ne saurait pas les exécuter.
  testDir: "./e2e",

  // Un seul navigateur : ce qui est vérifié est la conversation entre le front
  // et l'API, pas le rendu d'un moteur à l'autre.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: {
    baseURL: ADRESSE_DU_SITE,
    // Trace gardée sur échec seul : `npx playwright show-trace` rejoue alors le
    // parcours pas à pas, sans rien peser sur les exécutions vertes.
    trace: "retain-on-failure",
  },

  // Un `test.only` oublié réduirait la suite sans que rien ne le signale. La
  // garde ne vaut que sur une machine d'intégration : sur le poste, isoler un
  // cas le temps de le corriger est légitime.
  forbidOnly: !!process.env.CI,

  // Aucune reprise, et un seul worker : l'API n'accepte que cinq connexions par
  // minute. Rejouer un cas raté ferait répondre 429 à la reprise, et le journal
  // montrerait un quota là où il y avait un vrai défaut.
  retries: 0,
  workers: 1,

  reporter: "list",
});
