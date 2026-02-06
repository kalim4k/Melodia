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
}

export interface User {
  name: string;
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
  PROFILE = 'profil'
}

export interface GenerationParams {
  sender: string;
  recipient: string;
  vibe: 'romantique' | 'drole' | 'passionne' | 'poetique';
  musicStyle: 'pop' | 'slam' | 'jazz' | 'acoustique' | 'rap';
  voice: 'male' | 'female';
  details: string;
}