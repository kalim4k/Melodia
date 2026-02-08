
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Create from './pages/Create';
import MyMusic from './pages/MyMusic';
import CoinsPage from './pages/Coins';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import SharedSong from './pages/SharedSong';
import BackgroundAnimation from './components/BackgroundAnimation';
import PlayerBar from './components/PlayerBar';
import { NavItem, Song, User } from './types';
import { verifyMaketouPayment, isPaymentSuccessful } from './services/maketouService';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.HOME);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [sharedSongId, setSharedSongId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); 
  
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  // Payment Verification State
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentStatusType, setPaymentStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [showManualCheck, setShowManualCheck] = useState(false); 
  const processingRef = useRef(false);

  // 1. INITIALISATION
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setSharedSongId(shareId);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
      if (session) fetchUserData(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecked(true);
      if (session) {
        if (!verifyingPayment) fetchUserData(session.user.id, session.user.email);
        setShowAuth(false);
      } else {
        setUser(null);
        setCurrentSong(null);
      }
    });

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. TRIGGER PAIEMENT (Dès que session est prête)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPaymentReturn = params.get('payment_verification');

    if (authChecked && session && isPaymentReturn && !processingRef.current) {
        runPaymentVerification(session);
    }
  }, [session, authChecked]);

  const runPaymentVerification = async (currentSession: Session) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setVerifyingPayment(true);
    setShowManualCheck(false);

    const pendingCartId = localStorage.getItem('pending_cart_id');
    
    if (!pendingCartId) {
        setPaymentStatusType('error');
        setPaymentMessage("ERREUR CRITIQUE: ID de transaction perdu. Avez-vous changé de navigateur ?");
        setShowManualCheck(true);
        return;
    }

    try {
        setPaymentMessage("1/4 - Vérification du statut Maketou...");
        
        // --- ÉTAPE 1 : VERIFICATION API MAKETOU ---
        let attempts = 0;
        let finalStatus = 'waiting';
        let statusData: any = null;

        while (attempts < 10) {
           statusData = await verifyMaketouPayment(pendingCartId);
           console.log(`[Paiement] Tentative ${attempts+1} : ${statusData.status}`);
           
           if (isPaymentSuccessful(statusData.status) || statusData.status === 'payment_failed' || statusData.status === 'abandoned') {
              finalStatus = isPaymentSuccessful(statusData.status) ? 'COMPLETED' : statusData.status;
              break; 
           }
           await new Promise(r => setTimeout(r, 2000));
           attempts++;
        }

        // --- ÉTAPE 2 : CALCUL MONTANT ---
        let coinsToAdd = statusData?.meta?.coinAmount || 0;
        const paidAmount = statusData?.customerPrice || statusData?.cart?.customerPrice || 0;

        // Fallback montant (Remis à la normale)
        if (!coinsToAdd && paidAmount > 0) {
            if (paidAmount >= 9000) coinsToAdd = 300;
            else if (paidAmount >= 3500) coinsToAdd = 100;
            else if (paidAmount >= 2000) coinsToAdd = 50; 
        }

        if (finalStatus === 'COMPLETED') {
             if (coinsToAdd <= 0) {
                 throw new Error(`Paiement validé mais montant de pièces = 0 (Payé: ${paidAmount}). Contactez le support.`);
             }

             setPaymentMessage(`2/4 - Paiement validé (${paidAmount} FCFA). Enregistrement...`);

             // --- ÉTAPE 3 : INSERTION TRACE (CRITIQUE) ---
             // On utilise insert() direct, sans RPC, pour être sûr que ça passe si RLS est désactivé
             const { error: txError } = await supabase.from('transactions').insert({
                user_id: currentSession.user.id,
                maketou_cart_id: pendingCartId,
                amount_fcfa: paidAmount,
                coins_amount: coinsToAdd,
                status: 'COMPLETED'
             });

             if (txError) {
                 console.error("ERREUR INSERT TRANSACTION:", txError);
                 // On continue quand même pour créditer l'utilisateur, mais on alerte
                 setPaymentMessage("Attention: Erreur d'historique, mais on crédite votre compte...");
             }

             // --- ÉTAPE 4 : CRÉDIT ---
             setPaymentMessage("3/4 - Ajout des pièces...");
             
             // Récupérer solde actuel pour être sûr
             const { data: profile } = await supabase.from('profiles').select('coins').eq('id', currentSession.user.id).single();
             const newBalance = (profile?.coins || 0) + coinsToAdd;

             const { error: updateError } = await supabase
                .from('profiles')
                .update({ coins: newBalance })
                .eq('id', currentSession.user.id);

             if (updateError) {
                 throw new Error("Erreur lors de la mise à jour du solde : " + updateError.message);
             }

             // --- ÉTAPE 5 : SUCCÈS & REDIRECTION ---
             setPaymentMessage("4/4 - Terminé ! Redirection...");
             setPaymentStatusType('success');
             
             // Update Local User
             setUser(prev => prev ? ({...prev, coins: newBalance}) : null);

             // Clear
             localStorage.removeItem('pending_cart_id');
             window.history.replaceState({}, '', window.location.pathname);
             
             setTimeout(() => {
                 setVerifyingPayment(false);
                 setActiveTab(NavItem.CREATE);
                 setPaymentMessage(null);
                 processingRef.current = false;
             }, 2000);

        } else if (statusData?.status === 'payment_failed') {
             throw new Error("Paiement refusé ou annulé.");
        } else {
             // Cas où Maketou ne répond pas "completed" assez vite
             setPaymentStatusType('info');
             setPaymentMessage("Paiement en attente. Cliquez ci-dessous pour forcer la vérification.");
             setShowManualCheck(true);
             processingRef.current = false;
        }

    } catch (e: any) {
        console.error("ERREUR PAIEMENT:", e);
        setPaymentStatusType('error');
        setPaymentMessage(`ERREUR: ${e.message}`);
        setShowManualCheck(true);
        processingRef.current = false;
    }
  };

  const fetchUserData = async (userId: string, email?: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          name: profile.name,
          email: email || '',
          coins: profile.coins,
          avatar: profile.avatar_url || 'https://picsum.photos/seed/user123/200/200',
          plan: 'gratuit',
          joinedAt: profile.created_at || new Date().toISOString()
        });
      }

      const { data: userSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userSongs) {
        const formattedSongs: Song[] = userSongs.map(s => ({
          id: s.id,
          title: s.title,
          recipient: s.recipient,
          lyrics: s.lyrics,
          audioUrl: s.audio_url,
          style: s.style,
          createdAt: s.created_at,
          duration: s.duration,
          coverImage: s.cover_image,
          voiceInput: s.voice_input, 
          voiceMode: s.voice_mode as any
        }));
        setSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  };

  const handleSongCreated = async (newSong: Song) => {
    if (!session?.user) return;
    const { error } = await supabase.from('songs').insert({
      user_id: session.user.id,
      title: newSong.title,
      recipient: newSong.recipient,
      lyrics: newSong.lyrics,
      audio_url: newSong.audioUrl,
      style: newSong.style,
      duration: newSong.duration,
      cover_image: newSong.coverImage,
      created_at: newSong.createdAt,
      voice_input: newSong.voiceInput || null,
      voice_mode: newSong.voiceMode || null
    });
    if (error) { alert(`Erreur de sauvegarde: ${error.message}`); return; }
    setSongs([newSong, ...songs]);
  };

  const deductCoins = (amount: number) => {
    if (!user || !session?.user) return false;
    if (user.coins >= amount) {
      const newBalance = user.coins - amount;
      setUser({ ...user, coins: newBalance });
      supabase.from('profiles').update({ coins: newBalance }).eq('id', session.user.id).then();
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentSong(null);
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const renderContent = () => {
    if (!user) return null;
    switch (activeTab) {
      case NavItem.HOME: return <Home user={user} recentSongs={songs.slice(0, 5)} goToCreate={() => setActiveTab(NavItem.CREATE)} onPlay={handlePlaySong} />;
      case NavItem.CREATE: return <Create onSongCreated={handleSongCreated} deductCoins={deductCoins} onPlay={handlePlaySong} />;
      case NavItem.MY_MUSIC: return <MyMusic songs={songs} onPlay={handlePlaySong} currentSongId={currentSong?.id} isPlaying={isPlaying} />;
      case NavItem.COINS: return <CoinsPage user={user} />;
      case NavItem.PROFILE: return <Profile user={user} onLogout={handleLogout} onNavigate={setActiveTab} />;
      default: return null;
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

  // VUE DE CHARGEMENT PENDANT LE PAIEMENT
  if (verifyingPayment) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white flex-col gap-6 px-6 text-center z-50 fixed inset-0">
        {!showManualCheck ? (
            <div className="w-16 h-16 border-4 border-rose-500 border-t-white rounded-full animate-spin"></div>
        ) : (
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-4xl mb-2">!</div>
        )}
        
        <div>
            <h2 className="text-2xl font-bold mb-4">Traitement du paiement</h2>
            <div className={`text-lg mb-6 max-w-sm mx-auto p-4 rounded-xl ${paymentStatusType === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-white/10'}`}>
                {paymentMessage || "Veuillez patienter..."}
            </div>

            {showManualCheck && (
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => {
                            processingRef.current = false;
                            if (session) runPaymentVerification(session);
                        }}
                        className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform"
                    >
                        <RefreshCw size={20} /> Réessayer la vérification
                    </button>
                    
                    <button 
                        onClick={() => {
                            setVerifyingPayment(false);
                            window.history.replaceState({}, '', window.location.pathname);
                        }}
                        className="text-slate-400 text-sm mt-4 hover:text-white underline"
                    >
                        Annuler (Si le problème persiste)
                    </button>
                </div>
            )}
        </div>
    </div>
  );

  // ROUTE 1: Shared Song
  if (sharedSongId) {
    return (
      <SharedSong 
        songId={sharedSongId} 
        onGoHome={() => {
           window.history.pushState({}, '', window.location.pathname);
           setSharedSongId(null);
        }} 
      />
    );
  }

  // ROUTE 2: Landing / Auth
  if (!session) {
    if (!authChecked) return <div className="h-screen bg-slate-50"></div>;
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return <Landing onStart={() => setShowAuth(true)} />;
  }

  const sidebarMarginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72';

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      <BackgroundAnimation />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobile={isMobile} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out z-10 w-full ${sidebarMarginClass}`}>
        {user && <Header user={user} title={getPageTitle()} />}
        
        {paymentMessage && !verifyingPayment && (
            <div className={`mx-6 mt-4 p-4 rounded-2xl shadow-lg animate-fade-in-up flex items-center justify-center font-bold text-center border ${
                paymentStatusType === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 
                paymentStatusType === 'error' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
                {paymentMessage}
            </div>
        )}

        <div className="flex-1 px-4 md:px-8 pt-6 max-w-7xl mx-auto w-full relative pb-32">
          {renderContent()}
        </div>
      </main>

      {currentSong && (
        <PlayerBar 
          song={currentSong} 
          isPlaying={isPlaying} 
          isExpanded={isPlayerExpanded}
          onToggleExpand={() => setIsPlayerExpanded(!isPlayerExpanded)}
          onTogglePlay={() => setIsPlaying(!isPlaying)} 
          onClose={() => {
            setIsPlaying(false);
            setCurrentSong(null);
            setIsPlayerExpanded(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
