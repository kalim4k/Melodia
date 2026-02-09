
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdzjgsjlyzoskqaovypj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XCIKC1XS42v_wpODUVkO2w_3jgPS0JU';

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
