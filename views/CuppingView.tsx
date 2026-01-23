import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { CuppingForm, CuppingSession, RoastedStock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Coffee, User as UserIcon, ClipboardList, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  stocks: RoastedStock[];
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
    'Floral',
    'Afrutado',
    'Bayas',
    'Frutas deshidratadas',
    'Cítricos',
    'Verde/Vegeral',
    'Ácido/Fermentado',
    'Ácido',
    'Fermentado',
    'Otra',
    'Químico',
    'Humedad/Tierra',
    'Madera'
  ],
  roast: [
    'Tostado',
    'Cereal',
    'Quemado',
    'Tabaco',
    'Nueces/Cacao',
    'Nueces',
    'Cacao',
    'Especias',
    'Dulce',
    'Vainilla',
    'Azúcar morena'
  ],
  taste: [
    'Salado',
    'Amargo',
    'Ácido',
    'Umami',
    'Dulce'
  ],
  mouthfeel: [
    'Áspero',
    'Suave',
    'Metálico',
    'Aceitoso',
    'Deja seca la boca'
  ]
};

const CuppingView: React.FC<Props> = ({ stocks }) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'form' | 'recent'>('form');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [tasterName, setTasterName] = useState('');
  const [objective, setObjective] = useState('');
  const [form, setForm] = useState<CuppingForm>(() => buildEmptyForm());

  const cuppingSessions = useLiveQuery(() => db.cuppingSessions.orderBy('date').reverse().toArray(), []) || [];
  const [selectedSessionForSummary, setSelectedSessionForSummary] = useState<CuppingSession | null>(null);

  const availableStocks = useMemo(
    () => stocks.filter(s => s.remainingQtyKg > 0),
    [stocks]
  );

  const selectedStock = useMemo(
    () => availableStocks.find(s => s.id === selectedStockId) || null,
    [availableStocks, selectedStockId]
  );

  const handleToggleDescriptor = (field: keyof CuppingForm, value: string) => {
    setForm(prev => {
      const current = prev[field] as string[];
      const exists = current.includes(value);
      const nextValues = exists ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [field]: nextValues };
    });
  };

  const handleIntensityChange = (field: keyof CuppingForm, value: string) => {
    const parsed = Number(value);
    setForm(prev => ({ ...prev, [field]: parsed }));
  };

  const handleTextChange = (field: keyof CuppingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSession = async () => {
    if (!canEdit) return;
    if (!selectedStock || !tasterName.trim()) return;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const session: CuppingSession = {
      id,
      roastStockId: selectedStock.id,
      roastId: selectedStock.roastId,
      coffeeName: selectedStock.variety,
      clientName: selectedStock.clientName,
      tasterName: tasterName.trim(),
      date: new Date().toISOString(),
      objective: objective.trim() || undefined,
      form
    };

    await db.cuppingSessions.put(session);
    await syncToCloud('cuppingSessions', session);

    showToast('Sesión de catación guardada', 'success');
  };

  const renderScale = (label: string, intensityField: keyof CuppingForm, notesField: keyof CuppingForm) => (
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
          {Number((form[intensityField] as number) ?? 0).toFixed(2)} / 10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.25}
        value={(form[intensityField] as number) ?? 0}
        onChange={e => handleIntensityChange(intensityField, e.target.value)}
        className="w-full accent-black dark:accent-white"
      />
      <textarea
        value={(form[notesField] as string) ?? ''}
        onChange={e => handleTextChange(notesField, e.target.value)}
        placeholder="Notas..."
        className="w-full mt-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-white px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white resize-none h-16 placeholder:text-stone-400 dark:placeholder:text-stone-600"
      />
    </div>
  );

  const renderDescriptors = (
    title: string,
    fields: { label: string; field: keyof CuppingForm; options: string[] }[]
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
                const selected = (form[group.field] as string[]).includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleToggleDescriptor(group.field, option)}
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

  const renderScaleSummary = (
    sessionForm: CuppingForm,
    label: string,
    intensityField: keyof CuppingForm,
    notesField: keyof CuppingForm
  ) => {
    const intensity = Number((sessionForm[intensityField] as number) ?? 0);
    const notes = (sessionForm[notesField] as string) ?? '';
    const clamped = Math.max(0, Math.min(10, intensity));
    const percentage = (clamped / 10) * 100;

    return (
      <div className="border border-stone-200 p-4 space-y-4 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-black">{label}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Intensidad
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-stone-500">
            {clamped.toFixed(2)} / 10
          </span>
        </div>
        <div className="w-full h-1 bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="border border-stone-200 px-3 py-2 text-xs text-stone-700 bg-stone-50 min-h-[2.5rem]">
          {notes || 'Sin notas registradas'}
        </div>
      </div>
    );
  };

  const renderDescriptorsSummary = (
    sessionForm: CuppingForm,
    title: string,
    fields: { label: string; field: keyof CuppingForm; options: string[] }[]
  ) => (
    <div className="border border-stone-200 p-4 space-y-4 bg-white">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-stone-500" />
        <span className="text-xs font-black uppercase tracking-widest text-black">{title}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(group => (
          <div key={group.label} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map(option => {
                const selected = (sessionForm[group.field] as string[]).includes(option);
                return (
                  <span
                    key={option}
                    className={`px-2 py-1 border text-[10px] uppercase tracking-widest ${
                      selected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-stone-400 border-stone-200'
                    }`}
                  >
                    {option}
                  </span>
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
    <div className="space-y-10 max-w-6xl mx-auto pb-48">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black dark:border-white pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Catación</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-500 dark:text-stone-400">
            Sistema descriptivo de evaluación sensorial
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 text-xs text-stone-600 dark:text-stone-400 md:items-end">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">
                {selectedStock
                  ? `${selectedStock.variety} (${selectedStock.clientName})`
                  : 'Sin muestra seleccionada'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">
                {tasterName || 'Sin catador asignado'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] border transition-all ${
                activeTab === 'form'
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              Nueva sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] border transition-all ${
                activeTab === 'recent'
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              Sesiones recientes
            </button>
          </div>
        </div>
      </div>

      {!canEdit && activeTab === 'form' && (
        <div className="border border-dashed border-stone-300 dark:border-stone-700 p-10 text-center text-sm text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">
          Solo usuarios autorizados pueden registrar sesiones de catación
        </div>
      )}

      {canEdit && activeTab === 'form' && (
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="border border-stone-200 dark:border-stone-800 p-5 space-y-4 bg-white dark:bg-stone-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    Café tostado
                  </label>
                  <select
                    value={selectedStockId}
                    onChange={e => setSelectedStockId(e.target.value)}
                    className="w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-white px-3 py-2 text-sm font-medium outline-none focus:border-black dark:focus:border-white"
                  >
                    <option value="">Seleccionar lote</option>
                    {availableStocks.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.variety} ({stock.clientName}) – {stock.remainingQtyKg.toFixed(2)} Kg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    Catador
                  </label>
                  <input
                    type="text"
                    value={tasterName}
                    onChange={e => setTasterName(e.target.value)}
                    className="w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black dark:focus:border-white"
                    placeholder="Nombre de la persona que cata"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  Objetivo
                </label>
                <input
                  type="text"
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  className="w-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black dark:focus:border-white"
                  placeholder="Ej. Evaluación de perfil para espresso"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderScale('Fragancia', 'fragranceIntensity', 'fragranceNotes')}
                {renderScale('Aroma', 'aromaIntensity', 'aromaNotes')}
              </div>
              <div className="space-y-4">
                {renderDescriptors('Calificadores Aromáticos', [
                  { label: 'Familias aromáticas', field: 'fragranceDescriptors', options: descriptorOptions.aromatic },
                  { label: 'Notas de tueste', field: 'aromaDescriptors', options: descriptorOptions.roast }
                ])}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderScale('Sabor', 'flavorIntensity', 'flavorNotes')}
                {renderScale('Sabor residual', 'aftertasteIntensity', 'aftertasteNotes')}
              </div>
              <div className="space-y-4">
                {renderDescriptors('Gustos predominantes', [
                  { label: 'Gustos básicos', field: 'flavorDescriptors', options: descriptorOptions.taste },
                  { label: 'Gustos en retrogusto', field: 'aftertasteDescriptors', options: descriptorOptions.taste }
                ])}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderScale('Acidez', 'acidityIntensity', 'acidityNotes')}
                {renderScale('Dulzor', 'sweetnessIntensity', 'sweetnessNotes')}
              </div>
              <div className="space-y-4">
                {renderScale('Sensación en boca', 'mouthfeelIntensity', 'mouthfeelNotes')}
                {renderDescriptors('Sensación en boca', [
                  { label: 'Textura', field: 'mouthfeelDescriptors', options: descriptorOptions.mouthfeel }
                ])}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={!selectedStock || !tasterName.trim()}
                className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-[0.25em] border border-black hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar sesión de cata
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="border border-stone-200 bg-white">
          <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-stone-600">
                Sesiones recientes
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
              {cuppingSessions.length} sesiones
            </span>
          </div>
          {/* Mobile Cards for Cupping Sessions */}
          <div className="lg:hidden space-y-4">
            {cuppingSessions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 font-medium uppercase text-sm border border-dashed border-stone-300">
                Aún no hay sesiones de catación registradas
              </div>
            ) : (
              cuppingSessions.map(session => (
                <div key={session.id} className="bg-white border border-stone-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-black text-sm">{session.coffeeName}</div>
                      <div className="text-xs text-stone-500 font-medium">{session.clientName || 'Interno'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSessionForSummary(session)}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] border border-stone-200 text-stone-600 hover:border-black hover:text-black bg-white"
                    >
                      Ver
                    </button>
                  </div>
                  
                  <div className="bg-stone-50 p-3 rounded text-xs space-y-2 border border-stone-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Catador</span>
                        <span className="font-medium text-stone-600">{session.tasterName}</span>
                      </div>
                      <div>
                        <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Fecha</span>
                        <span className="font-mono text-stone-600">{session.date.split('T')[0]}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-stone-200">
                      <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Objetivo</span>
                      <span className="font-medium text-stone-600">{session.objective || 'Sin objetivo declarado'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 border-r border-stone-100">
                    Café
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 border-r border-stone-100">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 border-r border-stone-100">
                    Catador
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 border-r border-stone-100">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 border-r border-stone-100">
                    Objetivo
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cuppingSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-stone-400 text-xs font-mono uppercase tracking-[0.25em]"
                    >
                      Aún no hay sesiones de catación registradas
                    </td>
                  </tr>
                ) : (
                  cuppingSessions.map(session => (
                    <tr key={session.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 border-r border-stone-100">
                        <div className="font-bold text-sm tracking-tight text-black">
                          {session.coffeeName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-600 font-medium border-r border-stone-100">
                        {session.clientName || 'Interno'}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-600 font-medium border-r border-stone-100">
                        {session.tasterName}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-600 font-mono border-r border-stone-100">
                        {session.date.split('T')[0]}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 border-r border-stone-100">
                        {session.objective || 'Sin objetivo declarado'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSessionForSummary(session)}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] border border-stone-200 text-stone-600 hover:border-black hover:text-black bg-white"
                        >
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      {selectedSessionForSummary && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[160] flex items-center justify-center p-4 dark:bg-black/90"
          onClick={() => setSelectedSessionForSummary(null)}
        >
          <div
            className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-black shadow-2xl dark:bg-stone-900 dark:border-stone-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-stone-200 flex items-center justify-between bg-black text-white dark:bg-stone-950 dark:border-stone-800">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">
                  Ficha de catación
                </p>
                <h3 className="text-2xl font-black tracking-tight">
                  {selectedSessionForSummary.coffeeName}
                </h3>
                <p className="text-[11px] text-stone-300 font-mono dark:text-stone-400">
                  {selectedSessionForSummary.clientName || 'Cliente interno'} •{' '}
                  {selectedSessionForSummary.date.split('T')[0]}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-300 dark:text-stone-400">
                  Catador: {selectedSessionForSummary.tasterName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSessionForSummary(null)}
                  className="text-white hover:text-stone-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-8 bg-stone-50 dark:bg-stone-950">
              <div className="border border-stone-200 bg-white p-5 space-y-3 dark:bg-stone-900 dark:border-stone-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                      Café
                    </p>
                    <p className="font-bold text-black dark:text-white">
                      {selectedSessionForSummary.coffeeName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                      Cliente
                    </p>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {selectedSessionForSummary.clientName || 'Interno'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                      Objetivo
                    </p>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {selectedSessionForSummary.objective || 'Sin objetivo declarado'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Fragancia',
                    'fragranceIntensity',
                    'fragranceNotes'
                  )}
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Aroma',
                    'aromaIntensity',
                    'aromaNotes'
                  )}
                </div>
                <div className="space-y-4">
                  {renderDescriptorsSummary(selectedSessionForSummary.form, 'Calificadores Aromáticos', [
                    {
                      label: 'Familias aromáticas',
                      field: 'fragranceDescriptors',
                      options: descriptorOptions.aromatic
                    },
                    {
                      label: 'Notas de tueste',
                      field: 'aromaDescriptors',
                      options: descriptorOptions.roast
                    }
                  ])}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Sabor',
                    'flavorIntensity',
                    'flavorNotes'
                  )}
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Sabor residual',
                    'aftertasteIntensity',
                    'aftertasteNotes'
                  )}
                </div>
                <div className="space-y-4">
                  {renderDescriptorsSummary(selectedSessionForSummary.form, 'Gustos predominantes', [
                    {
                      label: 'Gustos básicos',
                      field: 'flavorDescriptors',
                      options: descriptorOptions.taste
                    },
                    {
                      label: 'Gustos en retrogusto',
                      field: 'aftertasteDescriptors',
                      options: descriptorOptions.taste
                    }
                  ])}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Acidez',
                    'acidityIntensity',
                    'acidityNotes'
                  )}
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Dulzor',
                    'sweetnessIntensity',
                    'sweetnessNotes'
                  )}
                </div>
                <div className="space-y-4">
                  {renderScaleSummary(
                    selectedSessionForSummary.form,
                    'Sensación en boca',
                    'mouthfeelIntensity',
                    'mouthfeelNotes'
                  )}
                  {renderDescriptorsSummary(selectedSessionForSummary.form, 'Sensación en boca', [
                    {
                      label: 'Textura',
                      field: 'mouthfeelDescriptors',
                      options: descriptorOptions.mouthfeel
                    }
                  ])}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CuppingView;
