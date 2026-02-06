import { createClient } from '@supabase/supabase-js';

// Utilisation de valeurs par défaut pour éviter le crash "supabaseUrl is required" 
// si les variables d'environnement ne sont pas définies.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wdzjgsjlyzoskqaovypj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XCIKC1XS42v_wpODUVkO2w_3jgPS0JU';

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("Attention : Les clés Supabase (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY) sont manquantes ou incorrectes. L'authentification ne fonctionnera pas correctement.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Types Helper pour la base de données
export type Tables = {
  profiles: {
    id: string; // references auth.users
    name: string;
    coins: number;
    avatar_url: string;
  };
  songs: {
    id: string;
    user_id: string;
    title: string;
    recipient: string;
    lyrics: string;
    audio_url: string;
    cover_image: string;
    style: string;
    duration: string;
    created_at: string;
  };
};