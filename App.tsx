import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Create from './pages/Create';
import MyMusic from './pages/MyMusic';
import CoinsPage from './pages/Coins';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Landing from './pages/Landing'; // Import de la Landing Page
import BackgroundAnimation from './components/BackgroundAnimation';
import { NavItem, Song, User } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.HOME);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // État pour gérer l'affichage entre Landing et Auth
  const [showAuth, setShowAuth] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Gestion de la session Supabase
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchUserData(session.user.id);
      })
      .catch((err) => {
        console.warn("Erreur lors de la récupération de la session:", err);
      })
      .finally(() => {
        setLoadingInitial(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
        setShowAuth(false); // Reset landing state on login
      } else {
        setUser(null);
      }
    });

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // 1. Récupérer le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          name: profile.name,
          coins: profile.coins,
          avatar: profile.avatar_url || 'https://picsum.photos/seed/user123/200/200',
          plan: 'gratuit', // Par défaut 'gratuit', passera en 'premium' via logique d'achat future
          joinedAt: profile.created_at || new Date().toISOString()
        });
      }

      // 2. Récupérer les chansons
      const { data: userSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userSongs) {
        // Transformation des noms de colonnes (snake_case DB -> camelCase App)
        const formattedSongs: Song[] = userSongs.map(s => ({
          id: s.id,
          title: s.title,
          recipient: s.recipient,
          lyrics: s.lyrics,
          audioUrl: s.audio_url,
          style: s.style,
          createdAt: s.created_at,
          duration: s.duration,
          coverImage: s.cover_image
        }));
        setSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Erreur chargement données utilisateur:", error);
    }
  };

  const handleSongCreated = async (newSong: Song) => {
    if (!session?.user) return;

    // Sauvegarder dans Supabase
    const { error } = await supabase.from('songs').insert({
      user_id: session.user.id,
      title: newSong.title,
      recipient: newSong.recipient,
      lyrics: newSong.lyrics,
      audio_url: newSong.audioUrl,
      style: newSong.style,
      duration: newSong.duration,
      cover_image: newSong.coverImage,
      created_at: newSong.createdAt
    });

    if (error) {
      console.error("Erreur sauvegarde chanson:", error);
      // On ajoute quand même localement pour l'UX
    }

    setSongs([newSong, ...songs]);
    setActiveTab(NavItem.MY_MUSIC);
  };

  const deductCoins = (amount: number) => {
    if (!user || !session?.user) return false;
    
    if (user.coins >= amount) {
      const newBalance = user.coins - amount;
      
      // Mise à jour optimiste UI
      setUser({ ...user, coins: newBalance });

      // Mise à jour DB
      supabase
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', session.user.id)
        .then(({ error }) => {
          if (error) console.error("Erreur mise à jour pièces:", error);
        });

      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Le listener onAuthStateChange gérera le reste, mais on reset l'état local pour être sûr
  };

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case NavItem.HOME:
        return <Home user={user} recentSongs={songs.slice(0, 3)} goToCreate={() => setActiveTab(NavItem.CREATE)} />;
      case NavItem.CREATE:
        return <Create onSongCreated={handleSongCreated} deductCoins={deductCoins} />;
      case NavItem.MY_MUSIC:
        return <MyMusic songs={songs} />;
      case NavItem.COINS:
        return <CoinsPage user={user} />;
      case NavItem.PROFILE:
        return <Profile user={user} onLogout={handleLogout} onNavigate={setActiveTab} />;
      default:
        return <Home user={user} recentSongs={songs} goToCreate={() => setActiveTab(NavItem.CREATE)} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case NavItem.HOME: return 'Accueil';
      case NavItem.CREATE: return 'Créer';
      case NavItem.MY_MUSIC: return 'Mes Musiques';
      case NavItem.COINS: return 'Boutique';
      case NavItem.PROFILE: return 'Profil';
      default: return 'Melodia';
    }
  };

  if (loadingInitial) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-rose-500">Chargement...</div>;
  }

  // --- LOGIQUE D'AFFICHAGE NON-CONNECTÉ ---
  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />;
    }
    return <Landing onStart={() => setShowAuth(true)} />;
  }

  // Calcul dynamique de la marge
  const mainMargin = !isMobile ? (isSidebarCollapsed ? 'ml-20' : 'ml-72') : '';

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      <BackgroundAnimation />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobile={isMobile} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out z-10 ${mainMargin}`}>
        {user && <Header user={user} title={getPageTitle()} />}
        <div className="flex-1 px-4 md:px-8 pt-6 max-w-7xl mx-auto w-full relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;