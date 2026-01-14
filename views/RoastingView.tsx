import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Flame, Clock, Scale, Calendar, ChevronRight, X, Coffee, ArrowRight, Printer, AlertCircle } from 'lucide-react';
import { Roast, GreenCoffee, Order, RoastedStock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db, syncToCloud } from '../db';

interface Props {
  roasts: Roast[];
  greenCoffees: GreenCoffee[];
  orders: Order[];
}

const RoastingView: React.FC<Props> = ({ roasts, greenCoffees, orders }) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [showNewRoastModal, setShowNewRoastModal] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // New Roast Form State
  const [selectedGreenCoffeeId, setSelectedGreenCoffeeId] = useState<string>('');
  const [greenQtyKg, setGreenQtyKg] = useState<number>(0);
  const [roastedQtyKg, setRoastedQtyKg] = useState<number>(0);
  
  // Initialize with local date
  const [roastDate, setRoastDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });
  
  const [profile, setProfile] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Derived state
  const selectedGreenCoffee = greenCoffees.find(g => g.id === selectedGreenCoffeeId);

  const availableGreenCoffees = useMemo(() => {
    return greenCoffees.filter(g => g.quantityKg > 0);
  }, [greenCoffees]);

  // Calculate stats - Use Local Date to avoid Timezone issues
  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const today = getLocalDate();

  const roastsToday = roasts.filter(r => r.roastDate === today);
  const totalGreenToday = roastsToday.reduce((sum, r) => sum + Number(r.greenQtyKg), 0);
  const totalRoastedToday = roastsToday.reduce((sum, r) => sum + Number(r.roastedQtyKg), 0);

  // Calculate detailed stats for summary
  const avgShrinkage = roastsToday.length > 0 
      ? roastsToday.reduce((sum, r) => sum + r.weightLossPercentage, 0) / roastsToday.length 
      : 0;

  const roastsByOrder = useMemo(() => {
      return roastsToday.reduce((acc, roast) => {
        const clientName = roast.clientName || 'Stock';
        const variety = greenCoffees.find(g => g.id === roast.greenCoffeeId)?.variety || 'Desconocido';
        
        if (!acc[clientName]) {
            acc[clientName] = { green: 0, roasted: 0, batches: 0, varieties: new Set<string>() };
        }
        acc[clientName].green += roast.greenQtyKg;
        acc[clientName].roasted += roast.roastedQtyKg;
        acc[clientName].batches += 1;
        acc[clientName].varieties.add(variety);
        return acc;
    }, {} as Record<string, { green: number, roasted: number, batches: number, varieties: Set<string> }>);
  }, [roastsToday, greenCoffees]);

  // Update date when modal opens to ensure it's current (fixes overnight stale date issue)
  useEffect(() => {
      if (showNewRoastModal) {
          setRoastDate(getLocalDate());
      }
  }, [showNewRoastModal]);

  // Helper to check completion status
  const checkOrderCompletion = (order: Order) => {
    const isServiceOrder = order.type === 'Servicio de Tueste';
    const currentAccumulated = order.accumulatedRoastedKg || 0;
    const currentGreenAccumulated = order.accumulatedGreenUsedKg || 0;
    
    if (isServiceOrder) {
        // Check if green used is enough
        return currentGreenAccumulated >= (order.quantityKg - 0.1);
    } else {
        // Check if roasted output is enough
        return currentAccumulated >= (order.quantityKg - 0.1);
    }
  };

  // Filter orders needing roasting (pending or processing)
  // We exclude orders that are technically complete but haven't updated status yet
  const pendingOrders = orders.filter(o => 
    (o.status === 'Pendiente' || o.status === 'En Producción') && 
    !checkOrderCompletion(o)
  );

  // Auto-fix stuck orders
  useEffect(() => {
    const checkAndFixOrders = async () => {
        const potentialStuckOrders = orders.filter(o => o.status === 'Pendiente' || o.status === 'En Producción');
        
        for (const order of potentialStuckOrders) {
            let greenUsed = order.accumulatedGreenUsedKg || 0;
            let roastedUsed = order.accumulatedRoastedKg || 0;

            // Recalculate from roasts to be robust (handles legacy orders)
            if (order.relatedRoastIds && order.relatedRoastIds.length > 0) {
                const orderRoasts = roasts.filter(r => order.relatedRoastIds?.includes(r.id));
                const calculatedGreen = orderRoasts.reduce((sum, r) => sum + r.greenQtyKg, 0);
                const calculatedRoasted = orderRoasts.reduce((sum, r) => sum + r.roastedQtyKg, 0);
                
                // Use calculated values if they provide more info
                if (calculatedGreen > greenUsed) greenUsed = calculatedGreen;
                if (calculatedRoasted > roastedUsed) roastedUsed = calculatedRoasted;
            }

            const isServiceOrder = order.type === 'Servicio de Tueste';
            let isComplete = false;

            if (isServiceOrder) {
                isComplete = greenUsed >= (order.quantityKg - 0.1);
            } else {
                isComplete = roastedUsed >= (order.quantityKg - 0.1);
            }

            if (isComplete) {
                console.log('Auto-completing stuck order:', order.clientName);
                const updates: Partial<Order> = { 
                    progress: 100,
                    accumulatedGreenUsedKg: greenUsed,
                    accumulatedRoastedKg: roastedUsed
                };

                // Only auto-complete to 'Listo para Despacho' if NOT a service order
                // Service orders must go through "Armado de Pedido"
                if (!isServiceOrder) {
                    updates.status = 'Listo para Despacho';
                }

                await db.orders.update(order.id, updates);
                syncToCloud('orders', { ...order, ...updates });
                if (!isServiceOrder) {
                    showToast(`Pedido ${order.clientName} actualizado automáticamente`, 'success');
                }
            }
        }
    };
    
    checkAndFixOrders();
  }, [orders, roasts, showToast]);

  const handleSaveRoast = async () => {
    if (!canEdit) return;
    if (!selectedGreenCoffeeId || greenQtyKg <= 0 || roastedQtyKg <= 0) {
        showToast('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    // Create Roast Record
    const newRoast: Roast = {
        id: Math.random().toString(36).substr(2, 9),
        greenCoffeeId: selectedGreenCoffeeId,
        orderId: selectedOrderId || undefined,
        clientName: selectedOrderId ? orders.find(o => o.id === selectedOrderId)?.clientName || 'Stock' : 'Stock',
        greenQtyKg,
        roastedQtyKg,
        weightLossPercentage: shrinkage,
        profile,
        roastDate
    };

    // Update Green Coffee Stock
    const greenCoffee = greenCoffees.find(g => g.id === selectedGreenCoffeeId);
    if (greenCoffee) {
        const updatedGreen = { 
            ...greenCoffee, 
            quantityKg: Math.max(0, greenCoffee.quantityKg - greenQtyKg) 
        };
        await db.greenCoffees.update(greenCoffee.id, updatedGreen);
        syncToCloud('greenCoffees', updatedGreen);
    }

    // Handle Order Fulfillment Logic
    let clientStockQty = roastedQtyKg;
    let excessStockQty = 0;

    if (selectedOrderId) {
        const order = orders.find(o => o.id === selectedOrderId);
        if (order) {
            const currentAccumulated = order.accumulatedRoastedKg || 0;
            const newAccumulated = currentAccumulated + roastedQtyKg;
            
            const currentGreenAccumulated = order.accumulatedGreenUsedKg || 0;
            const newGreenAccumulated = currentGreenAccumulated + greenQtyKg;

            // Determine Completion Logic based on Order Type
            const isServiceOrder = order.type === 'Servicio de Tueste';
            let isComplete = false;
            let progressPercentage = 0;

            if (isServiceOrder) {
                // For Service Orders: Target is Green Coffee Input
                // All roasted coffee belongs to client (no excess stock for roastery usually)
                clientStockQty = roastedQtyKg; 
                excessStockQty = 0;

                // Check completion against Green Quantity
                // We assume order.quantityKg represents the Green Coffee amount for Service Orders
                isComplete = newGreenAccumulated >= (order.quantityKg - 0.1); // Small buffer for float precision
                progressPercentage = isComplete ? 100 : Math.round((newGreenAccumulated / order.quantityKg) * 100);

            } else {
                // For Sales: Target is Roasted Coffee Output
                const remainingNeeded = Math.max(0, order.quantityKg - currentAccumulated);
                
                // Determine how much of this roast goes to the order vs stock
                clientStockQty = Math.min(roastedQtyKg, remainingNeeded);
                excessStockQty = Math.max(0, roastedQtyKg - remainingNeeded);

                isComplete = newAccumulated >= (order.quantityKg - 0.1);
                progressPercentage = isComplete ? 100 : Math.round((newAccumulated / order.quantityKg) * 100);
            }

            const updates: Partial<Order> = {
                accumulatedRoastedKg: newAccumulated,
                accumulatedGreenUsedKg: newGreenAccumulated,
                relatedRoastIds: [...(order.relatedRoastIds || []), newRoast.id]
            };

            // Update Status
            if (isComplete) {
                if (isServiceOrder) {
                    // Service orders stay in 'En Producción' until "Armado de Pedido"
                    updates.status = 'En Producción';
                    updates.progress = 100;
                } else {
                    updates.status = 'Listo para Despacho';
                    updates.progress = 100;
                }
            } else {
                updates.status = 'En Producción';
                updates.progress = Math.min(99, progressPercentage);
            }

            await db.orders.update(order.id, updates);
            syncToCloud('orders', { ...order, ...updates });
        }
    }

    // Add Roast to DB
    await db.roasts.add(newRoast);
    syncToCloud('roasts', newRoast);

    // Create Roasted Stock Entry for Client/Order
    if (clientStockQty > 0) {
        const clientStock: RoastedStock = {
            id: Math.random().toString(36).substr(2, 9),
            roastId: newRoast.id,
            variety: greenCoffee?.variety || 'Unknown',
            clientName: newRoast.clientName || 'Stock',
            totalQtyKg: clientStockQty,
            remainingQtyKg: clientStockQty,
            isSelected: false,
            mermaGrams: 0
        };
        await db.roastedStocks.add(clientStock);
        syncToCloud('roastedStocks', clientStock);
    }

    // Create Roasted Stock Entry for Excess (Silo/Stock)
    if (excessStockQty > 0) {
        const excessStock: RoastedStock = {
            id: Math.random().toString(36).substr(2, 9),
            roastId: newRoast.id,
            variety: greenCoffee?.variety || 'Unknown',
            clientName: 'Stock', // Explicitly mark as Stock
            totalQtyKg: excessStockQty,
            remainingQtyKg: excessStockQty,
            isSelected: false,
            mermaGrams: 0
        };
        await db.roastedStocks.add(excessStock);
        syncToCloud('roastedStocks', excessStock);
        if (selectedOrderId) {
            showToast(`Exceso de ${excessStockQty.toFixed(2)}kg enviado a Stock`, 'info');
        }
    }
    
    showToast('Tueste registrado correctamente', 'success');
    setShowNewRoastModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedGreenCoffeeId('');
    setGreenQtyKg(0);
    setRoastedQtyKg(0);
    setProfile('');
    setSelectedOrderId('');
  };

  // Calculate shrinkage
  const shrinkage = greenQtyKg > 0 ? ((greenQtyKg - roastedQtyKg) / greenQtyKg) * 100 : 0;

  const sortedRoasts = useMemo(() => {
    return [...roasts].sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime());
  }, [roasts]);

  const displayedRoasts = activeTab === 'queue' ? sortedRoasts.slice(0, 10) : sortedRoasts;

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-black pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Gestión de Tueste</h2>
          <p className="text-stone-500 font-medium uppercase tracking-wide">Control de producción y perfiles</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowDailySummary(true)}
            className="px-6 py-3 border border-stone-200 hover:border-black text-black font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Resumen del Día
          </button>
          {canEdit && (
            <button 
              onClick={() => setShowNewRoastModal(true)}
              className="px-6 py-3 bg-black text-white border border-black hover:bg-white hover:text-black font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Tueste
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border border-stone-200 p-6 flex items-start justify-between group hover:border-black transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tuestes Hoy</p>
            <h3 className="text-4xl font-black tracking-tighter">{roastsToday.length}</h3>
          </div>
          <div className="bg-black text-white p-2">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-stone-200 p-6 flex items-start justify-between group hover:border-black transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Kg Verde Tostado Hoy</p>
            <h3 className="text-4xl font-black tracking-tighter">{totalGreenToday.toFixed(1)} <span className="text-lg text-stone-400 font-bold">KG</span></h3>
          </div>
          <div className="bg-black text-white p-2">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-stone-200 p-6 flex items-start justify-between group hover:border-black transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Órdenes Pendientes</p>
            <h3 className="text-4xl font-black tracking-tighter">{pendingOrders.length}</h3>
          </div>
          <div className="bg-black text-white p-2">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-12">
        
        {/* Top Section: Roasting Queue */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black uppercase tracking-tight">Cola de Producción</h3>
            <span className="text-xs font-bold bg-black text-white px-2 py-1">{pendingOrders.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.length === 0 ? (
              <div className="col-span-full border border-dashed border-stone-300 p-8 text-center">
                <p className="text-stone-400 font-medium uppercase tracking-wide text-sm">No hay órdenes pendientes</p>
              </div>
            ) : (
              pendingOrders.map(order => {
                // Calculate remaining amount
                const isService = order.type === 'Servicio de Tueste';
                const current = isService ? (order.accumulatedGreenUsedKg || 0) : (order.accumulatedRoastedKg || 0);
                const remaining = Math.max(0, order.quantityKg - current);

                const recommendedGreen = order.type === 'Venta Café Tostado' 
                    ? (remaining / 0.85).toFixed(2) 
                    : null;

                return (
                <div key={order.id} className="border border-stone-200 p-5 hover:border-black transition-all group bg-white">
                  <div className="mb-2">
                    <h4 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{order.clientName}</h4>
                    <span className="text-[10px] font-mono text-stone-400">#{order.id.slice(0, 8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-stone-600 flex-wrap">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs font-bold uppercase tracking-wider">{order.variety}</span>
                    {order.roastType && (
                        <>
                        <span className="text-stone-300">|</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{order.roastType}</span>
                        </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4">
                    <div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Pedido Total</p>
                        <p className="font-bold text-sm text-stone-500">{order.quantityKg} <span className="text-[10px] text-stone-400 font-bold">Kg</span></p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-black uppercase tracking-widest mb-1">Por Tostar</p>
                        <p className="font-black text-xl">{remaining.toFixed(2)} <span className="text-xs text-stone-500 font-bold">Kg</span></p>
                    </div>
                    {recommendedGreen && (
                        <div className="col-span-2 pt-2 border-t border-stone-200/50">
                            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Sugerido (Verde) Total</p>
                            <p className="font-bold text-sm text-amber-700">{recommendedGreen} <span className="text-[10px] text-amber-600/70 font-bold">Kg</span></p>
                        </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-stone-100">
                    {canEdit && (
                      <button 
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          
                          // Auto-fill logic
                          const recommendedGreen = order.type === 'Venta Café Tostado' 
                             ? (remaining / 0.85) 
                             : remaining;
                          
                          setGreenQtyKg(parseFloat(recommendedGreen.toFixed(2)));
                          setProfile(order.roastType || '');
                          
                          // Find matching green coffee
                          const matchingGreen = availableGreenCoffees.find(g => 
                            g.variety.toLowerCase().includes(order.variety.toLowerCase()) || 
                            order.variety.toLowerCase().includes(g.variety.toLowerCase())
                          );
                          
                          if (matchingGreen) {
                             setSelectedGreenCoffeeId(matchingGreen.id);
                          }
                          
                          setShowNewRoastModal(true);
                        }}
                        className="text-xs font-black uppercase tracking-wide bg-black text-white px-4 py-2 hover:bg-stone-800 transition-all flex items-center gap-2 w-full justify-center"
                      >
                        Tostar <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Bottom Section: Roast History */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Historial de Tuestes</h3>
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border ${activeTab === 'queue' ? 'bg-black text-white border-black' : 'text-stone-500 border-transparent hover:border-stone-200'}`}
                onClick={() => setActiveTab('queue')}
              >
                Recientes
              </button>
              <button 
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border ${activeTab === 'history' ? 'bg-black text-white border-black' : 'text-stone-500 border-transparent hover:border-stone-200'}`}
                onClick={() => setActiveTab('history')}
              >
                Todos
              </button>
            </div>
          </div>

          <div className="border border-stone-200 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                  <th className="p-4 font-bold border-r border-stone-100">Fecha / ID</th>
                  <th className="p-4 font-bold border-r border-stone-100">Café Verde</th>
                  <th className="p-4 font-bold border-r border-stone-100 text-right">Peso Entrada</th>
                  <th className="p-4 font-bold border-r border-stone-100 text-right">Peso Salida</th>
                  <th className="p-4 font-bold text-right">Merma %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayedRoasts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400 font-medium uppercase text-sm">
                      No hay registros de tueste
                    </td>
                  </tr>
                ) : (
                  displayedRoasts.map((roast) => {
                    const green = greenCoffees.find(g => g.id === roast.greenCoffeeId);
                    
                    return (
                      <tr key={roast.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-4 border-r border-stone-100">
                          <div className="font-bold text-black text-xs">{roast.id.slice(0, 8)}</div>
                          <div className="text-xs text-stone-500 font-medium">{roast.roastDate.split('T')[0]}</div>
                        </td>
                        <td className="p-4 border-r border-stone-100">
                          <span className="font-bold text-black block">{green?.variety || 'Desconocido'}</span>
                          <span className="text-xs text-stone-500 uppercase">{green?.clientName} - {green?.origin}</span>
                        </td>
                        <td className="p-4 text-right font-medium text-stone-600 border-r border-stone-100">
                          {roast.greenQtyKg.toFixed(2)} kg
                        </td>
                        <td className="p-4 text-right font-bold text-black border-r border-stone-100">
                          {roast.roastedQtyKg.toFixed(2)} kg
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 text-xs font-bold ${
                            roast.weightLossPercentage > 20 ? 'bg-red-100 text-red-700' : 
                            roast.weightLossPercentage < 10 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {roast.weightLossPercentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Roast Modal */}
      {showNewRoastModal && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowNewRoastModal(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-6 h-6" /> Nuevo Tueste
              </h3>
              <button 
                onClick={() => setShowNewRoastModal(false)}
                className="p-2 hover:bg-stone-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Green Coffee Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Seleccionar Café Verde</label>
                <select 
                  className="w-full p-3 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-medium transition-colors"
                  value={selectedGreenCoffeeId || ''}
                  onChange={(e) => setSelectedGreenCoffeeId(e.target.value)}
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {availableGreenCoffees.map(coffee => (
                    <option key={coffee.id} value={coffee.id}>
                      {coffee.variety} - {coffee.clientName} ({coffee.quantityKg}kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Weights */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Peso Verde (Kg)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full p-3 pl-10 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-bold text-lg transition-colors"
                      value={greenQtyKg || ''}
                      onChange={(e) => setGreenQtyKg(Number(e.target.value))}
                    />
                    <Scale className="w-4 h-4 absolute left-3 top-4 text-stone-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Peso Tostado (Kg)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full p-3 pl-10 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-bold text-lg transition-colors"
                      value={roastedQtyKg || ''}
                      onChange={(e) => setRoastedQtyKg(Number(e.target.value))}
                    />
                    <Coffee className="w-4 h-4 absolute left-3 top-4 text-stone-400" />
                  </div>
                </div>
              </div>

              {/* Shrinkage Indicator */}
              <div className="bg-stone-50 p-4 border border-stone-200 flex justify-between items-center">
                <span className="text-sm font-bold uppercase text-stone-500">Merma Estimada</span>
                <span className={`text-xl font-black ${shrinkage > 20 ? 'text-red-600' : 'text-black'}`}>
                  {shrinkage.toFixed(1)}%
                </span>
              </div>

              {/* Profile & Order */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Perfil / Notas</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-medium transition-colors"
                    placeholder="Ej. Tueste Medio, Notas Frutales"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Orden Relacionada</label>
                  <select 
                    className="w-full p-3 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-medium transition-colors"
                    value={selectedOrderId || ''}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                  >
                    <option value="">-- Ninguna --</option>
                    {pendingOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        #{order.id.slice(0, 8)} - {order.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-4 pt-4 border-t border-stone-100">
                <button 
                  onClick={() => setShowNewRoastModal(false)}
                  className="px-6 py-3 border border-stone-200 hover:border-black text-stone-600 hover:text-black font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRoast}
                  disabled={!selectedGreenCoffeeId || greenQtyKg <= 0}
                  className="px-8 py-3 bg-black text-white border border-black hover:bg-stone-800 font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Tueste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary Modal */}
      {showDailySummary && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowDailySummary(false)}
        >
          <div 
            className="bg-white w-full max-w-lg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black">
              <h3 className="text-xl font-black uppercase tracking-tight">Resumen de Producción</h3>
              <button onClick={() => setShowDailySummary(false)}>
                <X className="w-6 h-6 hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">{today}</p>
                <h4 className="text-3xl font-black uppercase tracking-tight">Reporte Diario</h4>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                  <span className="font-medium text-stone-600">Total Batches</span>
                  <span className="font-bold text-xl">{roastsToday.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                  <span className="font-medium text-stone-600">Total Café Verde</span>
                  <span className="font-bold text-xl">{totalGreenToday.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                  <span className="font-medium text-stone-600">Total Tostado</span>
                  <span className="font-bold text-xl">{totalRoastedToday.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                  <span className="font-medium text-stone-600">Merma Promedio</span>
                  <span className="font-bold text-xl">{avgShrinkage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Breakdown by Order */}
              <div className="mb-8">
                <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Desglose por Pedido</h5>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {Object.entries(roastsByOrder).map(([client, stats]) => (
                    <div key={client} className="bg-stone-50 p-3 rounded border border-stone-100">
                        <div className="flex justify-between items-center mb-1">
                            <div className="overflow-hidden">
                                <span className="font-bold text-sm truncate block max-w-[180px]">{client}</span>
                                <span className="text-[10px] text-stone-400 block truncate">{Array.from(stats.varieties).join(', ')}</span>
                            </div>
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full shrink-0">{stats.batches} batch{stats.batches !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex justify-between text-xs text-stone-500 mt-2">
                            <span>Verde: <span className="font-bold">{stats.green.toFixed(1)}kg</span></span>
                            <span>Tostado: <span className="font-bold">{stats.roasted.toFixed(1)}kg</span></span>
                        </div>
                    </div>
                    ))}
                    {Object.keys(roastsByOrder).length === 0 && (
                        <p className="text-center text-stone-400 text-xs italic">No hay tuestes registrados hoy</p>
                    )}
                </div>
              </div>

              <button 
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Imprimir Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoastingView;
