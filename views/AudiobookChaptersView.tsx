import React from 'react';
import { PlayCircle, BookOpen, Clock, ArrowLeft } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto pb-32 animate-fade-in px-4 pt-8 flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
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
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-medium mt-2 max-w-2xl">
                {category.description}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-full">
                  {category.chapters.length} capítulos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Capítulos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {category.chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              className="group relative aspect-square flex flex-col justify-between p-6 md:p-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl hover:border-black dark:hover:border-white hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-colors shrink-0">
                  <span className="font-black text-sm text-stone-700 dark:text-stone-300 group-hover:hidden transition-colors">
                    {index + 1}
                  </span>
                  <PlayCircle className="w-5 h-5 text-white dark:text-black hidden group-hover:block" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 rounded-full">
                  {chapter.duration}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100 leading-tight line-clamp-4">
                  {chapter.title}
                </h4>
              </div>

              <div className="pt-5 border-t border-stone-100 dark:border-stone-800 flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Contenido</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    <BookOpen size={10} /> Leer · Quiz · Tarea
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-all shadow-sm shrink-0">
                  <PlayCircle className="w-4 h-4 text-stone-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
