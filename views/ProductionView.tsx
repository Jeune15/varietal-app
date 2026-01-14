import React, { useState } from 'react';
import { db, syncToCloud, getSupabase } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Order, 
  RoastedStock, 
  RetailBagStock, 
  ProductionActivityType, 
  ProductionActivity,
  ProductionItem
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
    shippingCost: 0
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
      shippingCost: 0
    });
  };

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
      const existingBag = retailBags.find(b => b.coffeeName === selectedStock.variety && b.type === additionalInfo.bagType);
      
      if (existingBag) {
        const updatedBag = { ...existingBag, quantity: existingBag.quantity + productionValue };
        await db.retailBags.update(existingBag.id, { quantity: updatedBag.quantity });
        await syncToCloud('retailBags', updatedBag);
      } else {
        const newBag: RetailBagStock = { 
          id: Math.random().toString(36).substr(2, 9), 
          coffeeName: selectedStock.variety, 
          type: additionalInfo.bagType, 
          quantity: productionValue 
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
        // Validate stock
        // For Service Orders, quantityKg is Green Coffee, so it will always be > Roasted Stock.
        // We skip this check for Service Orders, assuming we are packing whatever was roasted.
        const isServiceOrder = order.type === 'Servicio de Tueste';
        
        if (!isServiceOrder && order.quantityKg > selectedStock.remainingQtyKg) {
          showToast(`Stock insuficiente en el lote seleccionado. Disponible: ${selectedStock.remainingQtyKg.toFixed(2)} Kg`, 'error');
          return;
        }

        // Deduct from stock
        // For Service Orders, we consume the entire selected stock batch (as it belongs to the client)
        // For Sales, we consume the order quantity
        const deductionQty = isServiceOrder ? selectedStock.remainingQtyKg : order.quantityKg;
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

        // Update Order
        const bagsUsed = additionalInfo.bagsUsed;

        const updates = { 
          progress: 100, // Assuming full fulfillment
          status: 'Listo para Despacho' as const, 
          bagsUsed, 
          packagingType: additionalInfo.packagingType,
          fulfilledFromStockId: selectedStock.id
        };
        
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

    const newActivity: ProductionActivity = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeMode,
      date: new Date().toISOString(),
      details: { selectedOrderId, selectedStockId, productionValue, ...additionalInfo }
    };
    
    setHistory(prev => [...prev, newActivity]);
    
    showToast('Operación registrada exitosamente', 'success');
    resetForm();
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

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 border-b-4 border-black pb-8">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black tracking-tighter uppercase">Producción</h3>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.25em]">Centro de Operaciones</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 w-full md:w-auto">
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
          ) : !activeMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModeCard title="Armado de Pedido" desc="Envasado y preparación final de pedidos." icon={<BarChart2 className="w-6 h-6" />} onClick={() => setActiveMode('Armado de Pedido')} />
              <ModeCard title="Selección de Café" desc="Control de mermas y selección técnica." icon={<Scissors className="w-6 h-6" />} onClick={() => setActiveMode('Selección de Café')} />
              <ModeCard title="Bolsas Retail" desc="Conversión a empaques de venta unitaria." icon={<ShoppingBag className="w-6 h-6" />} onClick={() => setActiveMode('Armado de Bolsas Retail')} />
              <ModeCard title="Despacho" desc="Salida de pedidos listos a logística." icon={<Truck className="w-6 h-6" />} onClick={() => setActiveMode('Despacho de Pedido')} />
            </div>
          ) : (
            <div className="bg-white border border-stone-200 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
              <div className="p-8 bg-black text-white flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-xl font-black tracking-tight uppercase">{activeMode}</h4>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Formulario de Actividad</p>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAction} className="p-8 space-y-8">
                {['Armado de Pedido', 'Despacho de Pedido'].includes(activeMode) && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Seleccionar Pedido</label>
                    <select required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                      <option value="">-- Elija un pedido activo --</option>
                      {orders.filter(o => {
                        if (activeMode === 'Despacho de Pedido') return o.status === 'Listo para Despacho';
                        if (activeMode === 'Armado de Pedido') return o.status === 'En Producción' || o.status === 'Pendiente';
                        return false;
                      }).map(o => (
                        <option key={o.id} value={o.id}>{o.clientName} — {o.variety} ({o.quantityKg}Kg) — [{o.status}]</option>
                      ))}
                    </select>
                  </div>
                )}
                {['Selección de Café', 'Armado de Bolsas Retail', 'Armado de Pedido'].includes(activeMode) && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Existencias de Café (Origen)</label>
                    <select required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none" value={selectedStockId} onChange={e => setSelectedStockId(e.target.value)}>
                      <option value="">-- Elija un lote tostado --</option>
                      {stocks.filter(s => s.remainingQtyKg > 0).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.variety} ({s.clientName}) — Disp: {s.remainingQtyKg.toFixed(2)} Kg
                          {s.isSelected ? ' [Seleccionado]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {activeMode === 'Armado de Pedido' && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Tipo de Carga</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setAdditionalInfo({ ...additionalInfo, packagingType: 'grainpro' })}
                          className={`p-6 border flex flex-col items-center justify-center gap-3 transition-all ${
                            additionalInfo.packagingType === 'grainpro' 
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
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
                              ? 'bg-black text-white border-black' 
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          <Package className="w-6 h-6" />
                          <span className="text-xs font-black uppercase tracking-widest">Bolsas</span>
                        </button>
                      </div>
                    </div>

                    {(additionalInfo.packagingType === 'bags' || additionalInfo.packagingType === 'grainpro') && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">
                          {additionalInfo.packagingType === 'grainpro' ? 'Cantidad de Bolsas GrainPro' : 'Bolsas Utilizadas'}
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold" 
                          value={additionalInfo.bagsUsed || ''} 
                          onChange={e => setAdditionalInfo({...additionalInfo, bagsUsed: parseInt(e.target.value) || 0})}
                          placeholder="Ingrese cantidad..."
                        />
                      </div>
                    )}
                    
                    <div className="bg-stone-50 p-6 border border-stone-200 flex gap-4 items-center">
                        <CheckCircle className="w-5 h-5 text-black" />
                        <p className="text-xs text-stone-600 font-medium leading-relaxed">Al guardar, se descontará el peso del pedido del inventario seleccionado y se marcará como Listo para Despacho.</p>
                    </div>
                  </div>
                )}
                {activeMode === 'Selección de Café' && (
                  <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Merma Detectada (Gramos)</label><input type="number" step="0.1" min="0" required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold" value={additionalInfo.merma} onChange={e => setAdditionalInfo({...additionalInfo, merma: parseFloat(e.target.value)})} /></div>
                )}
                {activeMode === 'Armado de Bolsas Retail' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Formato Bolsa</label><select className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold appearance-none rounded-none" value={additionalInfo.bagType} onChange={e => setAdditionalInfo({...additionalInfo, bagType: e.target.value as any})}>
                      <option value="250g">250g</option><option value="500g">500g</option><option value="1kg">1kg</option>
                    </select></div>
                    <div className="space-y-3"><label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Unidades</label><input type="number" min="1" required className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold" value={productionValue} onChange={e => setProductionValue(parseInt(e.target.value))} /></div>
                  </div>
                )}
                {activeMode === 'Despacho de Pedido' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Costo de Envío</label>
                      <div className="relative">
                        <span className="absolute left-4 top-4 text-stone-400 font-bold">$</span>
                        <input 
                          type="number" 
                          min="0" 
                          className="w-full pl-8 pr-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold" 
                          value={additionalInfo.shippingCost || ''} 
                          onChange={e => setAdditionalInfo({...additionalInfo, shippingCost: parseFloat(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="bg-stone-50 p-6 border border-stone-200 flex items-start gap-4">
                      <Truck className="w-5 h-5 text-black mt-0.5" />
                      <p className="text-xs text-stone-600 font-medium leading-relaxed">
                        Confirma el envío del pedido seleccionado. Si ingresas un costo de envío, se generará automáticamente un registro en Gastos.
                      </p>
                    </div>
                  </div>
                )}
                <div className="pt-6"><button type="submit" className="w-full py-5 bg-black hover:bg-stone-800 text-white font-black uppercase tracking-[0.2em] transition-all text-xs border border-transparent hover:border-black">Guardar Actividad</button></div>
              </form>
            </div>
          )}
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

          <div className="bg-white border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Producto</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Tipo</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Existencias</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {productionInventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Settings2 className="w-12 h-12 text-stone-200" strokeWidth={1} />
                          <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">No hay insumos registrados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productionInventory.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-6 font-black text-black text-sm uppercase">{item.name}</td>
                        <td className="px-6 py-6">
                          {item.type === 'rechargeable' ? (
                            <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-3 py-1 border border-stone-200 uppercase tracking-wider">Recargable</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold bg-white text-black px-3 py-1 border border-black w-fit uppercase tracking-wider">Unidad</span>
                              {item.format && <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-1">{item.format}</span>}
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
                                className="w-full h-1 bg-stone-200 rounded-none appearance-none cursor-pointer accent-black disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-xs font-black text-black w-12 text-right">{item.quantity}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={item.quantity}
                                disabled={!canEdit}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                className="w-24 px-3 py-2 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold text-black transition-all text-center disabled:bg-stone-50 disabled:text-stone-500"
                              />
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Uds</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          {(item.quantity <= item.minThreshold) && (
                            <span className="inline-flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 border border-red-100">
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
      {showProdModal && (
        <div 
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowProdModal(false)}
        >
          <div 
            className="bg-white border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black p-8 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xl font-black tracking-tight uppercase">Nuevo Insumo</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Registro de Materiales</p>
              </div>
              <button onClick={() => setShowProdModal(false)} className="text-stone-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveProdItem} className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all placeholder:text-stone-300" 
                  value={prodForm.name} 
                  onChange={e => setProdForm({...prodForm, name: e.target.value})}
                  placeholder="Ej. Bolsas 250g, Gas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Tipo de Stock</label>
                  <select 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none"
                    value={prodForm.type}
                    onChange={e => setProdForm({...prodForm, type: e.target.value as 'unit' | 'rechargeable'})}
                  >
                    <option value="unit">Unidades (Cant)</option>
                    <option value="rechargeable">Recargable (%)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Alerta Mínima</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all" 
                    value={prodForm.minThreshold} 
                    onChange={e => setProdForm({...prodForm, minThreshold: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {prodForm.type === 'unit' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Formato (Opcional)</label>
                  <select 
                    className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none rounded-none"
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
                <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Stock Inicial</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  max={prodForm.type === 'rechargeable' ? 100 : undefined}
                  className="w-full px-5 py-4 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all" 
                  value={prodForm.quantity} 
                  onChange={e => setProdForm({...prodForm, quantity: parseInt(e.target.value)})}
                />
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-black hover:bg-stone-800 text-white font-black uppercase tracking-[0.2em] shadow-none transition-all text-xs border border-transparent hover:border-black">
                  Registrar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ModeCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, desc, icon, onClick }) => (
  <button onClick={onClick} className="group flex flex-col p-8 bg-white border border-stone-200 hover:border-black transition-all text-left relative overflow-hidden h-full">
    <div className="bg-black text-white p-4 w-fit mb-6 group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <h4 className="text-xl font-black text-black mb-3 tracking-tight uppercase group-hover:underline decoration-2 underline-offset-4">{title}</h4>
    <p className="text-xs text-stone-500 leading-relaxed font-bold uppercase tracking-wide">{desc}</p>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="bg-black text-white p-1">
        <Plus className="w-4 h-4" />
      </div>
    </div>
  </button>
);

export default ProductionView;
