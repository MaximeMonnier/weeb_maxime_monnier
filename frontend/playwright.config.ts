import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";

// Seul le port vient du .env racine : les identifiants ne viennent que du shell.
function portPublieParCompose(): string {
  try {
    const env = parseEnv(readFileSync(new URL("../.env", import.meta.url), "utf8"));
    return env.FRONTEND_PORT_DEV || "5173";
  } catch {
    return "5173";
  }
}

// Pas de `webServer` : un Vite seul, sans base ni API, ne prouverait rien.
const ADRESSE_DU_SITE = `http://127.0.0.1:${portPublieParCompose()}`;

export default defineConfig({
  testDir: "./e2e",

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: {
    baseURL: ADRESSE_DU_SITE,
    trace: "retain-on-failure",
  },

  forbidOnly: !!process.env.CI,

  // Le login plafonne à 5/min : une reprise ou un second worker prendrait un 429.
  retries: 0,
  workers: 1,

  reporter: "list",
});
