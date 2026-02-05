import React from 'react';
import { Song, User } from '../types';
import { Play, Plus, ChevronRight, Music } from 'lucide-react';

interface HomeProps {
  user: User;
  recentSongs: Song[];
  goToCreate: () => void;
}

const Home: React.FC<HomeProps> = ({ user, recentSongs, goToCreate }) => {
  return (
    <div className="pb-28">
      {/* iOS Large Title Greeting */}
      <div className="mb-6">
        <span className="text-slate-500 font-medium text-sm uppercase tracking-wide">Aujourd'hui</span>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bonjour, {user.name}</h1>
      </div>

      {/* Featured Card (iOS Widget Style) */}
      <div 
        onClick={goToCreate}
        className="group relative w-full aspect-[4/3] md:aspect-[3/1] bg-white rounded-[2rem] shadow-ios overflow-hidden mb-10 cursor-pointer active:scale-[0.98] transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
        <img 
          src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=2000&auto=format&fit=crop" 
          alt="Love" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-700" 
        />
        
        <div className="absolute inset-0 flex flex-col justify-between p-8">
          <div className="flex justify-between items-start">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wide border border-white/10">
              Nouveau
            </span>
          </div>
          
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">La chanson <br/>parfaite pour elle.</h2>
            <div className="flex items-center gap-2 text-rose-100 font-medium">
              <span>Commencer la création</span>
              <div className="bg-white/20 rounded-full p-1">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Écoutés récemment</h2>
        <button className="text-rose-500 text-sm font-semibold active:opacity-50">Tout voir</button>
      </div>

      {/* Horizontal Scroll / Grid */}
      {recentSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[2rem] shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Music className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-medium mb-6 max-w-xs">Votre bibliothèque est vide. Créez votre premier chef-d'œuvre.</p>
          <button 
            onClick={goToCreate} 
            className="bg-slate-900 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-slate-900/20 active:scale-95 transition-transform"
          >
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentSongs.map((song) => (
            <div key={song.id} className="bg-white p-3 rounded-[1.5rem] shadow-ios active:scale-95 transition-all cursor-pointer">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-inner">
                <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                   <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
                      <Play size={20} className="ml-1 text-black" fill="currentColor" />
                   </div>
                </div>
              </div>
              <div className="px-1">
                <h3 className="font-bold text-slate-900 truncate leading-tight">{song.title}</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">Pour {song.recipient}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;