import React, { useState } from 'react';
import { ArrowLeft, Droplet, Flame, ChevronDown, AlertTriangle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MilkFrothingSimulator } from './MilkFrothingSimulator';

const milkComponents = [
  {
    id: 'proteins',
    label: 'Proteínas',
    subLabel: '(caseína + proteínas del suero)',
    pct: '3–3.5%',
    color: 'from-stone-100 to-stone-50 dark:from-stone-800/50 dark:to-stone-800/20',
    textColor: 'text-stone-700 dark:text-stone-300',
    content: {
      role: {
        title: 'Qué hacen en la texturización',
        description: 'Son las responsables de la espuma.',
        points: [
          'El aire se incorpora.',
          'Las proteínas se desnaturalizan (se “abren”).',
          'Se acomodan alrededor de las burbujas y las estabilizan.',
          'Sin proteínas no hay estructura.'
        ]
      },
      cup: {
        title: 'En taza aportan',
        points: [
          'Cremosidad',
          'Sensación sedosa',
          'Estabilidad en el latte art',
          'Cuerpo lácteo equilibrado'
        ]
      },
      low: {
        title: '❌ Si hay poca proteína',
        points: [
          'Espuma grande y burbujas irregulares',
          'Se separa rápido (espuma arriba, leche abajo)',
          'Latte art inestable',
          'Sensación aguada y sin textura'
        ]
      },
      note: '💡 Por eso la leche “barista” suele tener proteína ligeramente más alta.'
    }
  },
  {
    id: 'fats',
    label: 'Grasas',
    pct: '3.5–4%',
    color: 'from-stone-200 to-stone-100 dark:from-stone-700/50 dark:to-stone-700/20',
    textColor: 'text-stone-800 dark:text-stone-400',
    content: {
      role: {
        title: '🔬 Qué hacen en la texturización',
        description: 'La grasa interfiere ligeramente con la formación de espuma (porque desestabiliza burbujas) pero aporta suavidad y lubricación. Es un equilibrio delicado.'
      },
      cup: {
        title: '🧈 En taza aportan',
        points: [
          'Cuerpo',
          'Sensación redonda',
          'Persistencia',
          'Boca más “aterciopelada”'
        ]
      },
      low: {
        title: '❌ Si hay poca grasa (leche descremada)',
        points: [
          'Espuma muy fácil de hacer',
          'Más volumen de espuma',
          'Pero textura menos cremosa',
          'Sensación más seca',
          'Menor integración con espresso'
        ]
      },
      high: {
        title: '❌ Si hay demasiada grasa',
        points: [
          'Espuma más difícil de estabilizar',
          'Puede sentirse pesada',
          'Menos definición aromática'
        ]
      },
      note: 'Por eso la entera suele dar el mejor balance sensorial.'
    }
  },
  {
    id: 'lactose',
    label: 'Lactosa',
    subLabel: '(azúcar natural de la leche)',
    pct: '4.7–5%',
    color: 'from-stone-300 to-stone-200 dark:from-stone-600/50 dark:to-stone-600/20',
    textColor: 'text-stone-900 dark:text-stone-500',
    content: {
      role: {
        description: 'La lactosa no ayuda a formar espuma directamente, pero es CLAVE en sabor.'
      },
      cup: {
        title: '🍬 En taza aporta',
        points: [
          'Dulzor natural',
          'Balance de acidez del café',
          'Sensación más redonda',
          'Caramelización ligera si sobrecalientas (aunque no como sacarosa)'
        ]
      },
      low: {
        title: '❌ Si hay poca lactosa',
        points: [
          'La leche sale plana',
          'El café se siente más ácido',
          'Menos sensación de “armonía”',
          'Final más corto'
        ]
      },
      note: 'Interesante: al texturizar a 55–65°C percibimos más dulzor porque la lactosa se vuelve más perceptible, no porque aumente.'
    }
  },
  {
    id: 'water',
    label: 'Agua',
    pct: '87–88%',
    color: 'from-stone-100 to-stone-50 dark:from-stone-800/50 dark:to-stone-800/20',
    textColor: 'text-stone-700 dark:text-stone-300',
    content: {
      role: {
        description: 'Sí, el 85–90% de la leche es agua. Es el medio donde todo sucede, define viscosidad e influye en cuerpo final.'
      },
      high: {
        title: '❌ Si hay demasiada agua (leche diluida)',
        points: [
          'Espuma inestable',
          'Sensación ligera',
          'Café domina demasiado',
          'Textura débil'
        ]
      },
      low: {
        title: '❌ Si hay menos agua (leche concentrada)',
        points: [
          'Más cuerpo',
          'Textura más densa',
          'Mayor estabilidad',
          'Sensación más pesada'
        ]
      }
    }
  }
];

