import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Create from './pages/Create';
import MyMusic from './pages/MyMusic';
import CoinsPage from './pages/Coins';
import Profile from './pages/Profile';
import BackgroundAnimation from './components/BackgroundAnimation';
import { NavItem, Song, User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.HOME);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Mock Data
  const [user, setUser] = useState<User>({
    name: 'Valentin',
    coins: 100,
    avatar: 'https://picsum.photos/seed/user123/200/200'
  });
  
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSongCreated = (newSong: Song) => {
    setSongs([newSong, ...songs]);
  };

  const deductCoins = (amount: number) => {
    if (user.coins >= amount) {
      setUser({ ...user, coins: user.coins - amount });
      return true;
    }
    return false;
  };

  const renderContent = () => {
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
        return <Profile user={user} />;
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

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      <BackgroundAnimation />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all z-10 ${!isMobile ? 'ml-64' : ''}`}>
        <Header user={user} title={getPageTitle()} />
        <div className="flex-1 px-4 md:px-8 pt-6 max-w-7xl mx-auto w-full relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;