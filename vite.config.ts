
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Charge les variables locales pour le dev
  const env = loadEnv(mode, process.cwd(), '');

  // Netlify expose les variables dans process.env lors du build.
  // En local, elles sont dans 'env'.
  // On cherche 'API_KEY' (nom standard) ou 'VITE_API_KEY' (nom Vite).
  const rawApiKey = process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY || '';
  
  // Nettoyage de la clé (suppression des espaces invisibles fréquents lors des copier-coller)
  const finalApiKey = rawApiKey.trim();

  console.log(`[Vite Build] API Key detected: ${finalApiKey ? 'YES (Length: ' + finalApiKey.length + ')' : 'NO'}`);

  return {
    plugins: [react()],
    define: {
      // On force l'injection dans une variable globale standard Vite
      // Cela permet d'accéder à la clé via import.meta.env.VITE_API_KEY n'importe où
      'import.meta.env.VITE_API_KEY': JSON.stringify(finalApiKey),
      // Fallback pour le code existant qui utilise process.env
      'process.env.API_KEY': JSON.stringify(finalApiKey),
    },
  };
});
