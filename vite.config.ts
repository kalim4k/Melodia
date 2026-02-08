
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement locales (.env)
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Fonction pour récupérer une variable en cherchant partout
  // Priorité : process.env (Netlify) > env (Local .env)
  const getEnvVar = (name: string) => {
    return process.env[name] || env[name] || process.env[`VITE_${name}`] || env[`VITE_${name}`] || '';
  };

  const apiKey = getEnvVar('API_KEY');
  const kieApiKey = getEnvVar('KIE_API_KEY');
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  console.log(`[Build] API_KEY configured: ${apiKey ? 'Yes (Length: ' + apiKey.length + ')' : 'No'}`);

  return {
    plugins: [react()],
    define: {
      // Injection standard
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.KIE_API_KEY': JSON.stringify(kieApiKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      
      // Fallback de sécurité (Parfois 'process.env' est mal polyfillé)
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey), 
    },
  };
});
