import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Coffee, 
  Plus, 
  History, 
  BookOpen, 
  AlertTriangle, 
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  Scale,
  Settings,
  Droplets,
  ChevronDown,
  ChevronUp,
  X,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Trash2,
  Eye
} from 'lucide-react';
import { EspressoSession, EspressoShot, SensoryAnalysis } from '../types';
import { useToast } from '../contexts/ToastContext';

const CalibrationGuide = () => (
  <div className="space-y-8 animate-fade-in">
    <div className="bg-stone-100 dark:bg-stone-900/50 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
      <h3 className="text-xl font-bold mb-4 text-stone-800 dark:text-stone-200">La Receta Base</h3>
      <p className="text-stone-600 dark:text-stone-400 mb-4">
        Para empezar a calibrar, recomendamos partir de una proporción (ratio) de 1:2.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm">
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1">Dosis (In)</p>
          <p className="text-2xl font-black text-brand dark:text-brand-light">18g - 20g</p>
          <p className="text-xs text-stone-400 mt-1">Depende del filtro</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm">
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1">Rendimiento (Out)</p>
          <p className="text-2xl font-black text-brand dark:text-brand-light">36g - 40g</p>
          <p className="text-xs text-stone-400 mt-1">Ratio 1:2</p>
        </div>
        <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm">
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1">Tiempo</p>
          <p className="text-2xl font-black text-brand dark:text-brand-light">25s - 30s</p>
          <p className="text-xs text-stone-400 mt-1">Desde que accionas la bomba</p>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">Pasos para Calibrar</h3>
      <ol className="list-decimal list-inside space-y-3 text-stone-600 dark:text-stone-400">
        <li className="pl-2"><span className="font-bold text-stone-800 dark:text-stone-200">Prepara el puck:</span> Distribuye homogéneamente y compacta (tamp) nivelado.</li>
        <li className="pl-2"><span className="font-bold text-stone-800 dark:text-stone-200">Pesa y Cronometra:</span> Usa una balanza bajo la taza. Inicia el tiempo al encender la máquina.</li>
        <li className="pl-2"><span className="font-bold text-stone-800 dark:text-stone-200">Detén por peso:</span> Corta la extracción 2g antes de tu peso objetivo (goteo residual).</li>
        <li className="pl-2"><span className="font-bold text-stone-800 dark:text-stone-200">Evalúa y Ajusta:</span> 
          <ul className="list-disc list-inside pl-6 mt-2 space-y-1 text-sm">
            <li>Si salió muy rápido (&lt; 25s) → Afina la molienda.</li>
            <li>Si salió muy lento (&gt; 30s) → Engruesa la molienda.</li>
            <li>Si el tiempo está bien pero sabe ácido → Aumenta el ratio (más agua) o temperatura.</li>
            <li>Si el tiempo está bien pero sabe amargo → Disminuye el ratio (menos agua) o temperatura.</li>
          </ul>
        </li>
      </ol>
    </div>
  </div>
);

