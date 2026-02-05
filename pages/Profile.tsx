import React from 'react';
import { User } from '../types';
import { Settings, LogOut, CreditCard, Bell, ChevronRight, Shield, CircleHelp } from 'lucide-react';

const Profile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="pb-28 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Profil</h1>
      
      {/* User Card */}
      <div className="bg-white rounded-[2rem] p-6 flex items-center gap-5 shadow-ios mb-8">
        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden ring-4 ring-slate-50">
          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-slate-400 text-sm font-medium">Membre depuis 2024</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wide">
            Premium
          </div>
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
              className={`w-full flex items-center justify-between p-4 pl-5 active:bg-slate-50 transition-colors ${idx !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}
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
              className={`w-full flex items-center justify-between p-4 pl-5 active:bg-slate-50 transition-colors ${idx !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}
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

        <button className="w-full bg-white text-rose-500 font-bold p-4 rounded-[1.5rem] shadow-ios active:scale-[0.98] transition-all">
          Déconnexion
        </button>
        
        <p className="text-center text-xs text-slate-300 pt-4">Melodia v1.0.2</p>
      </div>
    </div>
  );
};

export default Profile;