import React from 'react';
import { Coins as CoinsIcon, Check, Star } from 'lucide-react';
import { User } from '../types';

const CoinsPage: React.FC<{ user: User }> = ({ user }) => {
  const packs = [
    { amount: 50, price: '4.99€', popular: false, color: 'from-slate-700 to-slate-900' },
    { amount: 150, price: '12.99€', popular: true, color: 'from-rose-500 to-rose-600' },
    { amount: 500, price: '39.99€', popular: false, color: 'from-blue-600 to-indigo-700' },
  ];

  return (
    <div className="pb-28 max-w-4xl mx-auto">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Boutique</h1>
        <p className="text-slate-500">Solde actuel: <span className="font-bold text-slate-900">{user.coins} pièces</span></p>
      </div>

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

              <button className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg text-white bg-gradient-to-r ${pack.color}`}>
                {pack.price}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoinsPage;