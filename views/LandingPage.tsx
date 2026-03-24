import React from 'react';
import { PlayCircle, Calendar, Receipt } from 'lucide-react';

interface Props {
  onMenuOpen: () => void;
  onCalendarOpen: () => void;
  onSalesOpen?: () => void;
}

const LandingPage: React.FC<Props> = ({ onMenuOpen, onCalendarOpen, onSalesOpen }) => {
  const renderWord = (word: string, key: string) => (
    <span key={key} className="word-split-item">
      {word}
      <span className="word-split-mask">
        <span>{word}</span>
      </span>
      <span className="word-split-mask">
        <span>{word}</span>
      </span>
    </span>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center md:items-start justify-center px-4 sm:px-8 md:px-16">
      <div className="w-full max-w-5xl flex flex-col items-start justify-center">
        <div className="space-y-0 text-left">
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-tighter sm:tracking-widest md:tracking-[0.1em] leading-[0.95] md:leading-[0.9]">
            {renderWord('VARIETAL', 'varietal')}
          </div>
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-tighter sm:tracking-widest md:tracking-[0.1em] leading-[0.95] md:leading-[0.9]">
            {renderWord('Desarrolladores', 'desarrolladores')}
          </div>
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-tighter sm:tracking-widest md:tracking-[0.1em] leading-[0.95] md:leading-[0.9]">
            {renderWord('De', 'de')}&nbsp;{renderWord('Café', 'cafe')}
          </div>
          <p className="text-sm md:text-lg font-serif italic text-black tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-6 ml-0.5">
            est. 2022
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-center mt-8 md:mt-16">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Iniciar"
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors transition-transform active:scale-95"
          >
            <span>Iniciar</span>
            <PlayCircle className="w-5 h-5" />
          </button>

          {onSalesOpen && (
            <button
              type="button"
              onClick={onSalesOpen}
              aria-label="Ventas"
              className="inline-flex items-center justify-center w-[44px] h-[44px] border border-black bg-black text-white hover:bg-white hover:text-black transition-colors transition-transform active:scale-95"
            >
              <Receipt className="w-5 h-5 text-white" />
            </button>
          )}

          <button
            type="button"
            onClick={onCalendarOpen}
            aria-label="Calendario"
            className="inline-flex items-center justify-center w-[44px] h-[44px] border border-black text-black hover:bg-black hover:text-white transition-colors transition-transform active:scale-95"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
