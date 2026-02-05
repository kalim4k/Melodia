import React from 'react';
import { Heart } from 'lucide-react';

const BackgroundAnimation: React.FC = () => {
  // Générer des cœurs avec des propriétés aléatoires stables
  // On utilise useMemo dans un vrai projet pour éviter le re-calcul, 
  // ici c'est un composant statique.
  const hearts = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${12 + Math.random() * 18}s`, // Entre 12s et 30s pour être lent et apaisant
    animationDelay: `${Math.random() * 10}s`,
    size: Math.random() * 20 + 10,
    color: Math.random() > 0.6 ? '#f43f5e' : '#fda4af' // rose-500 ou rose-300
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart absolute"
          style={{
            left: heart.left,
            animationDuration: heart.animationDuration,
            animationDelay: heart.animationDelay,
          }}
        >
          <Heart 
            size={heart.size} 
            fill={heart.color} 
            color={heart.color} 
            style={{ opacity: 0.15 }} // Très transparent pour être épuré
          />
        </div>
      ))}
    </div>
  );
};

export default BackgroundAnimation;