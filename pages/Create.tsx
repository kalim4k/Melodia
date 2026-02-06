import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GenerationParams, Song } from '../types';
import { generateLyrics } from '../services/geminiService';
import { generateSunoMusic } from '../services/sunoService';
import { Wand2, Play, Pause, ChevronRight, ChevronLeft, Music, Edit3, Check, Loader2, Download, Image as ImageIcon, Upload, X, Mic, StopCircle, Trash2, Info } from 'lucide-react';

interface CreateProps {
  onSongCreated: (song: Song) => void;
  deductCoins: (amount: number) => boolean;
  onPlay?: (song: Song) => void;
}

type WizardStep = 'names' | 'style' | 'content' | 'lyrics-review' | 'final-result';

const Create: React.FC<CreateProps> = ({ onSongCreated, deductCoins, onPlay }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('names');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
  const [generatedLyricsData, setGeneratedLyricsData] = useState<{ title: string; lyrics: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // État local pour stocker le fichier brut avant l'upload
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // Pour préécoute locale
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Audio Player State for Result View
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  const [formData, setFormData] = useState<GenerationParams>({
    sender: '',
    recipient: '',
    vibe: 'romantique',
    musicStyle: 'pop',
    voice: 'female',
    details: '',
    customCover: null,
    voiceInput: null,
    voiceInputBlob: null,
    voiceMode: 'dedication' // Default
  });

  const vibes = [
    { id: 'romantique', label: 'Romantique', emoji: '🌹' },
    { id: 'passionne', label: 'Passionné', emoji: '🔥' },
    { id: 'poetique', label: 'Poétique', emoji: '📜' },
    { id: 'drole', label: 'Drôle', emoji: '😄' },
  ];

  const musicStyles = [
    { id: 'pop', label: 'Pop' },
    { id: 'rnb', label: 'RnB / Soul' },
    { id: 'afro', label: 'Afro Love' },
    { id: 'zouk', label: 'Zouk' },
    { id: 'lofi', label: 'Lo-Fi' },
    { id: 'bossa', label: 'Bossa Nova' },
    { id: 'acoustique', label: 'Acoustique' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'rap', label: 'Rap' },
    { id: 'slam', label: 'Slam' },
  ];

  // Gestion de l'upload d'image (Preview + Stockage File)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image est trop volumineuse (max 5MB)");
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
         setFormData({...formData, customCover: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomCover = () => {
    setFormData({...formData, customCover: null});
    setCoverFile(null);
  };

  // --- AUDIO RECORDING LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFormData(prev => ({ ...prev, voiceInputBlob: audioBlob }));
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 14) stopRecording(); // Max 15s
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Erreur micro:", err);
      setError("Impossible d'accéder au micro. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setFormData(prev => ({ ...prev, voiceInputBlob: null }));
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
  };

  const togglePreview = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
      audioPlayerRef.current.onended = () => setIsPlayingPreview(false);
    }
  };

  // Upload helpers
  const uploadFileToSupabase = async (file: Blob, bucket: string, ext: string = 'mp3'): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error(`Erreur upload ${bucket}:`, err);
      return null;
    }
  };

  // Player Logic
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setProgress((current / dur) * 100);
      
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      
      if (!isNaN(audioRef.current.duration)) {
        const dMins = Math.floor(audioRef.current.duration / 60);
        const dSecs = Math.floor(audioRef.current.duration % 60);
        setDuration(`${dMins}:${dSecs.toString().padStart(2, '0')}`);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
  };

  // Navigation
  const nextStep = () => {
    setError(null);
    if (currentStep === 'names') {
      if (!formData.sender || !formData.recipient) {
        setError("Veuillez remplir les deux champs.");
        return;
      }
      setCurrentStep('style');
    } else if (currentStep === 'style') {
      setCurrentStep('content');
    } else if (currentStep === 'content') {
      if (!formData.details) {
        setError("Un petit détail est nécessaire pour l'IA.");
        return;
      }
      handleGenerateLyrics();
    }
  };

  const prevStep = () => {
    setError(null);
    if (currentStep === 'style') setCurrentStep('names');
    if (currentStep === 'content') setCurrentStep('style');
    if (currentStep === 'lyrics-review') setCurrentStep('content');
  };

  const handleGenerateLyrics = async () => {
    setLoading(true);
    setLoadingText('Écriture des paroles...');
    try {
      const result = await generateLyrics(formData);
      setGeneratedLyricsData(result);
      setCurrentStep('lyrics-review');
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSong = async () => {
    if (!generatedLyricsData) return;
    if (!deductCoins(10)) {
      setError("Solde insuffisant (10 pièces requises).");
      return;
    }
    setLoading(true);
    setLoadingText('Composition musicale par IA (1-2 min)...');
    
    try {
      // 1. Upload des fichiers (Cover et Audio)
      let finalCover = null;
      let finalVoiceUrl = null;

      if (coverFile) {
        finalCover = await uploadFileToSupabase(coverFile, 'covers', coverFile.name.split('.').pop());
      }

      if (formData.voiceInputBlob) {
        setLoadingText('Sauvegarde de votre voix...');
        finalVoiceUrl = await uploadFileToSupabase(formData.voiceInputBlob, 'audio-inputs', 'mp3');
      }

      setLoadingText('Composition musicale par IA (1-2 min)...');

      // 2. Lancer la génération musicale
      const sunoResult = await generateSunoMusic({
        lyrics: generatedLyricsData.lyrics,
        style: `${formData.vibe} ${formData.musicStyle}`,
        title: generatedLyricsData.title,
        voice: formData.voice
        // Note: On pourrait passer l'audio ici pour l'inspiration, mais l'API est stricte.
        // On stocke l'URL dans l'objet Song pour l'usage "Dédicace".
      });

      // Si pas de cover custom, on prend celle de Suno
      if (!finalCover) finalCover = sunoResult.coverImage;

      const newSong: Song = {
        id: Date.now().toString(),
        title: sunoResult.title || generatedLyricsData.title,
        lyrics: generatedLyricsData.lyrics,
        recipient: formData.recipient,
        style: `${formData.vibe} • ${formData.musicStyle}`,
        audioUrl: sunoResult.audioUrl,
        createdAt: new Date().toISOString(),
        duration: sunoResult.duration,
        coverImage: finalCover || 'https://picsum.photos/400/400',
        voiceInput: finalVoiceUrl || undefined,
        voiceMode: formData.voiceMode
      };

      setGeneratedSong(newSong);
      onSongCreated(newSong); 
      setCurrentStep('final-result');
      
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la génération musicale. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Components
  const ProgressBar = () => {
    const steps = ['names', 'style', 'content', 'lyrics-review'];
    const currentIdx = steps.indexOf(currentStep);
    return (
      <div className="flex gap-2 mb-8 px-1">
        {steps.map((s, idx) => (
          <div 
            key={s} 
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              idx <= currentIdx ? 'bg-rose-500' : 'bg-slate-200'
            }`} 
          />
        ))}
      </div>
    );
  };

  // Loading View
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 animate-fade-in">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin flex items-center justify-center">
             <Music className="text-rose-500 animate-pulse" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{loadingText}</h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">L'IA compose la mélodie, les instruments et la voix. C'est magique, mais ça prend un peu de temps !</p>
      </div>
    );
  }

  // Final Result View
  if (currentStep === 'final-result' && generatedSong) {
    const fallbackImage = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60";
    
    return (
      <div className="pb-32 animate-fade-in">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-ios mb-6 overflow-hidden relative">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">C'est prêt ! 🎵</h2>
            <p className="text-slate-500">Voici votre création pour {generatedSong.recipient}</p>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl shadow-slate-200">
            <audio 
              ref={audioRef}
              src={generatedSong.audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              onLoadedMetadata={handleTimeUpdate}
            />

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10">
                <img 
                  src={generatedSong.coverImage || fallbackImage} 
                  alt="Cover" 
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImage;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate leading-tight">{generatedSong.title}</h3>
                <p className="text-rose-400 text-sm font-medium">{generatedSong.style}</p>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>{currentTime}</span>
              <span>{duration !== '0:00' ? duration : generatedSong.duration}</span>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-6 cursor-pointer" onClick={(e) => {
               if(audioRef.current) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const percent = x / rect.width;
                 audioRef.current.currentTime = percent * (audioRef.current.duration || 0);
               }
            }}>
              <div 
                className="absolute top-0 left-0 h-full bg-rose-500 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <a 
                href={generatedSong.audioUrl} 
                download
                target="_blank"
                rel="noreferrer"
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Télécharger"
              >
                <Download size={20} />
              </a>

              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>

              <button 
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={() => {
                  setGeneratedSong(null);
                  setCurrentStep('names');
                  setFormData({...formData, recipient: '', details: '', customCover: null, voiceInputBlob: null});
                  setCoverFile(null);
                  setAudioUrl(null);
                  setIsPlaying(false);
                }}
                title="Recommencer"
              >
                <Wand2 size={20} />
              </button>
            </div>
          </div>

        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-ios">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Paroles</h3>
          <p className="whitespace-pre-line text-slate-600 leading-relaxed font-medium">
            {generatedSong.lyrics}
          </p>
        </div>
        
        <div className="fixed bottom-24 left-0 right-0 px-6 md:pl-72 flex justify-center z-20 pointer-events-none">
           <button 
            onClick={() => {
              setGeneratedSong(null);
              setCurrentStep('names');
              setFormData({...formData, recipient: '', details: '', customCover: null, voiceInputBlob: null});
              setCoverFile(null);
              setAudioUrl(null);
              setIsPlaying(false);
            }}
            className="pointer-events-auto bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
          >
            Créer une autre chanson
          </button>
        </div>
      </div>
    );
  }

  // Wizard Steps
  return (
    <div className="max-w-xl mx-auto pb-32">
      <div className="text-center mb-8 pt-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Création</h1>
        {currentStep !== 'lyrics-review' && <ProgressBar />}
      </div>

      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-ios min-h-[400px] flex flex-col relative overflow-hidden">
        
        {/* STEP 1: Names */}
        {currentStep === 'names' && (
          <div className="flex-1 space-y-8 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 pl-1">De la part de</label>
              <input
                type="text"
                value={formData.sender}
                onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                placeholder="Votre prénom"
                className="w-full bg-slate-50 text-xl font-semibold text-slate-900 px-6 py-5 rounded-3xl focus:outline-none focus:ring-0 focus:bg-slate-100 transition-colors placeholder:text-slate-300"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 pl-1">Pour</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="Son prénom"
                className="w-full bg-slate-50 text-xl font-semibold text-slate-900 px-6 py-5 rounded-3xl focus:outline-none focus:ring-0 focus:bg-slate-100 transition-colors placeholder:text-slate-300"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Style */}
        {currentStep === 'style' && (
          <div className="flex-1 space-y-8 animate-fade-in">
            {/* Styles Musicaux */}
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Style Musical</label>
              <div className="flex flex-wrap gap-2">
                {musicStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({ ...formData, musicStyle: s.id as any })}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 border ${
                      formData.musicStyle === s.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiance */}
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Ambiance</label>
              <div className="grid grid-cols-2 gap-4">
                {vibes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setFormData({ ...formData, vibe: v.id as any })}
                    className={`relative p-4 rounded-3xl border-2 text-left transition-all active:scale-95 duration-200 ${
                      formData.vibe === v.id
                        ? 'bg-rose-50 border-rose-500 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-3xl mb-2">{v.emoji}</div>
                    <div className={`font-bold ${formData.vibe === v.id ? 'text-rose-600' : 'text-slate-700'}`}>{v.label}</div>
                    {formData.vibe === v.id && (
                      <div className="absolute top-4 right-4 text-rose-500"><Check size={20} /></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pochette Personnalisée */}
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Pochette (Optionnel)</label>
              {formData.customCover ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-md group">
                  <img src={formData.customCover} alt="Cover" className="w-full h-full object-cover" />
                  <button 
                    onClick={removeCustomCover}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:bg-white transition-colors">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-700">Ajouter une photo</span>
                    <span className="text-xs text-slate-400">Pour remplacer l'image IA</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>

          </div>
        )}

        {/* STEP 3: Content (Lyrics + Voice) */}
        {currentStep === 'content' && (
          <div className="flex-1 space-y-8 animate-fade-in">
             <div>
               <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Voix Chantée</label>
               <div className="bg-slate-100 p-1 rounded-full flex relative">
                  <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-spring ${
                      formData.voice === 'male' ? 'translate-x-[100%] translate-x-2' : 'left-1'
                    }`}
                  ></div>
                  
                 <button 
                  onClick={() => setFormData({...formData, voice: 'female'})}
                  className={`flex-1 relative z-10 py-3 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    formData.voice === 'female' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                 >
                   <span>👩 FEMME</span>
                 </button>
                 <button 
                  onClick={() => setFormData({...formData, voice: 'male'})}
                  className={`flex-1 relative z-10 py-3 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    formData.voice === 'male' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                 >
                   <span>👨 HOMME</span>
                 </button>
               </div>
             </div>

             {/* VOICE RECORDER SECTION */}
             <div className="border border-slate-100 rounded-3xl p-5 bg-slate-50">
               <div className="flex items-center justify-between mb-4">
                 <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Ajouter votre voix</label>
                 <span className="text-xs font-bold bg-white text-rose-500 px-2 py-1 rounded-lg border border-rose-100">Optionnel</span>
               </div>
               
               {/* Mode Selection Toggle */}
               <div className="flex gap-2 mb-4">
                 <button
                   onClick={() => setFormData({...formData, voiceMode: 'dedication'})}
                   className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                     formData.voiceMode === 'dedication' 
                     ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                     : 'bg-white text-slate-500 border-slate-200'
                   }`}
                 >
                   Intro Dédicace
                 </button>
                 <button
                   onClick={() => setFormData({...formData, voiceMode: 'inspiration'})}
                   className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                     formData.voiceMode === 'inspiration' 
                     ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' 
                     : 'bg-white text-slate-500 border-slate-200'
                   }`}
                 >
                   Fredonner l'air
                 </button>
               </div>

               {/* Description text */}
               <div className="flex gap-2 text-xs text-slate-500 mb-4 bg-white/50 p-3 rounded-xl">
                 <Info size={14} className="flex-shrink-0 mt-0.5" />
                 {formData.voiceMode === 'dedication' ? (
                   <p>Enregistrez un message (ex: "Je t'aime Marie") qui sera joué <span className="font-bold">avant</span> le début de la musique.</p>
                 ) : (
                   <p>Fredonnez une mélodie pendant 10s. L'IA s'en inspirera pour créer la musique (Expérimental).</p>
                 )}
               </div>

               {/* Recorder UI */}
               {!audioUrl ? (
                 <div className="flex flex-col items-center justify-center py-4">
                   {isRecording ? (
                     <div className="flex flex-col items-center">
                       <div className="text-rose-500 font-mono text-2xl font-bold mb-4 animate-pulse">
                         00:{recordingTime.toString().padStart(2, '0')}
                       </div>
                       <button 
                         onClick={stopRecording}
                         className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse hover:scale-105 transition-transform"
                       >
                         <StopCircle size={32} />
                       </button>
                       <span className="text-xs text-slate-400 mt-3">Appuyez pour arrêter</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center w-full">
                       <button 
                         onClick={startRecording}
                         className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform group"
                       >
                         <Mic size={28} className="group-hover:text-rose-300 transition-colors" />
                       </button>
                       <span className="text-xs text-slate-400 mt-3">Appuyez pour enregistrer (max 15s)</span>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-slate-100">
                   <button 
                     onClick={togglePreview}
                     className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors flex-shrink-0"
                   >
                     {isPlayingPreview ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                   </button>
                   <div className="flex-1 min-w-0">
                     <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full bg-rose-500 ${isPlayingPreview ? 'animate-progress' : 'w-full'}`}></div>
                     </div>
                     <p className="text-xs text-slate-400 mt-1 font-medium">Enregistrement prêt</p>
                   </div>
                   <button 
                     onClick={deleteRecording}
                     className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                     title="Supprimer"
                   >
                     <Trash2 size={18} />
                   </button>
                   <audio ref={audioPlayerRef} className="hidden" />
                 </div>
               )}
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 pl-1">Détails de l'histoire</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Racontez-nous... (ex: Rencontre au ski, elle aime le chocolat, on se marie en juin...)"
                  className="w-full h-32 bg-slate-50 p-5 rounded-3xl focus:outline-none focus:ring-0 focus:bg-slate-100 transition-colors placeholder:text-slate-400 text-slate-800 text-lg leading-relaxed resize-none"
                />
             </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {currentStep === 'lyrics-review' && generatedLyricsData && (
          <div className="flex-1 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900">Les Paroles</h2>
              <span className="text-rose-500 text-sm font-bold bg-rose-50 px-3 py-1 rounded-full">Éditable</span>
            </div>
            
            <input 
              type="text" 
              value={generatedLyricsData.title}
              onChange={(e) => setGeneratedLyricsData({...generatedLyricsData, title: e.target.value})}
              className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-900 placeholder:text-slate-300 mb-2"
              placeholder="Titre de la chanson"
            />
            <div className="relative">
              <textarea 
                value={generatedLyricsData.lyrics}
                onChange={(e) => setGeneratedLyricsData({...generatedLyricsData, lyrics: e.target.value})}
                className="w-full h-80 bg-slate-50 p-6 rounded-[2rem] border-none focus:ring-0 text-slate-600 font-medium leading-relaxed text-lg resize-none"
              />
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur rounded-full p-2 shadow-sm text-slate-400">
                <Edit3 size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-2xl text-center font-semibold shadow-lg animate-bounce z-50">
            {error}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 pt-4 flex items-center justify-between gap-4">
          {currentStep !== 'names' ? (
            <button 
              onClick={prevStep}
              className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
          ) : <div></div>}
          
          {currentStep === 'content' ? (
            <button
              onClick={nextStep}
              className="bg-rose-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-rose-500/30 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Wand2 size={20} />
              Générer
            </button>
          ) : currentStep === 'lyrics-review' ? (
            <button
              onClick={handleFinalizeSong}
              className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-slate-900/30 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Music size={20} />
              Créer (10 <span className="text-yellow-400">●</span>)
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="bg-rose-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-95 transition-transform"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;