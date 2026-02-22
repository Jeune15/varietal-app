import React from 'react';
import { PlayCircle } from 'lucide-react';

interface Props {
  onMenuOpen: () => void;
}

const LandingPage: React.FC<Props> = ({ onMenuOpen }) => {
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
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9]">
            {renderWord('VARIETAL', 'varietal')}
          </div>
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9] break-normal">
            {renderWord('Desarrolladores', 'desarrolladores')}
          </div>
          <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9]">
            {renderWord('De', 'de')}&nbsp;{renderWord('Café', 'cafe')}
          </div>
          <p className="text-sm md:text-lg font-serif italic text-black tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-6 ml-0.5">
            est. 2022
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center mt-8">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Iniciar"
          className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Iniciar</span>
          <PlayCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
