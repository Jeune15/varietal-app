import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Loader } from 'lucide-react';

interface Props {
  onMenuOpen: () => void;
}

const LandingPage: React.FC<Props> = ({ onMenuOpen }) => {
  return (
    <div className="fixed inset-0 z-0 bg-stone-900 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center animate-fade-in"
        style={{ backgroundImage: 'url(/inicio.jpg)' }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

      {/* Central Dark Box Frame */}
      <div className="absolute inset-8 md:inset-12 lg:inset-16 bg-black/40 z-0" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between py-6 md:py-10">
        
        {/* Top: Logo removed, added VARIETAL text above */}
        <div className="w-full flex justify-center mt-4">
          {/* Logo removed */}
        </div>

        {/* Center: Main Text */}
        <div className="relative text-center space-y-2">
          <div className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-4">
            VARIETAL
          </div>
          <div className="space-y-0">
            <div className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 uppercase tracking-tighter drop-shadow-lg">
              Desarrolladores
            </div>
            <div className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 uppercase tracking-tighter drop-shadow-lg">
              De Café
            </div>
          </div>
          <p className="text-sm md:text-base font-serif italic text-white/80 tracking-[0.3em] mt-6">
            since 2022
          </p>
        </div>

        {/* Bottom: Empty for balance */}
        <div className="w-full h-12" />

        {/* Top Right: Menu Button */}
        <button 
          onClick={onMenuOpen}
          className="absolute top-8 right-8 md:top-12 md:right-12 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
            Menú
          </span>
          <Menu className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
