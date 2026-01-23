import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Flame, Clock, Scale, Calendar, ChevronRight, X, Coffee, ArrowRight, Printer, AlertCircle, ClipboardList, Search } from 'lucide-react';
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
  const [greenCoffeeSearch, setGreenCoffeeSearch] = useState('');
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
  
  const shrinkage = useMemo(() => {
    if (greenQtyKg <= 0) return 0;
    return ((greenQtyKg - roastedQtyKg) / greenQtyKg) * 100;
  }, [greenQtyKg, roastedQtyKg]);

  const availableGreenCoffees = useMemo(() => {
    return greenCoffees
      .filter(g => g.quantityKg > 0)
      .sort((a, b) => {
        // Sort by Variety then Client
        const varietyCompare = a.variety.localeCompare(b.variety);
        if (varietyCompare !== 0) return varietyCompare;
        return a.clientName.localeCompare(b.clientName);
      });
  }, [greenCoffees]);

  const filteredGreenCoffees = useMemo(() => {
    if (!greenCoffeeSearch.trim()) return availableGreenCoffees;
    const query = greenCoffeeSearch.toLowerCase();
    return availableGreenCoffees.filter(g => 
      g.variety.toLowerCase().includes(query) || 
      g.clientName.toLowerCase().includes(query)
    );
  }, [availableGreenCoffees, greenCoffeeSearch]);

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
  // Exclude orders marcados como que no requieren tueste o ya completos
  const pendingOrders = orders.filter(o => 
    (o.status === 'Pendiente' || o.status === 'En Producción') && 
    (o.requiresRoasting ?? true) &&
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
                const needsAccumulatedUpdate = 
                  greenUsed !== (order.accumulatedGreenUsedKg || 0) || 
                  roastedUsed !== (order.accumulatedRoastedKg || 0);
                const needsProgressUpdate = order.progress !== 100;

                let needsStatusUpdate = false;
                if (!isServiceOrder && order.status !== 'Listo para Despacho') {
                    needsStatusUpdate = true;
                }

                if (needsAccumulatedUpdate || needsProgressUpdate || needsStatusUpdate) {
                    const updates: Partial<Order> = { 
                        progress: 100,
                        accumulatedGreenUsedKg: greenUsed,
                        accumulatedRoastedKg: roastedUsed
                    };

                    if (!isServiceOrder && needsStatusUpdate) {
                        updates.status = 'Listo para Despacho';
                    }

                    await db.orders.update(order.id, updates);
                    syncToCloud('orders', { ...order, ...updates });
                    if (!isServiceOrder) {
                        showToast(`Pedido ${order.clientName} actualizado automáticamente`, 'success');
                    }
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
    const linkedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : undefined;
    const baseClientName = linkedOrder?.clientName || 'Stock';

    const newRoast: Roast = {
        id: Math.random().toString(36).substr(2, 9),
        greenCoffeeId: selectedGreenCoffeeId,
        orderId: selectedOrderId || undefined,
        clientName: baseClientName,
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
        const order = linkedOrder;
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
            clientName: baseClientName,
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
            clientName: baseClientName,
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

  const selectedOrderForRoast = pendingOrders.find(o => o.id === selectedOrderId) || null;

  const sortedRoasts = useMemo(() => {
    return [...roasts].sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime());
  }, [roasts]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(
    () =>
      rowsPerPage > 0 ? Math.max(1, Math.ceil(sortedRoasts.length / rowsPerPage)) : 1,
    [sortedRoasts, rowsPerPage]
  );

  const displayedRoasts =
    activeTab === 'queue'
      ? sortedRoasts.slice(0, 10)
      : sortedRoasts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <>
    <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white font-sans p-8 animate-fade-in pb-48">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-black dark:border-stone-700 pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Gestión de Tueste</h2>
          <p className="text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wide">Control de producción y perfiles</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowDailySummary(true)}
            className="px-6 py-3 border border-stone-200 dark:border-stone-800 hover:border-black dark:hover:border-stone-500 text-black dark:text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Resumen del Día
          </button>
          {canEdit && (
            <button 
              onClick={() => setShowNewRoastModal(true)}
              className="px-6 py-3 bg-black dark:bg-stone-800 text-white dark:text-stone-200 border border-black dark:border-stone-700 hover:bg-white hover:text-black dark:hover:bg-stone-700 dark:hover:text-white font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Tueste
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border border-stone-200 dark:border-stone-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-stone-600 transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Tuestes Hoy</p>
            <h3 className="text-4xl font-black tracking-tighter">{roastsToday.length}</h3>
          </div>
          <div className="bg-black dark:bg-stone-800 text-white dark:text-stone-200 p-2">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-stone-600 transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Kg Verde Tostado Hoy</p>
            <h3 className="text-4xl font-black tracking-tighter">{totalGreenToday.toFixed(1)} <span className="text-lg text-stone-400 dark:text-stone-500 font-bold">KG</span></h3>
          </div>
          <div className="bg-black dark:bg-stone-800 text-white dark:text-stone-200 p-2">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-stone-600 transition-all">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Órdenes Pendientes</p>
            <h3 className="text-4xl font-black tracking-tighter">{pendingOrders.length}</h3>
          </div>
          <div className="bg-black dark:bg-stone-800 text-white dark:text-stone-200 p-2">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-12">
        
        {/* Top Section: Roasting Queue */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Cola de Producción</h3>
            <span className="text-xs font-bold bg-black dark:bg-stone-800 text-white dark:text-stone-200 px-2 py-1">{pendingOrders.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.length === 0 ? (
              <div className="col-span-full border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center">
                <p className="text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide text-sm">No hay órdenes pendientes</p>
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
                <div key={order.id} className="border border-stone-200 dark:border-stone-800 p-5 hover:border-black dark:hover:border-stone-600 transition-all group bg-white dark:bg-stone-900">
                  <div className="mb-2">
                    <h4 className="font-black text-lg uppercase tracking-tight leading-none mb-1 dark:text-white">{order.clientName}</h4>
                    <span className="text-[10px] font-mono text-stone-400">#{order.id.slice(0, 8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-stone-600 dark:text-stone-400 flex-wrap">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {order.orderLines && order.orderLines.length > 0 ? 'Múltiples cafés' : order.variety}
                    </span>
                    {order.roastType && (
                      <>
                        <span className="text-stone-300 dark:text-stone-600">|</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800/30">{order.roastType}</span>
                      </>
                    )}
                  </div>

                  {order.orderLines && order.orderLines.length > 0 && (
                    <div className="mb-3 space-y-1 text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                      {order.orderLines.slice(0, 4).map(line => (
                        <div key={line.id} className="flex justify-between">
                          <span>{line.variety}</span>
                          <span>{line.quantityKg.toFixed(2)} Kg</span>
                        </div>
                      ))}
                      {order.orderLines.length > 4 && (
                        <div className="text-[9px] text-stone-400">
                          +{order.orderLines.length - 4} más
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-800 p-3 rounded-lg border border-stone-100 dark:border-stone-700 mb-4">
                    <div>
                        <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Pedido Total</p>
                        <p className="font-bold text-sm text-stone-500 dark:text-stone-300">{order.quantityKg} <span className="text-[10px] text-stone-400 font-bold">Kg</span></p>
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

          {/* Mobile History Cards */}
          <div className="lg:hidden space-y-4">
            {displayedRoasts.length === 0 ? (
              <div className="p-8 text-center text-stone-400 font-medium uppercase text-sm border border-dashed border-stone-300">
                No hay registros de tueste
              </div>
            ) : (
              displayedRoasts.map((roast) => {
                const green = greenCoffees.find(g => g.id === roast.greenCoffeeId);
                return (
                  <div key={roast.id} className="bg-white border border-stone-200 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-black text-sm">#{roast.id.slice(0, 8)}</div>
                        <div className="text-xs text-stone-500 font-medium">{roast.roastDate.split('T')[0]}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        roast.weightLossPercentage > 20 ? 'bg-red-100 text-red-700' : 
                        roast.weightLossPercentage < 10 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-stone-100 text-stone-700'
                      }`}>
                        Merma: {roast.weightLossPercentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="bg-stone-50 p-3 rounded text-xs space-y-2 border border-stone-100">
                      <div>
                        <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Café Verde</span>
                        <span className="font-bold text-black">{green?.variety || 'Desconocido'}</span>
                        <div className="text-[10px] text-stone-500">{green?.clientName} - {green?.origin}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                        <div>
                          <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Entrada</span>
                          <span className="font-medium text-stone-600">{roast.greenQtyKg.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="block text-stone-400 text-[10px] uppercase tracking-wider">Salida</span>
                          <span className="font-bold text-black">{roast.roastedQtyKg.toFixed(2)} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block border border-stone-200 bg-white overflow-x-auto">
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
          {activeTab === 'history' && sortedRoasts.length > 0 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 uppercase tracking-widest">Mostrar</span>
                <select
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-stone-200 bg-white px-2 py-1 text-xs font-bold uppercase tracking-widest focus:border-black outline-none"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-stone-400 uppercase tracking-widest">registros</span>
              </div>
              <div className="flex items-center gap-3 justify-between md:justify-end">
                <span className="text-stone-500 font-mono">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2 py-1 border border-stone-200 text-stone-500 hover:border-black hover:text-black disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-500 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 border border-stone-200 text-stone-500 hover:border-black hover:text-black disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-500 transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Roast Modal */}
      {showNewRoastModal && (
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

            <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
              {/* Green Coffee Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Seleccionar Café Verde</label>
                
                {/* Search Input */}
                <div className="relative mb-2">
                   <Search className="w-4 h-4 absolute left-0 top-3 text-stone-400" />
                   <input
                     type="text"
                     className="w-full py-2 pl-7 bg-transparent border-b border-stone-100 dark:border-stone-800 focus:border-stone-300 dark:focus:border-stone-600 focus:ring-0 text-sm transition-colors placeholder:text-stone-300 dark:text-white dark:placeholder:text-stone-600"
                     placeholder="Buscar por variedad o cliente..."
                     value={greenCoffeeSearch}
                     onChange={(e) => setGreenCoffeeSearch(e.target.value)}
                   />
                </div>

                <select 
                  className="w-full py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-medium transition-colors px-0 text-xl placeholder:text-stone-300 dark:text-white"
                  value={selectedGreenCoffeeId || ''}
                  onChange={(e) => setSelectedGreenCoffeeId(e.target.value)}
                >
                  <option value="" className="dark:bg-stone-900">-- Seleccionar Origen --</option>
                  {filteredGreenCoffees.map(coffee => (
                    <option key={coffee.id} value={coffee.id} className="dark:bg-stone-900">
                      {coffee.variety} - {coffee.clientName} ({coffee.quantityKg}kg)
                    </option>
                  ))}
                </select>
                {filteredGreenCoffees.length === 0 && (
                   <p className="text-xs text-red-500 mt-1">No se encontraron cafés que coincidan con la búsqueda.</p>
                )}
              </div>

              {/* Weights */}
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Peso Verde (Kg)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full py-3 pl-8 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-black text-2xl transition-colors px-0 placeholder:text-stone-200 dark:text-white"
                      value={greenQtyKg || ''}
                      onChange={(e) => setGreenQtyKg(Number(e.target.value))}
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
                      value={roastedQtyKg || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setRoastedQtyKg(isNaN(val) ? 0 : val);
                      }}
                      placeholder="0.00"
                    />
                    <Coffee className="w-5 h-5 absolute left-0 top-4 text-stone-300 dark:text-stone-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  </div>
                </div>
              </div>

              {/* Shrinkage Indicator */}
              <div className="py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 tracking-widest">Merma Estimada</span>
                <span className={`text-4xl font-black ${shrinkage > 20 ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>
                  {shrinkage.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Perfil / Notas</label>
                  <input 
                    type="text" 
                    className="w-full py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-medium transition-colors px-0 placeholder:text-stone-300 dark:text-white"
                    placeholder="Ej. Tueste Medio"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-400 dark:text-stone-500">Orden Relacionada</label>
                  <select 
                    className="w-full py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 font-medium transition-colors px-0 placeholder:text-stone-300 dark:text-white"
                    value={selectedOrderId || ''}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                  >
                    <option value="" className="dark:bg-stone-900">-- Ninguna --</option>
                    {pendingOrders.map(order => (
                      <option key={order.id} value={order.id} className="dark:bg-stone-900">
                        #{order.id.slice(0, 8)} - {order.clientName}
                      </option>
                    ))}
                  </select>
                  {selectedOrderForRoast && (
                    <div className="mt-4 text-[11px] text-stone-600 dark:text-stone-400 border-l-2 border-black dark:border-white pl-3 py-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm uppercase tracking-tight">
                          {selectedOrderForRoast?.clientName}
                        </span>
                        <span className="font-mono text-xs">
                          {selectedOrderForRoast.quantityKg.toFixed(2)} Kg
                        </span>
                      </div>
                      <div className="mt-1 text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px]">
                        {selectedOrderForRoast?.orderLines && selectedOrderForRoast.orderLines.length > 0 ? 'Múltiples cafés' : selectedOrderForRoast.variety}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-6 pt-8 mt-4">
                <button 
                  onClick={() => setShowNewRoastModal(false)}
                  className="px-8 py-4 text-stone-400 dark:text-stone-500 hover:text-black dark:hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRoast}
                  disabled={!selectedGreenCoffeeId || greenQtyKg <= 0}
                  className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-stone-100 font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowDailySummary(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-lg border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 bg-black dark:bg-stone-950 text-white border-b border-stone-800 shrink-0 sticky top-0 z-10">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6" /> Resumen Diario
              </h3>
              <button 
                onClick={() => setShowDailySummary(false)}
                className="p-2 hover:bg-stone-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto scrollbar-hide">
              <div className="text-center mb-8">
                <p className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{today}</p>
                <h4 className="text-3xl font-black uppercase tracking-tight dark:text-white">Reporte Diario</h4>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="font-medium text-stone-600 dark:text-stone-400">Total Batches</span>
                  <span className="font-bold text-xl dark:text-white">{roastsToday.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="font-medium text-stone-600 dark:text-stone-400">Total Café Verde</span>
                  <span className="font-bold text-xl dark:text-white">{totalGreenToday.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="font-medium text-stone-600 dark:text-stone-400">Total Tostado</span>
                  <span className="font-bold text-xl dark:text-white">{totalRoastedToday.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="font-medium text-stone-600 dark:text-stone-400">Merma Promedio</span>
                  <span className="font-bold text-xl dark:text-white">{avgShrinkage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Breakdown by Order */}
              <div className="mb-8">
                <h5 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">Desglose por Pedido</h5>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                    {Object.entries(roastsByOrder).map(([client, stats]) => (
                      <div key={client} className="flex justify-between items-center text-sm border-b border-stone-100 dark:border-stone-800 pb-2 last:border-0">
                          <div>
                              <div className="font-bold dark:text-white">{client}</div>
                              <div className="text-xs text-stone-400 dark:text-stone-500">
                                  {stats.batches} batches • {Array.from(stats.varieties).join(', ')}
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="font-bold dark:text-white">{stats.roasted.toFixed(2)} kg</div>
                              <div className="text-xs text-stone-400 dark:text-stone-500">de {stats.green.toFixed(2)} kg</div>
                          </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider rounded transition-colors"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoastingView;