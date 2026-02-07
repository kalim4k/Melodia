import React, { useState } from 'react';
import { Song } from '../types';
import { Play, Pause, Music, Download, Share2 } from 'lucide-react';

interface MyMusicProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  currentSongId?: string;
  isPlaying?: boolean;
}

const MyMusic: React.FC<MyMusicProps> = ({ songs, onPlay, currentSongId, isPlaying }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?share=${songId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(songId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="pb-28 animate-fade-in w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight pt-4">Bibliothèque</h1>

      <div className="space-y-3">
        {songs.map((song) => {
          const isCurrent = currentSongId === song.id;
          const isActivePlaying = isCurrent && isPlaying;

          return (
            <div 
              key={song.id} 
              className={`group rounded-3xl p-3 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-all ${
                isCurrent ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-white hover:shadow-md'
              }`}
            >
              {/* Zone cliquable pour la lecture */}
              <div 
                className="flex flex-1 items-center gap-4 cursor-pointer min-w-0"
                onClick={() => onPlay(song)}
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-200 shadow-inner">
                  <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                  
                  {/* Overlay si la chanson est en cours */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-3 bar-1 bg-white h-3 animate-bounce mx-[1px]"></div>
                      <div className="w-3 bar-2 bg-white h-5 animate-bounce mx-[1px] delay-75"></div>
                      <div className="w-3 bar-3 bg-white h-2 animate-bounce mx-[1px] delay-150"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg truncate leading-tight ${isCurrent ? 'text-rose-600' : 'text-slate-900'}`}>
                    {song.title}
                  </h3>
                  <p className="text-slate-500 text-sm truncate">Pour <span className="text-rose-500 font-semibold">{song.recipient}</span></p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center gap-1 pr-2">
                 <button 
                  onClick={(e) => handleShare(e, song.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors relative"
                  title="Copier le lien de partage"
                >
                  <Share2 size={20} />
                  {copiedId === song.id && (
                     <span className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">Copié !</span>
                  )}
                </button>

                <a 
                  href={song.audioUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  title="Télécharger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={20} />
                </a>

                 <button 
                  onClick={() => onPlay(song)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    isCurrent ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-rose-500'
                  }`}
                >
                  {isActivePlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
              </div>
            </div>
          );
        })}

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