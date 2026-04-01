import React from 'react';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

interface Props {
  onSelectCategory: (categoryId: string) => void;
}

export const AudiobooksView: React.FC<Props> = ({ onSelectCategory }) => {
  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8 flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="space-y-2 mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">
          Audiolibros
        </h1>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
          Aprende, escucha y evalúa tus conocimientos
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-6 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-black dark:text-white">{audiobooksData.length}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Módulos</span>
        </div>
        <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-black dark:text-white">
            {audiobooksData.reduce((acc, cat) => acc + cat.chapters.length, 0)}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Capítulos</span>
        </div>
        <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Quiz + Tarea en cada capítulo</span>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {audiobooksData.map((category) => {
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="group relative flex flex-col justify-between p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl hover:border-black dark:hover:border-white hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="flex-1 space-y-4 mb-8">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black dark:text-white leading-tight">
                  {category.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
                  {category.description}
                </p>
              </div>

              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-end justify-between w-full">
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl md:text-3xl font-black text-black dark:text-white leading-none group-hover:scale-105 transition-transform origin-left">{category.chapters.length}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Capítulos</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-all transform group-hover:translate-x-1 shadow-sm">
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
