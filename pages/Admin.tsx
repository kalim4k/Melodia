
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { NavItem } from '../types';
import { 
  Users, Music, CreditCard, ShoppingBag, 
  TrendingUp, Loader2, LayoutDashboard, Settings, 
  ArrowLeft, Clock, DollarSign, Menu, X 
} from 'lucide-react';

interface AdminProps {
  onBack: (tab: NavItem) => void;
}

interface TransactionLog {
  id: string;
  amount: number;
  coins: number;
  created_at: string;
  status: string;
  user_id: string;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({
    users: 0,
    songs: 0,
    revenue: 0,
    orders: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<TransactionLog[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);

      // 1. Count Users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Count Songs
      const { count: songCount } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });

      // 3. Transactions (Revenue & History)
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const txs = transactions || [];
      
      const getRealAmount = (t: any) => {
         if (t.amount_fcfa && t.amount_fcfa > 0) return t.amount_fcfa;
         switch (t.coins_amount) {
            case 50: return 2500;
            case 100: return 4000;
            case 300: return 10000;
            default: return 0;
         }
      };

      const totalRevenue = txs.reduce((sum, t) => sum + getRealAmount(t), 0);
      const totalOrders = txs.length;

      setStats({
        users: userCount || 0,
        songs: songCount || 0,
        revenue: totalRevenue,
        orders: totalOrders
      });

      setRecentTransactions(txs.slice(0, 10).map(t => ({
        id: t.id,
        amount: getRealAmount(t),
        coins: t.coins_amount,
        created_at: t.created_at,
        status: t.status,
        user_id: t.user_id
      })));

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i)); 
        return d.toISOString().split('T')[0];
      });

      const revenueByDay: Record<string, number> = {};
      last7Days.forEach(day => revenueByDay[day] = 0);

      txs.forEach(t => {
        const day = t.created_at.split('T')[0];
        if (revenueByDay[day] !== undefined) {
          revenueByDay[day] += getRealAmount(t);
        }
      });

      setChartData(last7Days.map(day => revenueByDay[day]));

    } catch (err) {
      console.error("Erreur stats admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " an";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mois";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "j";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    return Math.floor(seconds / 60) + " m";
  };

  const Chart = ({ data }: { data: number[] }) => {
    const max = Math.max(...data, 1000); 
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val / max) * 100);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-40 relative mt-6">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                {data.length > 1 ? (
                  <>
                    <path d={`M0,100 L0,${100 - (data[0]/max)*100} ${points.split(' ').map((p, i) => `L${p}`).join(' ')} L100,100 Z`} fill="url(#chartGradient)" />
                    <polyline 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        points={points} 
                        strokeLinecap="round" 
                        vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : (
                  <text x="50" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10">Pas assez de données</text>
                )}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                <span>J-6</span><span>J-5</span><span>J-4</span><span>J-3</span><span>J-2</span><span>Hier</span><span>Auj.</span>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row">
        
        {/* OVERLAY MOBILE */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        {/* SIDEBAR (Drawer on mobile, Fixed on Desktop) */}
        <aside 
            className={`
                fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static md:flex-shrink-0
            `}
        >
            <div className="h-full flex flex-col">
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/50">
                            <LayoutDashboard size={18} />
                        </div>
                        <span className="font-bold text-lg">Admin</span>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
                        { id: 'users', icon: Users, label: 'Utilisateurs' },
                        { id: 'orders', icon: ShoppingBag, label: 'Commandes' },
                        { id: 'settings', icon: Settings, label: 'Réglages' }
                    ].map((item) => (
                         <button 
                            key={item.id}
                            onClick={() => {
                                setActiveView(item.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === item.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={() => onBack(NavItem.PROFILE)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-all"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Retour App</span>
                    </button>
                </div>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            
            {/* HEADER MOBILE */}
            <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-slate-900 text-lg">Dashboard</span>
                </div>
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
            </header>

            {/* SCROLLABLE AREA */}
            <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-100">
                <div className="max-w-7xl mx-auto space-y-8 pb-20">
                    
                    {/* Header Desktop */}
                    <div className="hidden md:flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vue d'ensemble</h1>
                            <p className="text-slate-500 mt-1">Bienvenue sur le panneau de contrôle Melodia.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm font-bold text-slate-600">Système opérationnel</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="animate-spin text-rose-500 mb-4" size={40} />
                            <p className="text-slate-400 font-medium">Chargement...</p>
                        </div>
                    ) : (
                        <>
                             {/* KPI CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {[
                                    { label: 'Revenus Total', value: `${stats.revenue.toLocaleString('fr-FR')} FCFA`, icon: CreditCard, color: 'text-green-500', bg: 'bg-green-50' },
                                    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Chansons', value: stats.songs, icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
                                    { label: 'Commandes', value: stats.orders, icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50' },
                                ].map((kpi, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-2xl`}>
                                                <kpi.icon size={24} />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-2xl md:text-3xl font-bold text-slate-900 block tracking-tight truncate">
                                                {kpi.value}
                                            </span>
                                            <span className="text-xs md:text-sm font-medium text-slate-400">{kpi.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* CHART */}
                                <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-slate-900">Revenus (7 jours)</h2>
                                        </div>
                                        <button onClick={fetchRealData} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                                            <TrendingUp size={20} />
                                        </button>
                                    </div>
                                    <Chart data={chartData} />
                                </div>

                                {/* LOGS */}
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col max-h-[500px]">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Clock size={20} className="text-rose-500" />
                                        Dernières Ventes
                                    </h2>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                        {recentTransactions.length === 0 ? (
                                            <p className="text-center text-slate-400 text-sm py-10">Aucune donnée</p>
                                        ) : (
                                            recentTransactions.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                                                            <DollarSign size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                                +{tx.amount.toLocaleString()} FCFA
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                                                                {tx.coins > 0 ? `${tx.coins} pièces` : 'Achat'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap ml-2">
                                                        {timeAgo(tx.created_at)}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    </div>
  );
};

export default Admin;
