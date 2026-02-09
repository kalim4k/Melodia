
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Injection des clés API (Uniquement Kie et Supabase)
      __VITE_KIE_API_KEY__: JSON.stringify(env.VITE_KIE_API_KEY || ''),
      __VITE_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL || ''),
      __VITE_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
  };
});
