import React, { useState } from 'react';
import { Play, Pause, Music, Star, ChevronDown, ChevronUp, Heart, ArrowRight, CheckCircle2, Gift } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Est-ce le cadeau idéal pour la Saint-Valentin ?",
      answer: "Absolument. Contrairement aux fleurs ou aux chocolats, une chanson est éternelle. C'est une preuve d'amour ultra-personnalisée qui touche droit au cœur."
    },
    {
      question: "Je ne suis pas poète, est-ce grave ?",
      answer: "Pas du tout ! Donnez juste des mots-clés (ex: 'rencontre au ski', 'ses yeux verts', 'je t'aime'), et notre IA transforme vos sentiments en une poésie magnifique."
    },
    {
      question: "Puis-je choisir une ambiance romantique ?",
      answer: "Oui ! Vous pouvez opter pour une ballade piano-voix émouvante, un RnB sensuel ou une Pop joyeuse pour célébrer votre couple."
    },
    {
      question: "Combien de temps ça prend ?",
      answer: "Moins de 2 minutes. Vous pouvez créer votre chanson juste avant le dîner de la Saint-Valentin et la jouer directement depuis votre téléphone."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-rose-200 selection:text-rose-900">
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
        `}
      </style>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight">Melodia</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={onStart}
              className="text-slate-600 font-medium hover:text-rose-500 transition-colors hidden md:block"
            >
              Connexion
            </button>
            <button 
              onClick={onStart}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
            >
              Créer ma chanson
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-rose-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-red-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-rose-100 px-4 py-1.5 rounded-full mb-8 shadow-sm animate-fadeInUp">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cadeau Saint-Valentin</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-fadeInUp delay-100">
            Offrez-lui la plus belle <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600">preuve d'amour</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp delay-200">
            Cette année, oubliez les fleurs. L'IA compose une chanson unique qui raconte <strong>votre histoire d'amour</strong>, avec vos souvenirs et vos prénoms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp delay-300">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-rose-500 text-white rounded-full font-bold text-lg shadow-xl shadow-rose-500/30 hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Créer sa chanson <Heart size={20} fill="currentColor" />
            </button>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <img key={i} src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                 ))}
               </div>
               <span>Déjà 12k+ amoureux conquis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Steps Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-100 to-red-100 rounded-[2.5rem] -rotate-3 opacity-50 blur-lg"></div>
              <img 
                src="https://celinaroom.com/wp-content/uploads/2026/02/ChatGPT-Image-6-fevr.-2026-11_50_21.png" 
                alt="Couple listening to music" 
                className="relative rounded-[2rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 w-full object-cover aspect-[4/5]"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                3 étapes pour un moment <br/> <span className="text-rose-500">magique à deux</span>
              </h2>
              
              <div className="space-y-8">
                {[
                  { title: "Racontez votre rencontre", desc: "Dites-nous comment vous vous êtes connus, ce que vous aimez chez l'autre, vos petits surnoms..." },
                  { title: "Choisissez l'ambiance", desc: "Plutôt slow romantique pour danser collé-serré ou une déclaration passionnée ?" },
                  { title: "Offrez l'émotion pure", desc: "En 2 minutes, votre sérénade est prête. Jouez-la lors de votre soirée en amoureux." }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-50 text-rose-600 font-bold text-xl flex items-center justify-center border border-rose-100">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{step.title}</h3>
                      <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={onStart} className="mt-10 text-rose-600 font-bold flex items-center gap-2 hover:gap-4 transition-all group">
                Je me lance <ArrowRight size={20} className="group-hover:text-rose-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Ils ont fait battre son cœur</h2>
              <div className="flex items-center justify-center gap-1 text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                <span className="text-slate-400 text-sm ml-2 font-medium">(4.9/5 sur 36k couples)</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Julie & Marc", role: "En couple depuis 2 ans", text: "J'ai raconté notre premier rencart maladroit dans la chanson. Il a pleuré de rire et d'émotion en l'écoutant. Meilleur cadeau !" },
                { name: "Thomas L.", role: "Surprise Saint-Valentin", text: "Je ne suis pas très doué avec les mots, mais Melodia a transformé mes sentiments en une ballade magnifique pour ma femme." },
                { name: "Sophie", role: "Déclaration", text: "Je n'osais pas lui dire 'Je t'aime' en face. La chanson l'a fait pour moi de la plus belle des manières." }
              ].map((review, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-ios relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-6xl text-rose-200 font-serif absolute top-4 right-6">"</div>
                  <div className="flex gap-1 text-yellow-400 mb-4">
                     {[1,2,3,4,5].map(j => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-600 mb-6 leading-relaxed font-medium relative z-10">
                    "{review.text}"
                  </p>
                  <div>
                    <div className="font-bold text-slate-900">{review.name}</div>
                    <div className="text-rose-500 text-xs font-bold uppercase tracking-wider">{review.role}</div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-slate-900 mb-4">Questions Fréquentes</h2>
             <p className="text-slate-500">Tout pour réussir votre surprise.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-200 hover:border-rose-100">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 text-left"
                >
                  <span className="font-bold text-slate-800">{faq.question}</span>
                  {openFaq === idx ? <ChevronUp className="text-rose-500" /> : <ChevronDown className="text-slate-400" />}
                </button>
                <div 
                  className={`px-6 bg-white text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'max-h-40 py-6 opacity-100' : 'max-h-0 py-0 opacity-0'
                  }`}
                >
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Melodia</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="text-sm">
            © 2024 Melodia. Fait avec amour.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;