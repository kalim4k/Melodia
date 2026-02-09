
/// <reference types="vite/client" />

// Déclaration des constantes globales injectées par Vite
declare const __VITE_KIE_API_KEY__: string;
declare const __VITE_SUPABASE_URL__: string;
declare const __VITE_SUPABASE_ANON_KEY__: string;

interface ImportMetaEnv {
  readonly VITE_KIE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
