
export interface Song {
  id: string;
  title: string;
  recipient: string;
  lyrics: string;
  audioUrl?: string; // URL for the generated TTS audio
  style: string;
  createdAt: string;
  duration: string;
  coverImage: string;
  voiceInput?: string; // URL de l'audio utilisateur
  voiceMode?: 'dedication' | 'inspiration'; // Mode d'utilisation
}

export interface User {
  name: string;
  email: string; // Ajouté pour Maketou
  coins: number;
  avatar: string;
  plan: 'gratuit' | 'premium';
  joinedAt: string;
}

export enum NavItem {
  HOME = 'accueil',
  CREATE = 'creer',
  MY_MUSIC = 'mes-musiques',
  COINS = 'pieces',
  PROFILE = 'profil',
  ADMIN = 'admin'
}

export interface GenerationParams {
  sender: string;
  recipient: string;
  vibe: 'romantique' | 'drole' | 'passionne' | 'poetique';
  musicStyle: 'pop' | 'slam' | 'jazz' | 'acoustique' | 'rap' | 'rnb' | 'afro' | 'zouk' | 'lofi' | 'bossa';
  voice: 'male' | 'female';
  details: string;
  customCover?: string | null; // Base64 or URL
  voiceInput?: string | null; // Blob URL or Supabase URL
  voiceInputBlob?: Blob | null; // Raw file for upload
  voiceMode?: 'dedication' | 'inspiration';
}
