// Fix: Manually define ImportMeta interfaces to resolve "Property 'env' does not exist" errors
// and "Cannot find type definition file for 'vite/client'" error.
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_KIE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
