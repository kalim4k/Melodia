import React from 'react';
import { Song } from '../types';
import { Play, Calendar, Heart, Download, MoreHorizontal, Music } from 'lucide-react';

interface MyMusicProps {
  songs: Song[];
}

const MyMusic: React.FC<MyMusicProps> = ({ songs }) => {
  return (
    <div className="pb-28">
      <h1 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Bibliothèque</h1>

      <div className="space-y-3">
        {songs.map((song) => (
          <div key={song.id} className="bg-white rounded-3xl p-3 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-200 shadow-inner">
              <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-lg truncate leading-tight">{song.title}</h3>
              <p className="text-slate-500 text-sm truncate">Pour <span className="text-rose-500 font-semibold">{song.recipient}</span></p>
            </div>

            <div className="flex items-center gap-1 pr-2">
               <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-rose-500 transition-colors">
                <Play size={20} fill="currentColor" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        ))}

        {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
               <Music size={40} />
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">C'est bien vide ici</h3>
            <p className="text-slate-400 max-w-xs mx-auto">Vos créations musicales apparaîtront ici une fois composées.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMusic;