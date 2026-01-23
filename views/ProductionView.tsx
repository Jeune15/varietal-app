import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, getSupabase } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Order, 
  RoastedStock, 
  RetailBagStock, 
  ProductionActivityType, 
  ProductionActivity,
  ProductionItem,
  Roast
} from '../types';
import { 
  CheckCircle, 
  Truck, 
  ShoppingBag, 
  Scissors, 
  BarChart2,
  X,
  Package,
  Container,
  Activity,
  Settings2,
  Plus,
  AlertCircle
} from 'lucide-react';

interface ModeCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, desc, icon, onClick }) => (
  <button onClick={onClick} className="group flex flex-col p-8 bg-white border border-stone-200 hover:border-black transition-all text-left relative overflow-hidden h-full dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600">
    <div className="bg-black text-white p-4 w-fit mb-6 group-hover:scale-105 transition-transform dark:bg-stone-800 dark:text-stone-200">
      {icon}
    </div>
    <h4 className="text-xl font-black text-black mb-3 tracking-tight uppercase group-hover:underline decoration-2 underline-offset-4 dark:text-white">{title}</h4>
    <p className="text-xs text-stone-500 leading-relaxed font-bold uppercase tracking-wide dark:text-stone-400">{desc}</p>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="bg-black text-white p-1 dark:bg-stone-800 dark:text-stone-200">
        <Plus className="w-4 h-4" />
      </div>
    </div>
  </button>
);

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  stocks: RoastedStock[];
  setStocks: React.Dispatch<React.SetStateAction<RoastedStock[]>>;
  retailBags: RetailBagStock[];
  setRetailBags: React.Dispatch<React.SetStateAction<RetailBagStock[]>>;
  setHistory: React.Dispatch<React.SetStateAction<ProductionActivity[]>>;
  productionInventory: ProductionItem[];
}

