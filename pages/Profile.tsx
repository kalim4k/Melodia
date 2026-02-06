import React, { useState, useEffect } from 'react';
import { User, NavItem } from '../types';
import { Settings, LogOut, CreditCard, Bell, ChevronRight, Shield, CircleHelp, ChevronLeft, ToggleLeft, ToggleRight, Moon, Mail, HelpCircle, FileText } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onNavigate: (tab: NavItem) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onNavigate }) => {
  const [subPage, setSubPage] = useState<string | null>(null);
  
  // États locaux pour les toggles
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifSongs, setNotifSongs] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [language, setLanguage] = useState('fr');

  const isPremium = user.plan === 'premium';

  // Formatage de la date d'inscription
  const formattedJoinDate = new Date(user.joinedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Gestion du Mode Sombre (Effet visuel basique sur le body pour l'instant)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      // Pour simuler, on change le background du body si nécessaire, 
      // mais idéalement Tailwind gérerait tout via la classe 'dark'.
      // Ici on garde l'UI propre à l'app mais on sauvegarde l'état.
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMenuClick = (label: string) => {
    if (label === 'Abonnement') {
      onNavigate(NavItem.COINS);
    } else {
      setSubPage(label);
    }
  };

  // --- RENDU DES SOUS-PAGES ---
  if (subPage) {
    return (
      <div className="pb-28 max-w-2xl mx-auto animate-fade-in">
        <button 
          onClick={() => setSubPage(null)}
          className="flex items-center gap-2 text-rose-500 font-semibold mb-6 hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={20} />
          Retour
        </button>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">{subPage}</h1>

        <div className="bg-white rounded-[2rem] p-6 shadow-ios min-h-[50vh]">
          
          {subPage === 'Paramètres' && (
            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Moon size={20} />
                  </div>
                  <span className="font-medium text-slate-700">Mode Sombre</span>
                </div>
                {isDarkMode ? (
                  <ToggleRight size={32} className="text-indigo-500 transition-colors" />
                ) : (
                  <ToggleLeft size={32} className="text-slate-300 transition-colors" />
                )}
              </button>

              <div className="border-t border-slate-50 pt-6">
                <div className="flex items-center justify-between mb-4">
                   <span className="font-medium text-slate-700">Langue de l'application</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 py-2 rounded-xl font-medium text-sm border transition-all ${language === 'fr' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Français
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-2 rounded-xl font-medium text-sm border transition-all ${language === 'en' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          )}

          {subPage === 'Notifications' && (
            <div className="space-y-6">
               <button 
                onClick={() => setNotifSongs(!notifSongs)}
                className="w-full flex items-center justify-between"
               >
                <span className="font-medium text-slate-700">Nouvelles chansons</span>
                {notifSongs ? <ToggleRight size={32} className="text-rose-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
              </button>
              
              <div className="border-t border-slate-50 pt-6">
                <button 
                  onClick={() => setNotifPromo(!notifPromo)}
                  className="w-full flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700">Offres promotionnelles</span>
                  {notifPromo ? <ToggleRight size={32} className="text-rose-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                </button>
              </div>
              
              <p className="text-xs text-slate-400 mt-4 px-2">
                Melodia vous enverra des notifications push pour vous prévenir quand vos créations sont prêtes.
              </p>
            </div>
          )}

          {subPage === 'Confidentialité' && (
            <div className="prose prose-slate prose-sm max-w-none text-slate-600">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Utilisation des données</h3>
              <p className="mb-4">
                Chez Melodia, la confidentialité de vos sentiments est notre priorité. Les paroles générées et les informations fournies (prénoms, anecdotes) sont utilisées <strong>uniquement</strong> dans le but de générer votre chanson via nos partenaires d'intelligence artificielle.
              </p>
              
              <h3 className="font-bold text-slate-900 text-lg mb-2">Stockage</h3>
              <p className="mb-4">
                Vos chansons sont stockées de manière sécurisée sur nos serveurs pour que vous puissiez les retrouver dans votre bibliothèque. Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-xl flex gap-3 mt-6">
                 <Shield className="text-blue-500 shrink-0" size={24} />
                 <p className="text-xs text-blue-700 m-0">
                   Nous ne revendons jamais vos données personnelles à des tiers publicitaires. Vos histoires d'amour vous appartiennent.
                 </p>
              </div>
            </div>
          )}
          
          {subPage === 'Aide' && (
             <div className="space-y-6">
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                   <HelpCircle size={16} /> Comment gagner des pièces ?
                 </h4>
                 <p className="text-sm text-slate-600">
                   Les pièces s'achètent dans la boutique. Nous offrons parfois des pièces gratuites lors d'événements spéciaux comme la Saint-Valentin !
                 </p>
               </div>

               <div className="bg-slate-50 p-4 rounded-2xl">
                 <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                   <FileText size={16} /> Droits d'auteur
                 </h4>
                 <p className="text-sm text-slate-600">
                   Vous êtes libre de partager vos chansons sur les réseaux sociaux. L'usage commercial nécessite une licence spécifique.
                 </p>
               </div>

               <div className="border-t border-slate-100 pt-6 text-center">
                 <p className="text-slate-600 mb-4 font-medium">Une autre question ?</p>
                 <a href="mailto:support@melodia.app" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform">
                    <Mail size={16} />
                    Contacter le support
                 </a>
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  // --- VUE PRINCIPALE DU PROFIL ---
  return (
    <div className="pb-28 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Profil</h1>
      
      {/* User Card */}
      <div className="bg-white rounded-[2rem] p-6 flex items-center gap-5 shadow-ios mb-8">
        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden ring-4 ring-slate-50 flex-shrink-0">
          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-xl font-bold text-slate-900 truncate">{user.name}</h2>
          <p className="text-slate-400 text-sm font-medium mb-2">
            Membre depuis le {formattedJoinDate}
          </p>
          
          {isPremium ? (
             <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wide border border-rose-100">
               Premium
             </div>
          ) : (
             <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wide border border-slate-200">
               Gratuit
             </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-4">Général</h3>
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-ios">
          {[
            { icon: Settings, label: "Paramètres", color: "bg-slate-500" },
            { icon: Bell, label: "Notifications", color: "bg-rose-500" },
            { icon: CreditCard, label: "Abonnement", color: "bg-blue-500" }
          ].map((item, idx, arr) => (
            <button 
              key={idx}
              onClick={() => handleMenuClick(item.label)}
              className={`w-full flex items-center justify-between p-4 pl-5 active:bg-slate-50 transition-colors hover:bg-slate-50 ${idx !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                  <item.icon size={16} />
                </div>
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>

        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-4">Support</h3>
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-ios">
           {[
            { icon: Shield, label: "Confidentialité", color: "bg-green-500" },
            { icon: CircleHelp, label: "Aide", color: "bg-orange-500" }
          ].map((item, idx, arr) => (
            <button 
              key={idx}
              onClick={() => handleMenuClick(item.label)}
              className={`w-full flex items-center justify-between p-4 pl-5 active:bg-slate-50 transition-colors hover:bg-slate-50 ${idx !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                  <item.icon size={16} />
                </div>
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-white text-rose-500 font-bold p-4 rounded-[1.5rem] shadow-ios active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-rose-50"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
        
        <p className="text-center text-xs text-slate-300 pt-4">Melodia v1.0.3</p>
      </div>
    </div>
  );
};

export default Profile;