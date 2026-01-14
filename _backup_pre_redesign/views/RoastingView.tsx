import React, { useState, useMemo } from 'react';
import { db, syncToCloud } from '../db';
import { Roast, GreenCoffee, RoastedStock, Order } from '../types';
import { Flame, Calculator, History, Search, FileText, X, ArrowRight, AlertCircle, CheckCircle2, Printer } from 'lucide-react';

interface Props {
  roasts: Roast[];
  greenCoffees: GreenCoffee[];
  orders: Order[];
}

const RoastingView: React.FC<Props> = ({ roasts, greenCoffees, orders }) => {
  const getTodayString = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [showModal, setShowModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [summaryDate, setSummaryDate] = useState(getTodayString());
  
  const [formData, setFormData] = useState({
    greenCoffeeId: '',
    greenQtyKg: 0,
    roastedQtyKg: 0,
    profile: '',
    roastDate: getTodayString()
  });

  // Calculate daily summary stats
  const dailySummary = useMemo(() => {
    // Use summaryDate instead of today
    const targetDate = summaryDate;
    const todaysRoasts = roasts.filter(r => r.roastDate === targetDate);
    
    return {
      date: targetDate,
      totalRoasts: todaysRoasts.length,
      totalGreen: todaysRoasts.reduce((sum, r) => sum + r.greenQtyKg, 0),
      totalRoasted: todaysRoasts.reduce((sum, r) => sum + r.roastedQtyKg, 0),
      batches: todaysRoasts,
      avgLoss: todaysRoasts.length > 0 
        ? todaysRoasts.reduce((sum, r) => sum + r.weightLossPercentage, 0) / todaysRoasts.length 
        : 0
    };
  }, [roasts, summaryDate]);

  // Filter orders that require roasting
  const roastingQueue = useMemo(() => {
    return orders.filter(o => 
      (o.requiresRoasting && o.status === 'Pendiente') || 
      (o.type === 'Servicio de Tueste' && o.status === 'Pendiente')
    );
  }, [orders]);

  const weightLoss = useMemo(() => {
    if (formData.greenQtyKg > 0) {
      return ((formData.greenQtyKg - formData.roastedQtyKg) / formData.greenQtyKg) * 100;
    }
    return 0;
  }, [formData.greenQtyKg, formData.roastedQtyKg]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    // Try to auto-select green coffee if variety matches (simple match)
    const matchingGreen = greenCoffees.find(g => 
      g.variety.toLowerCase().includes(order.variety.toLowerCase()) && g.quantityKg > 0
    );
    
    // Logic for Service vs Sale
    // Service: Order Qty is Green Input.
    // Sale: Order Qty is Roasted Output.
    const isService = order.type === 'Servicio de Tueste';
    
    setFormData(prev => ({
      ...prev,
      greenCoffeeId: matchingGreen ? matchingGreen.id : '',
      greenQtyKg: isService ? order.quantityKg : order.quantityKg * 1.2, 
      profile: '',
      roastedQtyKg: isService ? order.quantityKg * 0.84 : order.quantityKg 
    }));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedGreen = greenCoffees.find(g => g.id === formData.greenCoffeeId);
    
    if (!selectedGreen) {
      alert("Por favor seleccione un lote de café verde.");
      return;
    }

    if (formData.roastedQtyKg >= formData.greenQtyKg) {
      alert("Error: El peso tostado no puede ser mayor o igual al peso verde.");
      return;
    }

    if (selectedGreen.quantityKg < formData.greenQtyKg) {
      alert(`Stock insuficiente. Solo hay ${selectedGreen.quantityKg.toFixed(2)} Kg disponibles.`);
      return;
    }

    const newRoast: Roast = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: selectedGreen.clientName,
      weightLossPercentage: weightLoss,
      orderId: selectedOrderId || undefined,
      greenCoffeeId: selectedGreen.id,
      greenQtyKg: formData.greenQtyKg,
      roastedQtyKg: formData.roastedQtyKg,
      profile: formData.profile,
      roastDate: formData.roastDate
    };

    await db.roasts.add(newRoast);
    await syncToCloud('roasts', newRoast);

    const updatedGreen = { ...selectedGreen, quantityKg: selectedGreen.quantityKg - formData.greenQtyKg };
    await db.greenCoffees.update(selectedGreen.id, { quantityKg: updatedGreen.quantityKg });
    await syncToCloud('greenCoffees', updatedGreen);

    const newStock: RoastedStock = {
      id: Math.random().toString(36).substr(2, 9),
      roastId: newRoast.id,
      variety: selectedGreen.variety,
      clientName: selectedGreen.clientName,
      totalQtyKg: formData.roastedQtyKg,
      remainingQtyKg: formData.roastedQtyKg,
      isSelected: false,
      mermaGrams: 0
    };
    await db.roastedStocks.add(newStock);
    await syncToCloud('roastedStocks', newStock);

    // If linked to an order, update the order
    if (selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        const updatedRelatedRoasts = [...(order.relatedRoastIds || []), newRoast.id];
        
        const updates: any = {
          status: 'En Producción' as const,
          relatedRoastIds: updatedRelatedRoasts,
          requiresRoasting: false,
        };

        // If it's a Service, update the order quantity to match the actual roasted outcome
        if (order.type === 'Servicio de Tueste') {
           updates.quantityKg = formData.roastedQtyKg;
        }

        await db.orders.update(order.id, updates);
        await syncToCloud('orders', { ...order, ...updates });
      }
    }

    setShowModal(false);
    setSelectedOrderId(null);
    setFormData({
      greenCoffeeId: '',
      greenQtyKg: 0,
      roastedQtyKg: 0,
      profile: '',
      roastDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Tostado</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Gestión de Transformación</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowSummary(true)}
            className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-stone-600 px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Printer className="w-4 h-4" /> Resumen Diario
          </button>
          <button 
            onClick={() => {
              setSelectedOrderId(null);
              setFormData(prev => ({ ...prev, greenCoffeeId: '', greenQtyKg: 0, roastedQtyKg: 0, profile: '', roastDate: getTodayString() }));
              setShowModal(true);
            }} 
            className="flex-1 sm:flex-none bg-amber-800 hover:bg-amber-900 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Flame className="w-4 h-4" /> Nuevo Tueste
          </button>
        </div>
      </div>

      {/* Roasting Queue */}
      {roastingQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-bold text-sm uppercase tracking-wide">Cola de Tueste ({roastingQueue.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roastingQueue.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{order.type}</span>
                    <h5 className="font-bold text-stone-900">{order.clientName}</h5>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full">{order.quantityKg} Kg</span>
                </div>
                <div className="text-xs text-stone-600">
                  <span className="font-semibold">Variedad:</span> {order.variety}
                </div>
                <button 
                  onClick={() => handleSelectOrder(order)}
                  className="mt-auto w-full py-2 bg-amber-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-900 transition-colors flex items-center justify-center gap-2"
                >
                  Procesar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Grano Verde</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Resultado</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Mermas %</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Perfil / Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {roasts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-stone-400 font-medium text-sm italic">Sin registros de procesos de tueste.</td></tr>
              ) : (
                roasts.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-stone-900 text-sm tracking-tight">
                      {r.clientName}
                      {r.orderId && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700">Pedido Vinculado</span>}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-stone-400 tracking-tight">{r.greenQtyKg.toFixed(2)} Kg</td>
                    <td className="px-6 py-5 text-sm font-bold text-amber-800 tracking-tighter">{r.roastedQtyKg.toFixed(2)} Kg</td>
                    <td className="px-6 py-5 text-sm font-bold text-red-600 tracking-tight">{r.weightLossPercentage.toFixed(2)}%</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider mb-1">{r.profile}</span>
                        <span className="text-[11px] text-stone-400 font-semibold">{r.roastDate}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-none print:h-auto">
            {/* Modal Header - Hidden on Print */}
            <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center print:hidden z-10">
              <h3 className="text-lg font-bold text-stone-900">Resumen Diario de Producción</h3>
              <div className="flex gap-2 items-center">
                <input 
                  type="date"
                  value={summaryDate}
                  onChange={(e) => setSummaryDate(e.target.value)}
                  className="p-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
                <button onClick={() => window.print()} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowSummary(false)} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-8 print:p-12">
              <div className="flex justify-between items-end border-b-2 border-stone-900 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">VARIETAL</h1>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em]">Informe de Producción Diaria</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">Fecha: {dailySummary.date}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 print:border-stone-300">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Tostado</p>
                  <p className="text-2xl font-black text-stone-900">{dailySummary.totalRoasted.toFixed(2)} Kg</p>
                </div>
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 print:border-stone-300">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Café Verde Procesado</p>
                  <p className="text-2xl font-black text-stone-900">{dailySummary.totalGreen.toFixed(2)} Kg</p>
                </div>
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 print:border-stone-300">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Merma Promedio</p>
                  <p className="text-2xl font-black text-stone-900">{dailySummary.avgLoss.toFixed(2)}%</p>
                </div>
              </div>

              {/* Batch List */}
              <div>
                <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide mb-4">Detalle de Lotes Procesados</h4>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Cliente / Lote</th>
                      <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider text-right">Verde</th>
                      <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider text-right">Tostado</th>
                      <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider text-right">Merma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dailySummary.batches.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-stone-400 italic">No se registraron tuestes hoy.</td>
                      </tr>
                    ) : (
                      dailySummary.batches.map(batch => (
                        <tr key={batch.id}>
                          <td className="px-6 py-5 font-medium text-stone-900">
                            {batch.clientName}
                            <span className="block text-[10px] text-stone-500 font-normal">{batch.profile}</span>
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-stone-600">{batch.greenQtyKg.toFixed(2)}</td>
                          <td className="px-6 py-5 text-right font-bold text-stone-900 font-mono">{batch.roastedQtyKg.toFixed(2)}</td>
                          <td className="px-6 py-5 text-right text-stone-600 font-mono">{batch.weightLossPercentage.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="pt-12 mt-12 border-t border-stone-200 text-center print:fixed print:bottom-8 print:w-full print:left-0">
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">Generado por Varietal System</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-200">
            <div className="bg-amber-800 p-8 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xl font-bold tracking-tight">Registro de Tueste</h4>
                <p className="text-amber-100 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {selectedOrderId ? 'Procesando Pedido' : 'Proceso de Transformación'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-amber-400/50 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {selectedOrderId && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <p className="text-xs text-blue-800 font-medium">Vinculado al pedido seleccionado</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Lote de Café Verde</label>
                <select required className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-800 outline-none text-sm font-medium transition-all" value={formData.greenCoffeeId} onChange={e => setFormData({...formData, greenCoffeeId: e.target.value})}>
                  <option value="">Seleccione existencias...</option>
                  {greenCoffees.filter(g => g.quantityKg > 0).map(g => (
                    <option key={g.id} value={g.id}>{g.clientName} — {g.variety} ({g.quantityKg.toFixed(2)} Kg)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Peso Verde (Kg)</label>
                  <input type="number" step="0.01" min="0.1" required className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-800 outline-none text-sm font-bold transition-all" value={formData.greenQtyKg} onChange={e => setFormData({...formData, greenQtyKg: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Peso Tostado (Kg)</label>
                  <input type="number" step="0.01" min="0.1" required className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-800 outline-none text-sm font-bold transition-all text-amber-900" value={formData.roastedQtyKg} onChange={e => setFormData({...formData, roastedQtyKg: parseFloat(e.target.value)})} />
                </div>
              </div>
              {formData.greenQtyKg > 0 && (
                <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-[11px] font-bold uppercase tracking-widest"><Calculator className="w-3.5 h-3.5" /> Pérdida Estimada:</div>
                  <span className={`text-sm font-bold ${weightLoss > 20 || weightLoss < 0 ? 'text-red-600' : 'text-stone-900'}`}>{weightLoss.toFixed(2)}%</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Perfil Tueste</label>
                  <input type="text" required placeholder="Medio, City..." className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-800 outline-none text-sm font-medium transition-all" value={formData.profile} onChange={e => setFormData({...formData, profile: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Fecha Proceso</label>
                  <input type="date" required className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-800 outline-none text-sm font-semibold transition-all" value={formData.roastDate} onChange={e => setFormData({...formData, roastDate: e.target.value})} />
                </div>
              </div>
              <div className="pt-4"><button type="submit" className="w-full py-4 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-[0.2em]">Validar Transformación</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoastingView;
