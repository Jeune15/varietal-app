import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Check, ArrowUp, ArrowDown, MoveVertical, MoveHorizontal, Thermometer, Scale, Dna, HelpCircle, History, Lightbulb } from 'lucide-react';
import { ShotState, Adjustment, Level } from './engine/types';
import { generateRandomCase, generatePresetCase } from './engine/caseGenerator';
import { applyAdjustment } from './engine/calibrationEngine';
import { describeShot } from './engine/sensoryTranslator';
import { isVictory } from './engine/victory';
import { getAdvice } from './engine/advisor';
import { presets, SimulationPreset } from './engine/presets';

export const EspressoSimulator: React.FC = () => {
  const [state, setState] = useState<ShotState | null>(null);
  const [history, setHistory] = useState<ShotState[]>([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState<Adjustment[]>([]);
  const [won, setWon] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);

  const resetSimulation = () => {
    setState(null);
    setHistory([]);
    setAdjustmentHistory([]);
    setWon(false);
    setSelectedPresetId(null);
    setShowHints(false);
    setShowAdvisor(false);
  };

  // Initial state selection screen
  if (!state) {
    return (
      <div className="space-y-6 animate-fade-in p-4 md:p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Simulador de Calibración</h2>
          <p className="text-stone-500 dark:text-stone-400">Selecciona un escenario para practicar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Random Case Option */}
          <button
            onClick={() => {
              const newState = generateRandomCase();
              setState(newState);
              setHistory([newState]);
              setAdjustmentHistory([]);
              setWon(false);
              setSelectedPresetId(null);
            }}
            className="flex flex-col items-start p-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-brand hover:shadow-md transition-all text-left group"
          >
            <div className="p-2 bg-white dark:bg-stone-900 rounded-lg mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Dna className="w-6 h-6 text-brand" />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-stone-200">Caso Aleatorio</h3>
            <p className="text-sm text-stone-500 mt-1">Genera un problema de extracción al azar.</p>
          </button>

          {/* Presets */}
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const newState = generatePresetCase(preset.id);
                setState(newState);
                setHistory([newState]);
                setAdjustmentHistory([]);
                setWon(false);
                setSelectedPresetId(preset.id);
              }}
              className="flex flex-col items-start p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-brand hover:shadow-md transition-all text-left group"
            >
              <div className="flex justify-between w-full mb-2">
                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${
                  preset.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  preset.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {preset.difficulty === 'easy' ? 'Fácil' : preset.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                </span>
              </div>
              <h3 className="font-bold text-stone-800 dark:text-stone-200">{preset.label}</h3>
              <p className="text-sm text-stone-500 mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleAdjustment = (adjustment: Adjustment) => {
    if (!state || won) return;

    const newState = applyAdjustment(state, adjustment);
    setState(newState);
    setHistory([...history, newState]);
    setAdjustmentHistory([...adjustmentHistory, adjustment]);

    if (isVictory(newState)) {
      setWon(true);
    }
  };

  const clamp = (v: number) => Math.max(-2, Math.min(2, v));

  const getLevelColor = (level: Level) => {
    if (level === 0) return 'bg-green-500';
    if (Math.abs(level) === 1) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelLabel = (level: Level, type: 'extraction' | 'intensity' | 'balance') => {
    if (level === 0) return 'Ideal';
    
    if (type === 'extraction') {
      if (level < 0) return level === -1 ? 'Sub-extraído' : 'Muy Sub-extraído';
      return level === 1 ? 'Sobre-extraído' : 'Muy Sobre-extraído';
    }
    if (type === 'intensity') {
      if (level < 0) return level === -1 ? 'Ligero' : 'Muy Ligero';
      return level === 1 ? 'Intenso' : 'Muy Intenso';
    }
    if (type === 'balance') {
      return 'Desbalanceado';
    }
    return '';
  };

  const getAdjustmentLabel = (adj: Adjustment) => {
    switch (adj) {
      case 'finerGrind': return 'Molienda Más Fina';
      case 'coarserGrind': return 'Molienda Más Gruesa';
      case 'higherRatio': return 'Mayor Ratio (Más largo)';
      case 'lowerRatio': return 'Menor Ratio (Más corto)';
      case 'higherTemp': return 'Temperatura Más Alta';
      case 'lowerTemp': return 'Temperatura Más Baja';
    }
  };

  const getAdjustmentExplanation = (adj: Adjustment) => {
    switch (adj) {
      case 'finerGrind': return 'Aumenta la resistencia y superficie de contacto. Sube extracción e intensidad.';
      case 'coarserGrind': return 'Reduce la resistencia y superficie de contacto. Baja extracción e intensidad.';
      case 'higherRatio': return 'Más agua pasa por el café. Aumenta extracción pero diluye la intensidad (cuerpo).';
      case 'lowerRatio': return 'Menos agua pasa por el café. Reduce extracción pero concentra la intensidad.';
      case 'higherTemp': return 'El agua más caliente extrae más rápido. Aumenta extracción y reduce acidez.';
      case 'lowerTemp': return 'El agua más fría extrae más lento. Reduce extracción y resalta acidez.';
    }
  };

  const currentPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {currentPreset ? currentPreset.label : 'Caso Aleatorio'}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {currentPreset ? currentPreset.targetGoal : 'Encuentra el balance ideal.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
           {currentPreset && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-3 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 transition-colors min-h-[44px]"
            >
              <HelpCircle size={16} />
              {showHints ? 'Ocultar' : 'Pistas'}
            </button>
          )}
          
          {/* Advisor Button */}
          <button
            onClick={() => setShowAdvisor(!showAdvisor)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400 transition-colors min-h-[44px]"
          >
            <Lightbulb size={16} />
            {showAdvisor ? 'Ocultar' : 'Coach'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-3 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors min-h-[44px]"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Cambiar Caso</span>
            <span className="sm:hidden">Cambiar</span>
          </button>
        </div>
      </div>

      {showHints && currentPreset && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-6 animate-fade-in">
          <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
            <HelpCircle size={16} /> Pistas para este caso:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {currentPreset.hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {showAdvisor && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-6 animate-fade-in">
          <h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2">
            <Lightbulb size={16} /> Consejo del Coach:
          </h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {getAdvice(state)}
          </p>
        </div>
      )}

      {won ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 md:p-8 text-center animate-bounce-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200 rounded-full mb-4">
            <Check size={32} />
          </div>
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">¡Calibración Exitosa!</h3>
          <p className="text-green-700 dark:text-green-300 mb-6">
            Has logrado el balance ideal en {history.length - 1} ajustes.
          </p>

          <div className="mb-8 text-left bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <History size={16} />
              Resumen de tus decisiones
            </div>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {adjustmentHistory.map((adj, index) => (
                <div key={index} className="p-4 flex gap-4 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                      {getAdjustmentLabel(adj)}
                    </h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {getAdjustmentExplanation(adj)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={resetSimulation}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Siguiente Café
          </button>
        </div>
      ) : (
        <>
          {/* Sensory Feedback Section */}
          <div className="bg-stone-50 dark:bg-stone-950/50 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4">
              Análisis Sensorial
            </h3>
            <p className="text-lg md:text-xl font-medium text-stone-800 dark:text-stone-200 italic leading-relaxed">
              "{describeShot(state)}"
            </p>
          </div>

          {/* State Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Extracción', value: state.extraction, type: 'extraction' as const },
              { label: 'Intensidad', value: state.intensity, type: 'intensity' as const },
              { label: 'Balance', value: state.balance, type: 'balance' as const },
            ].map((metric) => (
              <div key={metric.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{metric.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    metric.value === 0 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}>
                    {getLevelLabel(metric.value, metric.type)}
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  {[-2, -1, 0, 1, 2].map((level) => {
                    const isActive = clamp(metric.value) === level;
                    return (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isActive ? getLevelColor(level) : 'bg-stone-100 dark:bg-stone-800'
                        } ${isActive ? 'scale-110' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Realizar Ajuste
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Grind Settings */}
              <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl sm:p-0 sm:bg-transparent sm:dark:bg-transparent">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 mb-1 px-1">
                  <MoveHorizontal size={16} />
                  <span className="text-sm font-bold">Molienda</span>
                </div>
                <button
                  onClick={() => handleAdjustment('finerGrind')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Más Fina</span>
                  <ArrowDown size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
                <button
                  onClick={() => handleAdjustment('coarserGrind')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Más Gruesa</span>
                  <ArrowUp size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
              </div>

              {/* Ratio Settings */}
              <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl sm:p-0 sm:bg-transparent sm:dark:bg-transparent">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 mb-1 px-1">
                  <Scale size={16} />
                  <span className="text-sm font-bold">Ratio</span>
                </div>
                <button
                  onClick={() => handleAdjustment('higherRatio')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Mayor Ratio (Más largo)</span>
                  <ArrowUp size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
                <button
                  onClick={() => handleAdjustment('lowerRatio')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Menor Ratio (Más corto)</span>
                  <ArrowDown size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
              </div>

              {/* Temperature Settings */}
              <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl sm:p-0 sm:bg-transparent sm:dark:bg-transparent">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 mb-1 px-1">
                  <Thermometer size={16} />
                  <span className="text-sm font-bold">Temperatura</span>
                </div>
                <button
                  onClick={() => handleAdjustment('higherTemp')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Más Alta</span>
                  <ArrowUp size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
                <button
                  onClick={() => handleAdjustment('lowerTemp')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm transition-all text-left group min-h-[44px]"
                >
                  <span className="text-sm">Más Baja</span>
                  <ArrowDown size={14} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History/Log */}
      {history.length > 1 && (
        <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase mb-2">Historial de intentos: {history.length - 1}</p>
          <div className="flex gap-1 flex-wrap">
            {history.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === history.length - 1 ? 'w-8 bg-stone-800 dark:bg-stone-200' : 'w-2 bg-stone-300 dark:bg-stone-700'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
