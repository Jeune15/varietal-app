import React from 'react';
import { Menu } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        <div className="space-y-0 text-left">
          <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9]">
            {renderWord('VARIETAL', 'varietal')}
          </div>
          <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9] break-words hyphens-auto">
            {renderWord('Desarrolladores', 'desarrolladores')}
          </div>
          <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-black uppercase tracking-widest md:tracking-[0.1em] leading-none md:leading-[0.9]">
            {renderWord('De', 'de')}&nbsp;{renderWord('Café', 'cafe')}
          </div>
          <p className="text-xs md:text-base font-serif italic text-black tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-6 ml-0.5">
            since 2022
          </p>
        </div>

        <button
          onClick={onMenuOpen}
          className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          <span>Menú</span>
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
