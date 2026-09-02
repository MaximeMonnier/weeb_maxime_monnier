import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv ne lit que les fichiers .env ; en conteneur la variable arrive par
  // l'environnement, d'où les deux sources.
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL;

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
  };
});
