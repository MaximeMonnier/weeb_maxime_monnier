/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optionnelle exprès : lib/api.ts doit traiter son absence.
  readonly VITE_API_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
