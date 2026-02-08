import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode actuel (local .env)
  // Le 3ème argument '' permet de charger TOUTES les variables, pas juste celles avec VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // CRITIQUE POUR NETLIFY : On ajoute "|| process.env.XXX"
      // Si loadEnv ne capture pas la variable (cas fréquent en CI/CD), on prend celle du processus Node
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY || process.env.KIE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
    },
  };
});