const TroubleshootingGuide = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const problems = [
    {
      id: 'fast-flow',
      title: 'Flujo muy rápido (< 20s)',
      cause: 'Molienda muy gruesa, canalización, o dosis muy baja.',
      solution: 'Afina la molienda (número más bajo). Revisa tu distribución y compactado. Aumenta la dosis si el filtro lo permite.'
    },
    {
      id: 'slow-flow',
      title: 'Flujo muy lento (> 35s) o goteo',
      cause: 'Molienda muy fina o dosis excesiva.',
      solution: 'Engruesa la molienda (número más alto). Disminuye la dosis.'
    },
    {
      id: 'sour-taste',
      title: 'Sabor Ácido / Agrio',
      cause: 'Sub-extracción. El agua no sacó suficientes compuestos.',
      solution: 'Aumenta el rendimiento (ratio 1:2.2 o 1:2.5). Sube la temperatura. Afina la molienda ligeramente.'
    },
    {
      id: 'bitter-taste',
      title: 'Sabor Amargo / Seco',
      cause: 'Sobre-extracción. El agua sacó demasiados compuestos indeseables.',
      solution: 'Disminuye el rendimiento (ratio 1:1.8 o 1:1.5). Baja la temperatura. Engruesa la molienda ligeramente.'
    },
    {
      id: 'channeling',
      title: 'Canalización (Chorros disparejos)',
      cause: 'Mala distribución o compactado desnivelado.',
      solution: 'Usa herramientas de distribución (WDT). Asegúrate de compactar con fuerza consistente y totalmente nivelado.'
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {problems.map((item) => (
        <div key={item.id} className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-900">
          <button
            onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <span className="font-bold text-stone-800 dark:text-stone-200">{item.title}</span>
            {openItem === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openItem === item.id && (
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
              <div className="mb-2">
                <span className="text-xs font-bold uppercase text-red-500">Causa posible:</span>
                <p className="text-sm text-stone-600 dark:text-stone-400">{item.cause}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-green-600">Solución:</span>
                <p className="text-sm text-stone-600 dark:text-stone-400">{item.solution}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Extraction Analysis Component ---
const ExtractionAnalysisForm: React.FC<{ 
  extraction: number; 
  tasteBalance: string[];
  onExtractionChange: (val: number) => void;
  onTasteBalanceToggle: (type: string) => void;
}> = ({ extraction, tasteBalance, onExtractionChange, onTasteBalanceToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-brand" />
          Extracción
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="p-6 space-y-6 animate-slide-up">
          {/* Extraction Slider */}
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Nivel de Extracción</label>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                extraction < 40 ? 'bg-blue-100 text-blue-700' :
                extraction > 60 ? 'bg-red-100 text-red-700' :
                'bg-green-100 text-green-700'
              }`}>
                {extraction < 40 ? 'Sub-extracción' :
                 extraction > 60 ? 'Sobre-extracción' :
                 'Buena extracción'}
              </span>
            </div>
            <div className="relative h-6">
              <input
                type="range"
                min="0"
                max="100"
                value={extraction}
                onChange={e => onExtractionChange(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-lg appearance-none cursor-pointer absolute top-2"
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 uppercase font-bold tracking-widest">
              <span>Sub</span>
              <span>Buena</span>
              <span>Sobre</span>
            </div>
          </div>

          {/* Taste Balance (Multi-select) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Balance de Sabor</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['sour', 'sweet', 'balanced', 'bitter'].map((type) => {
                const isSelected = tasteBalance.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onTasteBalanceToggle(type)}
                    className={`p-3 rounded-lg border text-xs font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-black border-transparent transform scale-105'
                        : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-900'
                    }`}
                  >
                    {type === 'sour' ? 'Ácido' : type === 'sweet' ? 'Dulce' : type === 'balanced' ? 'Balance' : 'Amargo'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sensory Analysis Component ---
const SensoryAnalysisForm: React.FC<{ value: SensoryAnalysis; onChange: (val: SensoryAnalysis) => void }> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand" />
          Análisis Sensorial
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="p-6 space-y-6 animate-slide-up">
          {/* Crema */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Crema</label>
            <input
              type="text"
              value={value.crema}
              onChange={e => onChange({ ...value, crema: e.target.value })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Ej. Elástica, atigrada, persistente..."
            />
          </div>

          {/* Acidez */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Acidez</label>
            </div>
            <select
              value={value.acidity.quality || ''}
              onChange={e => onChange({ ...value, acidity: { ...value.acidity, quality: e.target.value as any } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none appearance-none"
            >
              <option value="">Seleccionar calidad...</option>
              <option value="positive">Positiva (Brillante, Vibrante)</option>
              <option value="negative">Negativa (Agria, Punzante)</option>
            </select>
            <input
              type="text"
              value={value.acidity.description}
              onChange={e => onChange({ ...value, acidity: { ...value.acidity, description: e.target.value } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Descripción de la acidez..."
            />
          </div>

          {/* Dulzor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Dulzor</label>
              <div className="flex gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onChange({ ...value, sweetness: { ...value.sweetness, present: true } })}
                  className={`px-3 py-1 rounded-full transition-colors ${value.sweetness.present === true ? 'bg-brand text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}
                >
                  SÍ
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, sweetness: { ...value.sweetness, present: false } })}
                  className={`px-3 py-1 rounded-full transition-colors ${value.sweetness.present === false ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}
                >
                  NO
                </button>
              </div>
            </div>
            <input
              type="text"
              value={value.sweetness.intensity}
              onChange={e => onChange({ ...value, sweetness: { ...value.sweetness, intensity: e.target.value } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Intensidad (Ej. Alta, media, baja)..."
            />
          </div>

          {/* Amargor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Amargor</label>
            </div>
            <select
              value={value.bitterness.quality || ''}
              onChange={e => onChange({ ...value, bitterness: { ...value.bitterness, quality: e.target.value as any } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none appearance-none"
            >
              <option value="">Seleccionar calidad...</option>
              <option value="positive">Positiva (Agradable, Chocolate)</option>
              <option value="negative">Negativa (Seco, Astringente)</option>
            </select>
            <input
              type="text"
              value={value.bitterness.description}
              onChange={e => onChange({ ...value, bitterness: { ...value.bitterness, description: e.target.value } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Descripción del amargor..."
            />
          </div>

          {/* Cuerpo */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Cuerpo</label>
            <input
              type="text"
              value={value.body}
              onChange={e => onChange({ ...value, body: e.target.value })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Ej. Sedoso, ligero, pesado..."
            />
          </div>

          {/* Postgusto */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Postgusto</label>
            <select
              value={value.aftertaste.duration || ''}
              onChange={e => onChange({ ...value, aftertaste: { ...value.aftertaste, duration: e.target.value as any } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none appearance-none mb-2"
            >
              <option value="">Seleccionar duración...</option>
              <option value="quick">Rápido</option>
              <option value="semi-prolonged">Semiprolongado</option>
              <option value="prolonged">Prolongado</option>
            </select>
            <input
              type="text"
              value={value.aftertaste.description}
              onChange={e => onChange({ ...value, aftertaste: { ...value.aftertaste, description: e.target.value } })}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Descripción del postgusto..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Session Form ---
const CalibrationSessionForm: React.FC<{ onCancel: () => void; onSave: () => void }> = ({ onCancel, onSave }) => {
  const { showToast } = useToast();
  
  // Session Level State
  const [sessionData, setSessionData] = useState({
    baristaName: '',
    coffeeName: '',
    notes: ''
  });

  const [shots, setShots] = useState<EspressoShot[]>([]);
  
  // Current Shot Form State
  const [currentShot, setCurrentShot] = useState<Partial<EspressoShot>>({
    recipeName: 'Receta 1',
    grindSetting: '',
    doseIn: 18,
    yieldOut: 36,
    timeSeconds: 28,
    extraction: 50,
    tasteBalance: [],
    sensory: {
      crema: '',
      acidity: { quality: null, description: '' },
      sweetness: { present: null, intensity: '' },
      bitterness: { quality: null, description: '' },
      body: '',
      aftertaste: { duration: null, description: '' }
    }
  });

  const handleAddShot = () => {
    if (!currentShot.grindSetting) {
      showToast('Ingresa la molienda para añadir el shot', 'error');
      return;
    }

    const newShot: EspressoShot = {
      id: Math.random().toString(36).substr(2, 9),
      recipeName: currentShot.recipeName || `Receta ${shots.length + 1}`,
      grindSetting: currentShot.grindSetting!,
      doseIn: Number(currentShot.doseIn),
      yieldOut: Number(currentShot.yieldOut),
      timeSeconds: Number(currentShot.timeSeconds),
      extraction: Number(currentShot.extraction),
      tasteBalance: currentShot.tasteBalance || [],
      sensory: currentShot.sensory as SensoryAnalysis,
      notes: currentShot.notes
    };

    setShots([...shots, newShot]);
    
    // Reset form for next shot, keeping some values for easier workflow
    setCurrentShot({
      ...currentShot,
      recipeName: `Receta ${shots.length + 2}`,
      // Keep previous dose/yield/grind as starting point
      notes: '',
      tasteBalance: [],
      sensory: {
        crema: '',
        acidity: { quality: null, description: '' },
        sweetness: { present: null, intensity: '' },
        bitterness: { quality: null, description: '' },
        body: '',
        aftertaste: { duration: null, description: '' }
      }
    });

    showToast('Shot añadido a la sesión', 'success');
  };

  const handleRemoveShot = (id: string) => {
    setShots(shots.filter(s => s.id !== id));
  };

  const handleFinishSession = async () => {
    if (!sessionData.coffeeName) {
      showToast('Ingresa el nombre del café', 'error');
      return;
    }
    if (shots.length === 0) {
      showToast('Registra al menos un shot', 'error');
      return;
    }

    const newSession: EspressoSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      baristaName: sessionData.baristaName || 'Barista',
      coffeeName: sessionData.coffeeName,
      shots: shots,
      notes: sessionData.notes
    };

    try {
      await db.espressoSessions.add(newSession);
      
      // Add summary to history
      await db.history.add({
        id: Math.random().toString(36).substr(2, 9),
        type: 'Calibración',
        date: newSession.date,
        details: {
          title: `Calibración: ${newSession.coffeeName}`,
          subtitle: `${shots.length} recetas probadas`,
          result: `Mejor: ${shots[shots.length-1].grindSetting} (${shots[shots.length-1].timeSeconds}s)`
        }
      });

      showToast('Sesión de calibración guardada', 'success');
      onSave();
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('Error al guardar la sesión', 'error');
    }
  };

  const toggleTasteBalance = (type: string) => {
    const current = currentShot.tasteBalance || [];
    if (current.includes(type)) {
      setCurrentShot({ ...currentShot, tasteBalance: current.filter(t => t !== type) });
    } else {
      setCurrentShot({ ...currentShot, tasteBalance: [...current, type] });
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
      {/* Session Header Info */}
      <div className="bg-stone-100 dark:bg-stone-900/50 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <h2 className="text-lg font-bold mb-4 text-stone-900 dark:text-stone-100">Información de la Sesión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Café</label>
            <input
              type="text"
              required
              value={sessionData.coffeeName}
              onChange={e => setSessionData({...sessionData, coffeeName: e.target.value})}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Ej. Etiopía Yirgacheffe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Barista</label>
            <input
              type="text"
              value={sessionData.baristaName}
              onChange={e => setSessionData({...sessionData, baristaName: e.target.value})}
              className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              placeholder="Nombre del barista"
            />
          </div>
        </div>
      </div>

      {/* Added Shots List */}
      {shots.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-5 h-5" />
            Recetas Probadas ({shots.length})
          </h3>
          <div className="grid gap-4">
            {shots.map((shot, index) => (
              <div key={shot.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between animate-fade-in">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-brand">{shot.recipeName}</span>
                    <span className="text-stone-400 text-xs">Molienda: {shot.grindSetting}</span>
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-3">
                    <span>{shot.doseIn}g in / {shot.yieldOut}g out</span>
                    <span>•</span>
                    <span>{shot.timeSeconds}s</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveShot(shot.id)}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Shot Form */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-brand" />
          Nueva Receta
        </h3>

        <div className="space-y-6">
          {/* Recipe Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-stone-800">
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
              Receta {shots.length + 1}
            </h3>
            <span className="text-xs font-bold uppercase tracking-widest text-brand animate-pulse">
              En Curso
            </span>
          </div>

          {/* Core Variables */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1">
                <Scale className="w-3 h-3" /> Dosis (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={currentShot.doseIn}
                onChange={e => setCurrentShot({...currentShot, doseIn: Number(e.target.value)})}
                className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Salida (g)
              </label>
              <input
                type="number"
                step="0.1"
                value={currentShot.yieldOut}
                onChange={e => setCurrentShot({...currentShot, yieldOut: Number(e.target.value)})}
                className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Tiempo (s)
              </label>
              <input
                type="number"
                step="1"
                value={currentShot.timeSeconds}
                onChange={e => setCurrentShot({...currentShot, timeSeconds: Number(e.target.value)})}
                className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1">
                <Settings className="w-3 h-3" /> Molienda
              </label>
              <input
                type="text"
                value={currentShot.grindSetting}
                onChange={e => setCurrentShot({...currentShot, grindSetting: e.target.value})}
                className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-bold"
                placeholder="Ej. 2.4"
              />
            </div>
          </div>

          {/* Extraction Analysis */}
          <ExtractionAnalysisForm
            extraction={currentShot.extraction || 50}
            tasteBalance={currentShot.tasteBalance || []}
            onExtractionChange={val => setCurrentShot({...currentShot, extraction: val})}
            onTasteBalanceToggle={toggleTasteBalance}
          />

          {/* Sensory Analysis */}
          <SensoryAnalysisForm 
            value={currentShot.sensory as SensoryAnalysis} 
            onChange={val => setCurrentShot({...currentShot, sensory: val})} 
          />

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Anotaciones</label>
            <textarea
              value={currentShot.notes || ''}
              onChange={e => setCurrentShot({...currentShot, notes: e.target.value})}
              className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg min-h-[80px]"
              placeholder="Notas adicionales sobre esta extracción..."
            />
          </div>

          <button
            type="button"
            onClick={handleAddShot}
            className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Añadir Receta a la Sesión
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-4 pt-8 border-t border-stone-200 dark:border-stone-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 px-6 rounded-xl border border-stone-200 dark:border-stone-800 font-bold text-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 dark:text-stone-400 transition-colors"
        >
          Cancelar Sesión
        </button>
        <button
          type="button"
          onClick={handleFinishSession}
          disabled={shots.length === 0}
          className="flex-[2] py-4 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
        >
          <Save className="w-5 h-5" /> Terminar Sesión
        </button>
      </div>
    </div>
  );
};

// --- Session Detail Modal ---
const EspressoSessionDetailModal: React.FC<{ session: EspressoSession; onClose: () => void }> = ({ session, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">{session.coffeeName}</h2>
            <p className="text-sm text-stone-500">{new Date(session.date).toLocaleDateString()} • {session.baristaName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {session.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">Notas de Sesión</h4>
              <p className="text-stone-700 dark:text-stone-300 italic">"{session.notes}"</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">Historial de Recetas ({session.shots.length})</h3>
            {session.shots.map((shot, idx) => (
              <div key={idx} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3 bg-stone-50 dark:bg-stone-900/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-brand">{shot.recipeName}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-stone-500 mt-2">
                      <span className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded">In: {shot.doseIn}g</span>
                      <span className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded">Out: {shot.yieldOut}g</span>
                      <span className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded">Time: {shot.timeSeconds}s</span>
                      <span className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded">Grind: {shot.grindSetting}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    shot.extraction < 40 ? 'bg-blue-100 text-blue-700' :
                    shot.extraction > 60 ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {shot.extraction < 40 ? 'Sub' : shot.extraction > 60 ? 'Sobre' : 'Bien'} ({Math.round(shot.extraction)}%)
                  </div>
                </div>

                {/* Taste Balance */}
                {shot.tasteBalance && shot.tasteBalance.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                     {shot.tasteBalance.map(t => (
                       <span key={t} className="text-[10px] uppercase font-bold px-2 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-stone-600 dark:text-stone-300">
                         {t === 'sour' ? 'Ácido' : t === 'sweet' ? 'Dulce' : t === 'balanced' ? 'Balance' : 'Amargo'}
                       </span>
                     ))}
                   </div>
                )}
                
                {/* Sensory Analysis Summary */}
                {shot.sensory && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-500 mt-2 border-t border-stone-200 dark:border-stone-700 pt-3">
                     {shot.sensory.crema && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Crema:</span> {shot.sensory.crema}</div>
                     )}
                     {shot.sensory.acidity?.quality && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Acidez:</span> {shot.sensory.acidity.quality === 'positive' ? 'Positiva' : 'Negativa'} {shot.sensory.acidity.description && `(${shot.sensory.acidity.description})`}</div>
                     )}
                     {shot.sensory.sweetness?.present !== null && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Dulzor:</span> {shot.sensory.sweetness.present ? 'Sí' : 'No'} {shot.sensory.sweetness.intensity && `(${shot.sensory.sweetness.intensity})`}</div>
                     )}
                     {shot.sensory.bitterness?.quality && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Amargor:</span> {shot.sensory.bitterness.quality === 'positive' ? 'Positiva' : 'Negativa'} {shot.sensory.bitterness.description && `(${shot.sensory.bitterness.description})`}</div>
                     )}
                     {shot.sensory.body && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Cuerpo:</span> {shot.sensory.body}</div>
                     )}
                     {shot.sensory.aftertaste?.duration && (
                       <div><span className="font-bold text-stone-700 dark:text-stone-300">Postgusto:</span> {
                         shot.sensory.aftertaste.duration === 'quick' ? 'Rápido' : 
                         shot.sensory.aftertaste.duration === 'semi-prolonged' ? 'Semiprolongado' : 'Prolongado'
                       } {shot.sensory.aftertaste.description && `(${shot.sensory.aftertaste.description})`}</div>
                     )}
                   </div>
                )}
                
                {shot.notes && (
                   <div className="text-xs text-stone-500 mt-2 bg-white dark:bg-stone-800 p-2 rounded border border-stone-100 dark:border-stone-700">
                     <span className="font-bold text-stone-700 dark:text-stone-300">Nota:</span> {shot.notes}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const EspressoView: React.FC = () => {
  const [view, setView] = useState<'menu' | 'new' | 'guide' | 'troubleshoot'>('menu');
  const [selectedSession, setSelectedSession] = useState<EspressoSession | null>(null);
  const { showToast } = useToast();
  
  // Filter out deleted sessions and sort by date descending
  const sessions = useLiveQuery(() => 
    db.espressoSessions
      .filter(s => !s.deleted)
      .reverse()
      .toArray()
  );

  const handleDeleteSession = async (session: EspressoSession) => {
    if (confirm('¿Estás seguro de eliminar esta sesión?')) {
      try {
        await db.espressoSessions.update(session.id, { deleted: true });
        showToast('Sesión eliminada', 'success');
      } catch (error) {
        console.error('Error deleting session:', error);
        showToast('Error al eliminar sesión', 'error');
      }
    }
  };

  const MenuCard: React.FC<{ title: string; desc: string; icon: any; onClick: () => void; color?: string }> = ({ title, desc, icon: Icon, onClick, color }) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-left w-full group"
    >
      <div className={`p-3 rounded-lg mb-4 ${color || 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-8">
        {view !== 'menu' && (
          <button 
            onClick={() => setView('menu')}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <Coffee className="w-8 h-8 text-brand" />
            Calibración Espresso
          </h1>
          <p className="text-stone-500 mt-1">
            {view === 'menu' && 'Gestiona tus recetas y resuelve problemas de extracción.'}
            {view === 'new' && 'Registra una nueva sesión de calibración.'}
            {view === 'guide' && 'Guía paso a paso para el espresso perfecto.'}
            {view === 'troubleshoot' && 'Diagnóstico y solución de problemas.'}
          </p>
        </div>
      </div>

      {/* Main Menu */}
      {view === 'menu' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MenuCard 
              title="Nueva Sesión" 
              desc="Registra múltiples recetas para encontrar el espresso perfecto." 
              icon={Plus} 
              onClick={() => setView('new')}
              color="bg-brand/10 text-brand"
            />
            <MenuCard 
              title="Guía de Calibración" 
              desc="Aprende los fundamentos y ratios recomendados." 
              icon={BookOpen} 
              onClick={() => setView('guide')}
            />
            <MenuCard 
              title="Problemas Comunes" 
              desc="Soluciona extracciones rápidas, lentas o sabores indeseados." 
              icon={AlertTriangle} 
              onClick={() => setView('troubleshoot')}
            />
          </div>

          {/* Recent History Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" /> Historial Reciente
            </h2>
            
            {!sessions || sessions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900/50">
                <p className="text-stone-400 font-medium">No hay sesiones registradas</p>
                <button 
                  onClick={() => setView('new')}
                  className="mt-4 text-brand font-bold text-sm hover:underline"
                >
                  Registrar la primera sesión
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {sessions.slice(0, 5).map(session => (
                  <div key={session.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between group hover:border-brand/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-900 dark:text-stone-100">{session.coffeeName}</span>
                        <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                          {session.shots?.length || 0} recetas
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-3">
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{session.baristaName}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                         <p className="text-[10px] uppercase text-stone-400 font-bold">Última Molienda</p>
                         <span className="text-xl font-black text-stone-200 dark:text-stone-800 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                           {session.shots && session.shots.length > 0 ? session.shots[session.shots.length-1].grindSetting : '-'}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="p-2 text-stone-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar sesión"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Views */}
      {view === 'new' && <CalibrationSessionForm onCancel={() => setView('menu')} onSave={() => setView('menu')} />}
      {view === 'guide' && <CalibrationGuide />}
      {view === 'troubleshoot' && <TroubleshootingGuide />}
      
      {/* Detail Modal */}
      {selectedSession && (
        <EspressoSessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}
    </div>
  );
};
