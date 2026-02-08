
import React, { useState } from 'react';
import { Coins as CoinsIcon, Check, Star, Loader2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { initiateMaketouPayment, MAKETOU_PRODUCT_ID } from '../services/maketouService';

const CoinsPage: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState<number | null>(null); // Index du pack en chargement
  const [error, setError] = useState<string | null>(null);

  const packs = [
    { amount: 50, price: 2500, label: '2 500 FCFA', popular: false, color: 'from-slate-700 to-slate-900' },
    { amount: 100, price: 4000, label: '4 000 FCFA', popular: true, color: 'from-rose-500 to-rose-600' },
    { amount: 300, price: 10000, label: '10 000 FCFA', popular: false, color: 'from-blue-600 to-indigo-700' },
  ];

  const handleBuy = async (idx: number, pack: typeof packs[0]) => {
    if ((MAKETOU_PRODUCT_ID as string) === "REMPLACER_PAR_VOTRE_ID_PRODUIT_MAKETOU") {
        setError("Configuration manquante : L'ID du produit Maketou n'est pas défini dans le code.");
        return;
    }

    setLoading(idx);
    setError(null);

    try {
      const redirectUrl = await initiateMaketouPayment(user, pack.price, pack.amount);
      // Redirection vers la page de paiement
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Impossible de lancer le paiement.");
      setLoading(null);
    }
  };

  return (
    <div className="pb-28 max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Boutique</h1>
        <p className="text-slate-500">Solde actuel: <span className="font-bold text-slate-900">{user.coins} pièces</span></p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={20} />
            {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packs.map((pack, idx) => (
          <div 
            key={idx} 
            className={`relative bg-white rounded-[2rem] p-1 overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-ios ${pack.popular ? 'ring-4 ring-rose-100' : ''}`}
          >
            <div className="bg-white rounded-[1.8rem] p-6 h-full flex flex-col items-center text-center relative z-10">
              {pack.popular && (
                <div className="absolute top-4 right-4 text-yellow-500 animate-pulse">
                  <Star fill="currentColor" size={24} />
                </div>
              )}
              
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pack.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                <CoinsIcon size={32} />
              </div>
              
              <div className="text-5xl font-extrabold text-slate-900 mb-1 tracking-tighter">{pack.amount}</div>
              <div className="text-slate-400 font-medium text-sm mb-6 uppercase tracking-wide">Pièces</div>
              
              <div className="flex-1 w-full space-y-3 mb-8">
                 <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-green-500" /> 
                    <span className="font-medium">Sans publicité</span>
                 </div>
                 <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-green-500" /> 
                    <span className="font-medium">Génération prioritaire</span>
                 </div>
              </div>

              <button 
                onClick={() => handleBuy(idx, pack)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg text-white bg-gradient-to-r ${pack.color} flex items-center justify-center gap-2`}
              >
                {loading === idx ? <Loader2 className="animate-spin" /> : pack.label}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-center text-xs text-slate-400 mt-8">
        Paiement sécurisé via Maketou. Les crédits sont ajoutés automatiquement après validation.
      </p>
    </div>
  );
};

export default CoinsPage;
