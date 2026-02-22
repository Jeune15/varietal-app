import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { CuppingForm, CuppingSession, RoastedStock, FreeCuppingSample, CuppingSessionType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Coffee, User as UserIcon, ClipboardList, SlidersHorizontal, X, ArrowLeft, ArrowRight, Check, Plus, Minus, Calendar } from 'lucide-react';
import { SessionDetailModal } from '../components/CuppingSessionDetail';
import { gsap } from 'gsap';

interface Props {
  stocks: RoastedStock[];
  mode?: 'internal' | 'free' | 'all';
}

const buildEmptyForm = (): CuppingForm => ({
  fragranceIntensity: 0,
  fragranceDescriptors: [],
  fragranceNotes: '',
  aromaIntensity: 0,
  aromaDescriptors: [],
  aromaNotes: '',
  flavorIntensity: 0,
  flavorDescriptors: [],
  flavorNotes: '',
  aftertasteIntensity: 0,
  aftertasteDescriptors: [],
  aftertasteNotes: '',
  acidityIntensity: 0,
  acidityNotes: '',
  sweetnessIntensity: 0,
  sweetnessNotes: '',
  mouthfeelIntensity: 0,
  mouthfeelDescriptors: [],
  mouthfeelNotes: ''
});

const descriptorOptions = {
  aromatic: [
    'Floral', 'Afrutado', 'Bayas', 'Frutas deshidratadas', 'Cítricos',
    'Verde/Vegetal', 'Ácido/Fermentado', 'Ácido', 'Fermentado', 'Otra',
    'Químico', 'Humedad/Tierra', 'Madera'
  ],
  roast: [
    'Tostado', 'Cereal', 'Quemado', 'Tabaco', 'Nueces/Cacao',
    'Nueces', 'Cacao', 'Especias', 'Dulce', 'Vainilla', 'Azúcar morena'
  ],
  taste: [
    'Salado', 'Amargo', 'Ácido', 'Umami', 'Dulce'
  ],
  mouthfeel: [
    'Áspero', 'Suave', 'Metálico', 'Aceitoso', 'Deja seca la boca'
  ]
};

