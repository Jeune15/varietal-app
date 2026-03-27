import React, { useRef } from 'react';
import { BookOpen, ChevronRight, Leaf, Flame, Coffee, Droplet, Filter, Brain } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

interface Props {
  onSelectCategory: (categoryId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Leaf,
  Flame,
  Coffee,
  Droplet,
  Filter,
  Brain
};

export const AudiobooksView: React.FC<Props> = ({ onSelectCategory }) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-brand" />
            Audiolibros
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 uppercase tracking-widest">
            Aprende, escucha y evalúa tus conocimientos
          </p>
        </div>
      </div>

      {/* Grid de Categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {audiobooksData.map((category) => {
          const IconComponent = iconMap[category.icon] || BookOpen;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
            >
              <div className="w-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                    {category.chapters.length} Capítulos
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                    {category.title}
                  </h3>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {category.description}
                </p>
              </div>
              <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
                <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Explorar</span>
                <ChevronRight className="w-4 h-4 text-black dark:text-white" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
