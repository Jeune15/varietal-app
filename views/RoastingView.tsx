import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Flame, Scale, Clock, Printer, X, Eye, FileDown, CalendarDays, Calendar as CalendarIcon, Coffee } from 'lucide-react';
import { Roast, GreenCoffee, Order, RoastedStock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db, syncToCloud } from '../db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  roasts: Roast[];
  greenCoffees: GreenCoffee[];
  orders: Order[];
}

const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const getWeekString = (dateString: string) => {
  const d = new Date(dateString);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1); // Lunes
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Domingo
  return `${start.toISOString().split('T')[0]} / ${end.toISOString().split('T')[0]}`;
};

const RoastingView: React.FC<Props> = ({ roasts, greenCoffees, orders }) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [showNewRoastModal, setShowNewRoastModal] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [greenCoffeeName, setGreenCoffeeName] = useState('');
  const [greenQtyKg, setGreenQtyKg] = useState<number | ''>('');
  const [roastedQtyKg, setRoastedQtyKg] = useState<number | ''>('');
  const [profile, setProfile] = useState('');
  const [roastCode, setRoastCode] = useState('');
  const [roastDate, setRoastDate] = useState(getLocalDate());

  // Autocomplete options
  const uniqueClients = useMemo(() => Array.from(new Set([...roasts.map(r => r.clientName), ...greenCoffees.map(g => g.clientName)])).filter(Boolean), [roasts, greenCoffees]);
  const uniqueGreenCoffees = useMemo(() => Array.from(new Set([...roasts.map(r => r.greenCoffeeName || ''), ...greenCoffees.map(g => g.variety)])).filter(Boolean), [roasts, greenCoffees]);

  // History State
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const shrinkage = useMemo(() => {
    if (!greenQtyKg || !roastedQtyKg || greenQtyKg <= 0) return 0;
    return ((Number(greenQtyKg) - Number(roastedQtyKg)) / Number(greenQtyKg)) * 100;
  }, [greenQtyKg, roastedQtyKg]);

  const handleSaveRoast = async () => {
    if (!canEdit) return;
    if (!clientName.trim() || !greenCoffeeName.trim() || !greenQtyKg || !roastedQtyKg) {
      showToast('Por favor complete los campos requeridos', 'error');
      return;
    }

    const newRoast: Roast = {
      id: Math.random().toString(36).substr(2, 9),
      greenCoffeeId: 'manual', // No longer strictly linked
      greenCoffeeName: greenCoffeeName.trim(),
      clientName: clientName.trim(),
      greenQtyKg: Number(greenQtyKg),
      roastedQtyKg: Number(roastedQtyKg),
      weightLossPercentage: shrinkage,
      profile: profile.trim(),
      roastDate,
      roastCode: roastCode.trim()
    };

    await db.roasts.add(newRoast);
    await syncToCloud('roasts', newRoast);

    // Create Stock
    const newStock: RoastedStock = {
      id: Math.random().toString(36).substr(2, 9),
      roastId: newRoast.id,
      variety: greenCoffeeName.trim(),
      clientName: clientName.trim(),
      totalQtyKg: Number(roastedQtyKg),
      remainingQtyKg: Number(roastedQtyKg),
      isSelected: false,
      mermaGrams: 0,
      roastDate,
      roastCode: roastCode.trim()
    };

    await db.roastedStocks.add(newStock);
    await syncToCloud('roastedStocks', newStock);

    showToast('Tueste registrado y añadido al silo', 'success');
    setShowNewRoastModal(false);
    resetForm();
  };

  const resetForm = () => {
    setClientName('');
    setGreenCoffeeName('');
    setGreenQtyKg('');
    setRoastedQtyKg('');
    setProfile('');
    setRoastCode('');
    setRoastDate(getLocalDate());
  };

  // Grouping logic
  const groupedRoasts = useMemo(() => {
    const groups: Record<string, { totalRoasted: number, roasts: Roast[] }> = {};
    
    roasts.forEach(roast => {
      const key = groupBy === 'day' ? roast.roastDate : getWeekString(roast.roastDate);
      if (!groups[key]) {
        groups[key] = { totalRoasted: 0, roasts: [] };
      }
      groups[key].totalRoasted += roast.roastedQtyKg;
      groups[key].roasts.push(roast);
    });

    // Sort keys descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [roasts, groupBy]);

  const downloadPDF = (groupKey: string, roasts: Roast[]) => {
    const doc = new jsPDF();
    const title = groupBy === 'day' ? `Resumen de Tueste - Día: ${groupKey}` : `Resumen de Tueste - Semana: ${groupKey}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

    const sortedRoasts = [...roasts].sort((a, b) => a.clientName.localeCompare(b.clientName));

    const tableData = sortedRoasts.map(r => [
      r.clientName,
      r.greenCoffeeName || r.greenCoffeeId,
      r.roastCode || '-',
      `${r.greenQtyKg.toFixed(2)} Kg`,
      `${r.roastedQtyKg.toFixed(2)} Kg`,
      `${r.weightLossPercentage.toFixed(1)}%`,
      r.profile || '-'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Cliente', 'Café Verde', 'Código', 'Verde (Kg)', 'Tostado (Kg)', 'Merma', 'Perfil']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    const totalRoasted = roasts.reduce((sum, r) => sum + r.roastedQtyKg, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Tostado: ${totalRoasted.toFixed(2)} Kg`, 14, finalY);

    doc.save(`Tuestes_${groupKey.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-stone-950 min-h-screen text-black dark:text-white font-sans p-4 sm:p-8 animate-fade-in pb-48">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Gestión de Tueste</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Historial y Registro</p>
        </div>
        <div className="flex gap-4">
          {canEdit && (
            <button 
              onClick={() => setShowNewRoastModal(true)}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white hover:bg-stone-800 dark:hover:bg-stone-200 font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Tueste
            </button>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <h4 className="text-xl font-black uppercase tracking-tight">Historial</h4>
          <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-md">
            <button
              onClick={() => setGroupBy('day')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${groupBy === 'day' ? 'bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white' : 'text-stone-500 hover:text-black dark:hover:text-white'}`}
            >
              Por Día
            </button>
            <button
              onClick={() => setGroupBy('week')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${groupBy === 'week' ? 'bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white' : 'text-stone-500 hover:text-black dark:hover:text-white'}`}
            >
              Por Semana
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {groupedRoasts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-stone-300 dark:border-stone-800 text-stone-400 uppercase text-xs tracking-widest font-bold">
              No hay tuestes registrados
            </div>
          ) : (
            groupedRoasts.map(([key, data]) => (
              <div key={key} className="flex items-center justify-between p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-black dark:hover:border-stone-600 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 flex items-center justify-center rounded-full text-stone-500">
                    {groupBy === 'day' ? <CalendarIcon className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-wide">{key}</h5>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">{data.roasts.length} tuestes</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="font-black text-lg">{data.totalRoasted.toFixed(2)} Kg</p>
                    <p className="text-[9px] text-stone-500 uppercase tracking-widest">Total Tostado</p>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(key)}
                    className="p-3 bg-stone-50 dark:bg-stone-800 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-full"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Roast Modal */}
      {showNewRoastModal && createPortal(
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowNewRoastModal(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-2xl border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 bg-black dark:bg-stone-950 text-white border-b border-stone-800 shrink-0 sticky top-0 z-10">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-6 h-6" /> Nuevo Tueste
              </h3>
              <button 
                onClick={() => setShowNewRoastModal(false)}
                className="p-2 hover:bg-stone-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Cliente</label>
                  <input 
                    type="text"
                    list="clients-list"
                    className="w-full py-3 px-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-black dark:focus:border-white focus:ring-0 text-sm font-bold transition-colors text-black dark:text-white"
                    placeholder="Nombre del cliente"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <datalist id="clients-list">
                    {uniqueClients.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Café Verde</label>
                  <input 
                    type="text"
                    list="coffees-list"
                    className="w-full py-3 px-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-black dark:focus:border-white focus:ring-0 text-sm font-bold transition-colors text-black dark:text-white"
                    placeholder="Ej. Bourbon Moyobamba"
                    value={greenCoffeeName}
                    onChange={(e) => setGreenCoffeeName(e.target.value)}
                  />
                  <datalist id="coffees-list">
                    {uniqueGreenCoffees.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-4 border-y border-stone-100 dark:border-stone-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Peso Verde (Kg)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full py-3 pl-8 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-black text-2xl transition-colors px-0 placeholder:text-stone-200 dark:text-white"
                      value={greenQtyKg}
                      onChange={(e) => setGreenQtyKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                    />
                    <Scale className="w-5 h-5 absolute left-0 top-4 text-stone-300 dark:text-stone-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Peso Tostado (Kg)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full py-3 pl-8 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-black text-2xl transition-colors px-0 placeholder:text-stone-200 dark:text-white"
                      value={roastedQtyKg}
                      onChange={(e) => setRoastedQtyKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                    />
                    <Coffee className="w-5 h-5 absolute left-0 top-4 text-stone-300 dark:text-stone-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-900 p-4 rounded-sm">
                <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 tracking-widest">Merma Estimada</span>
                <span className={`text-2xl font-black ${shrinkage > 20 ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>
                  {shrinkage.toFixed(1)}%
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Perfil / Notas</label>
                <input 
                  type="text" 
                  className="w-full py-3 px-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-black dark:focus:border-white focus:ring-0 text-sm transition-colors text-black dark:text-white"
                  placeholder="Ej. Tueste Medio"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                />
              </div>

              <div className="w-1/2">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-stone-500">Código de café tostado</label>
                <input 
                  type="text" 
                  className="w-full py-2 px-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 text-xs font-mono uppercase transition-colors text-black dark:text-white"
                  placeholder="Ej. BMO-01"
                  value={roastCode}
                  onChange={(e) => setRoastCode(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-4 pt-8 border-t border-stone-100 dark:border-stone-800">
                <button 
                  onClick={() => setShowNewRoastModal(false)}
                  className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-500 hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRoast}
                  disabled={!clientName || !greenCoffeeName || !greenQtyKg || !roastedQtyKg}
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-stone-200 font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Tueste
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Group Details Modal */}
      {selectedGroup && createPortal(
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedGroup(null)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-4xl border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 bg-black dark:bg-stone-950 text-white border-b border-stone-800 shrink-0 sticky top-0 z-10">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  Detalle de Tuestes
                </h3>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">{groupBy === 'day' ? 'Día' : 'Semana'}: {selectedGroup}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => downloadPDF(selectedGroup, groupedRoasts.find(g => g[0] === selectedGroup)?.[1].roasts || [])}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 hover:bg-stone-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-0 overflow-y-auto scrollbar-hide bg-stone-50 dark:bg-stone-950">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0">
                  <tr className="text-[10px] uppercase tracking-widest text-stone-500">
                    <th className="p-4 font-bold border-r border-stone-100 dark:border-stone-800">Cliente</th>
                    <th className="p-4 font-bold border-r border-stone-100 dark:border-stone-800">Café Verde</th>
                    <th className="p-4 font-bold border-r border-stone-100 dark:border-stone-800 text-center">Código</th>
                    <th className="p-4 font-bold border-r border-stone-100 dark:border-stone-800 text-right">Verde</th>
                    <th className="p-4 font-bold border-r border-stone-100 dark:border-stone-800 text-right">Tostado</th>
                    <th className="p-4 font-bold text-right">Merma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {groupedRoasts.find(g => g[0] === selectedGroup)?.[1].roasts
                    .sort((a, b) => a.clientName.localeCompare(b.clientName))
                    .map((roast) => (
                      <tr key={roast.id} className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <td className="p-4 border-r border-stone-100 dark:border-stone-800">
                          <span className="font-bold text-sm text-black dark:text-white uppercase tracking-tight">{roast.clientName}</span>
                        </td>
                        <td className="p-4 border-r border-stone-100 dark:border-stone-800">
                          <span className="font-bold text-sm text-stone-700 dark:text-stone-300">{roast.greenCoffeeName || roast.greenCoffeeId}</span>
                          <div className="text-[10px] text-stone-500 mt-1">{roast.profile}</div>
                        </td>
                        <td className="p-4 border-r border-stone-100 dark:border-stone-800 text-center">
                          <span className="text-xs font-mono bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-sm text-stone-600 dark:text-stone-400">
                            {roast.roastCode || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-stone-600 dark:text-stone-400 border-r border-stone-100 dark:border-stone-800">
                          {roast.greenQtyKg.toFixed(2)} kg
                        </td>
                        <td className="p-4 text-right font-black text-black dark:text-white border-r border-stone-100 dark:border-stone-800">
                          {roast.roastedQtyKg.toFixed(2)} kg
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-xs font-bold ${roast.weightLossPercentage > 20 ? 'text-red-500' : 'text-stone-500'}`}>
                            {roast.weightLossPercentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RoastingView;
