import React, { useState } from 'react';
import { ChevronLeft, ArrowLeft, Droplets, FlaskConical, BookOpen, Info, CheckCircle2, Beaker, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onBack: () => void;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const DOMINANT_COMPOUNDS = [
  {
    id: 'magnesium',
    name: 'Magnesio (Mg²⁺)',
    symbol: 'Mg',
    color: 'emerald',
    summary: 'Potencia aromas y resalta la acidez frutal. Es el ion más extractor de compuestos aromáticos volátiles.',
    impact: 'Agudeza aromática, brillo ácido, definición de notas frutales y florales.',
    note: 'El magnesio es el mineral favorito de los baristas de competencia. Incluso en concentraciones moderadas, transforma un café plano en uno vibrante.',
    recommendedRange: '10–30 mg/L',
  },
  {
    id: 'calcium',
    name: 'Calcio (Ca²⁺)',
    symbol: 'Ca',
    color: 'amber',
    summary: 'Aporta cuerpo y redondez. Extrae más compuestos pesados como melanoidinas y azúcares de mayor peso molecular.',
    impact: 'Cuerpo, dulzura estructural, textura densa y percepción de plenitud en boca.',
    note: 'A altas concentraciones puede hacer el café "pesado". El rango óptimo para café de especialidad está por debajo de 50 mg/L.',
    recommendedRange: '20–50 mg/L',
  },
  {
    id: 'sodium',
    name: 'Sodio (Na⁺)',
    symbol: 'Na',
    color: 'sky',
    summary: 'Suaviza la acidez y crea una sensación de redondez. En dosis muy bajas puede potenciar la dulzura percibida.',
    impact: 'Supresión del amargor, redondez, percepción de dulzura y menor astringencia.',
    note: 'El sodio es delicado: por encima de 10 mg/L puede hacer el café salado. Se usa stratégicamente en dosis micro.',
    recommendedRange: '0–10 mg/L',
  },
  {
    id: 'potassium',
    name: 'Potasio (K⁺)',
    symbol: 'K',
    color: 'violet',
    summary: 'Aumenta la conductividad del agua y la capacidad extractiva total. Potencia la complejidad general.',
    impact: 'Mayor extracción general, más complejidad, ligero aumento de amargor si se supera el umbral.',
    note: 'Poco común en recetas de agua personalizadas. Se usa principalmente como complemento al magnesio.',
    recommendedRange: '5–15 mg/L',
  },
  {
    id: 'bicarbonate',
    name: 'Bicarbonato (HCO₃⁻)',
    symbol: 'HCO₃',
    color: 'rose',
    summary: 'Actúa como buffer de pH. A niveles altos neutraliza acidez y opaca el perfil. El mayor enemigo del café de especialidad.',
    impact: 'Supresión de acidez, perfil plano, pérdida de brillantez en taza. En dosis mínimas estabiliza el pH.',
    note: 'La SCA recomienda menos de 40 mg/L. El agua embotellada comercial suele tener 200–400 mg/L, lo que destruye el perfil del café.',
    recommendedRange: '0–40 mg/L',
  },
];

const SECONDARY_COMPOUNDS = [
  { id: 'magnesium', name: 'Magnesio', symbol: 'Mg' },
  { id: 'calcium', name: 'Calcio', symbol: 'Ca' },
  { id: 'sodium', name: 'Sodio', symbol: 'Na' },
  { id: 'potassium', name: 'Potasio', symbol: 'K' },
  { id: 'bicarbonate', name: 'Bicarbonato', symbol: 'HCO₃' },
];

type Proportion = 'baja' | 'media' | 'alta';

interface SecondarySelection {
  id: string;
  proportion: Proportion;
}

const PROPORTION_LABELS: Record<Proportion, string> = {
  baja: 'Baja (5–10 mg/L)',
  media: 'Media (10–25 mg/L)',
  alta: 'Alta (25–50 mg/L)',
};

const getColorClasses = (color: string) => {
  const map: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: 'bg-white dark:bg-stone-900', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-emerald-600 dark:bg-stone-800 dark:text-emerald-400 border border-stone-200 dark:border-stone-700' },
    amber:   { bg: 'bg-white dark:bg-stone-900', text: 'text-amber-600 dark:text-amber-400', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-amber-600 dark:bg-stone-800 dark:text-amber-400 border border-stone-200 dark:border-stone-700' },
    sky:     { bg: 'bg-white dark:bg-stone-900', text: 'text-sky-600 dark:text-sky-400', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-sky-600 dark:bg-stone-800 dark:text-sky-400 border border-stone-200 dark:border-stone-700' },
    violet:  { bg: 'bg-white dark:bg-stone-900', text: 'text-brand', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-brand dark:bg-stone-800 border border-stone-200 dark:border-stone-700' },
    rose:    { bg: 'bg-white dark:bg-stone-900', text: 'text-brand', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-brand dark:bg-stone-800 border border-stone-200 dark:border-stone-700' },
    stone:   { bg: 'bg-white dark:bg-stone-900', text: 'text-stone-900 dark:text-stone-100', border: 'border-stone-200 dark:border-stone-800', badge: 'bg-stone-50 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700' },
  };
  return map[color] || map.stone;
};

// ─────────────────────────────────────────────
// SIMULATOR TAB
// ─────────────────────────────────────────────

const SimulatorTab: React.FC = () => {
  const [dominantId, setDominantId] = useState<string | null>(null);
  const [secondaries, setSecondaries] = useState<SecondarySelection[]>([]);
  const [showResult, setShowResult] = useState(false);

  const dominant = DOMINANT_COMPOUNDS.find(c => c.id === dominantId);

  const toggleSecondary = (id: string) => {
    setSecondaries(prev => {
      if (prev.find(s => s.id === id)) return prev.filter(s => s.id !== id);
      return [...prev, { id, proportion: 'media' }];
    });
    setShowResult(false);
  };

  const setSecondaryProportion = (id: string, proportion: Proportion) => {
    setSecondaries(prev => prev.map(s => s.id === id ? { ...s, proportion } : s));
    setShowResult(false);
  };

  const generateResult = () => {
    if (!dominantId) return;
    setShowResult(true);
  };

  const reset = () => {
    setDominantId(null);
    setSecondaries([]);
    setShowResult(false);
  };

  // Simple heuristic profile description
  const buildProfile = () => {
    if (!dominant) return { title: '', howTo: '', cupImpact: '', usageTip: '' };

    const secIds = secondaries.map(s => s.id);
    const hasMg = dominantId === 'magnesium' || secIds.includes('magnesium');
    const hasCa = dominantId === 'calcium' || secIds.includes('calcium');
    const hasNa = secIds.includes('sodium');
    const hasBicarb = secIds.includes('bicarbonate');
    const hasMgHigh = secondaries.find(s => s.id === 'magnesium')?.proportion === 'alta';
    const hasCaHigh = secondaries.find(s => s.id === 'calcium')?.proportion === 'alta';

    let title = '';
    let cupImpact = '';
    let howTo = '';
    let usageTip = '';

    if (dominantId === 'magnesium') {
      if (hasCa && !hasBicarb) {
        title = 'Agua para Expresividad y Cuerpo';
        cupImpact = 'Alta claridad aromática con buen cuerpo de soporte. Acidez vibrante y dulzura redonda. Ideal para cafés de altura con buen desarrollo.';
        howTo = `Prepara 1 litro de base con agua destilada. Añade ${hasCaHigh ? '40–50' : '20–30'} mg de sulfato de magnesio (MgSO₄·7H₂O) como fuente de Mg²⁺ dominante, y ${hasCaHigh ? '40–50' : '15–25'} mg de cloruro de calcio (CaCl₂) como fuente de Ca²⁺. Mezcla hasta disolver completamente. Dilución recomendada: usar directamente.`;
      } else if (hasBicarb) {
        title = 'Agua Balanceada con Buffer de pH';
        cupImpact = 'Perfil brillante pero con la acidez ligeramente suavizada. El bicarbonato actúa como buffer, haciendo el café más accesible sin perder expresividad.';
        howTo = `Disuelve en 1 litro de agua destilada: 30 mg/L de MgSO₄·7H₂O y 15–20 mg/L de bicarbonato de sodio (NaHCO₃). Cuidado: exceder 40 mg/L de bicarbonato aplana el perfil.`;
      } else {
        title = 'Agua de Alta Expresividad Aromática';
        cupImpact = 'Máxima extracción de compuestos volátiles. Acidez definida, notas frutales brillantes, florales pronunciados. Ideal para cafés naturales y honey de alta complejidad.';
        howTo = `Disuelve en 1 litro de agua destilada: 25–35 mg de MgSO₄·7H₂O (aporta el Mg²⁺ principal). ${hasNa ? 'Agrega 5–8 mg de NaCl para redondear.' : ''} Revuelve hasta disolver. TDS objetivo: 60–90 ppm.`;
      }
      usageTip = 'Perfecta para filtrado (V60, Chemex, Kalita). La alta expresividad del magnesio se potencia con métodos de baja agitación. Temperatura recomendada: 90–93°C.';
    } else if (dominantId === 'calcium') {
      title = 'Agua para Cuerpo y Textura';
      cupImpact = `Café con cuerpo pronunciado, textura densa, dulzura estructural y acidez moderada. ${hasMg ? 'La combinación con magnesio añade brillo aromático sin perder la textura.' : 'El perfil es redondo y envolvente, con menor brillo aromático.'}`;
      howTo = `Disuelve en 1 litro de agua destilada: 40–55 mg de CaCl₂ como fuente primaria de Ca²⁺. ${hasMg ? 'Agrega 15–20 mg de MgSO₄·7H₂O para agregar expresividad.' : ''} TDS objetivo: 80–120 ppm.`;
      usageTip = 'Excelente para espresso. El calcio potencia la extracción de melanoidinas responsables de la crema. También funciona bien con cafés de proceso lavado de alta densidad.';
    } else if (dominantId === 'sodium') {
      title = 'Agua Suave para Claridad Limpia';
      cupImpact = 'Suavidad extrema. El sodio suprime el amargor y aporta una sensación de redondez. El café resulta accesible pero puede perder intensidad si otros iones son insuficientes.';
      howTo = `Disuelve en 1 litro de agua destilada: 5–8 mg de NaCl. ${hasMg ? 'Agrega 20 mg de MgSO₄·7H₂O para agregar estructura extractiva.' : ''} Mantén TDS entre 50–70 ppm.`;
      usageTip = 'Útil para cafés muy tostados donde quieres reducir el amargor sin alterar el perfil aromático. No recomendado como base única — combínalo siempre con magnesio o calcio.';
    } else if (dominantId === 'potassium') {
      title = 'Agua de Alta Conductividad Extractiva';
      cupImpact = 'Mayor capacidad extractiva total. El café puede resultar más intenso y complejo, pero el desequilibrio potasio–magnesio puede generar algo de astringencia si se sobreextrae.';
      howTo = `Disuelve en 1 litro de agua destilada: 10–15 mg de KCl o KHCO₃. ${hasMg ? 'Complementa con 20 mg de MgSO₄·7H₂O.' : 'Añade Ca²⁺ a través de CaCl₂ (15–20 mg) para mayor balance.'}`;
      usageTip = 'Experimenta con ratios 1:16 o 1:17 para evitar la sobreextracción que el alto potasio puede provocar. Funciona mejor en cafés con tuestes medios.';
    } else if (dominantId === 'bicarbonate') {
      title = 'Agua Neutralizante (Buffer Máximo)';
      cupImpact = '⚠️ Esta configuración suavizará drásticamente la acidez del café. El bicarbonato como dominante producirá un café plano, poco expresivo, con perfil amargo y pesado. Se recomienda solo para cafés muy ácidos o robustas.';
      howTo = `Para uso deliberado como buffer: disuelve 30–40 mg de NaHCO₃ en 1 litro de agua destilada. No exceder 40 mg/L. ${hasMg ? 'El magnesio secundario intentará compensar el aplastamiento aromático.' : ''}`;
      usageTip = '⚠️ No recomendado para cafés de especialidad. Puede ser útil para bajar la acidez percibida en cafés naturales muy afrutados que resultan demasiado agresivos para algunos consumidores.';
    }

    return { title, howTo, cupImpact, usageTip };
  };

  const profile = showResult ? buildProfile() : null;
  const dominantColors = dominant ? getColorClasses(dominant.color) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* STEP 1 - Dominant */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Paso 1</p>
          <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Selecciona el compuesto dominante</h3>
          <p className="text-xs text-stone-500 mt-1">El compuesto dominante define el carácter principal de tu agua y del perfil de extracción.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOMINANT_COMPOUNDS.map(compound => {
            const isSelected = dominantId === compound.id;
            const colors = getColorClasses(compound.color);
            return (
              <button
                key={compound.id}
                onClick={() => { setDominantId(compound.id); setShowResult(false); setSecondaries(prev => prev.filter(s => s.id !== compound.id)); }}
                className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-current ${colors.text}`
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? colors.text : 'text-stone-400'}`}>
                    {compound.symbol}
                  </span>
                  {isSelected && <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />}
                </div>
                <p className={`text-sm font-black leading-tight mb-1 ${isSelected ? colors.text : 'text-stone-800 dark:text-stone-200'}`}>{compound.name}</p>
                <p className="text-[11px] text-stone-500 leading-snug">{compound.summary}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2 - Secondaries */}
      {dominantId && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Paso 2</p>
            <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Agrega compuestos secundarios</h3>
            <p className="text-xs text-stone-500 mt-1">Selecciona qué otros minerales estarán presentes y en qué proporción. El compuesto dominante ya está incluido.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_COMPOUNDS.filter(c => c.id !== dominantId).map(compound => {
              const sel = secondaries.find(s => s.id === compound.id);
              const isSelected = !!sel;
              return (
                <div key={compound.id} className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleSecondary(compound.id)}
                    className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {compound.symbol} · {compound.name}
                  </button>
                  {isSelected && (
                    <div className="flex gap-1.5 flex-wrap animate-fade-in">
                      {(['baja', 'media', 'alta'] as Proportion[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setSecondaryProportion(compound.id, p)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            sel?.proportion === p
                              ? 'bg-brand text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      {dominantId && (
        <div className="flex gap-3 animate-fade-in">
          <button
            onClick={generateResult}
            className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity text-sm"
          >
            Generar perfil de agua
          </button>
          <button
            onClick={reset}
            className="px-6 py-4 border border-stone-200 dark:border-stone-700 rounded-xl font-black uppercase tracking-widest text-stone-500 hover:border-stone-400 transition-all text-xs"
          >
            Reiniciar
          </button>
        </div>
      )}

      {/* Result */}
      {showResult && profile && dominant && dominantColors && (
        <div className={`rounded-3xl border-2 p-6 md:p-8 space-y-6 animate-fade-in ${dominantColors.bg} ${dominantColors.border}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dominantColors.text}`}>Perfil Generado</p>
            <h3 className={`text-2xl font-black uppercase tracking-tight leading-tight ${dominantColors.text}`}>{profile.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Cómo prepararlo</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{profile.howTo}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Impacto en la taza</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{profile.cupImpact}</p>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">💡 Cómo usarla</p>
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{profile.usageTip}</p>
          </div>

          {secondaries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${dominantColors.text} w-full`}>Composición del agua</span>
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${dominantColors.badge}`}>
                {dominant.name} (Dominante · {dominant.recommendedRange})
              </span>
              {secondaries.map(sec => {
                const c = DOMINANT_COMPOUNDS.find(d => d.id === sec.id);
                return c ? (
                  <span key={sec.id} className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    {c.name} · {sec.proportion}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// METRICS TAB
// ─────────────────────────────────────────────

const MetricsTab: React.FC = () => {
  const metrics = [
    { label: 'TDS Total', value: '75–250 mg/L', ideal: '150 mg/L', note: 'Total Dissolved Solids. Indica la cantidad total de minerales disueltos. Por debajo de 75 ppm el agua extrae poco; por encima de 250 puede saturar y enmascarar sabores.' },
    { label: 'Dureza Total (GH)', value: '50–175 mg/L CaCO₃', ideal: '~100 mg/L', note: 'Suma de Ca²⁺ y Mg²⁺. Define la capacidad extractiva total. Una dureza muy baja produce subextracción; muy alta puede generar exceso de cuerpo y astringencia.' },
    { label: 'Dureza al Carbonato (KH / Alcalinidad)', value: '40–75 mg/L CaCO₃', ideal: '40–50 mg/L', note: 'Relacionado con HCO₃⁻. Es la capacidad del agua para neutralizar ácidos (buffer). La SCA prefiere valores bajos para mantener la acidez natural del café.' },
    { label: 'pH', value: '6.5–7.5', ideal: '7.0', note: 'Agua levemente neutra. Valores muy bajos (ácidos) potencian la acidez pero pueden dañar el equipo. Valores muy altos (alcalinos) aplanan el perfil.' },
    { label: 'Sodio (Na⁺)', value: '< 10 mg/L', ideal: '< 5 mg/L', note: 'La SCA establece un máximo estricto. El sodio en exceso genera sabores salados o metálicos y puede alterar enzimas en los procesos de torrefacción.' },
    { label: 'Cloruros (Cl⁻)', value: '< 50 mg/L', ideal: '< 30 mg/L', note: 'El cloro libre destruye los compuestos aromáticos del café. El agua clorada (agua de red sin filtrar) es uno de los mayores enemigos del café de especialidad.' },
  ];

  const minerals = [
    { name: 'Magnesio (Mg²⁺)', color: 'emerald', roles: ['Extracción de compuestos aromáticos', 'Potencia acidez frutal y notas florales', 'Aumenta la brillantez percibida'], optimal: '10–30 mg/L', excess: 'Astringencia, amargor metálico, Sobreextracción', deficiency: 'Pérdida de aromas, café plano y sin vida' },
    { name: 'Calcio (Ca²⁺)', color: 'amber', roles: ['Aporta cuerpo y textura', 'Extrae melanoidinas y azúcares complejos', 'Estabilidad estructural del perfil'], optimal: '20–50 mg/L', excess: 'Exceso de cuerpo, opacidad aromática, incrustaciones en equipo', deficiency: 'Café liviano, sin base, con sensación acuosa' },
    { name: 'Sodio (Na⁺)', color: 'sky', roles: ['Suprime el amargor', 'Suaviza la acidez', 'Potencia percepción dulce en dosis micro'], optimal: '< 10 mg/L', excess: 'Sabor salado o metálico', deficiency: 'Sin efecto notable (no es esencial para extracción)' },
    { name: 'Potasio (K⁺)', color: 'violet', roles: ['Aumenta conductividad extractiva', 'Añade complejidad general', 'Complementa al Mg en perfiles complejos'], optimal: '5–15 mg/L', excess: 'Astringencia, perfil desequilibrado', deficiency: 'Sin efecto notable por sí solo' },
    { name: 'Bicarbonato (HCO₃⁻)', color: 'rose', roles: ['Buffer de pH (neutraliza ácidos)', 'Reduce variación de acidez entre tandas', 'En dosis bajas puede suavizar acidez muy agresiva'], optimal: '< 40 mg/L', excess: 'Café plano, sin acidez, perfil apagado y pesado', deficiency: 'pH inestable, acidez extrema con aguas muy suaves' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* SCA Metrics */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Métricas SCA para Agua de Café</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            La Specialty Coffee Association (SCA) establece rangos técnicos para el agua ideal. Estos parámetros garantizan una extracción óptima y protegen el equipo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-sm text-black dark:text-white uppercase tracking-tight">{m.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Ideal: <span className="font-bold text-brand">{m.ideal}</span></p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-full shrink-0">
                  {m.value}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-3">{m.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Minerals */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Minerales y su impacto en la taza</h3>
          <p className="text-xs text-stone-500 mt-1">Cada ion disuelto en el agua tiene un rol específico en la extracción y el perfil sensorial.</p>
        </div>
        <div className="space-y-4">
          {minerals.map((m) => {
            const colors = getColorClasses(m.color);
            return (
              <div key={m.name} className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 md:p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-base font-black ${colors.text} uppercase tracking-tight`}>{m.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}>
                    Óptimo: {m.optimal}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Roles en la extracción</p>
                    <ul className="space-y-1">
                      {m.roles.map((r, i) => <li key={i} className="text-stone-600 dark:text-stone-400 flex items-start gap-1.5"><span className={`${colors.text} font-black`}>·</span> {r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-2">Exceso</p>
                    <p className="text-stone-600 dark:text-stone-400">{m.excess}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">Deficiencia</p>
                    <p className="text-stone-600 dark:text-stone-400">{m.deficiency}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// RECIPES TAB
// ─────────────────────────────────────────────

const RecipesTab: React.FC = () => {
  const [openProduct, setOpenProduct] = useState<string | null>(null);

  const waterRecipes = [
    {
      id: 'body',
      title: 'Agua para Cuerpo',
      profile: 'Textura densa, dulzura pronunciada, acidez moderada',
      color: 'amber',
      description: 'Diseñada para extraer melanoidinas y azúcares complejos. Ideal para espresso y cafés de proceso natural.',
      ingredients: [
        { item: 'Agua destilada', qty: '1 litro (base)' },
        { item: 'Cloruro de calcio (CaCl₂ anhidro)', qty: '55 mg' },
        { item: 'Sulfato de magnesio (MgSO₄·7H₂O)', qty: '15 mg' },
      ],
      steps: [
        'Mide exactamente 1 litro de agua destilada (TDS < 5 ppm).',
        'Pesa 55 mg de cloruro de calcio (CaCl₂). Añádelo al agua.',
        'Pesa 15 mg de sulfato de magnesio (MgSO₄·7H₂O). Añádelo.',
        'Agita o remueve suavemente por 30 segundos hasta disolver por completo.',
        'Verifica TDS: debería estar entre 80–120 ppm.',
        'Usa directamente o almacena en botella hermética hasta 7 días.',
      ],
      tip: 'Para espresso: usa a 93°C. Para filtrado: 91–92°C. El calcio favorece una crema densa y una extracción estable en el tiempo.'
    },
    {
      id: 'sweetness',
      title: 'Agua para Dulzor',
      profile: 'Redondez, suavidad, dulzura percibida alta, acidez baja',
      color: 'violet',
      description: 'Balance entre magnesio y sodio que suprime el amargor y realza los azúcares naturales del café.',
      ingredients: [
        { item: 'Agua destilada', qty: '1 litro (base)' },
        { item: 'Sulfato de magnesio (MgSO₄·7H₂O)', qty: '25 mg' },
        { item: 'Cloruro de calcio (CaCl₂ anhidro)', qty: '20 mg' },
        { item: 'Cloruro de sodio (NaCl, sin aditivos)', qty: '5 mg' },
      ],
      steps: [
        'Mide exactamente 1 litro de agua destilada.',
        'Añade 25 mg de MgSO₄·7H₂O. Disuelve.',
        'Añade 20 mg de CaCl₂. Disuelve.',
        'Añade 5 mg de NaCl (sal de roca o kosher, sin yodo ni aditivos). Disuelve.',
        'Mezcla por 1 minuto hasta integración total.',
        'TDS objetivo: 70–100 ppm. pH aproximado: 6.8–7.2.',
        'Usa a 88–90°C para resaltar el dulzor sin aumentar la acidez.'
      ],
      tip: 'El sodium en dosis micros actúa como supresor del amargor. No aumentes la cantidad de NaCl — incluso 10 mg puede empezar a dar sabor salado.'
    },
    {
      id: 'clarity',
      title: 'Agua para Claridad',
      profile: 'Alta limpieza, acidez brillante, complejidad aromática, cuerpo ligero',
      color: 'emerald',
      description: 'Fórmula dominada por magnesio para potenciar al máximo los compuestos volátiles aromáticos. Pensada para filtrado de alta claridad.',
      ingredients: [
        { item: 'Agua destilada', qty: '1 litro (base)' },
        { item: 'Sulfato de magnesio (MgSO₄·7H₂O)', qty: '40 mg' },
        { item: 'Bicarbonato de potasio (KHCO₃)', qty: '10 mg' },
      ],
      steps: [
        'Mide exactamente 1 litro de agua destilada.',
        'Añade 40 mg de MgSO₄·7H₂O. Agita hasta disolver completamente.',
        'Añade 10 mg de KHCO₃. Mezcla suavemente.',
        'Deja reposar 2 minutos antes de verificar TDS (debería estar entre 55–80 ppm).',
        'Usa con métodos de filtrado de baja turbulencia: V60, Chemex, Kalita.',
        'Temperatura recomendada: 93–95°C para cafés de altura.'
      ],
      tip: 'Esta agua transforma V60s con cafés naturales o honey. La alta concentración de Mg extrae los ésteres y ácidos orgánicos volátiles responsables de las notas frutales más delicadas.'
    }
  ];

  const products = [
    {
      id: 'third-wave',
      name: 'Third Wave Water',
      color: 'sky',
      tagline: 'El estándar más popular del mercado',
      description: 'Third Wave Water (TWW) es un producto diseñado específicamente para hacer agua de café de especialidad a partir de agua destilada. Viene en cápsulas que se disuelven directamente. La fórmula original apunta a cumplir las especificaciones SCA con un balance de minerales predefinido.',
      howToUse: [
        'Añade 1 cápsula a exactamente 1 galón (3.78 litros) de agua destilada.',
        'Agita bien hasta disolver. El tiempo de disolución es de 1–2 minutos.',
        'TDS resultante: aproximadamente 150 ppm.',
        'Deja reposar 5 minutos antes de usar para estabilizar el balance iónico.',
        'Usa a la temperatura recomendada para tu método (90–94°C para filtrado, 93–95°C para espresso).'
      ],
      profiles: [
        { name: 'Classic Profile', benefit: 'Balance general SCA-compliant. Bueno para cafés de proceso lavado.' },
        { name: 'Espresso Profile', benefit: 'Más calcio, diseñado para extraer mejor la crema y el cuerpo en espresso.' },
        { name: 'Light Roast Profile', benefit: 'Más magnesio para realzar acidez y complejidad en tostados claros.' },
      ],
      tip: 'TWW es ideal para quienes quieren consistencia sin calcular manualmente. No es óptimo para experimentos finos — la fórmula es fija por cápsula.',
    },
    {
      id: 'apax',
      name: 'APAX LAB Concentrates',
      color: 'rose',
      tagline: 'Precisión científica y formulaciones específicas',
      description: 'APAX LAB ofrece ingredientes concentrados de minerales específicos para escalar recetas bases (por gota o gramo). Permite afinar el equilibrio con extrema precisión, incrementando la intensidad de ciertos sabores sin enmascarar otros.',
      howToUse: [
        'Utiliza el APAX LAB Water Recipe Calculator para escalar tu receta a tu dosis exacta.',
        'Añade las gotas o gramos del concentrado directamente sobre tu taza o recipiente.',
        'Ajusta la intensidad incrementando la concentración para un perfil más agresivo o rebajándola para uno sutil.',
        'Documenta tus gotas/recetas favoritas para estandarizar tus cafés.'
      ],
      profiles: [
        { name: 'TONIK [T]', benefit: 'Vibrante, brillante y jugoso. Rico en Magnesio, Cloruros y Calcio para potenciar la acidez de tu café.' },
        { name: 'JAMM [J]', benefit: 'Rico, dulce y cremoso. Magnifica el Calcio y Bicarbonato para acentuar cuerpo, textura y dulzura residual.' },
        { name: 'LYLAC [L]', benefit: 'Elegante, floral y sedoso. Aprovecha sulfatos y potasio para destacar características delicadas con cuerpo liso.' },
        { name: 'KONFLUX [K]', benefit: 'Dulzura, balance y textura redonda. Usa sílica y cloruro de calcio para hacer la taza más envolvente sin opacar el sabor base.' },
      ],
      tip: 'APAX LAB es perfecto para experimentación directa por su sistema de goteo. Utiliza LYLAC para Geishas o lavados etíopes florales, y JAMM para potenciar sudamericanos u orígenes de notas caramelizadas.',
    },
    {
      id: 'brew-water',
      name: 'Brew Water',
      color: 'violet',
      tagline: 'Simplicidad y consistencia para producción diaria',
      description: 'Brew Water ofrece kits de mineralización listos para usar con instrucciones claras y perfiles predefinidos. Está pensado para cafeterías que quieren mejorar la calidad del agua sin necesidad de equipos de laboratorio ni grandes conocimientos de química.',
      howToUse: [
        'Identifica tu perfil objetivo: cuerpo, dulzor o claridad.',
        'Usa el kit correspondiente (Brew Water tiene variantes según perfil).',
        'Sigue las instrucciones del kit: generalmente una tableta o medida de polvo por litro de agua destilada o muy blanda.',
        'Disuelve completamente antes de usar.',
        'Úsalo en filtros, espresso o cualquier método de preparación.'
      ],
      profiles: [
        { name: 'Body Formula', benefit: 'Alta concentración de Ca²⁺ para espresso con textura y dulzura pronunciada.' },
        { name: 'Clarity Formula', benefit: 'Mg²⁺ dominante para filtrado de alta claridad y expresividad.' },
        { name: 'Balanced Formula', benefit: 'TDS medio (~120 ppm) para uso general en cafetería. Cumple estándar SCA.' },
      ],
      tip: 'Brew Water es ideal para cafeterías de volumen medio-alto que quieren estandarizar sin complejidad. El costo por litro es muy competitivo comparado con otras soluciones de mercado.',
    }
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Water Recipes */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Recetas de Agua con Base Destilada</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Tres fórmulas diseñadas para resaltar perfiles específicos de taza. Todas parten de agua destilada (TDS &lt; 5 ppm) como base neutra.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {waterRecipes.map(recipe => {
            const colors = getColorClasses(recipe.color);
            return (
              <div key={recipe.id} className={`rounded-2xl border ${colors.border} ${colors.bg} flex flex-col`}>
                <div className="p-5 space-y-4 flex-1">
                  <div>
                    <h4 className={`font-black uppercase tracking-tight text-base ${colors.text}`}>{recipe.title}</h4>
                    <p className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">{recipe.profile}</p>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{recipe.description}</p>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Ingredientes</p>
                    <div className="space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="text-stone-600 dark:text-stone-400">{ing.item}</span>
                          <span className={`font-black shrink-0 ${colors.text}`}>{ing.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Paso a paso</p>
                    <ol className="space-y-1.5">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="text-[11px] text-stone-600 dark:text-stone-400 flex gap-2">
                          <span className={`font-black shrink-0 ${colors.text}`}>{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className={`m-4 rounded-xl p-3 bg-white/50 dark:bg-black/20`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">💡 Tip de barista</p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{recipe.tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Productos del Mercado</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Guía de uso y aprovechamiento de los tres productos más populares para mineralización de agua en café de especialidad.
          </p>
        </div>
        <div className="space-y-4">
          {products.map(product => {
            const colors = getColorClasses(product.color);
            const isOpen = openProduct === product.id;
            return (
              <div key={product.id} className={`rounded-2xl border ${colors.border} overflow-hidden`}>
                <button
                  onClick={() => setOpenProduct(isOpen ? null : product.id)}
                  className={`w-full flex items-center justify-between gap-4 p-5 ${colors.bg} text-left hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className={`font-black uppercase tracking-tight text-base ${colors.text}`}>{product.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium">{product.tagline}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-stone-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="p-5 md:p-6 space-y-6 bg-white dark:bg-stone-900 animate-fade-in">
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{product.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Manual de uso</p>
                        <ol className="space-y-2">
                          {product.howToUse.map((step, i) => (
                            <li key={i} className="text-[11px] text-stone-600 dark:text-stone-400 flex gap-2">
                              <span className={`font-black shrink-0 ${colors.text}`}>{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">Perfiles disponibles</p>
                        <div className="space-y-3">
                          {product.profiles.map((p, i) => (
                            <div key={i} className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text} mb-1`}>{p.name}</p>
                              <p className="text-[11px] text-stone-600 dark:text-stone-400">{p.benefit}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5">💡 Cómo sacarle el mayor provecho</p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{product.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export const WaterToolView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'metrics' | 'recipes'>('simulator');

  const tabs = [
    { id: 'simulator', label: 'Simulador', icon: FlaskConical },
    { id: 'metrics', label: 'Métricas', icon: Info },
    { id: 'recipes', label: 'Recetas', icon: BookOpen },
  ] as const;

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 pt-4">
        <div className="max-w-7xl mx-auto px-4 pb-0">
          <div className="flex items-center gap-4 mb-6 mt-2">
            <button
              onClick={onBack}
              className="group p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                Agua
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Mineralización, métricas y recetas
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-stone-400 hover:text-stone-600 hover:text-brand dark:hover:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'simulator' && <SimulatorTab />}
        {activeTab === 'metrics' && <MetricsTab />}
        {activeTab === 'recipes' && <RecipesTab />}
      </div>
    </div>
  );
};