const ProductionView: React.FC<Props> = ({ 
  orders, setOrders, stocks, setStocks, retailBags, setRetailBags, setHistory, productionInventory
}) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  // Tabs State
  const [activeTab, setActiveTab] = useState<'activities' | 'inventory'>('activities');

  // Activity State
  const [activeMode, setActiveMode] = useState<ProductionActivityType | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [productionValue, setProductionValue] = useState(0); 
  const [additionalInfo, setAdditionalInfo] = useState({ 
    bagsUsed: 0, 
    isGrainPro: false, 
    packagingType: 'bags' as 'bags' | 'grainpro',
    merma: 0, 
    bagType: '250g' as '250g' | '500g' | '1kg',
    shippingCost: 0,
    markOrderReady: false
  });

  // Inventory Modal State
  const [showProdModal, setShowProdModal] = useState(false);
  const [prodForm, setProdForm] = useState<Partial<ProductionItem>>({
    name: '',
    type: 'unit',
    quantity: 0,
    minThreshold: 10,
    format: undefined
  });

  const resetForm = () => {
    setActiveMode(null);
    setSelectedOrderId('');
    setSelectedStockId('');
    setProductionValue(0);
    setAdditionalInfo({ 
      bagsUsed: 0, 
      isGrainPro: false, 
      packagingType: 'bags',
      merma: 0, 
      bagType: '250g',
      shippingCost: 0,
      markOrderReady: false
    });
  };

  const history = useLiveQuery(() => db.history.orderBy('date').reverse().limit(50).toArray() as Promise<ProductionActivity[]>) || [];
  const roasts = useLiveQuery(() => db.roasts.toArray() as Promise<Roast[]>) || [];

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!activeMode) return;

    if (activeMode === 'Armado de Bolsas Retail') {
      const selectedStock = stocks.find(s => s.id === selectedStockId);
      if (!selectedStock) return;

      const bagSizeKg = additionalInfo.bagType === '250g' ? 0.25 : additionalInfo.bagType === '500g' ? 0.5 : 1;
      const reductionKg = productionValue * bagSizeKg;
      
      if (reductionKg > selectedStock.remainingQtyKg) {
        showToast(`No hay suficiente stock granel. Máximo posible: ${Math.floor(selectedStock.remainingQtyKg / bagSizeKg)} bolsas.`, 'error');
        return;
      }

      // Update Stock
      const newRemaining = selectedStock.remainingQtyKg - reductionKg;
      
      if (newRemaining <= 0.001) {
        await db.roastedStocks.delete(selectedStock.id);
        if (getSupabase()) {
            await getSupabase().from('roastedStocks').delete().eq('id', selectedStock.id);
        }
      } else {
        const updatedStock = { ...selectedStock, remainingQtyKg: newRemaining };
        await db.roastedStocks.update(selectedStock.id, { remainingQtyKg: updatedStock.remainingQtyKg });
        await syncToCloud('roastedStocks', updatedStock);
      }

      // Update Retail Bags
      const existingBag = retailBags.find(
        b =>
          b.coffeeName === selectedStock.variety &&
          b.type === additionalInfo.bagType &&
          b.roastId === selectedStock.roastId
      );
      
      if (existingBag) {
        const updatedBag: RetailBagStock = { ...existingBag, quantity: existingBag.quantity + productionValue };
        await db.retailBags.update(existingBag.id, { quantity: updatedBag.quantity });
        await syncToCloud('retailBags', updatedBag);
      } else {
        const roast = roasts.find(r => r.id === selectedStock.roastId);
        const newBag: RetailBagStock = { 
          id: Math.random().toString(36).substr(2, 9), 
          coffeeName: selectedStock.variety, 
          type: additionalInfo.bagType, 
          quantity: productionValue,
          clientName: selectedStock.clientName,
          roastDate: roast?.roastDate,
          roastId: selectedStock.roastId
        };
        await db.retailBags.add(newBag);
        await syncToCloud('retailBags', newBag);
      }

      // Automatically deduct from Production Inventory (Bags)
      const linkedItems = productionInventory.filter(item => item.format === additionalInfo.bagType && item.type === 'unit');
      for (const item of linkedItems) {
        const newQty = Math.max(0, item.quantity - productionValue);
        await db.productionInventory.update(item.id, { quantity: newQty });
        await syncToCloud('productionInventory', { ...item, quantity: newQty });
      }
    }

    if (activeMode === 'Selección de Café') {
      const selectedStock = stocks.find(s => s.id === selectedStockId);
      if (!selectedStock) return;
      const weightReductionKg = additionalInfo.merma / 1000;
      if (weightReductionKg > selectedStock.remainingQtyKg) {
        showToast("La merma no puede ser mayor al stock restante.", 'error');
        return;
      }
      
      const newRemaining = selectedStock.remainingQtyKg - weightReductionKg;

      if (newRemaining <= 0.001) {
         await db.roastedStocks.delete(selectedStock.id);
         if (getSupabase()) {
             await getSupabase().from('roastedStocks').delete().eq('id', selectedStock.id);
         }
      } else {
        const updatedStock = { 
          ...selectedStock, 
          isSelected: true, 
          mermaGrams: selectedStock.mermaGrams + additionalInfo.merma, 
          remainingQtyKg: newRemaining
        };
        await db.roastedStocks.update(selectedStock.id, updatedStock);
        await syncToCloud('roastedStocks', updatedStock);
      }
    }

    if (activeMode === 'Armado de Pedido') {
      const order = orders.find(o => o.id === selectedOrderId);
      const selectedStock = stocks.find(s => s.id === selectedStockId);

      if (order && selectedStock) {
        const isServiceOrder = order.type === 'Servicio de Tueste';
        const markReady = additionalInfo.markOrderReady;
        const requestedQty = productionValue;

        if (!requestedQty || requestedQty <= 0) {
          showToast("Ingresa la cantidad a despachar en Kg.", 'error');
          return;
        }

        const stockAvailable = selectedStock.remainingQtyKg;
        let deductionQty = requestedQty;

        if (!isServiceOrder) {
          const currentFulfilled = order.fulfilledKg || 0;
          const remainingOrderQty = Math.max(0, order.quantityKg - currentFulfilled);

          if (remainingOrderQty <= 0.001) {
            showToast("Este pedido ya está completamente armado.", 'info');
            return;
          }

          const maxPossible = Math.min(stockAvailable, remainingOrderQty);

          if (requestedQty > maxPossible + 0.001) {
            showToast(
              `Solo se despacharán ${maxPossible.toFixed(2)} Kg por límite de stock o pedido.`,
              'info'
            );
          }

          deductionQty = Math.min(requestedQty, maxPossible);
        } else {
          if (requestedQty > stockAvailable + 0.001) {
            showToast(
              `Solo se despacharán ${stockAvailable.toFixed(2)} Kg por límite de stock disponible.`,
              'info'
            );
          }
          deductionQty = Math.min(requestedQty, stockAvailable);
        }

        if (deductionQty <= 0) {
          showToast("No hay cantidad válida para despachar.", 'error');
          return;
        }

        const newRemaining = selectedStock.remainingQtyKg - deductionQty;
        
        if (newRemaining <= 0.001) {
           await db.roastedStocks.delete(selectedStock.id);
           if (getSupabase()) {
               await getSupabase().from('roastedStocks').delete().eq('id', selectedStock.id);
           }
        } else {
           const updatedStock = { 
            ...selectedStock, 
            remainingQtyKg: newRemaining
           };
           await db.roastedStocks.update(selectedStock.id, { remainingQtyKg: updatedStock.remainingQtyKg });
           await syncToCloud('roastedStocks', updatedStock);
        }

        const bagsUsed = additionalInfo.bagsUsed;

        const updates: Partial<Order> = { 
          bagsUsed: (order.bagsUsed || 0) + bagsUsed, 
          packagingType: additionalInfo.packagingType,
          fulfilledFromStockId: selectedStock.id
        };

        const newFulfilled = (order.fulfilledKg || 0) + deductionQty;
        updates.fulfilledKg = newFulfilled;

        if (!isServiceOrder) {
          if (order.quantityKg > 0) {
            const progressPercentage = Math.round((newFulfilled / order.quantityKg) * 100);
            updates.progress = Number.isNaN(progressPercentage) ? 0 : Math.min(100, Math.max(0, progressPercentage));
          }

          if (newFulfilled >= order.quantityKg - 0.01) {
            updates.status = 'Listo para Despacho';
            updates.progress = 100;
          } else if (order.status === 'Pendiente') {
            updates.status = 'En Producción';
          }
        } else {
          if (markReady) {
            updates.status = 'Listo para Despacho';
            updates.progress = 100;
          } else if (order.status === 'Pendiente') {
            updates.status = 'En Producción';
          }
        }
        
        await db.orders.update(order.id, updates);
        await syncToCloud('orders', { ...order, ...updates });
      } else if (order) {
          showToast("Debe seleccionar un lote de café para envasar.", 'error');
          return;
      }
    }

    if (activeMode === 'Despacho de Pedido') {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        const shippingCost = additionalInfo.shippingCost || 0;
        const updates = { 
          status: 'Enviado' as const, 
          shippedDate: new Date().toISOString(),
          shippingCost
        };
        await db.orders.update(order.id, updates);
        await syncToCloud('orders', { ...order, ...updates });

        // Automatically create an Expense if shipping cost > 0
        if (shippingCost > 0) {
          const newExpense = {
            id: Math.random().toString(36).substr(2, 9),
            reason: `Envío Pedido ${order.clientName}`,
            amount: shippingCost,
            date: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            relatedOrderId: order.id
          };
          await db.expenses.add(newExpense);
          await syncToCloud('expenses', newExpense);
        }
      }
    }

    const orderForActivity = orders.find(o => o.id === selectedOrderId) || null;
    const stockForActivity = stocks.find(s => s.id === selectedStockId) || null;

    const newActivity: ProductionActivity = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeMode,
      date: new Date().toISOString(),
      details: { 
        selectedOrderId, 
        selectedStockId, 
        productionValue, 
        ...additionalInfo,
        orderId: orderForActivity?.id,
        orderType: orderForActivity?.type,
        orderClientName: orderForActivity?.clientName,
        stockVariety: stockForActivity?.variety,
        stockClientName: stockForActivity?.clientName
      }
    };
    
    await db.history.add(newActivity);
    await syncToCloud('history', newActivity);

    setHistory(prev => [...prev, newActivity]);
    
    showToast('Operación registrada exitosamente', 'success');
    
    if (activeMode === 'Armado de Pedido') {
      setSelectedStockId('');
      setProductionValue(0);
      setAdditionalInfo(prev => ({
        ...prev,
        bagsUsed: 0,
        merma: 0,
        shippingCost: 0
      }));
    } else {
      resetForm();
    }
  };

  const handleSaveProdItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!prodForm.name) return;
    
    const newItem: ProductionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: prodForm.name,
      type: prodForm.type as 'unit' | 'rechargeable',
      quantity: prodForm.quantity || 0,
      minThreshold: prodForm.minThreshold || 0,
      format: prodForm.type === 'unit' ? prodForm.format : undefined
    };

    await db.productionInventory.add(newItem);
    await syncToCloud('productionInventory', newItem);
    setShowProdModal(false);
    setProdForm({ name: '', type: 'unit', quantity: 0, minThreshold: 10, format: undefined });
  };

  const updateItemQuantity = async (id: string, newQty: number) => {
    if (!canEdit) return;
    const item = productionInventory.find(i => i.id === id);
    if (!item) return;
    
    // Validate bounds for percentage
    let validatedQty = newQty;
    if (item.type === 'rechargeable') {
      if (validatedQty < 0) validatedQty = 0;
      if (validatedQty > 100) validatedQty = 100;
    } else {
      if (validatedQty < 0) validatedQty = 0;
    }

    const updated = { ...item, quantity: validatedQty };
    await db.productionInventory.update(id, { quantity: validatedQty });
    await syncToCloud('productionInventory', updated);
  };

  const selectedOrderSummary = orders.find(o => o.id === selectedOrderId) || null;
  const selectedStockSummary = stocks.find(s => s.id === selectedStockId) || null;

  return (
    <>
    <div className="space-y-12 pb-48">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black tracking-tighter uppercase">Producción</h3>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Centro de Operaciones</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 md:flex-none flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border ${
              activeTab === 'activities' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
            }`}
          >
            <Activity className="w-4 h-4" /> Actividades
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 md:flex-none flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border ${
              activeTab === 'inventory' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
            }`}
          >
            <Settings2 className="w-4 h-4" /> Inventario
          </button>
        </div>
      </div>

      {activeTab === 'activities' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!canEdit ? (
            <div className="border border-dashed border-stone-300 p-12 text-center">
              <p className="text-stone-400 font-medium uppercase tracking-wide text-sm">
                Solo usuarios autorizados pueden registrar actividades de producción
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModeCard title="Armado de Pedido" desc="Envasado y preparación final de pedidos." icon={<BarChart2 className="w-6 h-6" />} onClick={() => setActiveMode('Armado de Pedido')} />
                <ModeCard title="Selección de Café" desc="Control de mermas y selección técnica." icon={<Scissors className="w-6 h-6" />} onClick={() => setActiveMode('Selección de Café')} />
                <ModeCard title="Bolsas Retail" desc="Conversión a empaques de venta unitaria." icon={<ShoppingBag className="w-6 h-6" />} onClick={() => setActiveMode('Armado de Bolsas Retail')} />
                <ModeCard title="Despacho" desc="Salida de pedidos listos a logística." icon={<Truck className="w-6 h-6" />} onClick={() => setActiveMode('Despacho de Pedido')} />
              </div>

              {activeMode && createPortal(
                <div 
                  className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
                  onClick={resetForm}
                >
                  <div 
                    className="bg-white dark:bg-stone-900 w-full max-w-2xl border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-black dark:bg-stone-950 text-white p-4 border-b border-stone-800 shrink-0 sticky top-0 z-10 flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="text-lg font-black tracking-tighter uppercase">{activeMode}</h4>
                        <p className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em]">Formulario de Actividad</p>
                      </div>
                      <button onClick={resetForm} className="text-white hover:text-stone-300 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleAction} className="p-6 space-y-6 overflow-y-auto">
                      {['Armado de Pedido', 'Despacho de Pedido'].includes(activeMode) && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Seleccionar Pedido</label>
                          <select required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                            <option value="">-- Elija un pedido activo --</option>
                            {orders.filter(o => {
                              if (activeMode === 'Despacho de Pedido') {
                                const hasPackagingForSale = o.type === 'Venta Café Tostado' && (o.bagsUsed || 0) > 0;
                                if (o.type === 'Venta Café Tostado') {
                                  return o.status === 'Listo para Despacho' && hasPackagingForSale;
                                }
                                return o.status === 'Listo para Despacho';
                              }
                              if (activeMode === 'Armado de Pedido') {
                                if (o.type === 'Servicio de Tueste') {
                                  return o.status === 'En Producción' || o.status === 'Pendiente' || o.status === 'Listo para Despacho';
                                }
                                return o.status === 'En Producción' || o.status === 'Pendiente';
                              }
                              return false;
                            }).map(o => (
                              <option key={o.id} value={o.id}>
                                {o.clientName} — {o.orderLines && o.orderLines.length > 0 ? 'Múltiples cafés' : o.variety} ({o.quantityKg}Kg) — {o.type === 'Servicio de Tueste' ? 'Servicio' : 'Venta'} — [{o.status}]
                              </option>
                            ))}
                          </select>
                          {stocks.filter(s => s.remainingQtyKg > 0).filter(s => {
                            if (activeMode === 'Armado de Pedido' && selectedOrderId) {
                              const order = orders.find(o => o.id === selectedOrderId);
                              if (order) {
                                if (order.type === 'Servicio de Tueste') return true;
                                return s.clientName === order.clientName || s.clientName === 'Stock';
                              }
                            }
                            return true;
                          }).length === 0 && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-medium dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                              No hay café tostado disponible para este pedido. Si tiene café verde en silos, asegúrese de tostarlo primero en la sección "Tueste".
                            </div>
                          )}
                        </div>
                      )}
                      {selectedOrderSummary && (
                        <div className="bg-stone-50 border border-stone-200 p-4 flex flex-col gap-2 dark:bg-stone-900 dark:border-stone-800">
                          <div className="flex justify-between text-xs">
                            <div>
                              <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Pedido</p>
                              <p className="font-bold text-black dark:text-white">
                                {selectedOrderSummary.clientName}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                {selectedOrderSummary.type === 'Servicio de Tueste' ? 'Servicio de Tueste' : 'Venta Café Tostado'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Cantidad Pedido</p>
                              <p className="font-black text-sm dark:text-white">
                                {(() => {
                                  const order = selectedOrderSummary;
                                  const displayQty =
                                    order.type === 'Servicio de Tueste' && typeof order.serviceRoastedQtyKg === 'number'
                                      ? order.serviceRoastedQtyKg
                                      : order.quantityKg;
                                  return `${displayQty.toFixed(2)} Kg`;
                                })()}
                              </p>
                              {typeof selectedOrderSummary.fulfilledKg === 'number' && (
                                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                  Despachado: {selectedOrderSummary.fulfilledKg.toFixed(2)} Kg
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedOrderSummary.orderLines && selectedOrderSummary.orderLines.length > 0 && (
                            <div className="border-t border-stone-100 pt-3 mt-2 dark:border-stone-800">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 dark:text-stone-500">
                                Detalle del pedido
                              </p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {selectedOrderSummary.orderLines.map(line => (
                                  <p key={line.id} className="text-[11px] text-stone-600 dark:text-stone-400">
                                    {line.variety} • {line.quantityKg.toFixed(2)} Kg
                                    {line.grindType ? ` • ${line.grindType === 'molido' ? 'Molido' : 'Grano'}` : ''}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {(selectedOrderSummary.deliveryAddress || selectedOrderSummary.deliveryAddressDetail) && (
                            <div className="border-t border-stone-100 pt-3 mt-2 flex justify-between gap-4 text-xs dark:border-stone-800">
                              <div>
                                <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Dirección de envío</p>
                                <p className="font-medium text-black dark:text-white">
                                  {selectedOrderSummary.deliveryAddress}
                                </p>
                                {selectedOrderSummary.deliveryAddressDetail && (
                                  <p className="text-[11px] text-stone-500 mt-1 dark:text-stone-400">
                                    {selectedOrderSummary.deliveryAddressDetail}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Entrega</p>
                                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                  {selectedOrderSummary.defaultGrindType === 'molido' ? 'Molido' : 'Grano'}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedStockSummary && (
                            <div className="flex justify-between items-end text-xs border-t border-stone-100 pt-3 mt-2 dark:border-stone-800">
                              <div>
                                <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Lote Tostado</p>
                                <p className="font-bold text-black dark:text-white">
                                  {selectedStockSummary.clientName} — {selectedStockSummary.variety}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Disponible</p>
                                <p className="font-black text-sm dark:text-white">
                                  {selectedStockSummary.remainingQtyKg.toFixed(2)} Kg
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {['Selección de Café', 'Armado de Bolsas Retail', 'Armado de Pedido'].includes(activeMode) && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Existencias de Café (Origen)</label>
                          <select required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" value={selectedStockId} onChange={e => setSelectedStockId(e.target.value)}>
                            <option value="">-- Elija un lote tostado --</option>
                            {stocks
                              .filter(s => s.remainingQtyKg > 0)
                              .filter(s => {
                                if (activeMode === 'Armado de Pedido' && selectedOrderId) {
                                  return true;
                                }
                                return true;
                              })
                              .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.clientName} — {s.variety} — Disp: {s.remainingQtyKg.toFixed(2)} Kg
                                {s.isSelected ? ' [Seleccionado]' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {activeMode === 'Armado de Pedido' && (
                        <div className="space-y-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Tipo de Carga</label>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setAdditionalInfo({ ...additionalInfo, packagingType: 'grainpro' })}
                                className={`p-6 border flex flex-col items-center justify-center gap-3 transition-all ${
                                  additionalInfo.packagingType === 'grainpro' 
                                    ? 'bg-black text-white border-black dark:bg-stone-800 dark:border-stone-700' 
                                    : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                                }`}
                              >
                                <Container className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-widest">Grain Pro</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAdditionalInfo({ ...additionalInfo, packagingType: 'bags' })}
                                className={`p-6 border flex flex-col items-center justify-center gap-3 transition-all ${
                                  additionalInfo.packagingType === 'bags' 
                                    ? 'bg-black text-white border-black dark:bg-stone-800 dark:border-stone-700' 
                                    : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                                }`}
                              >
                                <Package className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-widest">Bolsas</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">
                              Cantidad a despachar (Kg)
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              required
                              className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500"
                              value={productionValue || ''}
                              onChange={e => setProductionValue(parseFloat(e.target.value) || 0)}
                              placeholder="Ej: 50"
                            />
                            {selectedOrderSummary && selectedOrderSummary.type !== 'Servicio de Tueste' && (
                              <p className="text-[10px] text-stone-500 font-medium dark:text-stone-400">
                                Pendiente del pedido:{' '}
                                {Math.max(
                                  0,
                                  selectedOrderSummary.quantityKg - (selectedOrderSummary.fulfilledKg || 0)
                                ).toFixed(2)}{' '}
                                Kg
                              </p>
                            )}
                          </div>

                          {(additionalInfo.packagingType === 'bags' || additionalInfo.packagingType === 'grainpro') && (
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">
                                {additionalInfo.packagingType === 'grainpro' ? 'Cantidad de Bolsas GrainPro' : 'Bolsas Utilizadas'}
                              </label>
                              <input 
                                type="number" 
                                min="1" 
                                step="1"
                                required
                                className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" 
                                value={additionalInfo.bagsUsed || ''} 
                                onChange={e => setAdditionalInfo({...additionalInfo, bagsUsed: parseInt(e.target.value) || 0})}
                                placeholder="Ingrese cantidad..."
                              />
                            </div>
                          )}
                          
                          {selectedOrderId && orders.find(o => o.id === selectedOrderId)?.type === 'Servicio de Tueste' && (
                            <div className="flex items-center gap-3">
                              <input
                                id="mark-ready"
                                type="checkbox"
                                className="w-4 h-4 border-stone-300 dark:border-stone-700 dark:bg-stone-900"
                                checked={additionalInfo.markOrderReady}
                                onChange={e => setAdditionalInfo({ ...additionalInfo, markOrderReady: e.target.checked })}
                              />
                              <label htmlFor="mark-ready" className="text-xs font-bold text-stone-700 uppercase tracking-widest dark:text-stone-300">
                                Marcar pedido listo para despacho
                              </label>
                            </div>
                          )}
                          
                          <div className="bg-stone-50 p-6 border border-stone-200 flex gap-4 items-center dark:bg-stone-900 dark:border-stone-800">
                              <CheckCircle className="w-5 h-5 text-black dark:text-white" />
                              <p className="text-xs text-stone-600 font-medium leading-relaxed dark:text-stone-400">
                                Al guardar, se descontará café del lote seleccionado y se actualizará el estado del pedido. 
                                Los pedidos de venta se marcarán como Listo para Despacho automáticamente; los servicios de tueste pueden registrarse en varias tandas antes de despachar.
                              </p>
                          </div>
                        </div>
                      )}
                      {activeMode === 'Selección de Café' && (
                        <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Merma Detectada (Gramos)</label><input type="number" step="0.1" min="0" required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" value={additionalInfo.merma} onChange={e => setAdditionalInfo({...additionalInfo, merma: parseFloat(e.target.value)})} /></div>
                      )}
                      {activeMode === 'Armado de Bolsas Retail' && (
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Formato Bolsa</label><select className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold appearance-none rounded-none dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" value={additionalInfo.bagType} onChange={e => setAdditionalInfo({...additionalInfo, bagType: e.target.value as any})}>
                            <option value="250g">250g</option><option value="500g">500g</option><option value="1kg">1kg</option>
                          </select></div>
                          <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Unidades</label><input type="number" min="1" step="1" required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" value={productionValue} onChange={e => setProductionValue(parseInt(e.target.value) || 0)} /></div>
                        </div>
                      )}
                      {activeMode === 'Despacho de Pedido' && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Costo de Envío</label>
                            <div className="relative">
                              <span className="absolute left-4 top-4 text-stone-400 font-bold dark:text-stone-500">$</span>
                              <input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                className="w-full pl-8 pr-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500" 
                                value={additionalInfo.shippingCost || ''} 
                                onChange={e => setAdditionalInfo({...additionalInfo, shippingCost: parseFloat(e.target.value) || 0})}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="bg-stone-50 p-6 border border-stone-200 flex items-start gap-4 dark:bg-stone-900 dark:border-stone-800">
                            <Truck className="w-5 h-5 text-black mt-0.5 dark:text-white" />
                            <p className="text-xs text-stone-600 font-medium leading-relaxed dark:text-stone-400">
                              Confirma el envío del pedido seleccionado. Si ingresas un costo de envío, se generará automáticamente un registro en Gastos.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={resetForm}
                          className="px-6 py-3 border border-stone-200 text-stone-500 font-bold uppercase tracking-[0.2em] text-xs hover:border-black hover:text-black dark:border-stone-700 dark:text-stone-400 dark:hover:border-white dark:hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="px-6 py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-stone-800 dark:bg-white dark:text-black dark:hover:bg-stone-200"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              , document.body)}
            </>
          )}

          <div className="bg-white border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-black dark:text-white" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white">
                    Historial de Actividades de Producción
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] dark:text-stone-500">
                  Últimas {history.length} entradas
                </span>
              </div>
              {history.length === 0 ? (
                <div className="px-6 py-8 text-center text-xs text-stone-400 font-medium uppercase tracking-widest dark:text-stone-500">
                  Sin actividades registradas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 dark:bg-stone-950 dark:border-stone-800">
                      <tr>
                        <th className="px-6 py-3 font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Fecha</th>
                        <th className="px-6 py-3 font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Actividad</th>
                        <th className="px-6 py-3 font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Cliente</th>
                        <th className="px-6 py-3 font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Lote / Café</th>
                        <th className="px-6 py-3 font-bold text-stone-500 uppercase tracking-widest text-right dark:text-stone-400">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {history.map((a) => {
                        const details: any = a.details || {};
                        const date = a.date ? a.date.split('T')[0] : '';
                        const client = details.orderClientName || '—';
                        const stock = details.stockVariety || details.stockClientName || '—';
                        let detailText = '';

                        if (a.type === 'Armado de Pedido') {
                          if (typeof details.productionValue === 'number' && !Number.isNaN(details.productionValue)) {
                            detailText = `${details.productionValue.toFixed(2)} Kg despachados`;
                          }
                          if (details.packagingType === 'grainpro' && details.bagsUsed) {
                            detailText += detailText ? ` · GrainPro x${details.bagsUsed}` : `GrainPro x${details.bagsUsed}`;
                          } else if (details.packagingType === 'bags' && details.bagsUsed) {
                            detailText += detailText ? ` · Bolsas x${details.bagsUsed}` : `Bolsas x${details.bagsUsed}`;
                          }
                        } else if (a.type === 'Selección de Café') {
                          if (typeof details.merma === 'number' && !Number.isNaN(details.merma)) {
                            detailText = `${details.merma.toFixed(0)} g merma`;
                          }
                        } else if (a.type === 'Armado de Bolsas Retail') {
                          if (typeof details.productionValue === 'number' && !Number.isNaN(details.productionValue)) {
                            const bag = details.bagType || '';
                            detailText = `${details.productionValue.toFixed(0)} uds ${bag}`;
                          }
                        } else if (a.type === 'Despacho de Pedido') {
                          if (typeof details.shippingCost === 'number' && details.shippingCost > 0) {
                            detailText = `Envío $${details.shippingCost.toFixed(2)}`;
                          }
                        }

                        if (!detailText) {
                          detailText = '—';
                        }

                        return (
                          <tr key={a.id} className="hover:bg-stone-50 transition-colors dark:hover:bg-stone-800/50">
                            <td className="px-6 py-3 border-r border-stone-100 font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300">{date}</td>
                            <td className="px-6 py-3 border-r border-stone-100 font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300">{a.type}</td>
                            <td className="px-6 py-3 border-r border-stone-100 font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300">{client}</td>
                            <td className="px-6 py-3 border-r border-stone-100 font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300">{stock}</td>
                            <td className="px-6 py-3 text-right font-medium text-stone-700 dark:text-stone-300">{detailText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Production Inventory Table */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-black text-white p-3">
                <Settings2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-black tracking-tight uppercase">Inventario de Producción</h3>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">Insumos y Materiales</p>
              </div>
            </div>
            {canEdit && (
              <button 
                onClick={() => setShowProdModal(true)}
                className="bg-black hover:bg-stone-800 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nuevo Producto
              </button>
            )}
          </div>

          {/* Mobile Inventory Cards */}
          <div className="lg:hidden space-y-4">
            {productionInventory.length === 0 ? (
               <div className="p-8 text-center text-stone-400 text-xs font-mono uppercase tracking-widest bg-white border border-stone-200 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-500">
                  No hay insumos registrados
               </div>
            ) : (
               productionInventory.map(item => (
                 <div key={item.id} className="bg-white border border-stone-200 p-5 space-y-4 shadow-sm dark:bg-stone-900 dark:border-stone-800">
                    <div className="flex justify-between items-start gap-4">
                       <span className="font-black text-black text-sm uppercase tracking-tight dark:text-white">{item.name}</span>
                       {item.type === 'rechargeable' ? (
                          <span className="text-[9px] font-bold bg-stone-100 text-stone-600 px-2 py-1 border border-stone-200 uppercase tracking-wider rounded-sm dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700">Recargable</span>
                       ) : (
                          <div className="flex flex-col items-end gap-1">
                             <span className="text-[9px] font-bold bg-black text-white px-2 py-1 border border-black uppercase tracking-wider rounded-sm dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200">Unidad</span>
                             {item.format && <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider dark:text-stone-500">{item.format}</span>}
                          </div>
                       )}
                    </div>
                    
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest dark:text-stone-500">Existencias</span>
                          <span className="text-xs font-black text-black dark:text-white">
                             {item.quantity}{item.type === 'rechargeable' ? '%' : ' Uds'}
                          </span>
                       </div>
                       
                       {item.type === 'rechargeable' ? (
                          <div className="flex items-center gap-4">
                             <input 
                               type="range" 
                               min="0" 
                               max="100" 
                               value={item.quantity} 
                               disabled={!canEdit}
                               onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                               className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50 dark:bg-stone-700 dark:accent-white"
                             />
                          </div>
                       ) : (
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => updateItemQuantity(item.id, Math.max(0, item.quantity - 1))}
                               disabled={!canEdit || item.quantity <= 0}
                               className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-black font-bold rounded-full disabled:opacity-50 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white"
                             >
                               -
                             </button>
                             <input 
                               type="number" 
                               value={item.quantity}
                               disabled={!canEdit}
                               onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                               className="flex-1 py-2 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold text-black text-center disabled:bg-stone-50 dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500"
                             />
                             <button 
                               onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                               disabled={!canEdit}
                               className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-black font-bold rounded-full disabled:opacity-50 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white"
                             >
                               +
                             </button>
                          </div>
                       )}
                    </div>

                    {item.quantity <= item.minThreshold && (
                       <div className="bg-red-50 border border-red-100 p-3 flex items-center gap-2 text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Reordenar (Min: {item.minThreshold})</span>
                       </div>
                    )}
                 </div>
               ))
            )}
          </div>

          <div className="hidden lg:block bg-white border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-black text-white dark:bg-stone-950 dark:text-stone-200">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Producto</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Tipo</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Existencias</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {productionInventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Settings2 className="w-12 h-12 text-stone-200 dark:text-stone-800" strokeWidth={1} />
                          <p className="text-stone-400 font-medium text-sm uppercase tracking-widest dark:text-stone-600">No hay insumos registrados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productionInventory.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors group dark:hover:bg-stone-800/50">
                        <td className="px-6 py-6 font-black text-black text-sm uppercase dark:text-white">{item.name}</td>
                        <td className="px-6 py-6">
                          {item.type === 'rechargeable' ? (
                            <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-3 py-1 border border-stone-200 uppercase tracking-wider dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700">Recargable</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold bg-white text-black px-3 py-1 border border-black w-fit uppercase tracking-wider dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700">Unidad</span>
                              {item.format && <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-1 dark:text-stone-500">{item.format}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          {item.type === 'rechargeable' ? (
                            <div className="flex items-center gap-4 w-48">
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={item.quantity} 
                                disabled={!canEdit}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                className="w-full h-1 bg-stone-200 rounded-none appearance-none cursor-pointer accent-black disabled:opacity-50 disabled:cursor-not-allowed dark:bg-stone-700 dark:accent-white"
                              />
                              <span className="text-xs font-black text-black w-12 text-right dark:text-white">{item.quantity}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={item.quantity}
                                disabled={!canEdit}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                className="w-24 px-3 py-2 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold text-black transition-all text-center disabled:bg-stone-50 disabled:text-stone-500 dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-500"
                              />
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest dark:text-stone-500">Uds</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          {(item.quantity <= item.minThreshold) && (
                            <span className="inline-flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
                              <AlertCircle className="w-3 h-3" /> Reordenar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Packaging */}
      {showProdModal && createPortal(
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowProdModal(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-lg border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black dark:bg-stone-950 text-white p-4 border-b border-stone-800 shrink-0 sticky top-0 z-10 flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tighter uppercase">Nuevo Insumo</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Registro de Materiales</p>
              </div>
              <button onClick={() => setShowProdModal(false)} className="text-white hover:text-stone-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProdItem} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Nombre del Producto</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all placeholder:text-stone-300 dark:bg-stone-900 dark:border-stone-800 dark:focus:border-stone-500 dark:text-white dark:placeholder:text-stone-600" 
                  value={prodForm.name} 
                  onChange={e => setProdForm({...prodForm, name: e.target.value})}
                  placeholder="Ej. Bolsas 250g, Gas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Tipo de Stock</label>
                  <select 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none dark:bg-stone-900 dark:border-stone-800 dark:focus:border-stone-500 dark:text-white"
                    value={prodForm.type}
                    onChange={e => setProdForm({...prodForm, type: e.target.value as 'unit' | 'rechargeable'})}
                  >
                    <option value="unit">Unidades (Cant)</option>
                    <option value="rechargeable">Recargable (%)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Alerta Mínima</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all dark:bg-stone-900 dark:border-stone-800 dark:focus:border-stone-500 dark:text-white" 
                    value={prodForm.minThreshold} 
                    onChange={e => setProdForm({...prodForm, minThreshold: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {prodForm.type === 'unit' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Formato (Opcional)</label>
                  <select 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none dark:bg-stone-900 dark:border-stone-800 dark:focus:border-stone-500 dark:text-white"
                    value={prodForm.format || ''}
                    onChange={e => setProdForm({...prodForm, format: e.target.value as any || undefined})}
                  >
                    <option value="">Ninguno (Genérico)</option>
                    <option value="250g">Bolsa 250g</option>
                    <option value="500g">Bolsa 500g</option>
                    <option value="1kg">Bolsa 1kg</option>
                  </select>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider ml-1">Si selecciona un formato, el stock se descontará automáticamente al producir bolsas retail.</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1 dark:text-white">Stock Inicial</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  max={prodForm.type === 'rechargeable' ? 100 : undefined}
                  className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all dark:bg-stone-900 dark:border-stone-800 dark:focus:border-stone-500 dark:text-white" 
                  value={prodForm.quantity} 
                  onChange={e => setProdForm({...prodForm, quantity: parseInt(e.target.value)})}
                />
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-black hover:bg-stone-800 text-white font-black uppercase tracking-[0.2em] shadow-none transition-all text-xs border border-transparent hover:border-black dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-700">
                  Registrar Producto
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
    </>
  );
};



export default ProductionView;