const commonProblems = [
  {
    id: 'screaming',
    title: 'Grita al vaporizar (chillido agudo)',
    cause: 'La lanceta está demasiado profunda o no entra aire al inicio.',
    solution: 'Baja la jarra ligeramente hasta escuchar el "tss-tss" suave (aire entrando). El chillido indica que solo estás calentando leche sin texturizar.'
  },
  {
    id: 'big-bubbles',
    title: 'Burbujas grandes y visibles',
    cause: 'Introdujiste aire demasiado rápido, muy tarde (cuando la leche ya estaba caliente) o la lanceta estaba muy en la superficie.',
    solution: 'Introduce el aire SOLO al principio (antes de que la jarra se caliente). Luego hunde la lanceta ligeramente para crear vórtice y romper las burbujas grandes.'
  },
  {
    id: 'separation',
    title: 'La espuma se separa de la leche',
    cause: 'Demasiado aire (espuma muy seca) o dejaste reposar la jarra mucho tiempo antes de servir.',
    solution: 'Introduce menos aire (menos tiempo de "tss-tss"). Si reposa, agita la jarra en círculos (swirl) para reintegrar antes de verter.'
  },
  {
    id: 'no-spin',
    title: 'La leche no gira (sin vórtice)',
    cause: 'La lanceta está en el centro de la jarra o muy profunda.',
    solution: 'Busca una posición descentrada (a un lado) y encuentra el ángulo donde la leche empiece a rotar. El vórtice es vital para mezclar la espuma con el líquido.'
  },
  {
    id: 'too-hot',
    title: 'Leche quemada o sin dulzor',
    cause: 'Superaste los 70°C. Las proteínas se desnaturalizan por completo y la lactosa pierde percepción de dulzor.',
    solution: 'Usa tu mano en la jarra. Cuando esté demasiado caliente para tocarla (aprox 60°C), apaga inmediatamente. El calor residual subirá unos grados más.'
  }
];

interface TopBackButtonProps {
  onClick?: () => void;
}

const TopBackButton: React.FC<TopBackButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 md:top-6 left-4 md:left-8 z-[200] inline-flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-[11px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 touch-target"
      aria-label="Volver"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Volver</span>
    </button>
  );
};

