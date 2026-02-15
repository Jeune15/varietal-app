import React, { useEffect, useMemo, useState } from 'react';
import { EspressoView } from './EspressoCalibrationView';
import { Coffee, Filter, ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { db } from '../db';
import { FilterSession, FilterPour, FilterRecipe, FilterRecipePhase, BrewMethod, GrindSize } from '../types';

const grindSizeOptions: { value: GrindSize; label: string }[] = [
  { value: 'extra-fine', label: 'Extra fina' },
  { value: 'fine', label: 'Fina' },
  { value: 'medium', label: 'Media' },
  { value: 'coarse', label: 'Gruesa' },
  { value: 'extra-coarse', label: 'Extra gruesa' }
];

const brewMethodOptions: { value: BrewMethod; label: string }[] = [
  { value: 'V60', label: 'V60' },
  { value: 'Chemex', label: 'Chemex' },
  { value: 'French Press', label: 'French Press' },
  { value: 'Aeropress', label: 'Aeropress' },
  { value: 'Espresso', label: 'Espresso' },
  { value: 'Otro', label: 'Otro' }
];

const pourTypeOptions = [
  { value: 'continuous', label: 'Continuo' },
  { value: 'pulsed', label: 'Pulsado' },
  { value: 'circular', label: 'Circular' },
  { value: 'direct', label: 'Directo' }
];

const methodSpecificFields: Record<
  BrewMethod,
  { key: string; label: string; placeholder: string }[]
> = {
  V60: [
    { key: 'bloom', label: 'Bloom', placeholder: 'Bloom en ml y tiempo' },
    { key: 'pours', label: 'Número de vertidos', placeholder: 'Por ejemplo: 3 vertidos' },
    { key: 'bypass', label: 'Bypass', placeholder: 'Porcentaje de bypass si aplica' }
  ],
  Chemex: [
    { key: 'filterThickness', label: 'Grosor de filtro', placeholder: 'Estándar, grueso, etc.' },
    { key: 'pourPattern', label: 'Patrón de vertido', placeholder: 'Circular, centro, etc.' }
  ],
  'French Press': [
    { key: 'immersionTime', label: 'Tiempo de inmersión', placeholder: 'Segundos antes de romper costra' },
    { key: 'plungeTime', label: 'Tiempo de prensado', placeholder: 'Segundos de bajada del émbolo' }
  ],
  Aeropress: [
    { key: 'inverted', label: 'Método invertido', placeholder: 'Sí/No' },
    { key: 'pressTime', label: 'Tiempo de presión', placeholder: 'Segundos de presión' }
  ],
  Espresso: [
    { key: 'preinfusion', label: 'Preinfusión', placeholder: 'Segundos a baja presión' },
    { key: 'pressureProfile', label: 'Perfil de presión', placeholder: 'Lineal, ramp-up, etc.' }
  ],
  Otro: [
    { key: 'detalle1', label: 'Variable 1', placeholder: 'Cualquier variable relevante' },
    { key: 'detalle2', label: 'Variable 2', placeholder: 'Otra variable relevante' }
  ]
};

const createEmptyRecipe = (): FilterRecipe => {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).substring(2),
    createdAt: now,
    updatedAt: now,
    name: 'Nueva receta',
    method: 'V60',
    coffeeName: '',
    doseGrams: 15,
    waterTempCelsius: 92,
    grindSize: 'medium',
    grinderClicks: null,
    totalWaterMl: 250,
    ratio: '1:16',
    totalTimeSeconds: 150,
    pressureBars: null,
    filterType: '',
    phases: [],
    tasting: {
      flavor: '',
      aroma: '',
      body: '',
      acidity: ''
    },
    methodSpecific: {},
    notes: '',
    deleted: false
  };
};

const FilterRecipeManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<FilterRecipe[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let isMounted = true;
    db.filterRecipes.toArray().then(all => {
      if (!isMounted) return;
      setRecipes(all.filter(r => !r.deleted));
      if (all.length > 0) {
        setSelectedId(all[0].id);
      }
    }).catch(err => {
      console.error('Error loading filter recipes:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const current = useMemo(
    () => recipes.find(r => r.id === selectedId) || null,
    [recipes, selectedId]
  );

  useEffect(() => {
    if (!dirty || !current) return;
    const timeout = setTimeout(async () => {
      try {
        const updated = { ...current, updatedAt: new Date().toISOString() };
        await db.filterRecipes.put(updated);
        setRecipes(prev => prev.map(r => (r.id === updated.id ? updated : r)));
        setDirty(false);
        showToast('Cambios guardados automáticamente', 'success');
      } catch (err) {
        console.error('Error autosaving filter recipe:', err);
        showToast('Error al guardar cambios', 'error');
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [dirty, current, showToast]);

  const updateCurrent = (patch: Partial<FilterRecipe>) => {
    if (!current) return;
    setRecipes(prev =>
      prev.map(r => (r.id === current.id ? { ...r, ...patch } : r))
    );
    setDirty(true);
  };

  const handleAddRecipe = () => {
    const base = createEmptyRecipe();
    setRecipes(prev => [...prev, base]);
    setSelectedId(base.id);
    setDirty(true);
  };

  const handleDuplicateRecipe = () => {
    if (!current) return;
    const now = new Date().toISOString();
    const copy: FilterRecipe = {
      ...current,
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2),
      name: `${current.name} (copia)`,
      createdAt: now,
      updatedAt: now
    };
    setRecipes(prev => [...prev, copy]);
    setSelectedId(copy.id);
    setDirty(true);
    showToast('Receta duplicada', 'success');
  };

  const handleAddPhase = () => {
    if (!current) return;
    const nextOrder = (current.phases?.length || 0) + 1;
    const lastEnd = current.phases?.length
      ? current.phases[current.phases.length - 1].endTimeSeconds
      : 0;
    const phase: FilterRecipePhase = {
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2),
      order: nextOrder,
      startTimeSeconds: lastEnd,
      endTimeSeconds: lastEnd + 30,
      volumeMl: Math.round((current.totalWaterMl || 0) / Math.max(nextOrder, 1)),
      pourType: 'continuous'
    };
    updateCurrent({ phases: [...current.phases, phase] });
  };

  const handleUpdatePhase = (id: string, patch: Partial<FilterRecipePhase>) => {
    if (!current) return;
    updateCurrent({
      phases: current.phases.map(p => (p.id === id ? { ...p, ...patch } : p))
    });
  };

  const handleExportCsv = () => {
    if (!current) return;
    const lines: string[] = [];
    lines.push('Campo,Valor');
    lines.push(`Nombre,"${current.name}"`);
    lines.push(`Método,"${current.method}"`);
    lines.push(`Café,"${current.coffeeName}"`);
    lines.push(`Dosis (g),${current.doseGrams}`);
    lines.push(`Temperatura (°C),${current.waterTempCelsius.toFixed(1)}`);
    lines.push(`Molienda,"${current.grindSize}"`);
    lines.push(`Clicks molino,${current.grinderClicks ?? ''}`);
    lines.push(`Agua total (ml),${current.totalWaterMl}`);
    lines.push(`Ratio,"${current.ratio}"`);
    lines.push(`Tiempo total (s),${current.totalTimeSeconds}`);
    lines.push(`Presión (bar),${current.pressureBars ?? ''}`);
    lines.push(`Filtro,"${current.filterType}"`);
    lines.push(`Sabor,"${current.tasting.flavor}"`);
    lines.push(`Aroma,"${current.tasting.aroma}"`);
    lines.push(`Cuerpo,"${current.tasting.body}"`);
    lines.push(`Acidez,"${current.tasting.acidity}"`);
    Object.entries(current.methodSpecific).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        lines.push(`Extra ${key},"${value}"`);
      }
    });
    lines.push('');
    lines.push('Fase,Inicio (s),Fin (s),Volumen (ml),Tipo vertido');
    current.phases.forEach(p => {
      lines.push(
        `${p.order},${p.startTimeSeconds},${p.endTimeSeconds},${p.volumeMl},${p.pourType}`
      );
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const title = current.name;
    const rows = current.phases
      .map(
        p =>
          `<tr><td>${p.order}</td><td>${p.startTimeSeconds}</td><td>${p.endTimeSeconds}</td><td>${p.volumeMl}</td><td>${p.pourType}</td></tr>`
      )
      .join('');
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Método:</strong> ${current.method}</p>
          <p><strong>Café:</strong> ${current.coffeeName}</p>
          <p><strong>Dosis:</strong> ${current.doseGrams} g | <strong>Agua:</strong> ${current.totalWaterMl} ml | <strong>Ratio:</strong> ${current.ratio}</p>
          <p><strong>Tiempo total:</strong> ${current.totalTimeSeconds} s | <strong>Temperatura:</strong> ${current.waterTempCelsius.toFixed(1)} °C</p>
          <h2>Notas de degustación</h2>
          <p><strong>Sabor:</strong> ${current.tasting.flavor}</p>
          <p><strong>Aroma:</strong> ${current.tasting.aroma}</p>
          <p><strong>Cuerpo:</strong> ${current.tasting.body}</p>
          <p><strong>Acidez:</strong> ${current.tasting.acidity}</p>
          <h2>Variables específicas</h2>
          <ul>
            ${Object.entries(current.methodSpecific)
              .filter(([, value]) => value && value.trim() !== '')
              .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
              .join('')}
          </ul>
          <h2>Fases de vertido</h2>
          <table>
            <thead>
              <tr><th>Fase</th><th>Inicio (s)</th><th>Fin (s)</th><th>Volumen (ml)</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const validateNumeric = (value: number, min: number, max: number) => {
    return !Number.isNaN(value) && value >= min && value <= max;
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Recetas
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
              Recetas
            </h2>
            <button
              type="button"
              onClick={handleAddRecipe}
              className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Nueva
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {recipes.length === 0 && (
              <div className="text-xs text-stone-400 py-8 text-center">
                Aún no hay recetas creadas.
              </div>
            )}
            {recipes.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${
                  r.id === selectedId
                    ? 'bg-black text-white border-black dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200'
                }`}
              >
                <div className="font-bold truncate">{r.name}</div>
                <div className="text-[10px] text-stone-400">
                  {r.method} • {r.ratio}
                </div>
              </button>
            ))}
          </div>
        </div>

        {current && (
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <input
                    type="text"
                    value={current.name}
                    onChange={e => updateCurrent({ name: e.target.value })}
                    className="w-full text-xl font-black bg-transparent border-b border-stone-200 dark:border-stone-700 focus:outline-none focus:border-brand py-1"
                    placeholder="Nombre de la receta"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Método
                      </span>
                      <select
                        value={current.method}
                        onChange={e => updateCurrent({ method: e.target.value as BrewMethod })}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      >
                        {brewMethodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Café
                      </span>
                      <input
                        type="text"
                        value={current.coffeeName}
                        onChange={e => updateCurrent({ coffeeName: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        placeholder="Origen, finca o lote"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Dosis (g)
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={current.doseGrams}
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (!validateNumeric(val, 1, 100)) return;
                          updateCurrent({ doseGrams: val });
                        }}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Ratio
                      </span>
                      <input
                        type="text"
                        value={current.ratio}
                        onChange={e => updateCurrent({ ratio: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        placeholder="1:15, 1:16..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateRecipe}
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    Duplicar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    >
                      Exportar CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Agua total (ml)
                  </span>
                  <input
                    type="number"
                    min={50}
                    max={1000}
                    value={current.totalWaterMl}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 10, 2000)) return;
                      updateCurrent({ totalWaterMl: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Tiempo total (s)
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={current.totalTimeSeconds}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 10, 1200)) return;
                      updateCurrent({ totalTimeSeconds: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Temp. agua (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={80}
                    max={100}
                    value={current.waterTempCelsius}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 60, 100)) return;
                      updateCurrent({ waterTempCelsius: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Presión (bar opcional)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={current.pressureBars ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      if (val !== null && !validateNumeric(val, 0, 20)) return;
                      updateCurrent({ pressureBars: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Molienda
                  </span>
                  <select
                    value={current.grindSize}
                    onChange={e => updateCurrent({ grindSize: e.target.value as GrindSize })}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  >
                    {grindSizeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Clicks molino
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={current.grinderClicks ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      if (val !== null && !validateNumeric(val, 0, 500)) return;
                      updateCurrent({ grinderClicks: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Tipo de filtro
                  </span>
                  <input
                    type="text"
                    value={current.filterType}
                    onChange={e => updateCurrent({ filterType: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    placeholder="Papel, metal, tela..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Variables específicas
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {(
                      methodSpecificFields[current.method] ||
                      methodSpecificFields.Otro
                    ).map(field => (
                      <input
                        key={field.key}
                        type="text"
                        value={current.methodSpecific[field.key] ?? ''}
                        onChange={e =>
                          updateCurrent({
                            methodSpecific: {
                              ...current.methodSpecific,
                              [field.key]: e.target.value
                            }
                          })
                        }
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        placeholder={field.placeholder}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                    Fases de vertido
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    Añadir fase
                  </button>
                </div>
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {current.phases.length === 0 && (
                    <div className="text-xs text-stone-400 py-6">
                      Aún no hay fases definidas.
                    </div>
                  )}
                  {current.phases.map(phase => (
                    <div
                      key={phase.id}
                      className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-700 dark:text-stone-200">
                          Fase {phase.order}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Inicio (s)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={current.totalTimeSeconds}
                            value={phase.startTimeSeconds}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                startTimeSeconds: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Fin (s)
                          </span>
                          <input
                            type="number"
                            min={phase.startTimeSeconds}
                            max={current.totalTimeSeconds}
                            value={phase.endTimeSeconds}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                endTimeSeconds: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Volumen (ml)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={current.totalWaterMl}
                            value={phase.volumeMl}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                volumeMl: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          Tipo de vertido
                        </span>
                        <select
                          value={phase.pourType}
                          onChange={e =>
                            handleUpdatePhase(phase.id, {
                              pourType: e.target.value as any
                            })
                          }
                          className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        >
                          {pourTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                  Notas de degustación
                </h2>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Sabor
                    </span>
                    <textarea
                      value={current.tasting.flavor}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, flavor: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Descriptores de sabor predominantes"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Aroma
                    </span>
                    <textarea
                      value={current.tasting.aroma}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, aroma: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Aromas percibidos en seco y en caliente"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Cuerpo
                    </span>
                    <textarea
                      value={current.tasting.body}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, body: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Sensación en boca, textura"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Acidez
                    </span>
                    <textarea
                      value={current.tasting.acidity}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, acidity: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Tipo de acidez, intensidad, carácter"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Notas adicionales
                    </span>
                    <textarea
                      value={current.notes ?? ''}
                      onChange={e => updateCurrent({ notes: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Observaciones generales, ajustes futuros sugeridos"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterBrewView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [sessionData, setSessionData] = useState({
    brewerName: '',
    coffeeName: '',
    method: '',
    notes: ''
  });
  const [pours, setPours] = useState<FilterPour[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    minutes: '',
    seconds: '',
    volumeMl: ''
  });

  const sortedPours = useMemo(
    () => [...pours].sort((a, b) => a.timeSeconds - b.timeSeconds),
    [pours]
  );

  const totalVolume = useMemo(
    () => pours.reduce((sum, p) => sum + p.volumeMl, 0),
    [pours]
  );

  const handleSubmitPour = () => {
    const minutes = Number(formState.minutes || 0);
    const seconds = Number(formState.seconds || 0);
    const volume = Number(formState.volumeMl);

    if (isNaN(volume) || volume <= 0) {
      showToast('Ingresa un volumen válido en ml', 'error');
      return;
    }

    if (isNaN(minutes) || minutes < 0 || isNaN(seconds) || seconds < 0 || seconds > 59) {
      showToast('El tiempo debe tener minutos y segundos válidos', 'error');
      return;
    }

    const timeSeconds = minutes * 60 + seconds;

    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      showToast('El tiempo debe ser un número válido', 'error');
      return;
    }

    if (editingId) {
      setPours(current =>
        current.map(p =>
          p.id === editingId
            ? { ...p, timeSeconds, volumeMl: volume }
            : p
        )
      );
      showToast('Vertido actualizado', 'success');
    } else {
      const id =
        typeof crypto !== 'undefined' && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : Math.random().toString(36).substring(2);

      const nextOrder = pours.length + 1;
      const newPour: FilterPour = {
        id,
        order: nextOrder,
        timeSeconds,
        volumeMl: volume
      };

      setPours(current => [...current, newPour]);
      showToast('Vertido añadido a la línea de tiempo', 'success');
    }

    setEditingId(null);
    setFormState({
      minutes: '',
      seconds: '',
      volumeMl: ''
    });
  };

  const handleEditPour = (pour: FilterPour) => {
    const minutes = Math.floor(pour.timeSeconds / 60);
    const seconds = pour.timeSeconds % 60;
    setEditingId(pour.id);
    setFormState({
      minutes: String(minutes),
      seconds: String(seconds),
      volumeMl: String(pour.volumeMl)
    });
  };

  const handleClearTimeline = () => {
    if (pours.length === 0) return;
    setPours([]);
    setEditingId(null);
    setFormState({
      minutes: '',
      seconds: '',
      volumeMl: ''
    });
    showToast('Línea de tiempo reiniciada', 'success');
  };

  const handleSaveSession = async () => {
    if (!sessionData.coffeeName.trim() || !sessionData.method.trim()) {
      showToast('Ingresa al menos el café y el método', 'error');
      return;
    }
    if (pours.length === 0) {
      showToast('Agrega al menos un vertido', 'error');
      return;
    }

    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2);

    const session: FilterSession = {
      id,
      date: new Date().toISOString(),
      brewerName: sessionData.brewerName.trim() || 'Barista',
      coffeeName: sessionData.coffeeName.trim(),
      method: sessionData.method.trim(),
      pours,
      notes: sessionData.notes.trim() || undefined
    };

    try {
      await db.filterSessions.add(session);
      showToast('Sesión de filtrado guardada', 'success');
    } catch (error) {
      console.error('Error saving filter session:', error);
      showToast('Error al guardar la sesión', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in px-4 pt-8">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Recetas
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100">
              <Filter className="w-5 h-5 text-white dark:text-stone-900" />
            </span>
            Recetas de Filtrado
          </h1>
          <p className="text-stone-500 text-sm">
            Registra cada vertido con tiempo exacto y volumen para replicar tus filtrados.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
            Volumen total
          </span>
          <div className="px-4 py-2 rounded-full bg-black text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-black tracking-widest">
            {totalVolume} ml
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
              Información de la sesión
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Café
                </label>
                <input
                  type="text"
                  value={sessionData.coffeeName}
                  onChange={e => setSessionData({ ...sessionData, coffeeName: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="Origen, finca o lote"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Método
                </label>
                <input
                  type="text"
                  value={sessionData.method}
                  onChange={e => setSessionData({ ...sessionData, method: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="V60, Kalita, Chemex..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Barista
                </label>
                <input
                  type="text"
                  value={sessionData.brewerName}
                  onChange={e => setSessionData({ ...sessionData, brewerName: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Notas
                </label>
                <textarea
                  value={sessionData.notes}
                  onChange={e => setSessionData({ ...sessionData, notes: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm min-h-[72px] resize-none"
                  placeholder="Comentarios sobre temperatura, receta base o sensaciones en taza"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
              Nuevo vertido
            </h2>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Minutos
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.minutes}
                  onChange={e => setFormState({ ...formState, minutes: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Segundos
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={formState.seconds}
                  onChange={e => setFormState({ ...formState, seconds: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Volumen (ml)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formState.volumeMl}
                  onChange={e => setFormState({ ...formState, volumeMl: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={handleSubmitPour}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black uppercase tracking-[0.25em] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                {editingId ? 'Actualizar vertido' : 'Añadir vertido'}
              </button>
              <button
                type="button"
                onClick={handleClearTimeline}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSession}
            className="w-full mt-2 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black uppercase tracking-[0.3em] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-lg"
          >
            Guardar sesión de filtrado
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                Línea de tiempo de vertidos
              </h2>
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                {sortedPours.length} vertidos
              </span>
            </div>

            {sortedPours.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-sm text-stone-400">
                Añade tu primer vertido para comenzar la línea de tiempo.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[520px] pr-2">
                <div className="relative">
                  <div className="absolute left-1.5 top-2 bottom-2 w-[2px] bg-stone-200 dark:bg-stone-700" />
                  <div className="space-y-4">
                    {sortedPours.map(pour => {
                      const cumulative = sortedPours
                        .filter(p => p.timeSeconds <= pour.timeSeconds)
                        .reduce((sum, p) => sum + p.volumeMl, 0);
                      return (
                        <div key={pour.id} className="relative pl-8">
                          <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-black dark:bg-stone-100 border-2 border-white dark:border-stone-900" />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="text-[11px] font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                                {formatTime(pour.timeSeconds)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                  Vertido de {pour.volumeMl} ml
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  Volumen acumulado: {cumulative} ml
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditPour(pour)}
                                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


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
  if (selectedCategory === 'filter') {
    return (
      <FilterRecipeManager onBack={() => setSelectedCategory('none')} />
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

        {/* Filter Card */}
        <button 
          onClick={() => setSelectedCategory('filter')}
          className="group relative overflow-hidden bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Filter className="w-6 h-6 text-stone-700 dark:text-stone-100" />
            </div>
            
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-2">Filtrados</h3>
            <p className="text-stone-500 mb-6 text-sm leading-relaxed">
              Diseña y documenta cada vertido para tus métodos de filtrado manual.
            </p>

            <div className="flex items-center text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Entrar <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
