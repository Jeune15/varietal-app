import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ElementType;
}

interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onNavigate: (id: string) => void;
  activeTab: string;
}

const FullScreenMenu: React.FC<FullScreenMenuProps> = ({ isOpen, onClose, items, onNavigate, activeTab }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[200] flex transition-opacity duration-500 ease-in-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Background Layer - Changes based on hover */}
      <div className="absolute inset-0 bg-stone-950 transition-colors duration-700">
        {/* Default Background (always visible as base) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-40"
          style={{ backgroundImage: 'url(/inicio-2.webp)' }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content Container */}
      <div className="relative w-full h-full flex flex-col md:flex-row">
        
        {/* Left Side - Navigation List */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12 overflow-y-auto">
          <div className="space-y-6 md:space-y-8">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group flex items-center gap-4 md:gap-8 w-full text-left transition-all duration-300 transform ${
                  isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className={`text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight transition-colors duration-300 ${
                  activeTab === item.id 
                    ? 'text-brand italic' 
                    : hoveredId === item.id 
                      ? 'text-white pl-4' 
                      : 'text-stone-500'
                }`}>
                  {item.label}
                </span>
                
                {/* Arrow indicator on hover */}
                <span className={`opacity-0 -translate-x-4 transition-all duration-300 ${
                  hoveredId === item.id ? 'opacity-100 translate-x-0' : ''
                }`}>
                  <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-brand" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Info / Decoration (Desktop only) */}
        <div className="hidden lg:flex flex-col justify-between p-12 w-1/3 border-l border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="text-right">
             <button 
              onClick={onClose}
              className="p-4 hover:bg-white/10 rounded-full transition-colors inline-flex items-center justify-center group"
            >
              <X className="w-8 h-8 text-stone-400 group-hover:text-white transition-colors" />
            </button>
          </div>
          
          <div className="space-y-8 text-right">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Ubicación</p>
              <p className="text-xl font-serif text-white">Laboratorio Varietal</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">Estado</p>
              <p className="text-xl font-serif text-brand">Sistema Activo</p>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="absolute top-6 right-6 lg:hidden">
           <button 
            onClick={onClose}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FullScreenMenu;
