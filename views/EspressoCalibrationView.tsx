import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
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
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { line, curveMonotoneX } from 'd3-shape';
import { EspressoSession, EspressoShot, SensoryAnalysis } from '../types';
import { useToast } from '../contexts/ToastContext';

const CalibrationGuide = () => {
  const [activeVariable, setActiveVariable] = useState<string | null>(null);
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null);

  const isActive = (id: string) =>
    activeVariable === id || hoveredVariable === id;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">Variables enfocadas en espresso</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('dosis')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'dosis' ? null : 'dosis'))
            }
            onMouseEnter={() => setHoveredVariable('dosis')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'dosis' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('dosis')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('dosis') ? 'Impacto en taza' : 'Dosis'}
              </p>
              {!isActive('dosis') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>Cantidad de café molido que colocas en el portafiltro.</p>
                  <p>
                    Más café significa más material soluble y mayor resistencia al flujo: el agua tarda más en atravesar el puck y aumenta la extracción.
                  </p>
                </div>
              )}
              {isActive('dosis') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Más dosis →</span> + Cuerpo, + Intensidad, - Claridad.</p>
                  <p>Puede + amargor si no ajustas molienda.</p>
                  <p><span className="font-semibold">Menos dosis →</span> + Claridad, + Acidez percibida, - Cuerpo.</p>
                  <p>Puede subextraerse y sentirse débil.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('rendimiento')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'rendimiento' ? null : 'rendimiento'))
            }
            onMouseEnter={() => setHoveredVariable('rendimiento')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'rendimiento' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('rendimiento')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('rendimiento') ? 'Impacto en taza' : 'Rendimiento'}
              </p>
              {!isActive('rendimiento') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>
                    Cantidad final de bebida extraída. Por ejemplo: 18 g de café → 36 g de bebida.
                  </p>
                  <p>
                    Se extraen compuestos en etapas: primero ácidos y dulces, luego compuestos más amargos y secos.
                  </p>
                </div>
              )}
              {isActive('rendimiento') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Rendimiento bajo →</span> + Dulzor, + Cuerpo, - Acidez, - Amargor.</p>
                  <p><span className="font-semibold">Rendimiento alto →</span> + Acidez, + Claridad, - Cuerpo, + Amargor si se prolonga demasiado.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('molienda')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'molienda' ? null : 'molienda'))
            }
            onMouseEnter={() => setHoveredVariable('molienda')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'molienda' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('molienda')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('molienda') ? 'Impacto en taza' : 'Molienda'}
              </p>
              {!isActive('molienda') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>Tamaño de las partículas del café.</p>
                  <p>
                    Controla la superficie de contacto y la velocidad del flujo del agua, afectando directamente la extracción.
                  </p>
                </div>
              )}
              {isActive('molienda') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Molienda fina →</span> + Extracción, + Cuerpo, + Amargor, - Acidez brillante.</p>
                  <p><span className="font-semibold">Molienda gruesa →</span> - Extracción, + Acidez, + Claridad, - Cuerpo.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('ratio')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'ratio' ? null : 'ratio'))
            }
            onMouseEnter={() => setHoveredVariable('ratio')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'ratio' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('ratio')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('ratio') ? 'Impacto en taza' : 'Ratio'}
              </p>
              {!isActive('ratio') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>
                    Relación entre la cantidad de café y la cantidad de bebida. Un ratio 1:2 es el estándar moderno de espresso.
                  </p>
                  <p>
                    Determina cuánto del café se disuelve en el agua y es la variable que más define el perfil sensorial.
                  </p>
                </div>
              )}
              {isActive('ratio') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Ratios cortos (1:1 a 1:1.5) →</span> + Dulzor, + Densidad, - Acidez, - Balance.</p>
                  <p><span className="font-semibold">Ratios medios (1:2 a 1:2.5) →</span> mejor balance general, dulzor + acidez + cuerpo equilibrados.</p>
                  <p><span className="font-semibold">Ratios largos (1:3 o más) →</span> + Acidez, + Claridad, - Cuerpo, + Amargor final.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('preinfusion')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'preinfusion' ? null : 'preinfusion'))
            }
            onMouseEnter={() => setHoveredVariable('preinfusion')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'preinfusion' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('preinfusion')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('preinfusion') ? 'Impacto en taza' : 'Preinfusión'}
              </p>
              {!isActive('preinfusion') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>Tiempo inicial donde el café se humedece a baja presión antes de la extracción completa.</p>
                  <p>
                    Permite que el puck se hidrate y expanda antes del flujo fuerte, mejorando la uniformidad y reduciendo la canalización.
                  </p>
                </div>
              )}
              {isActive('preinfusion') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Con preinfusión →</span> + Dulzor, + Uniformidad, - Canalización, + Claridad.</p>
                  <p><span className="font-semibold">Sin preinfusión →</span> extracción más agresiva y mayor riesgo de amargor desigual.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('temperatura')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'temperatura' ? null : 'temperatura'))
            }
            onMouseEnter={() => setHoveredVariable('temperatura')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'temperatura' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('temperatura')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('temperatura') ? 'Impacto en taza' : 'Temperatura del agua'}
              </p>
              {!isActive('temperatura') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>Temperatura del agua utilizada para extraer el espresso.</p>
                  <p>
                    El calor aumenta la solubilidad de los compuestos del café y modifica la velocidad de extracción.
                  </p>
                </div>
              )}
              {isActive('temperatura') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Temperatura alta →</span> + Extracción, + Amargor, + Cuerpo, - Acidez brillante.</p>
                  <p><span className="font-semibold">Temperatura baja →</span> + Acidez, + Claridad, - Amargor, riesgo de subextracción.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${
              isActive('tampeo')
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-stone-900/80 border-stone-200 dark:border-stone-800'
            }`}
            onClick={() =>
              setActiveVariable(prev => (prev === 'tampeo' ? null : 'tampeo'))
            }
            onMouseEnter={() => setHoveredVariable('tampeo')}
            onMouseLeave={() =>
              setHoveredVariable(prev => (prev === 'tampeo' ? null : prev))
            }
          >
            <div className="px-5 py-6 space-y-3 text-sm min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center text-center">
              <p
                className={`text-[11px] md:text-xs font-bold uppercase tracking-widest mb-3 ${
                  isActive('tampeo')
                    ? 'text-stone-200'
                    : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                {isActive('tampeo') ? 'Impacto en taza' : 'Tampeo'}
              </p>
              {!isActive('tampeo') && (
                <div className="space-y-2 text-stone-600 dark:text-stone-300">
                  <p>Presión y uniformidad al compactar el café en el portafiltro.</p>
                  <p>
                    Define la resistencia del puck al paso del agua; si es desigual genera canalización y extracciones irregulares.
                  </p>
                </div>
              )}
              {isActive('tampeo') && (
                <div className="space-y-1 text-sm text-white">
                  <p><span className="font-semibold">Tampeo uniforme →</span> extracción pareja, + Balance, + Dulzor.</p>
                  <p><span className="font-semibold">Tampeo desigual →</span> canalización, mezcla de sabores ácido + amargo, - Claridad.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <li className="pl-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">Evalúa y Ajusta:</span> 
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
};

const TroubleshootingGuide = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const problems = [
    {
      id: 'acidic',
      code: 'A',
      title: 'Espresso muy ácido / verde / hueco',
      symptoms: ['Acidez punzante', 'Poco dulzor', 'Final corto', 'Sensación aguada'],
      causeLabel: 'Causa',
      cause: 'Subextracción.',
      solutionsLabel: 'Soluciones (en este orden)',
      solutions: [
        'Moler más fino -> aumenta extracción',
        'Aumentar rendimiento -> extraer más compuestos dulces',
        'Subir temperatura -> disuelve más sólidos',
        'Aumentar preinfusión -> mejora uniformidad'
      ],
      avoid: 'Subir dosis primero (no corrige la causa principal).'
    },
    {
      id: 'bitter',
      code: 'B',
      title: 'Espresso muy amargo / seco / astringente',
      symptoms: ['Amargor dominante', 'Sequedad en lengua', 'Final largo y pesado'],
      causeLabel: 'Causa',
      cause: 'Sobreextracción.',
      solutionsLabel: 'Soluciones (en este orden)',
      solutions: [
        'Moler más grueso -> reduce extracción',
        'Reducir rendimiento -> menos compuestos tardíos',
        'Bajar temperatura -> menos solubilidad',
        'Reducir tiempo total'
      ]
    },
    {
      id: 'acidic-bitter',
      code: 'C',
      title: 'Espresso ácido y amargo al mismo tiempo',
      symptoms: ['Sabor confuso', 'Sin dulzor', 'Sensación “sucia”'],
      causeLabel: 'Causa',
      cause: 'Canalización o extracción desigual.',
      solutionsLabel: 'Soluciones',
      solutions: [
        'Revisar distribución del café',
        'Mejorar tampeo uniforme',
        'Añadir preinfusión',
        'Revisar molienda (puede estar demasiado fina)'
      ],
      note: 'Este problema NO se corrige con ratio primero.'
    },
    {
      id: 'weak',
      code: 'D',
      title: 'Espresso muy débil / aguado',
      symptoms: ['Poco cuerpo', 'Sabor diluido', 'Baja intensidad'],
      causeLabel: 'Causas posibles',
      cause: 'Ratio demasiado largo o dosis baja.',
      solutionsLabel: 'Soluciones',
      solutions: [
        'Reducir ratio (menos bebida)',
        'Aumentar dosis',
        'Moler ligeramente más fino'
      ]
    },
    {
      id: 'dense',
      code: 'E',
      title: 'Espresso muy denso / pesado / “espeso”',
      symptoms: ['Mucho cuerpo', 'Poco brillo', 'Sabor cerrado'],
      causeLabel: 'Causa',
      cause: 'Ratio demasiado corto.',
      solutionsLabel: 'Soluciones',
      solutions: ['Aumentar rendimiento', 'Moler ligeramente más grueso']
    },
    {
      id: 'low-sweetness',
      code: 'F',
      title: 'Falta de dulzor (pero sin amargor)',
      symptoms: ['Correcto balance pero plano', 'No hay sensación jugosa'],
      causeLabel: 'Causa',
      cause: 'Extracción incompleta de azúcares.',
      solutionsLabel: 'Soluciones',
      solutions: [
        'Aumentar ligeramente rendimiento',
        'Añadir preinfusión',
        'Subir temperatura 1 a 2 grados'
      ]
    },
    {
      id: 'flat',
      code: 'G',
      title: 'Sabor plano / sin definición',
      symptoms: ['Todo sabe igual', 'Sin acidez ni dulzor claro'],
      causeLabel: 'Causa',
      cause: 'Extracción demasiado alta o temperatura excesiva.',
      solutionsLabel: 'Soluciones',
      solutions: ['Reducir temperatura', 'Reducir rendimiento', 'Ajustar molienda más gruesa']
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
            <span className="font-bold text-stone-800 dark:text-stone-200">
              {item.code ? `${item.code}. ` : ''}{item.title}
            </span>
            {openItem === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openItem === item.id && (
            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
              {item.symptoms && (
                <div className="mb-3">
                  <span className="text-xs font-bold uppercase text-stone-500">Síntomas</span>
                  <ul className="mt-1 list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1">
                    {item.symptoms.map((symptom: string) => (
                      <li key={symptom}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mb-3">
                <span className="text-xs font-bold uppercase text-red-500">
                  {item.causeLabel || 'Causa'}
                </span>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{item.cause}</p>
              </div>
              <div className="mb-2">
                <span className="text-xs font-bold uppercase text-green-600">
                  {item.solutionsLabel || 'Soluciones'}
                </span>
                <ul className="mt-1 list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1">
                  {item.solutions.map((solution: string) => (
                    <li key={solution}>{solution}</li>
                  ))}
                </ul>
              </div>
              {item.avoid && (
                <div className="mt-2">
                  <span className="text-xs font-bold uppercase text-amber-600">Evita</span>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{item.avoid}</p>
                </div>
              )}
              {item.note && (
                <div className="mt-2">
                  <span className="text-xs font-bold uppercase text-stone-500">Nota</span>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{item.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

type SensoryTimelineProps = {
  offsets: number[];
  notes: string[];
  onChange: (offsets: number[], notes: string[]) => void;
};

const SensoryTimeline: React.FC<SensoryTimelineProps> = ({ offsets, notes, onChange }) => {
  let safeOffsets: number[];
  if (offsets && offsets.length === 5) {
    safeOffsets = offsets;
  } else if (offsets && offsets.length === 3) {
    safeOffsets = [offsets[0], offsets[0], offsets[1], offsets[2], offsets[2]];
  } else {
    safeOffsets = [0, 0, 0, 0, 0];
  }

  let safeNotes: string[];
  if (notes && notes.length === 5) {
    safeNotes = notes;
  } else if (notes && notes.length === 3) {
    safeNotes = [notes[0] || '', '', notes[1] || '', '', notes[2] || ''];
  } else {
    safeNotes = ['', '', '', '', ''];
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const labels = ['Impacto', 'Inicio', 'Desarrollo', 'Final', 'Postgusto'];

  const maxOffset = 40;
  const svgWidth = 100;
  const svgHeight = 96;
  const paddingY = 8;
  const centerY = svgHeight / 2;
  const amplitude = centerY - paddingY;

  const points = safeOffsets.map((off, index) => {
    const x = (index / (labels.length - 1)) * svgWidth;
    const normalized = Math.max(-maxOffset, Math.min(maxOffset, off)) / maxOffset;
    const y = centerY + normalized * amplitude;
    return { x, y };
  });

  const lineGenerator = useMemo(
    () =>
      line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveMonotoneX),
    []
  );

  const linePath = lineGenerator(points as { x: number; y: number }[]) || '';

  const handleDragEnd = (index: number, deltaY: number) => {
    const current = safeOffsets[index] || 0;
    let next = current + deltaY;
    if (next > maxOffset) next = maxOffset;
    if (next < -maxOffset) next = -maxOffset;
    const updatedOffsets = [...safeOffsets];
    updatedOffsets[index] = next;
    onChange(updatedOffsets, safeNotes);
  };

  const handleOpenEditor = (index: number) => {
    setEditingIndex(index);
    setDraft(safeNotes[index] || '');
  };

  const handleSave = () => {
    if (editingIndex === null) return;
    const updatedNotes = [...safeNotes];
    updatedNotes[editingIndex] = draft.trim();
    onChange(safeOffsets, updatedNotes);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative h-24 w-full flex items-center justify-between gap-4">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-stone-300 dark:border-stone-700 pointer-events-none" />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-full w-full pointer-events-none"
        >
          <path
            d={linePath}
            fill="none"
            stroke="#000000"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </svg>

        {hoveredIndex !== null && safeNotes[hoveredIndex] && (
          <div
            className="absolute -top-2 transform -translate-y-full px-3 py-2 rounded-lg bg-black text-white text-xs max-w-xs shadow-lg z-20"
            style={{
              left: `${((hoveredIndex + 0.5) / labels.length) * 100}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {safeNotes[hoveredIndex]}
          </div>
        )}

        {labels.map((label, index) => {
          const isFixed = index === 0 || index === labels.length - 1;
          return (
            <div
              key={label}
              className="flex-1 flex items-center justify-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(prev => (prev === index ? null : prev))}
            >
              <motion.div
                drag={isFixed ? false : 'y'}
                dragConstraints={isFixed ? undefined : { top: -40, bottom: 40 }}
                dragElastic={isFixed ? 0 : 0.2}
                onDragEnd={isFixed ? undefined : ((_, info) => handleDragEnd(index, info.offset.y))}
                style={{ y: safeOffsets[index] || 0 }}
                className={
                  'w-4 h-4 rounded-full bg-black shadow-md border border-white' +
                  (isFixed ? ' cursor-default' : ' cursor-grab active:cursor-grabbing')
                }
              />
            </div>
          );
        })}

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => handleOpenEditor(index)}
              className="text-[11px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white transition-colors"
            >
              {label}
              {safeNotes[index] && ' •'}
            </button>
          ))}
        </div>
      </div>

      {editingIndex !== null && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
            Análisis sensorial — {labels[editingIndex]}
          </p>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-sm min-h-[80px] resize-y"
            placeholder="Describe lo que percibes en esta parte de la línea de tiempo..."
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Session Form ---
const CalibrationSessionForm: React.FC<{ onCancel: () => void; onSave: () => void }> = ({ onCancel, onSave }) => {

  const { showToast } = useToast();
  
  const [sessionData, setSessionData] = useState({
    baristaName: '',
    coffeeName: '',
    coffeeOrigin: '',
    coffeeProcess: '',
    roastDate: '',
    notes: ''
  });

  const [shots, setShots] = useState<EspressoShot[]>([]);
  const [previousShot, setPreviousShot] = useState<EspressoShot | null>(null);
  const [level, setLevel] = useState<'basic' | 'advanced'>('basic');
  
  const [currentShot, setCurrentShot] = useState<Partial<EspressoShot>>({
    recipeName: 'Receta 1',
    grindSetting: '',
    doseIn: 18,
    yieldOut: 36,
    timeSeconds: 28,
    waterTempCelsius: 93,
    extraction: 50,
    tasteBalance: [],
    acidityScore: 3,
    sweetnessScore: 3,
    bitternessScore: 3,
    bodyScore: 3,
    clarityScore: 3,
    acidityDescriptors: '',
    sweetnessDescriptors: '',
    bitternessDescriptors: '',
    bodyDescriptors: '',
    clarityDescriptors: '',
    temporalProfileStart: 2.5,
    temporalProfileMiddle: 2.5,
    temporalProfileEnd: 2.5,
    temporalProfileStartNotes: '',
    temporalProfileMiddleNotes: '',
    temporalProfileEndNotes: '',
    sensoryTimelineOffsets: [0, 0, 0, 0, 0],
    sensoryTimelineNotes: ['', '', '', '', ''],
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
      notes: currentShot.notes,
      waterTempCelsius: currentShot.waterTempCelsius,
      preinfusionSeconds: currentShot.preinfusionSeconds,
      pressureBar: currentShot.pressureBar,
      firstDropsSeconds: currentShot.firstDropsSeconds,
      tamping: currentShot.tamping,
      acidityScore: currentShot.acidityScore,
      sweetnessScore: currentShot.sweetnessScore,
      bitternessScore: currentShot.bitternessScore,
      bodyScore: currentShot.bodyScore,
      clarityScore: currentShot.clarityScore,
      sensoryCategories: currentShot.sensoryCategories,
      sensorySubnotes: currentShot.sensorySubnotes,
      acidityDescriptors: currentShot.acidityDescriptors,
      sweetnessDescriptors: currentShot.sweetnessDescriptors,
      bitternessDescriptors: currentShot.bitternessDescriptors,
      bodyDescriptors: currentShot.bodyDescriptors,
      clarityDescriptors: currentShot.clarityDescriptors,
      sensoryTimelineOffsets: currentShot.sensoryTimelineOffsets || [0, 0, 0, 0, 0],
      sensoryTimelineNotes: currentShot.sensoryTimelineNotes || ['', '', '', '', ''],
      temporalProfileStart: currentShot.temporalProfileStart,
      temporalProfileMiddle: currentShot.temporalProfileMiddle,
      temporalProfileEnd: currentShot.temporalProfileEnd,
      temporalProfileStartNotes: currentShot.temporalProfileStartNotes,
      temporalProfileMiddleNotes: currentShot.temporalProfileMiddleNotes,
      temporalProfileEndNotes: currentShot.temporalProfileEndNotes
    };

    setShots([...shots, newShot]);
    setPreviousShot(newShot);
    
    // Reset form for next shot, keeping some values for easier workflow
    setCurrentShot({
      ...currentShot,
      recipeName: `Receta ${shots.length + 2}`,
      // Keep previous dose/yield/grind as starting point
      notes: '',
      tasteBalance: [],
      acidityScore: newShot.acidityScore,
      sweetnessScore: newShot.sweetnessScore,
      bitternessScore: newShot.bitternessScore,
      bodyScore: newShot.bodyScore,
      clarityScore: newShot.clarityScore,
      acidityDescriptors: '',
      sweetnessDescriptors: '',
      bitternessDescriptors: '',
      bodyDescriptors: '',
      clarityDescriptors: '',
      waterTempCelsius: newShot.waterTempCelsius,
      preinfusionSeconds: newShot.preinfusionSeconds,
      pressureBar: newShot.pressureBar,
      firstDropsSeconds: newShot.firstDropsSeconds,
      tamping: newShot.tamping,
      sensoryCategories: newShot.sensoryCategories,
      sensorySubnotes: '',
      sensoryTimelineOffsets: newShot.sensoryTimelineOffsets || [0, 0, 0, 0, 0],
      sensoryTimelineNotes: ['', '', '', '', ''],
      temporalProfileStart: newShot.temporalProfileStart ?? 2.5,
      temporalProfileMiddle: newShot.temporalProfileMiddle ?? 2.5,
      temporalProfileEnd: newShot.temporalProfileEnd ?? 2.5,
      temporalProfileStartNotes: '',
      temporalProfileMiddleNotes: '',
      temporalProfileEndNotes: '',
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
      notes: sessionData.notes,
      coffeeOrigin: sessionData.coffeeOrigin,
      coffeeProcess: sessionData.coffeeProcess,
      roastDate: sessionData.roastDate
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

  const roastDays = sessionData.roastDate
    ? Math.floor((Date.now() - new Date(sessionData.roastDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const dose = currentShot.doseIn || 0;
  const yieldOut = currentShot.yieldOut || 0;
  const ratio = dose > 0 && yieldOut > 0 ? yieldOut / dose : null;

  let ratioLabel = '–';
  let ratioBadgeClass = 'bg-stone-100 text-stone-700';
  if (ratio) {
    const rounded = Math.round(ratio * 10) / 10;
    ratioLabel = `1:${rounded.toFixed(1)}`;
    if (rounded >= 1.5 && rounded <= 2.5) {
      ratioBadgeClass = 'bg-emerald-100 text-emerald-700';
    } else if ((rounded >= 1.2 && rounded < 1.5) || (rounded > 2.5 && rounded <= 2.8)) {
      ratioBadgeClass = 'bg-amber-100 text-amber-700';
    } else {
      ratioBadgeClass = 'bg-red-100 text-red-700';
    }
  }

  const waterTempC = currentShot.waterTempCelsius ?? 0;

  const getDiagnosis = () => {
    const messages: string[] = [];
    const time = currentShot.timeSeconds || 0;
    const bitterness = currentShot.bitternessScore || 0;
    const acidity = currentShot.acidityScore || 0;

    if (time > 0 && time < 22) {
      messages.push('Tiempo total bajo: prueba una molienda más fina o aumentar la dosis.');
    }
    if (time > 35) {
      messages.push('Tiempo total alto: prueba una molienda más gruesa o reducir la dosis.');
    }
    if (bitterness >= 4 && time > 30) {
      messages.push('Amargor alto con tiempo largo: posible sobreextracción.');
    }
    if (acidity >= 4 && time < 25) {
      messages.push('Acidez alta con tiempo corto: posible subextracción.');
    }
    if (!messages.length) {
      messages.push('Extracción dentro de parámetros normales. Ajusta según preferencia.');
    }
    return messages;
  };

  const diagnosisMessages = getDiagnosis();

  const centerValue = 2.5;
  const temporalStart = currentShot.temporalProfileStart ?? centerValue;
  const temporalMiddle = currentShot.temporalProfileMiddle ?? centerValue;
  const temporalEnd = currentShot.temporalProfileEnd ?? centerValue;

  const tasteData = [
    { label: 'Punto inicial', value: centerValue },
    { label: 'Inicio', value: Math.max(0, Math.min(5, temporalStart)) },
    { label: 'Medio', value: Math.max(0, Math.min(5, temporalMiddle)) },
    { label: 'Final', value: Math.max(0, Math.min(5, temporalEnd)) },
    { label: 'Punto final', value: centerValue }
  ];

  const tastePath = line<{ label: string; value: number }>()
    .x((_, i) => (i / (tasteData.length - 1)) * 160)
    .y(d => 40 - (d.value / 5) * 40)
    .curve(curveMonotoneX)(tasteData);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: información de la sesión y nivel */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-stone-100 dark:bg-stone-900/50 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">Datos del café</h2>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Café</label>
                <input
                  type="text"
                  required
                  value={sessionData.coffeeName}
                  onChange={e => setSessionData({...sessionData, coffeeName: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  placeholder="Ej. Etiopía Yirgacheffe"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Origen</label>
                <input
                  type="text"
                  value={sessionData.coffeeOrigin}
                  onChange={e => setSessionData({...sessionData, coffeeOrigin: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  placeholder="Origen o finca"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Proceso</label>
                <select
                  value={sessionData.coffeeProcess}
                  onChange={e => setSessionData({...sessionData, coffeeProcess: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                >
                  <option value="">Selecciona proceso</option>
                  <option value="lavado">Lavado</option>
                  <option value="natural">Natural</option>
                  <option value="honey">Honey</option>
                  <option value="anaerobico">Anaeróbico</option>
                  <option value="experimental">Experimental</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Fecha (tueste o lote)</label>
                <input
                  type="date"
                  value={sessionData.roastDate}
                  onChange={e => setSessionData({...sessionData, roastDate: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Días desde tueste</label>
                <div className="h-[40px] flex items-center rounded-lg border border-dashed border-stone-300 px-3 text-xs text-stone-600 dark:text-stone-300 bg-white/60 dark:bg-stone-950/40">
                  {roastDays !== null ? `${roastDays} días` : 'Selecciona fecha de tueste'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Barista</label>
                <input
                  type="text"
                  value={sessionData.baristaName}
                  onChange={e => setSessionData({...sessionData, baristaName: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  placeholder="Nombre del barista"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 p-1 bg-white/60 dark:bg-stone-900/60">
              <button
                type="button"
                onClick={() => setLevel('basic')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
                  level === 'basic'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-stone-500'
                }`}
              >
                Nivel básico
              </button>
              <button
                type="button"
                onClick={() => setLevel('advanced')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
                  level === 'advanced'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-stone-500'
                }`}
              >
                Nivel avanzado
              </button>
            </div>
          </div>
        </div>

        {/* Main content: historial y receta actual */}
        <div className="flex-1 space-y-6">
          {/* Added Shots List */}
          {shots.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <History className="w-5 h-5" />
                Recetas Probadas ({shots.length})
              </h3>
              <div className="grid gap-4">
                {shots.map((shot, index) => {
                  const prev = index > 0 ? shots[index - 1] : null;
                  const changes: string[] = [];
                  if (prev) {
                    if (shot.doseIn !== prev.doseIn) changes.push(`Dosis: ${prev.doseIn}→${shot.doseIn}`);
                    if (shot.yieldOut !== prev.yieldOut) changes.push(`Salida: ${prev.yieldOut}→${shot.yieldOut}`);
                    if (shot.timeSeconds !== prev.timeSeconds) changes.push(`Tiempo: ${prev.timeSeconds}→${shot.timeSeconds}`);
                    if (shot.grindSetting !== prev.grindSetting) changes.push(`Molienda: ${prev.grindSetting}→${shot.grindSetting}`);
                  }
                  return (
                    <div key={shot.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between animate-fade-in">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-brand">{shot.recipeName}</span>
                          <span className="text-stone-400 text-xs">Molienda: {shot.grindSetting}</span>
                        </div>
                        <div className="text-xs text-stone-500 flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span>{shot.doseIn}g in / {shot.yieldOut}g out</span>
                            <span>•</span>
                            <span>{shot.timeSeconds}s</span>
                          </div>
                          {changes.length > 0 && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              Cambios vs anterior: {changes.join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveShot(shot.id)}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      <Scale className="w-3 h-3" /> Dosis (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentShot.doseIn}
                      onChange={e => setCurrentShot({...currentShot, doseIn: Number(e.target.value)})}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      <Droplets className="w-3 h-3" /> Salida (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentShot.yieldOut}
                      onChange={e => setCurrentShot({...currentShot, yieldOut: Number(e.target.value)})}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      <Clock className="w-3 h-3" /> Tiempo (s)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={currentShot.timeSeconds}
                      onChange={e => setCurrentShot({...currentShot, timeSeconds: Number(e.target.value)})}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      <Settings className="w-3 h-3" /> Molienda
                    </label>
                    <input
                      type="text"
                      value={currentShot.grindSetting}
                      onChange={e => setCurrentShot({...currentShot, grindSetting: e.target.value})}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-center font-bold"
                      placeholder="Ej. 2.4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Ratio
                    </label>
                    <div className="h-[52px] flex items-center justify-between px-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm">
                      <span className="font-mono text-stone-700 dark:text-stone-100">{ratioLabel}</span>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${ratioBadgeClass}`}>
                        {ratio ? 'Evaluado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Temperatura agua (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentShot.waterTempCelsius ?? ''}
                      onChange={e => setCurrentShot({...currentShot, waterTempCelsius: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {level === 'advanced' && (
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Preinfusión (s)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={currentShot.preinfusionSeconds ?? ''}
                        onChange={e => setCurrentShot({...currentShot, preinfusionSeconds: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Presión (bar)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentShot.pressureBar ?? ''}
                        onChange={e => setCurrentShot({...currentShot, pressureBar: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Primeras gotas (s)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={currentShot.firstDropsSeconds ?? ''}
                        onChange={e => setCurrentShot({...currentShot, firstDropsSeconds: e.target.value === '' ? undefined : Number(e.target.value)})}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Tampeo</label>
                      <select
                        value={currentShot.tamping || ''}
                        onChange={e => setCurrentShot({...currentShot, tamping: e.target.value === '' ? undefined : e.target.value as 'soft' | 'normal' | 'firm'})}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-bold"
                      >
                        <option value="">Selecciona</option>
                        <option value="soft">Suave</option>
                        <option value="normal">Normal</option>
                        <option value="firm">Firme</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
                    Perfil sensorial
                  </label>
                  <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
                    <svg viewBox="-4 -4 168 48" className="w-full h-24 overflow-visible">
                      <line
                        x1={0}
                        y1={20}
                        x2={160}
                        y2={20}
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                      />
                      {tastePath && (
                        <path
                          d={tastePath}
                          fill="none"
                          stroke="#000000"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                      )}
                      {tasteData.map((d, i) => {
                        const x = (i / (tasteData.length - 1)) * 160;
                        const y = 40 - (d.value / 5) * 40;
                        return (
                          <circle
                            key={d.label}
                            cx={x}
                            cy={y}
                            r={4}
                            fill="#000000"
                            stroke="#ffffff"
                            strokeWidth={1}
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
                      Inicio
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.temporalProfileStart ?? 5}
                        onChange={e =>
                          setCurrentShot({
                            ...currentShot,
                            temporalProfileStart: Number(e.target.value)
                          })
                        }
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.temporalProfileStart ?? 5).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.temporalProfileStartNotes || ''}
                      onChange={e =>
                        setCurrentShot({
                          ...currentShot,
                          temporalProfileStartNotes: e.target.value
                        })
                      }
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Análisis del inicio..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
                      Medio
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.temporalProfileMiddle ?? 5}
                        onChange={e =>
                          setCurrentShot({
                            ...currentShot,
                            temporalProfileMiddle: Number(e.target.value)
                          })
                        }
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.temporalProfileMiddle ?? 5).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.temporalProfileMiddleNotes || ''}
                      onChange={e =>
                        setCurrentShot({
                          ...currentShot,
                          temporalProfileMiddleNotes: e.target.value
                        })
                      }
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Análisis de la parte media..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
                      Final
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.temporalProfileEnd ?? 5}
                        onChange={e =>
                          setCurrentShot({
                            ...currentShot,
                            temporalProfileEnd: Number(e.target.value)
                          })
                        }
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.temporalProfileEnd ?? 5).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.temporalProfileEndNotes || ''}
                      onChange={e =>
                        setCurrentShot({
                          ...currentShot,
                          temporalProfileEndNotes: e.target.value
                        })
                      }
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Análisis del final..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Acidez</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.acidityScore ?? 0}
                        onChange={e => setCurrentShot({...currentShot, acidityScore: Number(e.target.value)})}
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.acidityScore ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.acidityDescriptors || ''}
                      onChange={e => setCurrentShot({...currentShot, acidityDescriptors: e.target.value})}
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Descriptores de acidez (ej. cítrico, jugoso...)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Dulzor</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.sweetnessScore ?? 0}
                        onChange={e => setCurrentShot({...currentShot, sweetnessScore: Number(e.target.value)})}
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.sweetnessScore ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.sweetnessDescriptors || ''}
                      onChange={e => setCurrentShot({...currentShot, sweetnessDescriptors: e.target.value})}
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Descriptores de dulzor (ej. caramelo, miel...)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Amargor</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.bitternessScore ?? 0}
                        onChange={e => setCurrentShot({...currentShot, bitternessScore: Number(e.target.value)})}
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.bitternessScore ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.bitternessDescriptors || ''}
                      onChange={e => setCurrentShot({...currentShot, bitternessDescriptors: e.target.value})}
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Descriptores de amargor (ej. cacao, tánico...)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Cuerpo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.bodyScore ?? 0}
                        onChange={e => setCurrentShot({...currentShot, bodyScore: Number(e.target.value)})}
                        className="flex-1 accent-black dark:accent-white"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.bodyScore ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.bodyDescriptors || ''}
                      onChange={e => setCurrentShot({...currentShot, bodyDescriptors: e.target.value})}
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Descriptores de cuerpo (ej. sedoso, pesado...)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Claridad</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={currentShot.clarityScore ?? 0}
                        onChange={e => setCurrentShot({...currentShot, clarityScore: Number(e.target.value)})}
                        className="flex-1"
                      />
                      <span className="w-10 text-xs font-mono text-right">
                        {(currentShot.clarityScore ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentShot.clarityDescriptors || ''}
                      onChange={e => setCurrentShot({...currentShot, clarityDescriptors: e.target.value})}
                      className="w-full mt-1 p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Descriptores de claridad (ej. limpio, turbio...)"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Notas específicas</label>
                  <textarea
                    value={currentShot.sensorySubnotes || ''}
                    onChange={e => setCurrentShot({...currentShot, sensorySubnotes: e.target.value})}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg min-h-[60px]"
                    placeholder="Ej. Fresa madura, flor de azahar, cacao 70%..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Anotaciones</label>
                  <textarea
                    value={currentShot.notes || ''}
                    onChange={e => setCurrentShot({...currentShot, notes: e.target.value})}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg min-h-[80px]"
                    placeholder="Notas adicionales sobre esta extracción..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Diagnóstico sugerido</label>
                  <motion.ul
                    className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-3 space-y-1"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {diagnosisMessages.map((msg, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        • {msg}
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
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

                {shot.sensoryTimelineOffsets && shot.sensoryTimelineOffsets.length >= 3 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                      Línea de tiempo sensorial
                    </p>
                    <div className="flex items-center gap-2">
                      {shot.sensoryTimelineOffsets.map((off, i) => {
                        const clamped = Math.max(-40, Math.min(40, off || 0));
                        const labels = ['Impacto', 'Inicio', 'Desarrollo', 'Final', 'Postgusto'];
                        return (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-1.5 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                              <div
                                className="w-full bg-gradient-to-b from-emerald-400 to-sky-500"
                                style={{
                                  height: `${50 + (clamped / 40) * 50}%`,
                                  transformOrigin: 'bottom'
                                }}
                              />
                            </div>
                            <span className="text-[9px] uppercase tracking-widest text-stone-500">
                              {labels[i] || labels[labels.length - 1]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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

interface EspressoViewProps {
  onRegisterBackHandler?: (handler: () => boolean) => void;
}

export const EspressoView: React.FC<EspressoViewProps> = ({ onRegisterBackHandler }) => {
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

  useEffect(() => {
    if (!onRegisterBackHandler) return;
    onRegisterBackHandler(() => {
      if (view === 'menu') {
        return false;
      }
      setView('menu');
      return true;
    });
  }, [view, onRegisterBackHandler]);

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100">
            {view === 'menu' && 'Recetas de Espresso'}
            {view === 'new' && 'Calibraciones'}
            {view === 'guide' && 'Guía de Calibración'}
            {view === 'troubleshoot' && 'Problemas Comunes'}
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
              title="Calibraciones" 
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
