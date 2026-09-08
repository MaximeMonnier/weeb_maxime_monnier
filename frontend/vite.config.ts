// defineConfig vient de vitest/config et non de vite : lui seul connaît la clé
// `test` ci-dessous, absente du type de configuration de Vite.
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Préfixe vide : loadEnv verse alors tout process.env en plus des fichiers
  // .env, ce qui couvre la variable passée par --build-arg en conteneur.
  const apiUrl = loadEnv(mode, process.cwd(), "").VITE_API_URL;

  // Échouer ici plutôt que de livrer un bundle vert qui meurt au chargement :
  // l'adresse est figée dans le JavaScript, elle doit être connue maintenant.
  if (mode === "production" && !apiUrl) {
    throw new Error(
      "VITE_API_URL est absente : la passer en --build-arg VITE_API_URL=... (image) " +
        "ou la définir dans frontend/.env (build local).",
    );
  }

  return {
    plugins: [react(), tailwindcss()],

    server: {
      // Les événements du système de fichiers ne traversent pas un montage lié :
      // sans interrogation, le rechargement à chaud est muet en conteneur.
      watch: {
        usePolling: process.env.DEV_POLLING === "1",
      },
    },

    test: {
      // localStorage et le DOM n'existent pas sous Node : la suite de lib/api.ts
      // lit le jeton dans le premier, les formulaires rendus attendront le second.
      environment: "jsdom",
      // Pas de globales : chaque fichier importe describe, it et expect de
      // "vitest", ce qui évite d'apprendre ces noms à TypeScript et à ESLint.
      globals: false,
    },
  };
});