const CuppingView: React.FC<Props> = ({ stocks, mode = 'all' }) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const internalCardRef = useRef<HTMLButtonElement | null>(null);
  const freeCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.2, ease: 'power3.out' });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const liftEnter = (el: HTMLElement | null) => {
    if (!el) return;
    gsap.to(el, { y: -6, scale: 1.02, duration: 0.22, ease: 'power2.out' });
  };
  const liftLeave = (el: HTMLElement | null) => {
    if (!el) return;
    gsap.to(el, { y: 0, scale: 1, duration: 0.22, ease: 'power2.inOut' });
  };

  const [activeTab, setActiveTab] = useState<'form' | 'recent'>('form');
  
  // Flow State
  const [viewStep, setViewStep] = useState<'type-selection' | 'setup-samples' | 'analysis'>('type-selection');
  const [sessionType, setSessionType] = useState<CuppingSessionType | null>(null);

  // Internal Session State
  const [selectedStockId, setSelectedStockId] = useState('');
  const [tasterName, setTasterName] = useState('');
  const [objective, setObjective] = useState('');
  const [internalForm, setInternalForm] = useState<CuppingForm>(() => buildEmptyForm());

  // Free Session State
  const [numSamples, setNumSamples] = useState(1);
  const [freeSamples, setFreeSamples] = useState<FreeCuppingSample[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);

  const [selectedSession, setSelectedSession] = useState<CuppingSession | null>(null);

  const cuppingSessions = useLiveQuery(() => db.cuppingSessions.orderBy('date').reverse().toArray(), []) || [];
  
  const filteredSessions = useMemo(() => {
    if (mode === 'all') return cuppingSessions;
    return cuppingSessions.filter(s => {
      // Legacy sessions (no sessionType) are considered internal
      if (mode === 'internal') return s.sessionType === 'internal' || !s.sessionType;
      if (mode === 'free') return s.sessionType === 'free';
      return true;
    });
  }, [cuppingSessions, mode]);

  const availableStocks = useMemo(
    () => stocks.filter(s => s.remainingQtyKg > 0),
    [stocks]
  );

  const selectedStock = useMemo(
    () => availableStocks.find(s => s.id === selectedStockId) || null,
    [availableStocks, selectedStockId]
  );

  // Initialize free samples when numSamples changes or type is selected
  const initFreeSamples = (count: number) => {
    const newSamples: FreeCuppingSample[] = Array.from({ length: count }, (_, i) => ({
      id: crypto.randomUUID(),
      brand: '',
      variety: '',
      origin: '',
      process: '',
      roastType: '',
      roastDate: '',
      restDays: 0,
      notes: '',
      form: buildEmptyForm()
    }));
    setFreeSamples(newSamples);
    setCurrentSampleIndex(0);
  };

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestNavigation = (action: () => void) => {
    // Only confirm if we are in a session (setup or analysis) and data might be lost
    // For simplicity, if we are in 'analysis' or 'setup-samples', we confirm.
    if (viewStep === 'analysis' || viewStep === 'setup-samples') {
      setPendingAction(() => action);
      setShowExitConfirm(true);
    } else {
      action();
    }
  };

  const confirmExit = () => {
    if (pendingAction) pendingAction();
    setShowExitConfirm(false);
    setPendingAction(null);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    setPendingAction(null);
  };

  // Initialize/Reset based on mode
  useEffect(() => {
    if (mode === 'internal') {
      setSessionType('internal');
      setViewStep('analysis');
      setInternalForm(buildEmptyForm());
    } else if (mode === 'free') {
      setActiveTab('form');
      setSessionType(null);
      setViewStep('type-selection');
      setNumSamples(1);
    } else {
      setSessionType(null);
      setViewStep('type-selection');
    }
  }, [mode]);

  const handleStartSetup = (type: CuppingSessionType) => {
    setSessionType(type);
    if (type === 'internal') {
      setViewStep('analysis'); // Internal goes straight to analysis/setup combined screen (legacy style)
      setInternalForm(buildEmptyForm());
    } else {
      setNumSamples(1);
      setViewStep('setup-samples');
      initFreeSamples(1);
    }
  };

  const calculateRestDays = (dateStr: string) => {
    if (!dateStr) return 0;
    const roast = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - roast.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const updateFreeSample = (index: number, field: keyof FreeCuppingSample, value: any) => {
    setFreeSamples(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calc rest days
      if (field === 'roastDate') {
        updated[index].restDays = calculateRestDays(value as string);
      }
      
      return updated;
    });
  };

  const updateFreeSampleForm = (index: number, field: keyof CuppingForm, value: any) => {
    setFreeSamples(prev => {
      const updated = [...prev];
      const currentForm = updated[index].form;
      
      // Handle array toggles for descriptors
      if (Array.isArray(currentForm[field]) && typeof value === 'string') {
        const currentArr = currentForm[field] as string[];
        const exists = currentArr.includes(value);
        const nextValues = exists ? currentArr.filter(v => v !== value) : [...currentArr, value];
        updated[index].form = { ...currentForm, [field]: nextValues };
      } else {
        // Direct assignment for other fields
        updated[index].form = { ...currentForm, [field]: value };
      }
      
      return updated;
    });
  };

  // Helper for internal form updates
  const updateInternalForm = (field: keyof CuppingForm, value: any) => {
    setInternalForm(prev => {
      if (Array.isArray(prev[field]) && typeof value === 'string') {
        const currentArr = prev[field] as string[];
        const exists = currentArr.includes(value);
        const nextValues = exists ? currentArr.filter(v => v !== value) : [...currentArr, value];
        return { ...prev, [field]: nextValues };
      } else {
        return { ...prev, [field]: value };
      }
    });
  };

  const handleSaveSession = async () => {
    if (!canEdit) return;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    let session: CuppingSession;

    if (sessionType === 'internal') {
      if (!selectedStock || !tasterName.trim()) {
        showToast('Faltan datos requeridos (Lote o Catador)', 'error');
        return;
      }
      session = {
        id,
        sessionType: 'internal',
        roastStockId: selectedStock.id,
        roastId: selectedStock.roastId,
        coffeeName: selectedStock.variety, // Legacy support
        clientName: selectedStock.clientName, // Legacy support
        tasterName: tasterName.trim(),
        date: new Date().toISOString(),
        objective: objective.trim() || undefined,
        form: internalForm
      };
    } else {
      // Free session validation
      if (!tasterName.trim()) {
        showToast('Falta nombre del catador', 'error');
        return;
      }
      // Check if all samples have at least brand/variety
      const invalidSample = freeSamples.find(s => !s.brand || !s.variety);
      if (invalidSample) {
        showToast('Complete la información de todas las muestras', 'error');
        return;
      }

      session = {
        id,
        sessionType: 'free',
        tasterName: tasterName.trim(),
        date: new Date().toISOString(),
        samples: freeSamples
      };
    }

    await db.cuppingSessions.put(session);
    await syncToCloud('cuppingSessions', session);

    showToast('Sesión de catación guardada', 'success');
    
    // Reset state
    setActiveTab('recent');
    setViewStep('type-selection');
    setSessionType(null);
    setInternalForm(buildEmptyForm());
    setFreeSamples([]);
  };

  const renderScale = (
    label: string, 
    intensityField: keyof CuppingForm, 
    notesField: keyof CuppingForm,
    currentForm: CuppingForm,
    onUpdate: (field: keyof CuppingForm, value: any) => void
  ) => (
    <div className="border border-stone-200 dark:border-stone-800 p-4 space-y-4 bg-white dark:bg-stone-900">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">{label}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Intensidad</span>
          </div>
        </div>
        <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
          {Number((currentForm[intensityField] as number) ?? 0).toFixed(2)} / 10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.25}
        value={(currentForm[intensityField] as number) ?? 0}
        onChange={e => onUpdate(intensityField, Number(e.target.value))}
        className="w-full accent-black dark:accent-white"
      />
      <textarea
        value={(currentForm[notesField] as string) ?? ''}
        onChange={e => onUpdate(notesField, e.target.value)}
        placeholder="Notas..."
        className="w-full mt-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-white px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white resize-none h-16 placeholder:text-stone-400 dark:placeholder:text-stone-600"
      />
    </div>
  );

  const renderDescriptors = (
    title: string,
    fields: { label: string; field: keyof CuppingForm; options: string[] }[],
    currentForm: CuppingForm,
    onUpdate: (field: keyof CuppingForm, value: any) => void
  ) => (
    <div className="border border-stone-200 dark:border-stone-800 p-4 space-y-4 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-stone-500 dark:text-stone-400" />
        <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">{title}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(group => (
          <div key={group.label} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map(option => {
                const selected = (currentForm[group.field] as string[]).includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onUpdate(group.field, option)}
                    className={`px-2 py-1 border text-[10px] uppercase tracking-widest transition-colors ${
                      selected
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
    <div className="space-y-10 max-w-6xl mx-auto pb-32 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div className="space-y-2">
          <h3 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase transition-all duration-300">Catación</h3>
          <p className="text-[11px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">
            Sistema descriptivo de evaluación sensorial
          </p>
        </div>
        <div className="flex gap-3">
            <button
              type="button"
              onClick={() => requestNavigation(() => {
                setActiveTab('form');
                setViewStep('type-selection');
                setSessionType(null);
              })}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${
                activeTab === 'form'
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              Nueva sesión
            </button>
            <button
              type="button"
              onClick={() => requestNavigation(() => setActiveTab('recent'))}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${
                activeTab === 'recent'
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              Sesiones recientes
            </button>
        </div>
      </div>

      {!canEdit && activeTab === 'form' && (
        <div className="border border-dashed border-stone-300 dark:border-stone-700 p-10 text-center text-sm text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">
          Solo usuarios autorizados pueden registrar sesiones de catación
        </div>
      )}

      {canEdit && activeTab === 'form' && viewStep === 'type-selection' && (
        <div className={`grid grid-cols-1 ${mode === 'all' ? 'md:grid-cols-2' : 'md:grid-cols-1 justify-center'} gap-8 max-w-4xl mx-auto`}>
           {mode !== 'free' && (
          <button
             ref={internalCardRef}
             onMouseEnter={() => liftEnter(internalCardRef.current)}
             onMouseLeave={() => liftLeave(internalCardRef.current)}
             onClick={() => handleStartSetup('internal')}
             className="group flex flex-col items-center justify-center gap-6 p-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
           >
             <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
               <Coffee className="w-8 h-8" />
             </div>
             <div className="text-center space-y-2">
               <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Cata Interna</h3>
               <p className="text-xs text-stone-500 dark:text-stone-400 font-medium max-w-[200px]">
                 Evaluar café tostado del inventario actual
               </p>
             </div>
           </button>
           )}

           {mode !== 'internal' && (
          <div
             ref={freeCardRef}
             onMouseEnter={() => liftEnter(freeCardRef.current)}
             onMouseLeave={() => liftLeave(freeCardRef.current)}
             className={`group flex flex-col items-center justify-center gap-6 p-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${mode === 'free' ? 'max-w-md mx-auto w-full' : ''}`}
           >
             <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-900 dark:text-white">
               <ClipboardList className="w-8 h-8" />
             </div>
             <div className="text-center space-y-4 w-full">
               <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Cata Libre</h3>
                 <p className="text-xs text-stone-500 dark:text-stone-400 font-medium max-w-[200px] mx-auto">
                   Evaluar muestras externas o experimentales
                 </p>
               </div>
               <div className="space-y-4 w-full max-w-[200px] mx-auto">
                 <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                   <button 
                      onClick={() => setNumSamples(Math.max(1, numSamples - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800 rounded-full"
                   >
                     <Minus className="w-4 h-4" />
                   </button>
                   <div className="text-center">
                      <span className="block text-2xl font-black">{numSamples}</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Muestras</span>
                   </div>
                   <button 
                      onClick={() => setNumSamples(Math.min(20, numSamples + 1))}
                      className="w-8 h-8 flex items-center justify-center border border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800 rounded-full"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
                 
                 <div className="space-y-1">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400 text-center">Catador/a</label>
                    <input
                       type="text"
                       value={tasterName}
                       onChange={e => setTasterName(e.target.value)}
                       placeholder="Tu nombre"
                       className="w-full bg-transparent border-b border-stone-300 dark:border-stone-700 py-1 text-sm font-bold focus:border-black outline-none text-center"
                    />
                 </div>
               </div>
               <button
                 onClick={() => {
                   initFreeSamples(numSamples);
                   setSessionType('free');
                   setViewStep('setup-samples');
                 }}
                 className="w-full py-3 bg-black text-white dark:bg-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
               >
                 Comenzar
               </button>
             </div>
           </div>
           )}
        </div>
      )}

      {canEdit && activeTab === 'form' && viewStep === 'setup-samples' && sessionType === 'free' && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => requestNavigation(() => setViewStep('type-selection'))}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
               <h3 className="text-xl font-black uppercase tracking-tight">Configuración de Muestras</h3>
               <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
                 Muestra {currentSampleIndex + 1} de {numSamples}
               </p>
            </div>
            <div className="flex gap-1">
              {freeSamples.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    idx === currentSampleIndex ? 'bg-black dark:bg-white' : 
                    idx < currentSampleIndex ? 'bg-stone-300 dark:bg-stone-700' : 'bg-stone-100 dark:bg-stone-800'
                  }`} 
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Marca</label>
                   <input 
                      type="text"
                      value={freeSamples[currentSampleIndex].brand}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'brand', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                      placeholder="Nombre de la marca"
                      autoFocus
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Variedad</label>
                   <input 
                      type="text"
                      value={freeSamples[currentSampleIndex].variety}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'variety', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                      placeholder="Ej. Geisha, Bourbon"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Origen</label>
                   <input 
                      type="text"
                      value={freeSamples[currentSampleIndex].origin}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'origin', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                      placeholder="Región, Finca..."
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Proceso</label>
                   <input 
                      type="text"
                      value={freeSamples[currentSampleIndex].process}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'process', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                      placeholder="Ej. Lavado, Natural"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Tipo de Tueste</label>
                   <select
                      value={freeSamples[currentSampleIndex].roastType}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'roastType', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                   >
                      <option value="">Seleccionar...</option>
                      <option value="Filtro">Filtro</option>
                      <option value="Espresso">Espresso</option>
                      <option value="Omni">Omni</option>
                      <option value="Cata">Cata</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Fecha de Tostado</label>
                   <input 
                      type="date"
                      value={freeSamples[currentSampleIndex].roastDate}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'roastDate', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Días de Reposo</label>
                   <input 
                      type="number"
                      value={freeSamples[currentSampleIndex].restDays}
                      readOnly
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-medium text-stone-500 outline-none"
                   />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Anotaciones Extra</label>
                   <textarea 
                      value={freeSamples[currentSampleIndex].notes}
                      onChange={(e) => updateFreeSample(currentSampleIndex, 'notes', e.target.value)}
                      className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-transparent text-sm font-medium focus:border-black dark:focus:border-white outline-none resize-none h-20"
                      placeholder="Cualquier detalle adicional..."
                   />
                </div>
             </div>

             <div className="flex justify-between pt-6 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => setCurrentSampleIndex(Math.max(0, currentSampleIndex - 1))}
                  disabled={currentSampleIndex === 0}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:text-stone-600"
                >
                  Anterior
                </button>
                {currentSampleIndex < numSamples - 1 ? (
                   <button
                     onClick={() => {
                        // Simple validation
                        if (!freeSamples[currentSampleIndex].brand) {
                           showToast('Ingrese al menos la marca', 'error');
                           return;
                        }
                        setCurrentSampleIndex(currentSampleIndex + 1);
                     }}
                     className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-80"
                   >
                     Siguiente
                   </button>
                ) : (
                   <button
                     onClick={() => {
                        if (!freeSamples[currentSampleIndex].brand) {
                           showToast('Ingrese al menos la marca', 'error');
                           return;
                        }
                        setViewStep('analysis');
                        setCurrentSampleIndex(0); // Reset to first sample for analysis
                     }}
                     className="px-6 py-2 bg-brand text-white text-xs font-bold uppercase tracking-widest hover:opacity-90"
                   >
                     Ir al Análisis
                   </button>
                )}
             </div>
          </div>
        </div>
      )}

      {canEdit && activeTab === 'form' && viewStep === 'analysis' && (
        <div className="grid grid-cols-1 gap-8 animate-fade-in">
          {/* Header Info */}
          <div className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 -mt-8 -mx-4 md:-mx-10 px-4 md:px-10 py-6 mb-2 sticky top-0 z-10 shadow-sm">
             <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-4 items-center">
                {sessionType === 'internal' ? (
                   <div className="w-full">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Café</label>
                         <select
                           value={selectedStockId}
                           onChange={e => setSelectedStockId(e.target.value)}
                           className="w-full bg-transparent border-b border-stone-300 dark:border-stone-700 py-1 text-sm font-bold focus:border-black outline-none"
                         >
                           <option value="">Seleccionar lote...</option>
                           {availableStocks.map(stock => (
                             <option key={stock.id} value={stock.id}>
                               {stock.variety} ({stock.clientName})
                             </option>
                           ))}
                         </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Catador</label>
                          <input
                             type="text"
                             value={tasterName}
                             onChange={e => setTasterName(e.target.value)}
                             placeholder="Nombre"
                             className="w-full bg-transparent border-b border-stone-300 dark:border-stone-700 py-1 text-sm font-bold focus:border-black outline-none"
                          />
                       </div>
                     </div>
                   </div>
                ) : (
                   <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <button 
                            onClick={() => setCurrentSampleIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentSampleIndex === 0}
                            className="p-2 border border-stone-200 dark:border-stone-700 rounded-full disabled:opacity-30 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                         >
                            <ArrowLeft className="w-4 h-4" />
                         </button>
                         <div>
                            <span className="block text-[9px] font-bold uppercase tracking-widest text-stone-500">Muestra {currentSampleIndex + 1} de {numSamples}</span>
                            <h3 className="text-lg font-black uppercase tracking-tight leading-none mt-1">
                               {freeSamples[currentSampleIndex].brand} - {freeSamples[currentSampleIndex].variety}
                            </h3>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right hidden sm:block">
                            <span className="block text-[9px] font-bold uppercase tracking-widest text-stone-500">Catador</span>
                            <input
                               type="text"
                               value={tasterName}
                               onChange={e => setTasterName(e.target.value)}
                               placeholder="Nombre"
                               className="bg-transparent border-b border-stone-300 dark:border-stone-700 py-1 text-sm font-bold focus:border-black outline-none text-right w-32"
                            />
                         </div>
                         <button 
                            onClick={() => setCurrentSampleIndex(prev => Math.min(numSamples - 1, prev + 1))}
                            disabled={currentSampleIndex === numSamples - 1}
                            className="p-2 border border-stone-200 dark:border-stone-700 rounded-full disabled:opacity-30 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                         >
                            <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="space-y-6">
            {/* The Form */}
            {(() => {
               const currentForm = sessionType === 'internal' ? internalForm : freeSamples[currentSampleIndex].form;
               const handleUpdate = sessionType === 'internal' 
                  ? updateInternalForm 
                  : (field: keyof CuppingForm, value: any) => updateFreeSampleForm(currentSampleIndex, field, value);

               return (
                 <div className="animate-fade-in" key={currentSampleIndex}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {renderScale('Fragancia', 'fragranceIntensity', 'fragranceNotes', currentForm, handleUpdate)}
                        {renderScale('Aroma', 'aromaIntensity', 'aromaNotes', currentForm, handleUpdate)}
                      </div>
                      <div className="space-y-4">
                        {renderDescriptors('Calificadores Aromáticos', [
                          { label: 'Familias aromáticas', field: 'fragranceDescriptors', options: descriptorOptions.aromatic },
                          { label: 'Notas de tueste', field: 'aromaDescriptors', options: descriptorOptions.roast }
                        ], currentForm, handleUpdate)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-4">
                        {renderScale('Sabor', 'flavorIntensity', 'flavorNotes', currentForm, handleUpdate)}
                        {renderScale('Sabor residual', 'aftertasteIntensity', 'aftertasteNotes', currentForm, handleUpdate)}
                      </div>
                      <div className="space-y-4">
                        {renderDescriptors('Gustos predominantes', [
                          { label: 'Gustos básicos', field: 'flavorDescriptors', options: descriptorOptions.taste },
                          { label: 'Gustos en retrogusto', field: 'aftertasteDescriptors', options: descriptorOptions.taste }
                        ], currentForm, handleUpdate)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-4">
                        {renderScale('Acidez', 'acidityIntensity', 'acidityNotes', currentForm, handleUpdate)}
                        {renderScale('Dulzor', 'sweetnessIntensity', 'sweetnessNotes', currentForm, handleUpdate)}
                      </div>
                      <div className="space-y-4">
                        {renderScale('Sensación en boca', 'mouthfeelIntensity', 'mouthfeelNotes', currentForm, handleUpdate)}
                        {renderDescriptors('Sensación en boca', [
                          { label: 'Textura', field: 'mouthfeelDescriptors', options: descriptorOptions.mouthfeel }
                        ], currentForm, handleUpdate)}
                      </div>
                    </div>
                 </div>
               );
            })()}

            <div className="flex justify-end pt-8 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={handleSaveSession}
                className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-[0.25em] border border-black hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-stone-200"
              >
                Guardar Sesión Completa
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="border border-stone-200 bg-white dark:bg-stone-900 dark:border-stone-800">
          <div className="p-6 border-b border-stone-200 bg-stone-50 dark:bg-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-stone-600 dark:text-stone-300">
                Sesiones recientes
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
              {filteredSessions.length} sesiones
            </span>
          </div>
          {/* List of sessions */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 font-medium uppercase text-sm border-stone-300">
                Aún no hay sesiones de catación registradas
              </div>
            ) : (
              filteredSessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => setSelectedSession(session)}
                  className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      {/* Taster Name - Primary */}
                      <div className="font-black text-sm uppercase tracking-tight text-black dark:text-white">
                         {session.tasterName || 'Sin nombre'}
                      </div>

                      {/* Coffee Info */}
                      {session.sessionType === 'free' ? (
                           <div className="text-xs font-bold text-stone-600 dark:text-stone-300">
                             {session.samples?.[0]?.brand} - {session.samples?.[0]?.variety}
                             {session.samples && session.samples.length > 1 && <span className="text-stone-400"> +{session.samples.length - 1}</span>}
                           </div>
                      ) : (
                           <div className="text-xs font-bold text-stone-600 dark:text-stone-300">
                             {session.coffeeName} <span className="text-stone-400 font-medium">({session.clientName})</span>
                           </div>
                      )}

                      {/* Date & Count */}
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                         <span>{new Date(session.date).toLocaleDateString()}</span>
                         <span>•</span>
                         <span>
                           {session.sessionType === 'free' 
                              ? `${session.samples?.length || 0} muestras`
                              : 'Cata Interna'}
                         </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedSession(session)}
                      className="p-2 text-stone-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                       <ClipboardList className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedSession && createPortal(
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />,
        document.body
      )}

      {/* Confirmation Modal */}
      {showExitConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 transform scale-100 transition-all">
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">
              ¿Estás seguro?
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 font-medium">
              Si sales ahora, podrías perder el progreso de la sesión actual.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[60] w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500/70 dark:border-stone-300/70 mix-blend-difference"
      />
    </div>
    </>
  );
};

export default CuppingView;
