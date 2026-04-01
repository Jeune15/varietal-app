import React from 'react';
import { ChevronLeft, PlayCircle, BookOpen, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

interface Props {
  categoryId: string;
  onBack: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export const AudiobookChaptersView: React.FC<Props> = ({ categoryId, onBack, onSelectChapter }) => {
  const category = audiobooksData.find(c => c.id === categoryId);

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500">
        <p>Categoría no encontrada.</p>
        <button onClick={onBack} className="mt-4 underline">Volver</button>
      </div>
    );
  }

  const totalDuration = category.chapters.length;

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-stone-200 dark:border-stone-800 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="group p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tighter uppercase leading-none">
                {category.title}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-2">
                {category.chapters.length} Capítulos
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block max-w-md shrink-0 self-center">
             <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed text-right border-l-2 border-brand/30 pl-4 py-1">
                {category.description}
             </p>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="max-w-4xl space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Índice de Capítulos</p>

        {category.chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => onSelectChapter(chapter.id)}
            className="w-full group flex items-start gap-4 p-4 md:p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-black dark:hover:border-white hover:shadow-md transition-all duration-300 text-left"
          >
            {/* Number Bubble */}
            <div className="flex-none w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-colors mt-0.5">
              <span className="font-black text-sm text-stone-700 dark:text-stone-300 group-hover:text-white dark:group-hover:text-black group-hover:hidden transition-colors">
                {index + 1}
              </span>
              <PlayCircle className="w-5 h-5 text-white dark:text-black hidden group-hover:block" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm md:text-base font-black text-stone-900 dark:text-stone-100 tracking-tight mb-1.5 leading-snug break-words">
                {chapter.title}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {chapter.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={10} /> Leer · Quiz · Tarea
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex flex-none items-center self-center text-stone-300 group-hover:text-black dark:group-hover:text-white transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
