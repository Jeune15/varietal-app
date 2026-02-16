import React, { useState, useEffect } from 'react';

interface LoaderProps {
  onComplete?: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const duration = 1500;
    const interval = 15;
    const steps = duration / interval;
    const increment = 100 / steps;

    let cancelled = false;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (cancelled) return;
            setIsHiding(true);
            setTimeout(() => {
              if (cancelled) return;
              onComplete?.();
            }, 500);
          }, 1000);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[300] bg-black text-white flex flex-col items-center justify-center transition-opacity duration-500 ${isHiding ? 'animate-zoom-out' : ''}`}>
      <div className="relative w-24 h-24 mb-8">
        <img 
          src="/logocircular.png" 
          alt="Loading..." 
          className="w-full h-full object-contain animate-spin-slow"
        />
      </div>
      
      <div className="w-64 space-y-2">
        <div className="h-[2px] w-full bg-white/20 overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/70">
          <span>Cargando</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
