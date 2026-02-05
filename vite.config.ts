import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode actuel (ex: .env, .env.production)
  // ou depuis l'interface Netlify
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Permet à "process.env.API_KEY" de fonctionner dans le code client
      // sans avoir besoin de tout renommer en import.meta.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY),
    },
  };
});