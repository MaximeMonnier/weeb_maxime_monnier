import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Surveillance des fichiers par interrogation périodique, au lieu des
    // notifications du système de fichiers. Uniquement quand DEV_POLLING vaut
    // 1, ce que fait l'image Docker : les événements inotify ne traversent pas
    // un montage lié depuis l'hôte, et sans cela le rechargement à chaud reste
    // muet dans le conteneur. Hors conteneur la variable est absente, la
    // surveillance native s'applique, et rien ne consomme de CPU pour rien.
    watch: {
      usePolling: process.env.DEV_POLLING === "1",
    },
  },
});
