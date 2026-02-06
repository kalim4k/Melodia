import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import { Play, Pause, X, SkipForward, SkipBack, Volume2 } from 'lucide-react';

interface PlayerBarProps {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ song, isPlaying, onTogglePlay, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Erreur de lecture auto:", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, song]);

  // Reset audio when song changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl || '';
      audioRef.current.load();
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [song.id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleEnded = () => {
    onTogglePlay(); // Switch to pause state
    setProgress(0);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-24 md:right-8 z-50 animate-fade-in-up">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-3 md:p-4 shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-white/10 relative overflow-hidden">
        
        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-rose-500 transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Audio Element (Hidden) */}
        <audio 
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Cover Art (Spinning if playing) */}
          <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
             <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/10 ring-1 ring-inset ring-white/10 rounded-xl"></div>
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-sm md:text-base truncate pr-4">{song.title}</h4>
            <p className="text-xs text-slate-400 truncate">Pour {song.recipient}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 md:gap-6 mr-2">
           <button className="hidden md:block text-slate-400 hover:text-white transition-colors">
              <SkipBack size={20} />
           </button>

           <button 
            onClick={onTogglePlay}
            className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
           >
             {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
           </button>

           <button className="hidden md:block text-slate-400 hover:text-white transition-colors">
              <SkipForward size={20} />
           </button>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="ml-2 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X size={18} />
        </button>

      </div>
    </div>
  );
};

export default PlayerBar;