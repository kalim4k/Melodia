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
import Landing from './pages/Landing';
import BackgroundAnimation from './components/BackgroundAnimation';
import PlayerBar from './components/PlayerBar';
import { NavItem, Song, User } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.HOME);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Auth State
  const [showAuth, setShowAuth] = useState(false);
  
  // Data State
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchUserData(session.user.id);
      })
      .catch((err) => {
        console.warn("Erreur session:", err);
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
        setShowAuth(false);
      } else {
        setUser(null);
        setCurrentSong(null); // Stop music on logout
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
          plan: 'gratuit',
          joinedAt: profile.created_at || new Date().toISOString()
        });
      }

      const { data: userSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userSongs) {
        const formattedSongs: Song[] = userSongs.map(s => ({
          id: s.id,
          title: s.title,
          recipient: s.recipient,
          lyrics: s.lyrics,
          audioUrl: s.audio_url,
          style: s.style,
          createdAt: s.created_at,
          duration: s.duration,
          coverImage: s.cover_image,
          // Mapping des nouveaux champs (assurez-vous d'avoir fait la migration SQL si nécessaire)
          // Pour l'instant on map sur des champs existants ou on suppose qu'ils existent
          voiceInput: s.voice_input, // Nouveau champ DB
          voiceMode: s.voice_mode // Nouveau champ DB
        }));
        setSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  };

  const handleSongCreated = async (newSong: Song) => {
    if (!session?.user) return;

    // Attention: Il faut s'assurer que la table 'songs' a bien les colonnes 'voice_input' et 'voice_mode'
    // Si elles n'existent pas encore en base, Supabase ignorera ces champs si on ne les a pas créés.
    const { error } = await supabase.from('songs').insert({
      user_id: session.user.id,
      title: newSong.title,
      recipient: newSong.recipient,
      lyrics: newSong.lyrics,
      audio_url: newSong.audioUrl,
      style: newSong.style,
      duration: newSong.duration,
      cover_image: newSong.coverImage,
      created_at: newSong.createdAt,
      voice_input: newSong.voiceInput || null,
      voice_mode: newSong.voiceMode || null
    });

    if (error) console.error("Erreur sauvegarde chanson:", error);

    setSongs([newSong, ...songs]);
  };

  const deductCoins = (amount: number) => {
    if (!user || !session?.user) return false;
    
    if (user.coins >= amount) {
      const newBalance = user.coins - amount;
      setUser({ ...user, coins: newBalance });
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
    setCurrentSong(null);
  };

  // --- AUDIO PLAYER LOGIC ---
  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      // Optionnel : Ouvrir le lecteur en plein écran automatiquement au lancement d'une nouvelle musique
      // setIsPlayerExpanded(true); 
    }
  };

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case NavItem.HOME:
        return (
          <Home 
            user={user} 
            recentSongs={songs.slice(0, 5)} 
            goToCreate={() => setActiveTab(NavItem.CREATE)} 
            onPlay={handlePlaySong}
          />
        );
      case NavItem.CREATE:
        return (
          <Create 
            onSongCreated={handleSongCreated} 
            deductCoins={deductCoins} 
            onPlay={handlePlaySong}
          />
        );
      case NavItem.MY_MUSIC:
        return (
          <MyMusic 
            songs={songs} 
            onPlay={handlePlaySong}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
          />
        );
      case NavItem.COINS:
        return <CoinsPage user={user} />;
      case NavItem.PROFILE:
        return <Profile user={user} onLogout={handleLogout} onNavigate={setActiveTab} />;
      default:
        return null;
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

  if (loadingInitial) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-rose-500">Chargement...</div>;

  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return <Landing onStart={() => setShowAuth(true)} />;
  }

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
        <div className="flex-1 px-4 md:px-8 pt-6 max-w-7xl mx-auto w-full relative pb-32">
          {renderContent()}
        </div>
      </main>

      {/* Global Player Bar */}
      {currentSong && (
        <PlayerBar 
          song={currentSong} 
          isPlaying={isPlaying} 
          isExpanded={isPlayerExpanded}
          onToggleExpand={() => setIsPlayerExpanded(!isPlayerExpanded)}
          onTogglePlay={() => setIsPlaying(!isPlaying)} 
          onClose={() => {
            setIsPlaying(false);
            setCurrentSong(null);
            setIsPlayerExpanded(false);
          }}
        />
      )}
    </div>
  );
};

export default App;