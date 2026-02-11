
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Loader2, User, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Nouvel état pour le prénom
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Veuillez entrer votre prénom.");
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }
          }
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-rose-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
      
      {/* Back Button */}
      {onBack && (
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors z-20"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>
      )}

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-ios relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
            <Heart fill="white" className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Melodia</h1>
          <p className="text-slate-500">Créez des chansons uniques pour ceux que vous aimez.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Champ Prénom - Visible uniquement en mode inscription */}
          {isSignUp && (
            <div className="animate-fade-in">
              <input
                type="text"
                placeholder="Votre prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              isSignUp ? 'Créer un compte' : 'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setName(''); // Reset name when toggling
            }}
            className="text-slate-500 text-sm font-medium hover:text-rose-500 transition-colors"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
