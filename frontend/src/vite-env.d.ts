/// <reference types="vite/client" />

// `interface` et non `type` : étendre ImportMetaEnv exige la fusion de déclarations.
interface ImportMetaEnv {
  // Optionnelle exprès : lib/api.ts doit traiter son absence.
  readonly VITE_API_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
