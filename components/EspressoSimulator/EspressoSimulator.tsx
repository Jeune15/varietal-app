import React, { useState } from 'react';
import { RefreshCw, Check, Lightbulb } from 'lucide-react';
import { ShotState, Adjustment, Level, Difficulty } from './engine/types';
import { generateRandomCase, generatePresetCase } from './engine/caseGenerator';
import { applyAdjustment } from './engine/calibrationEngine';
import { describeShot } from './engine/sensoryTranslator';
import { isVictory } from './engine/victory';
import { getAdvice } from './engine/advisor';
import { presets } from './engine/presets';

export const EspressoSimulator: React.FC = () => {
  const [state, setState] = useState<ShotState | null>(null);
  const [history, setHistory] = useState<ShotState[]>([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState<Adjustment[]>([]);
  const [won, setWon] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const resetSimulation = () => {
    setState(null);
    setHistory([]);
    setAdjustmentHistory([]);
    setWon(false);
    setSelectedPresetId(null);
    setShowAdvisor(false);
    setSelectedDifficulty(null);
  };

  // Pantalla inicial - Selección de modo
  if (!state && selectedDifficulty === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-4">
              Calibración
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-600 dark:text-stone-400">
              Espresso
            </h2>
          </div>

          {/* Botones principales */}
          <div className="space-y-4 mb-8">
            {/* Casos Aleatorios */}
            <button
              onClick={() => setSelectedDifficulty('basic')}
              className="w-full p-8 flex flex-col text-left border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-900 dark:hover:border-stone-100 transition-colors group"
            >
              <h3 className="text-2xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-2">
                Casos Aleatorios
              </h3>
              <p className="text-stone-600 dark:text-stone-400">Desafíos generados para practicar tu calibración</p>
            </button>

            {/* Presets divider */}
            <div className="py-4">
              <div className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">
                Desafíos Predeterminados
              </div>
            </div>
          </div>

          {/* Presets grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset, idx) => (
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
                className="p-6 flex flex-col text-left border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-900 dark:hover:border-stone-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 text-lg">
                    {preset.label}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">
                    {preset.difficulty === 'easy' ? 'Básico' : preset.difficulty === 'medium' ? 'Medio' : 'Avanzado'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de selección de nivel
  if (!state && selectedDifficulty !== null) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-4">
              Selecciona Nivel
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm">Cuántos ajustes disponibles tendrás</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Nivel Básico */}
            <button
              onClick={() => {
                const newState = generateRandomCase('basic');
                setState(newState);
                setHistory([newState]);
                setAdjustmentHistory([]);
                setWon(false);
                setSelectedDifficulty('basic');
              }}
              className="p-8 flex flex-col text-left border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-900 dark:hover:border-stone-100 transition-colors"
            >
              <h3 className="font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-3 text-xl">
                Básico
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">3 ajustes disponibles</p>
              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-500">
                <div>• Molienda</div>
                <div>• Ratio</div>
                <div>• Temperatura</div>
              </div>
            </button>

            {/* Nivel Avanzado */}
            <button
              onClick={() => {
                const newState = generateRandomCase('advanced');
                setState(newState);
                setHistory([newState]);
                setAdjustmentHistory([]);
                setWon(false);
                setSelectedDifficulty('advanced');
              }}
              className="p-8 flex flex-col text-left border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-900 dark:hover:border-stone-100 transition-colors"
            >
              <h3 className="font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-3 text-xl">
                Avanzado
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">5 ajustes disponibles</p>
              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-500">
                <div>• Molienda</div>
                <div>• Ratio</div>
                <div>• Temperatura</div>
                <div>• Dosis</div>
                <div>• Preinfusión</div>
              </div>
            </button>
          </div>

          <button
            onClick={() => setSelectedDifficulty(null)}
            className="w-full py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold uppercase tracking-widest text-sm transition-colors border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-900 dark:hover:border-stone-100"
          >
            ← Volver
          </button>
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

  const getLevelLabel = (level: Level, type: 'extraction' | 'intensity' | 'balance') => {
    if (level === 0) return 'Ideal';
    
    if (type === 'extraction') {
      if (level < 0) return level === -1 ? 'Sub-extr.' : 'Muy Sub-extr.';
      return level === 1 ? 'Sobre-extr.' : 'Muy Sobre-extr.';
    }
    if (type === 'intensity') {
      if (level < 0) return level === -1 ? 'Ligero' : 'Muy Ligero';
      return level === 1 ? 'Intenso' : 'Muy Intenso';
    }
    if (type === 'balance') {
      return level < 0 ? 'Desbalanc.' : 'Desbalanc.';
    }
    return '';
  };

  const getAdjustmentLabel = (adj: Adjustment) => {
    const labels: Record<Adjustment, string> = {
      'finerGrind': 'Molienda Fina',
      'coarserGrind': 'Molienda Gruesa',
      'higherRatio': 'Ratio Mayor',
      'lowerRatio': 'Ratio Menor',
      'higherTemp': 'Temp. Alta',
      'lowerTemp': 'Temp. Baja',
      'higherDose': 'Dosis ↑',
      'lowerDose': 'Dosis ↓',
      'longerPreinfusion': 'Preinfusión +',
      'shorterPreinfusion': 'Preinfusión -',
    };
    return labels[adj];
  };

  const getAdjustmentExplanation = (adj: Adjustment) => {
    switch (adj) {
      case 'finerGrind': return 'Aumenta resistencia. Sube extracción e intensidad.';
      case 'coarserGrind': return 'Reduce resistencia. Baja extracción e intensidad.';
      case 'higherRatio': return 'Más agua. Aumenta extracción, diluye intensidad.';
      case 'lowerRatio': return 'Menos agua. Reduce extracción, concentra intensidad.';
      case 'higherTemp': return 'Agua más caliente. Sube extracción, reduce acidez.';
      case 'lowerTemp': return 'Agua más fría. Baja extracción, resalta acidez.';
      case 'higherDose': return 'Más café. Aumenta concentración y cuerpo.';
      case 'lowerDose': return 'Menos café. Reduce concentración.';
      case 'longerPreinfusion': return 'Más tiempo saturacional. Mejor extracción.';
      case 'shorterPreinfusion': return 'Menos tiempo saturacional. Extracción más rápida.';
      default: return '';
    }
  };

  if (!state) return null;

  const currentPreset = presets.find(p => p.id === selectedPresetId);
  const isAdvancedMode = selectedDifficulty === 'advanced';

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-2">
              {currentPreset ? currentPreset.label : 'Caso Aleatorio'}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">
              {currentPreset ? currentPreset.targetGoal : 'Encuentra el balance ideal'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAdvisor(!showAdvisor)}
              className="flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-800 rounded text-stone-700 dark:text-stone-300 hover:border-stone-900 dark:hover:border-stone-100 transition-colors font-bold uppercase tracking-widest text-sm"
            >
              <Lightbulb size={14} />
              Coach
            </button>
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-800 rounded text-stone-700 dark:text-stone-300 hover:border-stone-900 dark:hover:border-stone-100 transition-colors font-bold uppercase tracking-widest text-sm"
            >
              <RefreshCw size={14} />
              Nuevo
            </button>
          </div>
        </div>

        {/* Coach */}
        {showAdvisor && (
          <div className="mb-6 p-4 border border-stone-200 dark:border-stone-800 rounded-lg">
            <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2 text-sm uppercase tracking-widest">
              <Lightbulb size={14} /> Coach
            </h4>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {getAdvice(state)}
            </p>
          </div>
        )}

        {won ? (
          /* Victory Screen */
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full mb-6">
              <Check size={32} />
            </div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-4">
              Perfecto
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-8 text-lg">
              Calibración exitosa en <span className="font-bold text-stone-900 dark:text-stone-100">{history.length - 1}</span> {history.length - 1 === 1 ? 'ajuste' : 'ajustes'}
            </p>

            <div className="mb-8 text-left bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="px-6 py-4 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-widest">
                Resumen de decisiones
              </div>
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {adjustmentHistory.map((adj, index) => (
                  <div key={index} className="p-4 md:p-5 flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest text-sm">
                        {getAdjustmentLabel(adj)}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                        {getAdjustmentExplanation(adj)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetSimulation}
              className="px-8 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
            >
              Siguiente Desafío
            </button>
          </div>
        ) : (
          <>
            {/* Análisis Sensorial */}
            <div className="mb-8 p-6 border border-stone-200 dark:border-stone-800 rounded-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-600 mb-3">
                Descripción General
              </h3>
              <p className="text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100 italic">
                "{describeShot(state)}"
              </p>
            </div>
            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Extracción', value: state.extraction, type: 'extraction' as const },
                { label: 'Intensidad', value: state.intensity, type: 'intensity' as const },
                { label: 'Balance', value: state.balance, type: 'balance' as const },
              ].map((metric) => (
                <div key={metric.label} className="border border-stone-200 dark:border-stone-800 p-5 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-widest">{metric.label}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-widest ${
                      metric.value === 0 
                        ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100' 
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}>
                      {getLevelLabel(metric.value, metric.type)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {[-2, -1, 0, 1, 2].map((level) => {
                      const isActive = clamp(metric.value) === level;
                      let barColor = 'bg-stone-200 dark:bg-stone-800';
                      if (isActive) {
                        if (level === 0) barColor = 'bg-emerald-500 dark:bg-emerald-600';
                        else if (Math.abs(level) === 1) barColor = 'bg-amber-500 dark:bg-amber-600';
                        else barColor = 'bg-red-500 dark:bg-red-600';
                      }
                      return (
                        <div
                          key={level}
                          className={`flex-1 rounded transition-all duration-300 ${barColor}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-600 mb-6">
                Ajustes Disponibles
              </h3>

              <div className={`grid gap-3 ${isAdvancedMode ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                {/* Grind */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-500 mb-2">
                    Molienda
                  </div>
                  <button
                    onClick={() => handleAdjustment('finerGrind')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Fina
                  </button>
                  <button
                    onClick={() => handleAdjustment('coarserGrind')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Gruesa
                  </button>
                </div>

                {/* Ratio */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-500 mb-2">
                    Ratio
                  </div>
                  <button
                    onClick={() => handleAdjustment('higherRatio')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Mayor
                  </button>
                  <button
                    onClick={() => handleAdjustment('lowerRatio')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Menor
                  </button>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-500 mb-2">
                    Temperatura
                  </div>
                  <button
                    onClick={() => handleAdjustment('higherTemp')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Alta
                  </button>
                  <button
                    onClick={() => handleAdjustment('lowerTemp')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Baja
                  </button>
                </div>

                {/* Dose - Advanced */}
                {isAdvancedMode && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-500 mb-2">
                      Dosis
                    </div>
                    <button
                      onClick={() => handleAdjustment('higherDose')}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Subir
                    </button>
                    <button
                      onClick={() => handleAdjustment('lowerDose')}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Bajar
                    </button>
                  </div>
                )}

                {/* Preinfusion - Advanced */}
                {isAdvancedMode && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-500 mb-2">
                      Preinfusión
                    </div>
                    <button
                      onClick={() => handleAdjustment('longerPreinfusion')}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Larga
                    </button>
                    <button
                      onClick={() => handleAdjustment('shorterPreinfusion')}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 hover:border-stone-900 dark:hover:border-stone-100 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Corta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Historial */}
            {history.length > 1 && (
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-500 dark:text-stone-600 uppercase tracking-widest mb-3">
                  Progreso: {history.length - 1} {history.length - 1 === 1 ? 'ajuste' : 'ajustes'}
                </p>
                <div className="flex gap-1">
                  {history.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === history.length - 1
                          ? 'w-3 h-3 bg-stone-900 dark:bg-stone-100'
                          : 'w-2 h-2 bg-stone-300 dark:bg-stone-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
