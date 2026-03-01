import React, { useState } from 'react';
import { ArrowLeft, Droplet, Flame } from 'lucide-react';
import { MilkFrothingSimulator } from './MilkFrothingSimulator';

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
  const [showSimulator, setShowSimulator] = useState(false);

  return (
    <div className="relative min-h-screen bg-white dark:bg-stone-950" style={{ scrollBehavior: 'smooth' }}>
      <TopBackButton onClick={onBack} />
      {showSimulator ? (
        /* Vista Simulador Fullscreen */
        <div className="min-h-screen flex flex-col bg-white dark:bg-stone-950 fixed inset-0 z-[100]">
          {/* Header con botón de retorno */}
          <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 p-4 shadow-sm safe-area-pt">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                  Simulador de Texturización
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                  Control completo: profundidad, ángulo, temperatura
                </p>
              </div>
              <button
                onClick={() => setShowSimulator(false)}
                className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold uppercase tracking-widest text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors touch-target"
              >
                ← Cerrar
              </button>
            </div>
          </div>

          {/* Simulador Component */}
          <div className="flex-1 overflow-y-auto relative scroll-smooth">
            <MilkFrothingSimulator />
          </div>
        </div>
      ) : (
        /* Vista Educativa */
        <div className="max-w-7xl mx-auto pb-32 animate-fade-in px-4 pt-20 md:pt-24">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tighter uppercase flex items-center gap-3">
            <span className="text-3xl md:text-4xl">☕</span>
            Leche
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 max-w-xl">
            Comprende la ciencia, aprende técnica y practica con simulador interactivo
          </p>
        </div>

        {/* Milk Science Section - Minimal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Science Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                La Ciencia
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Componentes clave de la leche</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Proteínas', pct: '3–3.5%', color: 'from-stone-100 to-stone-50 dark:from-stone-800/50 dark:to-stone-800/20', textColor: 'text-stone-700 dark:text-stone-300' },
                { label: 'Grasa', pct: '3.5–4%', color: 'from-stone-200 to-stone-100 dark:from-stone-700/50 dark:to-stone-700/20', textColor: 'text-stone-800 dark:text-stone-400' },
                { label: 'Lactosa', pct: '4.7–5%', color: 'from-stone-300 to-stone-200 dark:from-stone-600/50 dark:to-stone-600/20', textColor: 'text-stone-900 dark:text-stone-500' },
                { label: 'Agua', pct: '87–88%', color: 'from-stone-100 to-stone-50 dark:from-stone-800/50 dark:to-stone-800/20', textColor: 'text-stone-700 dark:text-stone-300' }
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-r ${item.color} rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2`}>
                  <span className={`font-bold text-xs sm:text-sm uppercase tracking-wider ${item.textColor}`}>{item.label}</span>
                  <span className={`text-xs font-mono font-bold ${item.textColor} flex-shrink-0`}>{item.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Points Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                Lo Importante
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Factores críticos</p>
            </div>

            <div className="space-y-4">
              {[
                { icon: '🌡️', label: 'Temperatura', value: '60–65°C', desc: 'Zona segura', color: 'bg-stone-50 dark:bg-stone-800/30' },
                { icon: '💨', label: 'Aire', value: '25–50%', desc: 'Microespuma', color: 'bg-stone-50 dark:bg-stone-800/30' },
                { icon: '🌀', label: 'Vórtice', value: 'Constante', desc: 'Integración', color: 'bg-stone-50 dark:bg-stone-800/30' },
                { icon: '🧨', label: 'Leche', value: 'Fría', desc: '4–6°C', color: 'bg-stone-50 dark:bg-stone-800/30' }
              ].map((item, i) => (
                <div key={i} className={`${item.color} rounded-lg p-4 flex items-start gap-3 sm:gap-4`}>
                  <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">{item.label}</span>
                      <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">{item.value}</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technique Guide - Simplified */}
        <div className="mb-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
              Técnica
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">6 pasos para microespuma sedosa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { step: 1, title: 'Leche fría', desc: 'Saca del refrigerador. 4–6°C. Jarra limpia.' },
              { step: 2, title: 'Posición lateral', desc: '1–2 cm bajo la superficie. Ángulo 45°.' },
              { step: 3, title: 'Aireación', desc: 'Sonido "chisss". 5–8 segundos. Crea vórtice.' },
              { step: 4, title: 'Integración', desc: 'Baja la jarra. Mantén rotación. Fluidez.' },
              { step: 5, title: 'Temperatura', desc: 'Monitor: 60–65°C. Apaga antes.' },
              { step: 6, title: 'Limpieza', desc: 'Purgue. Limpia inmediatamente. Seca.' }
            ].map((item) => (
              <div key={item.step} className="flex gap-3 sm:gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-800">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm">
                  {item.step}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">{item.title}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-stone-100 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/50 rounded-lg p-4 flex gap-3">
            <Flame className="w-5 h-5 text-stone-700 dark:text-stone-300 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-1">Regla de Oro</p>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                <strong>60–65°C</strong> es tu zona segura. Menos = espuma inestable. Más = textura destruida.
              </p>
            </div>
          </div>
        </div>

        {/* Simulator - Clean CTA */}
        <div className="mb-12 bg-stone-50 dark:bg-stone-900/50 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 md:p-10 text-center space-y-6">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
              Practica Aquí
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Control interactivo de profundidad, ángulo y temperatura. Métricas en vivo. Historial de intentos.
            </p>
          </div>

          <button
            onClick={() => setShowSimulator(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-black dark:bg-stone-100 text-white dark:text-stone-900 font-black uppercase tracking-[0.25em] rounded-lg hover:scale-105 transform transition-transform text-xs md:text-sm shadow-lg hover:shadow-xl touch-target"
          >
            Iniciar Simulador →
          </button>
        </div>


        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-4 sm:p-5 space-y-3">
            <h3 className="font-bold uppercase tracking-wide sm:tracking-widest text-red-900 dark:text-red-100 text-xs sm:text-sm">
              ✕ Errores
            </h3>
            <ul className="space-y-2 text-xs text-red-900 dark:text-red-200">
              <li>• Temperatura mayor a 70°C</li>
              <li>• Sin vórtice constante</li>
              <li>• Lanceta no lateral</li>
              <li>• Leche tibia al inicio</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-4 sm:p-5 space-y-3">
            <h3 className="font-bold uppercase tracking-wide sm:tracking-widest text-green-900 dark:text-green-100 text-xs sm:text-sm">
              ✓ Clave
            </h3>
            <ul className="space-y-2 text-xs text-green-900 dark:text-green-200">
              <li>• Leche fría: 4–6°C</li>
              <li>• Termómetro en práctica</li>
              <li>• Posición lateral consistente</li>
              <li>• Limpieza inmediata</li>
            </ul>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
