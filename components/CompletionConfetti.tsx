import React from 'react';

// Mock confetti since we don't have react-confetti in this environment
export function CompletionConfetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center overflow-hidden">
        {/* Simple CSS Confetti Mock */}
        <div className="absolute top-0 w-full h-full">
            {Array.from({ length: 20 }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute animate-bounce"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10%`,
                        animationDuration: `${2 + Math.random() * 3}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                >
                    {['🎉', '✨', '🎊'][i % 3]}
                </div>
            ))}
        </div>
    </div>
  );
}
