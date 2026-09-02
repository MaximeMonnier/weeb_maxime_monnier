import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Les événements du système de fichiers ne traversent pas un montage lié :
    // sans interrogation, le rechargement à chaud est muet en conteneur.
    watch: {
      usePolling: process.env.DEV_POLLING === "1",
    },
  },
});
