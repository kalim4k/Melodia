
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode actuel (local .env)
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Log pour débogage lors du build (visible dans les logs Netlify)
  console.log("Build Environment Check:");
  console.log("- API_KEY exists:", !!(process.env.API_KEY || env.API_KEY));
  console.log("- KIE_API_KEY exists:", !!(process.env.KIE_API_KEY || env.KIE_API_KEY));

  return {
    plugins: [react()],
    define: {
      // Stratégie de remplacement très permissive :
      // 1. Cherche dans process.env (CI/CD)
      // 2. Cherche dans env chargé par Vite (local)
      // 3. Fallback vide
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY || ''),
      'process.env.KIE_API_KEY': JSON.stringify(process.env.KIE_API_KEY || env.KIE_API_KEY || process.env.VITE_KIE_API_KEY || env.VITE_KIE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
    },
  };
});
