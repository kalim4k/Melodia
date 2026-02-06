import React, { useState } from 'react';
import { GenerationParams, Song } from '../types';
import { generateLyrics } from '../services/geminiService';
import { generateSunoMusic } from '../services/sunoService';
import { Wand2, Play, ChevronRight, ChevronLeft, Music, Edit3, Check, Loader2 } from 'lucide-react';

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

  const [formData, setFormData] = useState<GenerationParams>({
    sender: '',
    recipient: '',
    vibe: 'romantique',
    musicStyle: 'pop',
    voice: 'female',
    details: ''
  });

  const vibes = [
    { id: 'romantique', label: 'Romantique', emoji: '🌹' },
    { id: 'passionne', label: 'Passionné', emoji: '🔥' },
    { id: 'poetique', label: 'Poétique', emoji: '📜' },
    { id: 'drole', label: 'Drôle', emoji: '😄' },
  ];

  const musicStyles = [
    { id: 'pop', label: 'Pop' },
    { id: 'acoustique', label: 'Acoustique' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'slam', label: 'Slam' },
    { id: 'rap', label: 'Rap' },
  ];

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
      // Utilisation du service Suno
      const sunoResult = await generateSunoMusic({
        lyrics: generatedLyricsData.lyrics,
        style: `${formData.vibe} ${formData.musicStyle}`,
        title: generatedLyricsData.title,
        voice: formData.voice
      });

      const newSong: Song = {
        id: Date.now().toString(),
        title: sunoResult.title || generatedLyricsData.title,
        lyrics: generatedLyricsData.lyrics,
        recipient: formData.recipient,
        style: `${formData.vibe} • ${formData.musicStyle}`,
        audioUrl: sunoResult.audioUrl,
        createdAt: new Date().toISOString(),
        duration: sunoResult.duration,
        coverImage: sunoResult.coverImage
      };

      setGeneratedSong(newSong);
      onSongCreated(newSong); // Ceci déclenchera la lecture auto dans App.tsx si configuré
      setCurrentStep('final-result');
      
      // Sécurité : si onPlay est passé, on lance la lecture explicite
      if (onPlay) onPlay(newSong);
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
    return (
      <div className="pb-32 animate-fade-in">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-ios text-center mb-6">
          <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-rose-200 mb-8">
            <img src={generatedSong.coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{generatedSong.title}</h2>
          <p className="text-rose-500 font-medium mb-8">Pour {generatedSong.recipient}</p>

          <div className="flex items-center justify-center gap-6">
             {/* Note: La lecture se fait via la PlayerBar globale maintenant */}
             <button 
                onClick={() => onPlay && onPlay(generatedSong)}
                className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/40 active:scale-95 transition-all hover:bg-rose-600 animate-pulse"
              >
                <Play size={32} fill="currentColor" className="ml-1" />
              </button>
          </div>
          
          <div className="mt-6 flex justify-center">
             <a 
               href={generatedSong.audioUrl} 
               download 
               target="_blank"
               rel="noreferrer"
               className="text-sm font-semibold text-rose-500 hover:underline"
             >
               Télécharger le MP3
             </a>
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
              setFormData({...formData, recipient: '', details: ''});
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

            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Style Musical</label>
              <div className="flex flex-wrap gap-2">
                {musicStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({ ...formData, musicStyle: s.id as any })}
                    className={`px-6 py-3 rounded-full font-semibold transition-all active:scale-95 ${
                      formData.musicStyle === s.id
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Content */}
        {currentStep === 'content' && (
          <div className="flex-1 space-y-8 animate-fade-in">
             <div>
               <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 pl-1">Voix</label>
               <div className="bg-slate-100 p-1 rounded-full flex relative">
                  {/* Sliding Background */}
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

             <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 pl-1">Détails de l'histoire</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Racontez-nous... (ex: Rencontre au ski, elle aime le chocolat, on se marie en juin...)"
                  className="w-full h-40 bg-slate-50 p-5 rounded-3xl focus:outline-none focus:ring-0 focus:bg-slate-100 transition-colors placeholder:text-slate-400 text-slate-800 text-lg leading-relaxed resize-none"
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