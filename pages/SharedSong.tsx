
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Song } from '../types';
import { Play, Pause, Heart, Download, Mic, Music, Film, Share2, Video, Loader2, X, Image as ImageIcon, Edit3 } from 'lucide-react';

interface SharedSongProps {
  songId: string;
  onGoHome: () => void;
}

const SharedSong: React.FC<SharedSongProps> = ({ songId, onGoHome }) => {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingDedication, setPlayingDedication] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  // Video Clip State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [senderImage, setSenderImage] = useState<string | null>(null);
  const [recipientImage, setRecipientImage] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('id', songId)
          .single();

        if (error || !data) throw new Error("Chanson introuvable");

        const formattedSong: Song = {
            id: data.id,
            title: data.title,
            recipient: data.recipient,
            lyrics: data.lyrics,
            audioUrl: data.audio_url,
            style: data.style,
            createdAt: data.created_at,
            duration: data.duration,
            coverImage: data.cover_image,
            voiceInput: data.voice_input, 
            voiceMode: data.voice_mode as any
        };

        setSong(formattedSong);
        if (formattedSong.voiceInput && formattedSong.voiceMode === 'dedication') {
            setPlayingDedication(true);
        }
      } catch (err) {
        setError("Cette chanson n'existe pas ou a été supprimée.");
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [songId]);

  const togglePlay = () => {
    const activeAudio = playingDedication ? voiceRef.current : audioRef.current;
    if (activeAudio) {
      if (isPlaying) {
        activeAudio.pause();
        if(playingDedication && audioRef.current) audioRef.current.pause();
      } else {
        activeAudio.play().catch(e => console.error(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const activeAudio = playingDedication ? voiceRef.current : audioRef.current;
    if (activeAudio) {
      const current = activeAudio.currentTime;
      const dur = activeAudio.duration || 1;
      setProgress((current / dur) * 100);
      
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      
      if (!isNaN(activeAudio.duration)) {
        const dMins = Math.floor(activeAudio.duration / 60);
        const dSecs = Math.floor(activeAudio.duration % 60);
        setDuration(`${dMins}:${dSecs.toString().padStart(2, '0')}`);
      }
    }
  };

  const handleVoiceEnded = () => {
    setPlayingDedication(false);
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
    // Reset sequence
    if (song?.voiceInput && song.voiceMode === 'dedication') {
        setPlayingDedication(true);
    }
  };

  // --- VIDEO CLIP LOGIC ---
  const handleClipImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'sender' | 'recipient') => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'sender') setSenderImage(reader.result as string);
            else setRecipientImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const generateVideoClip = () => {
      if (!senderImage || !recipientImage) {
          alert("Veuillez ajouter les deux photos pour générer le clip.");
          return;
      }
      
      setGeneratingVideo(true);
      setVideoProgress(0);

      // Simulation de chargement de 20s
      let progress = 0;
      const interval = setInterval(() => {
          progress += 5; // 5% toutes les secondes (environ 20s total)
          setVideoProgress(Math.min(progress, 99));
          
          if (progress >= 100) {
              clearInterval(interval);
              setVideoUrl("https://celinaroom.com/wp-content/uploads/2026/02/video_2026-02-11_21-02-27.mp4");
              setGeneratingVideo(false);
              setShowVideoModal(false);
              setIsPlaying(false); // Stop audio player if active
          }
      }, 1000);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-rose-500 font-bold">Chargement de la mélodie...</div>;
  if (error || !song) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold px-4 text-center">{error}</div>;

  const fallbackImage = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 relative">
        
        {/* MODAL VIDEO */}
        {(showVideoModal || generatingVideo) && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl animate-fade-in-up">
                    
                    {generatingVideo ? (
                        <div className="py-10 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <Loader2 className="text-rose-500 animate-spin" size={40} />
                                <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Création du clip...</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                {videoProgress < 30 ? "Analyse des photos" : videoProgress < 70 ? "Synchronisation audio" : "Finalisation du montage"}
                            </p>
                            
                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
                                <div 
                                    className="h-full bg-rose-500 transition-all duration-300 ease-linear"
                                    style={{ width: `${videoProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={() => setShowVideoModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Générer le clip 🎬</h2>
                            <p className="text-slate-500 mb-6 text-sm">Ajoutez vos photos pour créer un clip vidéo unique synchronisé avec votre chanson.</p>

                            <div className="flex gap-4 mb-8">
                                {/* Sender Image */}
                                <div className="flex-1">
                                    <label className="block aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer relative overflow-hidden group">
                                        {senderImage ? (
                                            <img src={senderImage} alt="Moi" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <ImageIcon size={24} className="mb-2" />
                                                <span className="text-xs font-bold">Ma photo</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleClipImageUpload(e, 'sender')} />
                                        {senderImage && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="text-white" />
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* Recipient Image */}
                                <div className="flex-1">
                                    <label className="block aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer relative overflow-hidden group">
                                        {recipientImage ? (
                                            <img src={recipientImage} alt="Destinataire" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <ImageIcon size={24} className="mb-2" />
                                                <span className="text-xs font-bold">Sa photo</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleClipImageUpload(e, 'recipient')} />
                                        {recipientImage && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="text-white" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button 
                                onClick={generateVideoClip}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <Film size={20} />
                                Lancer la création (Gratuit)
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* Header simple */}
        <div className="mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Melodia</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-ios overflow-hidden relative">
            <div className="text-center mb-6">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Une chanson pour</p>
                <h1 className="text-3xl font-bold text-slate-900">{song.recipient}</h1>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl shadow-slate-200 mb-6">
                
                {/* SI VIDEO GENEREE */}
                {videoUrl ? (
                    <div className="w-full bg-black rounded-xl mb-6 overflow-hidden relative shadow-lg flex justify-center">
                        <video 
                            key={videoUrl}
                            controls
                            playsInline
                            autoPlay
                            className="w-full h-auto max-h-[75vh] object-contain"
                            src={videoUrl}
                        >
                             Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                    </div>
                ) : (
                    // SINON AUDIO
                    <>
                        <audio 
                            ref={audioRef}
                            src={song.audioUrl}
                            onTimeUpdate={!playingDedication ? handleTimeUpdate : undefined}
                            onEnded={handleAudioEnded}
                            onLoadedMetadata={!playingDedication ? handleTimeUpdate : undefined}
                        />
                        {song.voiceInput && song.voiceMode === 'dedication' && (
                            <audio 
                                ref={voiceRef}
                                src={song.voiceInput}
                                onEnded={handleVoiceEnded}
                                onTimeUpdate={playingDedication ? handleTimeUpdate : undefined}
                            />
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10 relative">
                                <img 
                                    src={song.coverImage || fallbackImage} 
                                    alt="Cover" 
                                    className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`} 
                                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                                />
                                {playingDedication && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Mic size={24} className="text-white animate-bounce" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-xl truncate leading-tight">
                                    {playingDedication ? 'Intro Vocale...' : song.title}
                               </h2>
                                <p className="text-rose-400 text-sm font-medium">{song.style}</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400 font-medium">
                            <span>{currentTime}</span>
                            <span>{playingDedication ? '-' : (duration !== '0:00' ? duration : song.duration)}</span>
                        </div>
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-8 cursor-pointer" onClick={(e) => {
                            const activeAudio = playingDedication ? voiceRef.current : audioRef.current;
                            if(activeAudio) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                activeAudio.currentTime = percent * (activeAudio.duration || 0);
                            }
                        }}>
                            <div 
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${playingDedication ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </>
                )}

                <div className="flex items-center justify-between gap-4">
                     {/* BOUTON CLIP */}
                     {!videoUrl && (
                        <button 
                            onClick={() => setShowVideoModal(true)}
                            className="h-12 px-5 rounded-full bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-xs shadow-sm border border-indigo-500/30"
                        >
                            <Film size={18} />
                            Générer un clip
                        </button>
                     )}

                     {/* PLAY/PAUSE */}
                     {!videoUrl && (
                         <button 
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20 mx-auto"
                        >
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>
                     )}
                     
                     {/* DOWNLOAD */}
                     <a 
                        href={videoUrl || song.audioUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-auto"
                     >
                        <Download size={20} />
                     </a>
                </div>
            </div>

            {/* Lyrics Preview */}
            <div className="bg-slate-50 rounded-[2rem] p-6 mb-6 max-h-60 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Paroles</h3>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed font-medium text-sm">
                    {song.lyrics}
                </p>
            </div>

            {/* CTA */}
            <button 
                onClick={onGoHome}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Music size={20} />
                Créer ma chanson aussi
            </button>
        </div>
        
        <p className="mt-8 text-slate-400 text-sm font-medium">Melodia © 2024</p>
    </div>
  );
};

export default SharedSong;