export const MilkTextureView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'science' | 'technique' | 'problems'>('simulator');
  const [openId, setOpenId] = useState<string | null>(null);
  const [problemOpenId, setProblemOpenId] = useState<string | null>(null);

  const tabs = [
    { id: 'simulator', label: 'Simulador' },
    { id: 'science', label: 'Ciencia' },
    { id: 'technique', label: 'Técnica' },
    { id: 'problems', label: 'Problemas Comunes' }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-stone-950" style={{ scrollBehavior: 'smooth' }}>
      
      {/* Sticky Header - Cata Style */}
      <div className="sticky top-0 z-[100] bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 safe-area-pt">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                  LECHE
                </h1>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-500">
                  Conceptos, Técnica y Simulador
                </p>
              </div>
            </div>

            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-4 py-2.5 rounded-full text-[11px] md:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 shadow-md border border-black dark:border-stone-100'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 pb-32 animate-fade-in">
        
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl">
               <MilkFrothingSimulator />
            </div>
          </div>
        )}

        {activeTab === 'science' && (
          <div className="space-y-12 animate-fade-in">
            {/* Milk Science Section */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                  La Ciencia (Componentes Clave)
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Entiende qué pasa al texturizar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milkComponents.map((item) => {
                  const isOpen = openId === item.id;
                  return (
                    <div key={item.id} className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm transition-all duration-300">
                      <button
                        onClick={() => setOpenId(isOpen ? null : item.id)}
                        className={`w-full bg-gradient-to-r ${item.color} p-5 flex items-center justify-between gap-3 text-left transition-all hover:opacity-95 touch-target`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`font-bold text-sm uppercase tracking-wider ${item.textColor}`}>{item.label}</span>
                            <span className={`text-xs font-mono font-bold ${item.textColor} flex-shrink-0 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full`}>{item.pct}</span>
                          </div>
                          {item.subLabel && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${item.textColor} block truncate`}>{item.subLabel}</span>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 ${item.textColor} transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="bg-white dark:bg-stone-900 overflow-hidden"
                          >
                            <div className="p-6 space-y-6 text-sm text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800">
                              {/* Role */}
                              {item.content.role && (
                                <div className="space-y-2">
                                  {item.content.role.title && <h4 className="font-black text-stone-900 dark:text-stone-100 uppercase text-xs tracking-widest">{item.content.role.title}</h4>}
                                  {item.content.role.description && <p className="leading-relaxed text-xs">{item.content.role.description}</p>}
                                  {item.content.role.points && (
                                    <ul className="list-disc pl-4 space-y-1 marker:text-stone-400 text-xs">
                                      {item.content.role.points.map((p, i) => <li key={i} className="pl-1 leading-relaxed">{p}</li>)}
                                    </ul>
                                  )}
                                </div>
                              )}

                              {/* Cup */}
                              {item.content.cup && (
                                <div className="space-y-2">
                                  {item.content.cup.title && <h4 className="font-black text-stone-900 dark:text-stone-100 uppercase text-xs tracking-widest">{item.content.cup.title}</h4>}
                                  {item.content.cup.points && (
                                    <ul className="list-disc pl-4 space-y-1 marker:text-stone-400 text-xs">
                                      {item.content.cup.points.map((p, i) => <li key={i} className="pl-1 leading-relaxed">{p}</li>)}
                                    </ul>
                                  )}
                                </div>
                              )}

                              {/* Low - Warning */}
                              {item.content.low && (
                                <div className="space-y-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                  {item.content.low.title && <h4 className="font-bold text-red-800 dark:text-red-200 uppercase text-[10px] tracking-widest mb-2">{item.content.low.title}</h4>}
                                  {item.content.low.points && (
                                    <ul className="list-disc pl-4 space-y-1 marker:text-red-400 text-red-700 dark:text-red-300 text-xs">
                                      {item.content.low.points.map((p, i) => <li key={i} className="pl-1 leading-relaxed">{p}</li>)}
                                    </ul>
                                  )}
                                </div>
                              )}

                              {/* High - Warning */}
                              {item.content.high && (
                                <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                  {item.content.high.title && <h4 className="font-bold text-amber-800 dark:text-amber-200 uppercase text-[10px] tracking-widest mb-2">{item.content.high.title}</h4>}
                                  {item.content.high.points && (
                                    <ul className="list-disc pl-4 space-y-1 marker:text-amber-400 text-amber-700 dark:text-amber-300 text-xs">
                                      {item.content.high.points.map((p, i) => <li key={i} className="pl-1 leading-relaxed">{p}</li>)}
                                    </ul>
                                  )}
                                </div>
                              )}

                              {/* Note */}
                              {item.content.note && (
                                <div className="text-xs font-bold text-stone-500 dark:text-stone-400 italic pt-3 border-t border-stone-100 dark:border-stone-800">
                                  {item.content.note}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Points */}
            <div className="space-y-6 border-t border-stone-200 dark:border-stone-800 pt-8">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                  Lo Importante
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Factores críticos</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🌡️', label: 'Temperatura', value: '60–65°C', desc: 'Zona segura', color: 'bg-stone-50 dark:bg-stone-800/30' },
                  { icon: '💨', label: 'Aire', value: '25–50%', desc: 'Microespuma', color: 'bg-stone-50 dark:bg-stone-800/30' },
                  { icon: '🌀', label: 'Vórtice', value: 'Constante', desc: 'Integración', color: 'bg-stone-50 dark:bg-stone-800/30' },
                  { icon: '🧨', label: 'Leche', value: 'Fría', desc: '4–6°C', color: 'bg-stone-50 dark:bg-stone-800/30' }
                ].map((item, i) => (
                  <div key={i} className={`${item.color} rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 border border-stone-200 dark:border-stone-800 shadow-sm`}>
                    <span className="text-3xl">{item.icon}</span>
                    <div className="space-y-1">
                      <span className="font-black text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100 block">{item.label}</span>
                      <span className="text-xs font-mono font-bold bg-white dark:bg-stone-950 px-2 py-1 rounded-md text-stone-600 dark:text-stone-400 block w-max mx-auto">{item.value}</span>
                      <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mt-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technique' && (
          <div className="space-y-12 animate-fade-in">
            {/* Technique Guide Section */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                  Técnica de 6 Pasos
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Paso a paso para microespuma sedosa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { step: 1, title: 'Leche fría', desc: 'Saca del refrigerador. 4–6°C. Jarra limpia.' },
                  { step: 2, title: 'Posición lateral', desc: '1–2 cm bajo la superficie. Ángulo 45°.' },
                  { step: 3, title: 'Aireación', desc: 'Sonido "chisss". 5–8 segundos. Crea vórtice.' },
                  { step: 4, title: 'Integración', desc: 'Baja la jarra. Mantén rotación. Fluidez.' },
                  { step: 5, title: 'Temperatura', desc: 'Monitor: 60–65°C. Apaga antes.' },
                  { step: 6, title: 'Limpieza', desc: 'Purgue. Limpia inmediatamente. Seca.' }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col gap-4 p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-black dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-black text-lg shadow-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-2">{item.title}</h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-stone-100 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 rounded-xl p-5 flex gap-4 mt-6">
                <Flame className="w-6 h-6 text-stone-700 dark:text-stone-300 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">Regla de Oro</p>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    <strong>60–65°C</strong> es tu zona segura. Menos = espuma inestable. Más = textura destruida.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-stone-200 dark:border-stone-800">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-black uppercase tracking-widest text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" /> Errores Comunes
                </h3>
                <ul className="space-y-3 font-medium text-sm text-red-800 dark:text-red-400/80">
                  <li className="flex gap-2"><span>•</span> Temperatura mayor a 70°C</li>
                  <li className="flex gap-2"><span>•</span> Sin vórtice constante</li>
                  <li className="flex gap-2"><span>•</span> Lanceta no lateral o en el fondo</li>
                  <li className="flex gap-2"><span>•</span> Leche tibia al iniciar</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-6 space-y-4">
                <h3 className="font-black uppercase tracking-widest text-green-900 dark:text-green-300 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Pasos Clave
                </h3>
                <ul className="space-y-3 font-medium text-sm text-green-800 dark:text-green-400/80">
                  <li className="flex gap-2"><span>•</span> Leche fría: 4–6°C</li>
                  <li className="flex gap-2"><span>•</span> Termómetro para practicar siempre</li>
                  <li className="flex gap-2"><span>•</span> Posición lateral firme</li>
                  <li className="flex gap-2"><span>•</span> Limpieza y purgue inmediato</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Problemas Comunes
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Diagnóstico y solución rápida</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commonProblems.map((problem) => {
                const isOpen = problemOpenId === problem.id;
                return (
                  <div key={problem.id} className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900/80 overflow-hidden shadow-sm transition-colors hover:border-black dark:hover:border-stone-500">
                    <button
                      onClick={() => setProblemOpenId(isOpen ? null : problem.id)}
                      className="w-full text-left p-5 flex items-center justify-between touch-target"
                    >
                      <span className="font-bold text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">
                        {problem.title}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 space-y-4">
                            <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 block mb-2">Causa Probable</span>
                              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed font-medium">
                                {problem.cause}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-500 block mb-2">Solución</span>
                              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed font-medium">
                                {problem.solution}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
