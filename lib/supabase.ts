
import { createClient } from '@supabase/supabase-js';

// Utilisation des globales injectées avec fallback sécurisé via typeof
// Cela évite l'erreur "Cannot read properties of undefined" sur import.meta.env
const supabaseUrl = (typeof __VITE_SUPABASE_URL__ !== 'undefined' ? __VITE_SUPABASE_URL__ : '') || 'https://wdzjgsjlyzoskqaovypj.supabase.co';
const supabaseAnonKey = (typeof __VITE_SUPABASE_ANON_KEY__ !== 'undefined' ? __VITE_SUPABASE_ANON_KEY__ : '') || 'sb_publishable_XCIKC1XS42v_wpODUVkO2w_3jgPS0JU';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Tables = {
  profiles: {
    id: string; 
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
    voice_input?: string | null;
    voice_mode?: string | null;
  };
};
