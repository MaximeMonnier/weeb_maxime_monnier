// vitest/config et non vite : seul son type connaît la clé `test`.
import { configDefaults, defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Préfixe vide : loadEnv lit aussi process.env, donc le --build-arg du conteneur.
  const apiUrl = loadEnv(mode, process.cwd(), "").VITE_API_URL;

  // L'adresse est figée dans le bundle : sans elle, il mourrait au chargement.
  if (mode === "production" && !apiUrl) {
    throw new Error(
      "VITE_API_URL est absente : la passer en --build-arg VITE_API_URL=... (image) " +
        "ou la définir dans frontend/.env (build local).",
    );
  }

  return {
    plugins: [react(), tailwindcss()],

    server: {
      // Les événements fichiers ne traversent pas un montage lié : sans polling, pas de HMR.
      watch: {
        usePolling: process.env.DEV_POLLING === "1",
      },
    },

    test: {
      environment: "jsdom",
      // Sans lui, le `?raw` d'`index.css.test.ts` serait vide et le test passerait à vide.
      css: true,
      globals: false,
      // e2e/ est à Playwright ; défauts repris, sinon Vitest relirait node_modules et dist.
      exclude: [...configDefaults.exclude, "e2e/**"],
      // userEvent.type dépasse les 5 s par défaut sur une machine chargée.
      testTimeout: 20_000,
    },
  };
});
