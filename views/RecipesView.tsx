import React, { useState } from 'react';
import { EspressoView } from './EspressoCalibrationView';
import { Coffee, Filter, ChevronRight, ArrowLeft } from 'lucide-react';

export const RecipesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'none' | 'espresso' | 'filter'>('none');

  if (selectedCategory === 'espresso') {
    return (
      <div className="relative">
        <button 
          onClick={() => setSelectedCategory('none')}
          className="fixed top-24 left-4 lg:left-8 z-10 p-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-full border border-stone-200 dark:border-stone-800 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        </button>
        <EspressoView />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in px-4 pt-8">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-2">Recetas y Calibración</h1>
        <p className="text-stone-500">Gestiona tus perfiles de extracción y guías de preparación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Espresso Card */}
        <button 
          onClick={() => setSelectedCategory('espresso')}
          className="group relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-0 right-0 p-32 bg-stone-100 dark:bg-stone-800 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-stone-900 dark:bg-stone-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Coffee className="w-6 h-6 text-white dark:text-stone-900" />
            </div>
            
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-2">Espresso</h3>
            <p className="text-stone-500 mb-6 text-sm leading-relaxed">
              Control total de tus variables. Registra dosis, ratios, tiempos y notas de cata para cada origen.
            </p>

            <div className="flex items-center text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Entrar <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </button>

        {/* Filter Card (Coming Soon) */}
        <button 
          disabled
          className="group relative overflow-hidden bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 opacity-75 cursor-not-allowed text-left"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-xl flex items-center justify-center mb-6">
              <Filter className="w-6 h-6 text-stone-400" />
            </div>
            
            <h3 className="text-2xl font-black text-stone-400 mb-2">Filtrados</h3>
            <p className="text-stone-400 mb-6 text-sm leading-relaxed">
              V60, Kalita, Aeropress y más. Próximamente podrás registrar tus recetas de métodos manuales.
            </p>

            <div className="inline-flex px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Próximamente
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
