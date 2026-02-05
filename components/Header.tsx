import React from 'react';
import { Bell, Coins } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ user, title }) => {
  return (
    <header className="sticky top-0 z-30 w-full px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-xl transition-all border-b border-black/[0.03]">
      <div className="flex-1">
        {/* Mobile Title */}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 md:hidden">{title}</h1>
        {/* Desktop Title */}
        <h2 className="hidden md:block text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-black/5 px-3 py-1.5 rounded-full">
          <Coins size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-slate-700">{user.coins}</span>
        </div>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-black/5 text-slate-600 active:scale-95 transition-transform">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>

        <div className="w-9 h-9 rounded-full overflow-hidden border border-black/5">
          <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default Header;