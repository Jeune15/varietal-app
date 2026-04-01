import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EspressoView } from './EspressoCalibrationView';
import { MilkTextureView } from '../components/MilkTextureView';
import { SensoryTrainingView } from './SensoryTrainingView';
import { GreenCoffeeToolView } from './GreenCoffeeToolView';
import { RoastingToolView } from './RoastingToolView';
import { LatteArtView } from './LatteArtView';
import { DrinksView } from './DrinksView';
import { ColdBrewToolView } from './ColdBrewToolView';
import { WaterToolView } from './WaterToolView';
import CuppingView from './CuppingView';
import { Coffee, Filter, Droplet, ChevronRight, ArrowLeft, Brain, Leaf, Flame, AlertTriangle, Eye, Trash2, X, FileDown, Palette, Snowflake } from 'lucide-react';
import { StyledSelect } from '../components/StyledSelect';
import { useToast } from '../contexts/ToastContext';
import { db } from '../db';
import { FilterSession, FilterPour, FilterRecipe, FilterRecipePhase, BrewMethod } from '../types';
import { gsap } from 'gsap';
import { FilterToolView } from './FilterToolView';

export const RecipesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'none' | 'espresso' | 'filter' | 'milk' | 'cupping' | 'greenCoffee' | 'roasting' | 'latteArt' | 'drinks' | 'coldBrew' | 'water'>('none');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const greenCoffeeCardRef = useRef<HTMLButtonElement | null>(null);
  const roastingCardRef = useRef<HTMLButtonElement | null>(null);
  const espressoCardRef = useRef<HTMLButtonElement | null>(null);
  const filterCardRef = useRef<HTMLButtonElement | null>(null);
  const milkCardRef = useRef<HTMLButtonElement | null>(null);
  const cuppingCardRef = useRef<HTMLButtonElement | null>(null);
  const latteArtCardRef = useRef<HTMLButtonElement | null>(null);
  const drinksCardRef = useRef<HTMLButtonElement | null>(null);
  const coldBrewCardRef = useRef<HTMLButtonElement | null>(null);
  const espressoBackHandlerRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    const getScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
      let el: HTMLElement | null = node;
      while (el && el !== document.body && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    const scrollParent = getScrollableParent(rootRef.current);
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [selectedCategory]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: 'power3.out'
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  const handleCategoryCardEnter = (el: HTMLButtonElement | null) => {
    if (!el) return;
    gsap.to(el, { y: -8, scale: 1.03, duration: 0.25, ease: 'power2.out' });
  };

  const handleCategoryCardLeave = (el: HTMLButtonElement | null) => {
    if (!el) return;
    gsap.to(el, { y: 0, scale: 1, duration: 0.25, ease: 'power2.inOut' });
  };

  let content: React.ReactNode = null;

  if (selectedCategory === 'greenCoffee') {
    content = <GreenCoffeeToolView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'roasting') {
    content = <RoastingToolView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'espresso') {
    content = <EspressoView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'filter') {
    content = <FilterToolView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'milk') {
    content = <MilkTextureView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'cupping') {
    content = <SensoryTrainingView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'latteArt') {
    content = <LatteArtView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'drinks') {
    content = <DrinksView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'coldBrew') {
    content = <ColdBrewToolView onBack={() => setSelectedCategory('none')} />;
  } else if (selectedCategory === 'water') {
    content = <WaterToolView onBack={() => setSelectedCategory('none')} />;
  } else {
    content = (
      <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">
            Herramientas
          </h1>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Simuladores, guías y recursos interactivos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Café Verde */}
          <button
            ref={greenCoffeeCardRef}
            onClick={() => setSelectedCategory('greenCoffee')}
            onMouseEnter={() => handleCategoryCardEnter(greenCoffeeCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(greenCoffeeCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Materia prima
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Café Verde
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Variedades, estándares y defectos
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Conoce las variedades, los estándares de calidad del café verde y los defectos que afectan tu taza final.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 2. Tueste */}
          <button
            ref={roastingCardRef}
            onClick={() => setSelectedCategory('roasting')}
            onMouseEnter={() => handleCategoryCardEnter(roastingCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(roastingCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Control de tostado
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Tueste
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Variables, perfiles y diagnóstico
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Domina las variables del tueste, identifica etapas, perfiles y diagnostica problemas de tostado.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 3. Cata */}
          <button
            ref={cuppingCardRef}
            onClick={() => setSelectedCategory('cupping')}
            onMouseEnter={() => handleCategoryCardEnter(cuppingCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(cuppingCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Entrenamiento Sensorial
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Cata
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Simulador, diccionario y educación
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Entrena tu paladar con simuladores de atributos, consulta el diccionario sensorial y mejora tu técnica de cata.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 4. Espresso */}
          <button
            ref={espressoCardRef}
            onClick={() => setSelectedCategory('espresso')}
            onMouseEnter={() => handleCategoryCardEnter(espressoCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(espressoCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Coffee className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Calibración espresso
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Espresso
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Sesiones, calibración y diagnóstico
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Control total de tus variables. Registra dosis, ratios, tiempos y notas de cata para cada origen.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 5. Leche */}
          <button
            ref={milkCardRef}
            onClick={() => setSelectedCategory('milk')}
            onMouseEnter={() => handleCategoryCardEnter(milkCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(milkCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Droplet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Conceptos y técnica
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Leche
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Microespuma, técnica y simuladores
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Aprende la ciencia de la texturización, domina la técnica paso a paso y practica con simuladores interactivos.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 6. Filtrado */}
          <button
            ref={filterCardRef}
            onClick={() => setSelectedCategory('filter')}
            onMouseEnter={() => handleCategoryCardEnter(filterCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(filterCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Filter className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Métodos de filtrado
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Filtrados
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Herramientas, guías y problemas comunes
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Diseña y documenta cada vertido para tus métodos de filtrado manual, con sesiones guiadas y soporte.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 7. Latte Art */}
          <button
            ref={latteArtCardRef}
            onClick={() => setSelectedCategory('latteArt')}
            onMouseEnter={() => handleCategoryCardEnter(latteArtCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(latteArtCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Palette className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Arte en café
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Latte Art
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Técnica, variables y patrones
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Aprende las técnicas de vertido libre y etching. Domina las variables y sigue guías paso a paso para cada patrón.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 8. Bebidas */}
          <button
            ref={drinksCardRef}
            onClick={() => setSelectedCategory('drinks')}
            onMouseEnter={() => handleCategoryCardEnter(drinksCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(drinksCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800">
                  <Coffee className="w-6 h-6 text-stone-400 dark:text-stone-500 group-hover:text-brand transition-colors" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Recetario
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Bebidas
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Calientes, Frías y Jarabes
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Descubre la historia, preparación y perfil sensorial de clásicos del café, así como recetas artesanales de siropes calientes y fríos.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 9. Cold Brew */}
          <button
            ref={coldBrewCardRef}
            onClick={() => setSelectedCategory('coldBrew')}
            onMouseEnter={() => handleCategoryCardEnter(coldBrewCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(coldBrewCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800">
                  <Droplet className="w-6 h-6 text-stone-400 dark:text-stone-500 group-hover:text-brand transition-colors" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Extracción en Frío
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Cold Brew
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Teoría, Recetas y Troubleshooting
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Domina la preparación del Cold Brew. Entiende la ciencia detrás de la extracción en frío, aprende nuevas técnicas y resuelve fallas comunes.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          {/* 10. Agua */}
          <button
            onClick={() => setSelectedCategory('water')}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-stone-400 dark:text-stone-500 group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 4 8.5 4 11a8 8 0 0016 0c0-2.5-2.5-9-8-9z" /></svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Simulador
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Agua
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Mineralización y recetas
                </p>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Simula la composición mineral de tu agua, aprende las métricas SCA y prepara fórmulas para resaltar cuerpo, dulzor o claridad.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Entrar</span>
              <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {content}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[60] w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500/70 dark:border-stone-300/70 mix-blend-difference"
      />
    </div>
  );
};
