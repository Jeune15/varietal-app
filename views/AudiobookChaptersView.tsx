import React from 'react';
import { ChevronLeft, PlayCircle, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

interface Props {
  categoryId: string;
  onBack: () => void;
  onSelectChapter: (chapterId: string) => void;
}

const AudiobookChaptersView: React.FC<Props> = ({ categoryId, onBack, onSelectChapter }) => {
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
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Volver a Audiolibros</span>
          </button>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase flex items-center gap-3">
            {category.title}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 uppercase tracking-widest">
            {category.description}
          </p>
        </div>
      </div>

      {/* Chapters List */}
      <div className="max-w-4xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">Índice de Capítulos</h3>
        
        {category.chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => onSelectChapter(chapter.id)}
            className="w-full group flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-black dark:hover:border-white transition-all duration-300 text-left"
          >
            {/* Number/Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
              <span className="font-black text-lg group-hover:hidden">{index + 1}</span>
              <PlayCircle className="w-6 h-6 hidden group-hover:block" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-1 truncate">
                {chapter.title}
              </h4>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {chapter.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={12} /> Leer y Escuchar
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden sm:block flex-shrink-0 text-stone-300 group-hover:text-brand transition-colors">
              <ChevronRight size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AudiobookChaptersView;
