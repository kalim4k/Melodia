import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';
import { Play, Pause, X, SkipForward, SkipBack, ChevronDown, Download, Music, Mic } from 'lucide-react';

interface PlayerBarProps {
  song: Song;
  isPlaying: boolean;
  isExpanded: boolean;
  onTogglePlay: () => void;
  onToggleExpand: () => void;
  onClose: () => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ 
  song, 
  isPlaying, 
  isExpanded,
  onTogglePlay, 
  onToggleExpand,
  onClose 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [durationStr, setDurationStr] = useState('0:00');
  
  // State pour gérer la séquence Dédicace -> Chanson
  const [playingDedication, setPlayingDedication] = useState(false);
  const hasDedication = song.voiceInput && song.voiceMode === 'dedication';

  const fallbackImage = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60";

  // Effet principal de lecture/pause
  useEffect(() => {
    if (!isPlaying) {
      // Pause tout
      audioRef.current?.pause();
      voiceRef.current?.pause();
      return;
    }

    // Si on doit jouer
    if (playingDedication && voiceRef.current) {
      voiceRef.current.play().catch(e => console.error("Erreur lecture voix", e));
    } else if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Erreur lecture musique", e));
    }
  }, [isPlaying, playingDedication]);

  // Initialisation lors du changement de chanson
  useEffect(() => {
    if (hasDedication) {
      // On commence par la dédicace si présente et si on lance la lecture
      setPlayingDedication(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        // Preload music
        audioRef.current.src = song.audioUrl || '';
        audioRef.current.load();
      }
    } else {
      setPlayingDedication(false);
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl || '';
        audioRef.current.load();
        if (isPlaying) audioRef.current.play().catch(() => {});
      }
    }
    
    // Reset visual
    setProgress(0);
    setCurrentTime('0:00');
  }, [song.id]);

  // Fin de la dédicace -> Lancer la musique
  const handleVoiceEnded = () => {
    setPlayingDedication(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    const activeAudio = playingDedication ? voiceRef.current : audioRef.current;
    
    if (activeAudio) {
      const current = activeAudio.currentTime;
      const duration = activeAudio.duration || 1;
      setProgress((current / duration) * 100);

      const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      setCurrentTime(formatTime(current));
      if (!isNaN(activeAudio.duration)) {
        setDurationStr(formatTime(activeAudio.duration));
      }
    }
  };

  const handleEnded = () => {
    onTogglePlay(); // Switch to pause state at end of song
    setProgress(0);
    // Reset sequence logic for next play
    if (hasDedication) setPlayingDedication(true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const activeAudio = playingDedication ? voiceRef.current : audioRef.current;
    
    if(activeAudio) {
       const rect = e.currentTarget.getBoundingClientRect();
       const x = e.clientX - rect.left;
       const percent = x / rect.width;
       activeAudio.currentTime = percent * (activeAudio.duration || 0);
    }
  };

  const lyricsLines = song.lyrics 
    ? song.lyrics.split('\n').filter(line => line.trim() !== '') 
    : ["Paroles instrumentales ou non disponibles"];

  return (
    <>
      <audio 
        ref={audioRef}
        onTimeUpdate={!playingDedication ? handleTimeUpdate : undefined}
        onEnded={handleEnded}
        onLoadedMetadata={!playingDedication ? handleTimeUpdate : undefined}
      />
      
      {hasDedication && (
        <audio
          ref={voiceRef}
          src={song.voiceInput}
          onEnded={handleVoiceEnded}
          onTimeUpdate={playingDedication ? handleTimeUpdate : undefined}
        />
      )}

      {/* FULL SCREEN PLAYER */}
      {isExpanded ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white animate-fade-in-up overflow-hidden">
          {/* Background Blur */}
          <div className="absolute inset-0 z-0">
             <img 
               src={song.coverImage || fallbackImage} 
               alt="Blur Background" 
               className="w-full h-full object-cover opacity-40 blur-3xl scale-125"
             />
             <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 mt-safe">
            <button 
              onClick={onToggleExpand} 
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronDown size={24} />
            </button>
            <div className="flex flex-col items-center">
               <span className="text-sm font-bold tracking-widest uppercase opacity-70">
                 {playingDedication ? 'Intro Dédicace' : 'En lecture'}
               </span>
               {playingDedication && <div className="text-xs text-rose-400 font-bold animate-pulse flex items-center gap-1"><Mic size={10} /> Voix de l'expéditeur</div>}
            </div>
            <button className="w-10 h-10 opacity-0 cursor-default"><ChevronDown size={24} /></button>
          </div>

          <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-8 md:gap-16 max-w-7xl mx-auto w-full">
            
            {/* Left Column: Cover & Controls */}
            <div className="flex flex-col items-center w-full md:w-1/2 max-w-md">
              <div className={`w-full aspect-square rounded-3xl shadow-2xl shadow-black/50 overflow-hidden mb-8 border border-white/10 relative group ${playingDedication ? 'ring-4 ring-rose-500 ring-opacity-50' : ''}`}>
                <img 
                   src={song.coverImage || fallbackImage} 
                   alt={song.title} 
                   className={`w-full h-full object-cover transition-transform duration-[20s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} 
                   onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                />
                {playingDedication && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Mic size={64} className="text-white animate-bounce" />
                  </div>
                )}
              </div>

              <div className="w-full text-center md:text-left mb-2">
                <h2 className="text-2xl md:text-3xl font-bold truncate leading-tight">{song.title}</h2>
                <p className="text-rose-400 font-medium text-lg">Pour {song.recipient}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full mt-6 mb-2">
                <div 
                  className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${playingDedication ? 'bg-rose-500' : 'bg-white group-hover:bg-rose-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>{currentTime}</span>
                  <span>{durationStr !== '0:00' ? durationStr : (playingDedication ? '-' : song.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between w-full mt-4 px-4">
                 <button className="text-slate-400 hover:text-white transition-colors"><SkipBack size={32} /></button>
                 <button 
                  onClick={onTogglePlay}
                  className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                 >
                   {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                 </button>
                 <button className="text-slate-400 hover:text-white transition-colors"><SkipForward size={32} /></button>
              </div>
              
              <div className="mt-8 flex gap-4">
                 <a 
                   href={song.audioUrl} 
                   download 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
                 >
                   <Download size={16} /> Télécharger
                 </a>
              </div>
            </div>

            {/* Right Column: Lyrics */}
            <div className="w-full md:w-1/2 h-[30vh] md:h-[60vh] bg-black/20 backdrop-blur-md rounded-3xl p-6 md:p-8 overflow-y-auto scrollbar-hide shadow-inner border border-white/5 mask-image-gradient">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 sticky top-0">Paroles</h3>
              <div className="space-y-6 text-center md:text-left">
                {lyricsLines.map((line, idx) => (
                  <p 
                    key={idx} 
                    className="text-lg md:text-2xl font-bold leading-relaxed text-white/80 hover:text-white transition-colors cursor-default animate-fade-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {line}
                  </p>
                ))}
                <div className="h-20"></div> {/* Spacer for scroll */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MINI PLAYER BAR */
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-24 md:right-8 z-50 animate-fade-in-up">
          <div 
            onClick={onToggleExpand}
            className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-3 md:p-4 shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-white/10 relative overflow-hidden cursor-pointer hover:bg-slate-900 transition-colors group"
          >
            
            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 pointer-events-none">
              <div 
                className={`h-full transition-all duration-300 ease-linear ${playingDedication ? 'bg-indigo-500' : 'bg-rose-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
              {/* Cover Art (Spinning if playing) */}
              <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <img 
                  src={song.coverImage || fallbackImage} 
                  alt={song.title} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                />
                <div className="absolute inset-0 bg-black/10 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                {playingDedication && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Mic size={20} className="text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-sm md:text-base truncate pr-4 group-hover:text-rose-300 transition-colors">
                  {playingDedication ? 'Intro Vocale...' : song.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">Pour {song.recipient}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 md:gap-6 mr-2" onClick={(e) => e.stopPropagation()}>
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
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="ml-2 p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <X size={18} />
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default PlayerBar;