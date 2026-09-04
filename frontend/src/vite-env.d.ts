/// <reference types="vite/client" />

// `interface` et non `type` : étendre ImportMetaEnv passe par la fusion de
// déclarations, que seule l'interface permet.
interface ImportMetaEnv {
  // Volontairement optionnelle : c'est ce qui oblige lib/api.ts à traiter le
  // cas où elle manque.
  readonly VITE_API_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
