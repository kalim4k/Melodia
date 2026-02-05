import React from 'react';
import { NavItem } from '../types';
import { Home, Plus, Music, Coins, User, Heart } from 'lucide-react';

interface SidebarProps {
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobile }) => {
  const menuItems = [
    { id: NavItem.HOME, label: 'Accueil', icon: Home },
    { id: NavItem.MY_MUSIC, label: 'Bibliothèque', icon: Music },
    { id: NavItem.CREATE, label: 'Créer', icon: Plus },
    { id: NavItem.COINS, label: 'Pièces', icon: Coins },
    { id: NavItem.PROFILE, label: 'Compte', icon: User },
  ];

  const handleNav = (id: NavItem) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Gradient fade to integrate bar smoothly */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white/90 to-transparent pointer-events-none"></div>
        
        {/* iOS Tab Bar */}
        <div className="relative bg-white/85 backdrop-blur-xl border-t border-black/[0.05] pb-safe pt-2">
          <div className="flex justify-around items-end h-[60px] px-2">
            {menuItems.map((item) => {
              const isCreate = item.id === NavItem.CREATE;
              const isActive = activeTab === item.id;
              
              if (isCreate) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="relative -top-5 flex flex-col items-center justify-center group"
                  >
                    <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transform transition-transform active:scale-90 active:shadow-sm">
                      <Plus size={28} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-semibold text-rose-500 mt-1 opacity-0 group-active:opacity-100 transition-opacity absolute -bottom-4">
                      Créer
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex flex-col items-center justify-center w-16 h-full transition-all active:scale-95 ${
                    isActive ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  <item.icon 
                    size={26} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    fill={isActive ? "currentColor" : "none"}
                    className={isActive ? "opacity-100" : "opacity-80"}
                  />
                  <span className="text-[10px] font-medium mt-1 tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Sidebar (Clean & Minimal)
  return (
    <div className="w-72 h-screen fixed left-0 top-0 bg-white/50 backdrop-blur-xl border-r border-black/[0.04] flex flex-col z-40 hidden md:flex">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Heart fill="white" className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Melodia</h1>
        </div>
        
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-4 mb-2">Menu</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium text-sm ${
              activeTab === item.id 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} fill={activeTab === item.id ? "currentColor" : "none"} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-2 group-hover:scale-110 transition-transform">
            <Heart size={80} fill="currentColor" />
          </div>
          <h3 className="font-bold text-lg mb-1">Saint-Valentin</h3>
          <p className="text-rose-100 text-sm opacity-90 leading-tight mb-3">Créez la surprise parfaite aujourd'hui.</p>
          <div className="inline-block bg-white/20 backdrop-blur-md rounded-lg px-2 py-1 text-xs font-bold">
            -50% sur les pièces
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;