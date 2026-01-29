import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Loader } from 'lucide-react';

interface Props {
  onMenuOpen: () => void;
}

const LandingPage: React.FC<Props> = ({ onMenuOpen }) => {
  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden">
      {/* Central Frame with Image and Content */}
      <div className="absolute inset-8 md:inset-12 lg:inset-16 overflow-hidden bg-stone-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center animate-fade-in"
          style={{ backgroundImage: "url('/inicio%202.jpg')" }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end items-start p-6 md:p-10">
          
          {/* Bottom Left: Main Text */}
          <div className="relative text-left space-y-0">
            <div className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-[0.1em] drop-shadow-lg leading-[0.9]">
              VARIETAL
            </div>
            <div className="text-4xl md:text-6xl lg:text-7xl font-black text-white/90 uppercase tracking-[0.1em] drop-shadow-lg leading-[0.9]">
              Desarrolladores
            </div>
            <div className="text-4xl md:text-6xl lg:text-7xl font-black text-white/90 uppercase tracking-[0.1em] drop-shadow-lg leading-[0.9]">
              De Café
            </div>
            <p className="text-sm md:text-base font-serif italic text-white/80 tracking-[0.3em] mt-6 ml-1">
              since 2022
            </p>
          </div>

          {/* Top Right: Menu Button */}
          <button 
            onClick={onMenuOpen}
            className="absolute top-0 right-0 p-6 md:p-10 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Menú
            </span>
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
