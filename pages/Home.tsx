import React from 'react';
import { Song, User } from '../types';
import { Play, Plus, ChevronRight, Music, Sparkles, ArrowRight } from 'lucide-react';

interface HomeProps {
  user: User;
  recentSongs: Song[];
  goToCreate: () => void;
  onPlay: (song: Song) => void;
}

const Home: React.FC<HomeProps> = ({ user, recentSongs, goToCreate, onPlay }) => {
  return (
    <div className="pb-32 animate-fade-in w-full max-w-4xl mx-auto">
      
      {/* Header Section style "Editorial Premium" */}
      <div className="mb-8 pt-4 md:pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Bonjour, <br/>
            <span className="text-slate-400 font-medium">{user.name.split(' ')[0]}</span>
          </h1>
          <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div 
        onClick={goToCreate}
        className="group relative w-full aspect-[4/3] md:aspect-[2.8/1] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 cursor-pointer transition-all duration-500 hover:shadow-slate-300 mb-10"
      >
        <img 
          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2000&auto=format&fit=crop" 
          alt="Create" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.7]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
              <Sparkles size={12} className="text-white" />
              <span>Studio IA</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 leading-[1.1] tracking-tight">
              Créez une émotion <br/>
              <span className="text-white/60 font-normal">inoubliable.</span>
            </h2>
            
            <button className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs md:text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-lg shadow-black/20 group-hover:scale-105 active:scale-95">
              <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                <Plus size={12} strokeWidth={3} />
              </div>
              <span>Composer maintenant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Songs Section */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Bibliothèque
          </h2>
          {recentSongs.length > 0 && (
            <button className="text-slate-400 hover:text-slate-900 text-xs font-semibold transition-colors uppercase tracking-wider">
              Tout voir
            </button>
          )}
        </div>

        {recentSongs.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300">
              <Music size={22} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Aucune création récente</p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
            {recentSongs.map((song) => (
              <div 
                key={song.id} 
                className="group relative flex-none w-40 snap-start cursor-pointer"
                onClick={() => onPlay(song)} // Activation du lecteur au clic
              >
                <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-3 shadow-lg shadow-slate-100 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 bg-slate-100">
                  <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play size={18} className="ml-1 text-slate-900" fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 px-1">
                  <h3 className="font-bold text-slate-900 truncate text-sm leading-tight">
                    {song.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wide">
                    Pour {song.recipient}
                  </p>
                </div>
              </div>
            ))}
            
             <div 
                onClick={goToCreate}
                className="flex-none w-40 aspect-square rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer snap-start group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 group-hover:border-slate-300 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <span className="font-semibold text-[10px] uppercase tracking-wide">Créer</span>
             </div>
          </div>
        )}
      </div>

      <div className="mt-8">
         <button 
           onClick={goToCreate}
           className="w-full bg-slate-900 rounded-[2rem] p-4 flex items-center justify-between shadow-lg shadow-slate-200 group active:scale-[0.98] transition-all hover:bg-black"
         >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-base">Prêt à commencer ?</h3>
                <p className="text-slate-400 text-xs font-medium">Créez votre chanson.</p>
              </div>
            </div>
            
            <div className="bg-white text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
               <ArrowRight size={18} />
            </div>
         </button>
      </div>
    </div>
  );
};

export default Home;