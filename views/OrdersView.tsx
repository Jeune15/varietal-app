import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, getSupabase } from '../db';
import { Order, OrderType, OrderLine, ProductionActivity, RoastedStock, RetailBagStock, ProductionItem, ProductionActivityType } from '../types';
import { Plus, Clock, User, X, Truck, DollarSign, AlertTriangle, Trash2, Activity, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type RetailSelectionLine = {
  id: string;
  retailBagId: string;
  coffeeName: string;
  bagType: RetailBagStock['type'];
  units: number;
  grindType: 'grano' | 'molido';
};

interface Props {
  orders: Order[];
}

const OrdersView: React.FC<Props> = ({ orders }) => {
  const { canEdit, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  
  // Shipping Modal State
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<Order | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);

  // Activity Panel State
  const [selectedOrderForActivities, setSelectedOrderForActivities] = useState<Order | null>(null);

  const stocks = useLiveQuery(
    () => db.roastedStocks.toArray() as Promise<RoastedStock[]>
  ) || [];
  const retailBags = useLiveQuery(
    () => db.retailBags.toArray() as Promise<RetailBagStock[]>
  ) || [];
  const productionInventory = useLiveQuery(
    () => db.productionInventory.toArray() as Promise<ProductionItem[]>
  ) || [];
  const history = useLiveQuery(
    () => db.history.toArray() as Promise<ProductionActivity[]>
  ) || [];

  const [activeMode, setActiveMode] = useState<ProductionActivityType | null>(null);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [productionValue, setProductionValue] = useState<number>(0);
  const [additionalInfo, setAdditionalInfo] = useState<{
    packagingType: 'bags' | 'grainpro';
    bagsUsed: number;
    merma: number;
    bagType: '250g' | '500g' | '1kg';
    shippingCost: number;
    markOrderReady: boolean;
  }>({
    packagingType: 'grainpro',
    bagsUsed: 0,
    merma: 0,
    bagType: '250g',
    shippingCost: 0,
    markOrderReady: false
  });

  const [selectedRetailBagId, setSelectedRetailBagId] = useState('');
  const [retailUnits, setRetailUnits] = useState<number | ''>('');
  const [retailGrindType, setRetailGrindType] = useState<'grano' | 'molido'>('grano');
  const [retailLines, setRetailLines] = useState<RetailSelectionLine[]>([]);

  const [selectedOrderIdForContinuation, setSelectedOrderIdForContinuation] = useState<string | null>(null);

  // Line-level helpers for molienda y bolsas
  const [lineGrindNumber, setLineGrindNumber] = useState<number | ''>('');
  const [lineGrindReference, setLineGrindReference] = useState('');
  const [lineBagsCount, setLineBagsCount] = useState<number | ''>('');
  const [lineBagSizeGrams, setLineBagSizeGrams] = useState<number>(1000);

  const createInitialFormData = () => ({
    clientName: '',
    variety: '',
    type: 'Venta Café Tostado' as OrderType,
    roastType: '',
    quantityKg: 0,
    defaultGrindType: 'grano' as 'grano' | 'molido',
    packagingType: 'bags' as 'bags' | 'grainpro',
    entryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requiresRoasting: true,
    deliveryAddress: '',
    deliveryAddressDetail: ''
  });
  const [formData, setFormData] = useState(createInitialFormData);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [serviceUnitMode, setServiceUnitMode] = useState<'green' | 'roasted'>('green');

  const resetFormState = () => {
    setFormData(createInitialFormData());
    setOrderLines([]);
    setServiceUnitMode('green');
    setLineGrindNumber('');
    setLineGrindReference('');
    setLineBagsCount('');
    setLineBagSizeGrams(1000);
  };

  const resetActivityForm = () => {
    setActiveMode(null);
    setSelectedStockId('');
    setProductionValue(0);
    setAdditionalInfo({
      packagingType: 'grainpro',
      bagsUsed: 0,
      merma: 0,
      bagType: '250g',
      shippingCost: 0,
      markOrderReady: false
    });
    setSelectedRetailBagId('');
    setRetailUnits('');
    setRetailGrindType('grano');
    setRetailLines([]);
  };

  const togglePauseOrder = async (order: Order, paused: boolean) => {
    if (!canEdit) return;
    const updates: Partial<Order> = { isPaused: paused };
    await db.orders.update(order.id, updates);
    await syncToCloud('orders', { ...order, ...updates });
    showToast(paused ? 'Pedido pausado' : 'Pedido reanudado', 'success');
    setSelectedOrderForActivities(null);
  };

  const addCurrentLine = () => {
    const variety = formData.variety.trim();
    let quantity = formData.quantityKg;

    if (formData.type === 'Venta Café Tostado') {
      if (lineBagsCount && lineBagSizeGrams) {
        quantity = (lineBagsCount * lineBagSizeGrams) / 1000;
      }
    }

    if (!variety || !quantity || quantity <= 0) {
      showToast('Ingresa variedad y kilos mayores a 0', 'error');
      return;
    }
    const line: OrderLine = {
      id: Math.random().toString(36).substr(2, 9),
      variety,
      quantityKg: quantity
    };

    if (formData.type === 'Venta Café Tostado') {
      if (lineBagsCount && lineBagSizeGrams) {
        line.bagsCount = lineBagsCount;
        line.bagSizeGrams = lineBagSizeGrams;
      }
      line.grindType = formData.defaultGrindType;
      if (formData.defaultGrindType === 'molido') {
        if (lineGrindNumber) {
          line.grindNumber = lineGrindNumber;
        }
        if (lineGrindReference.trim()) {
          line.grindReference = lineGrindReference.trim();
        }
      }
    }

    if (formData.type === 'Servicio de Tueste') {
      line.roastProfile = formData.roastType || undefined;
      line.grindType = formData.defaultGrindType;
      if (formData.defaultGrindType === 'molido') {
        if (lineGrindNumber) {
          line.grindNumber = lineGrindNumber;
        }
        if (lineGrindReference.trim()) {
          line.grindReference = lineGrindReference.trim();
        }
      }
    }

    setOrderLines(prev => [...prev, line]);
    setFormData(prev => ({
      ...prev,
      variety: '',
      quantityKg: 0
    }));
    setLineBagsCount('');
  };

  const removeLine = (id: string) => {
    setOrderLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const lines: OrderLine[] = [...orderLines];
    let quantityForNewLine = formData.quantityKg;

    if (formData.type === 'Venta Café Tostado' && lineBagsCount && lineBagSizeGrams) {
      quantityForNewLine = (lineBagsCount * lineBagSizeGrams) / 1000;
    }

    if (formData.variety.trim() && quantityForNewLine > 0) {
      const newLine: OrderLine = {
        id: Math.random().toString(36).substr(2, 9),
        variety: formData.variety.trim(),
        quantityKg: quantityForNewLine
      };

      if (formData.type === 'Venta Café Tostado') {
        if (lineBagsCount && lineBagSizeGrams) {
          newLine.bagsCount = lineBagsCount;
          newLine.bagSizeGrams = lineBagSizeGrams;
        }
        newLine.grindType = formData.defaultGrindType;
        if (formData.defaultGrindType === 'molido') {
          if (lineGrindNumber) {
            newLine.grindNumber = lineGrindNumber;
          }
          if (lineGrindReference.trim()) {
            newLine.grindReference = lineGrindReference.trim();
          }
        }
      }

      if (formData.type === 'Servicio de Tueste') {
        newLine.roastProfile = formData.roastType || undefined;
        newLine.grindType = formData.defaultGrindType;
        if (formData.defaultGrindType === 'molido') {
          if (lineGrindNumber) {
            newLine.grindNumber = lineGrindNumber;
          }
          if (lineGrindReference.trim()) {
            newLine.grindReference = lineGrindReference.trim();
          }
        }
      }

      lines.push(newLine);
    }
    const hasLines = lines.length > 0;
    const baseQuantity = hasLines ? lines.reduce((sum, l) => sum + l.quantityKg, 0) : formData.quantityKg;
    let quantityForOrder = baseQuantity;
    let serviceRoastedQty: number | undefined;

    if (formData.type === 'Servicio de Tueste' && serviceUnitMode === 'roasted' && baseQuantity > 0) {
      const estimatedGreen = baseQuantity / 0.85;
      serviceRoastedQty = baseQuantity;

      try {
        const allGreen = await db.greenCoffees.toArray();
        const clientName = formData.clientName.trim();
        const relevantGreen = allGreen.filter(g => {
          if (!clientName) return true;
          return g.clientName === clientName;
        });
        const availableGreen = relevantGreen.reduce((sum, g) => sum + (g.quantityKg || 0), 0);

        if (availableGreen + 0.001 < estimatedGreen) {
          showToast(
            `Aviso: para ${baseQuantity.toFixed(2)} Kg tostados se estiman ${estimatedGreen.toFixed(
              2
            )} Kg verdes, pero en sistema solo hay ${availableGreen.toFixed(2)} Kg registrados para este cliente.`,
            'info'
          );
        }
      } catch {
      }

      quantityForOrder = estimatedGreen;
    }

    const displayVariety = hasLines
      ? lines.length === 1
        ? lines[0].variety
        : 'Múltiples cafés'
      : formData.variety;
    const newOrder: Order = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pendiente',
      progress: 0,
      variety: displayVariety,
      quantityKg: quantityForOrder,
      serviceRoastedQtyKg: serviceRoastedQty,
      orderLines: hasLines ? lines : undefined
    };
    await db.orders.add(newOrder);
    await syncToCloud('orders', newOrder);
    
    showToast('Pedido creado exitosamente', 'success');
    setShowModal(false);
    resetFormState();
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    if (!canEdit) return;
    
    // Intercept "Listo para Despacho" -> "Enviado" to ask for shipping cost
    if (newStatus === 'Enviado' && order.status !== 'Enviado') {
      if (order.type === 'Venta Café Tostado' && (!order.bagsUsed || order.bagsUsed <= 0)) {
        showToast('Antes de despachar, registra el Armado de Pedido con sus bolsas.', 'error');
        return;
      }
      setSelectedOrderForShipping(order);
      setShippingCost(0);
      setShippingModalOpen(true);
      return;
    }

    const updates: Partial<Order> = { status: newStatus };
    
    if (newStatus === 'Pendiente') {
      updates.progress = 0;
    } else if (newStatus === 'En Producción') {
      updates.progress = 0;
    } else if (newStatus === 'Listo para Despacho') {
      updates.progress = 100;
    } else if (newStatus === 'Enviado') {
      updates.shippedDate = new Date().toISOString();
    }

    await db.orders.update(order.id, updates);
    await syncToCloud('orders', { ...order, ...updates });
    showToast(`Estado actualizado a ${newStatus}`, 'success');
  };

  const confirmShipping = async () => {
    if (!selectedOrderForShipping) return;
    
    const updates: Partial<Order> = { 
        status: 'Enviado',
        shippingCost,
        shippedDate: new Date().toISOString()
    };
    
    await db.orders.update(selectedOrderForShipping.id, updates);
    await syncToCloud('orders', { ...selectedOrderForShipping, ...updates });

    // Automatically create an Expense if shipping cost > 0
    if (shippingCost > 0) {
        const newExpense = {
            id: Math.random().toString(36).substr(2, 9),
            reason: `Envío Pedido ${selectedOrderForShipping.clientName}`,
            amount: shippingCost,
            date: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            relatedOrderId: selectedOrderForShipping.id
        };
        await db.expenses.add(newExpense);
        await syncToCloud('expenses', newExpense);
    }

    setShippingModalOpen(false);
    setSelectedOrderForShipping(null);
    showToast('Pedido marcado como enviado', 'success');
  };

  const handleSendOrder = (order: Order) => {
    if (!canEdit) return;
    if (!areAllRequiredActivitiesCompleted(order)) {
      showToast('Completa todas las actividades antes de enviar el pedido.', 'error');
      return;
    }
    resetActivityForm();
    setSelectedOrderForShipping(order);
    setShippingCost(order.shippingCost || 0);
    setShippingModalOpen(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrderForDelete(order);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!selectedOrderForDelete) return;
      
      await db.orders.delete(selectedOrderForDelete.id);
      if (getSupabase()) {
        await getSupabase().from('orders').delete().eq('id', selectedOrderForDelete.id);
      }
      
      setDeleteModalOpen(false);
      setSelectedOrderForDelete(null);
      showToast('Pedido eliminado', 'success');
  };

  const getStatusBadge = (status: string) => {
    return <span className="border border-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black">{status}</span>;
  };

  const isActivityCompleted = (order: Order, activityType: ProductionActivityType) => {
    if (order.completedActivities && order.completedActivities.includes(activityType)) {
      return true;
    }

    return history.some(activity => {
      const details: any = activity.details || {};
      const activityOrderId = details.orderId || details.selectedOrderId;
      return activity.type === activityType && activityOrderId === order.id;
    });
  };

  const getRequiredActivities = (order: Order): ProductionActivityType[] =>
    order.type === 'Venta Café Tostado'
      ? ['Armado de Bolsas Retail']
      : ['Selección de Café', 'Armado de Pedido'];

  const areAllRequiredActivitiesCompleted = (order: Order) => {
    const required = getRequiredActivities(order);
    return required.every(a => isActivityCompleted(order, a));
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!activeMode) return;
    if (!selectedOrderForActivities) return;

    const selectedOrderId = selectedOrderForActivities.id;

    if (activeMode === 'Armado de Bolsas Retail') {
      if (retailLines.length === 0) {
        showToast('Agrega al menos un café de retail', 'error');
        return;
      }

      const groupedByBag: Record<string, { bag: RetailBagStock; totalUnits: number }> = {};

      for (const line of retailLines) {
        const bag = retailBags.find(b => b.id === line.retailBagId);
        if (!bag) {
          showToast('Stock de retail no encontrado para uno de los cafés seleccionados.', 'error');
          return;
        }
        if (!groupedByBag[line.retailBagId]) {
          groupedByBag[line.retailBagId] = { bag, totalUnits: 0 };
        }
        groupedByBag[line.retailBagId].totalUnits += line.units;
      }

      for (const key of Object.keys(groupedByBag)) {
        const { bag, totalUnits } = groupedByBag[key];
        if (totalUnits > bag.quantity) {
          showToast(
            `No hay suficientes bolsas de ${bag.coffeeName} (${bag.type}). Máximo disponible: ${bag.quantity}.`,
            'error'
          );
          return;
        }
      }

      for (const key of Object.keys(groupedByBag)) {
        const { bag, totalUnits } = groupedByBag[key];
        const newQty = bag.quantity - totalUnits;
        if (newQty <= 0) {
          await db.retailBags.delete(bag.id);
          if (getSupabase()) {
            await getSupabase().from('retailBags').delete().eq('id', bag.id);
          }
        } else {
          const updatedBag = { ...bag, quantity: newQty };
          await db.retailBags.update(bag.id, { quantity: updatedBag.quantity });
          await syncToCloud('retailBags', updatedBag);
        }
      }

      const usedByFormat: Record<'250g' | '500g' | '1kg', number> = {
        '250g': 0,
        '500g': 0,
        '1kg': 0
      };

      for (const key of Object.keys(groupedByBag)) {
        const { bag, totalUnits } = groupedByBag[key];
        usedByFormat[bag.type] = (usedByFormat[bag.type] || 0) + totalUnits;
      }

      (['250g', '500g', '1kg'] as const).forEach(format => {
        const used = usedByFormat[format];
        if (!used) return;
        const linkedItems = productionInventory.filter(
          item => item.type === 'unit' && item.format === format
        );
        linkedItems.forEach(async item => {
          const newQty = Math.max(0, item.quantity - used);
          await db.productionInventory.update(item.id, { quantity: newQty });
          await syncToCloud('productionInventory', { ...item, quantity: newQty });
        });
      });
    }

    if (activeMode === 'Selección de Café') {
      const selectedStock = stocks.find(s => s.id === selectedStockId);
      if (!selectedStock) return;
      const weightReductionKg = additionalInfo.merma / 1000;
      if (weightReductionKg > selectedStock.remainingQtyKg) {
        showToast('La merma no puede ser mayor al stock restante.', 'error');
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
      const order = selectedOrderForActivities;
      const selectedStock = stocks.find(s => s.id === selectedStockId);

      if (order && selectedStock) {
        const isServiceOrder = order.type === 'Servicio de Tueste';
        const markReady = additionalInfo.markOrderReady;
        const requestedQty = productionValue;

        if (!requestedQty || requestedQty <= 0) {
          showToast('Ingresa la cantidad a despachar en Kg.', 'error');
          return;
        }

        const stockAvailable = selectedStock.remainingQtyKg;
        let deductionQty = requestedQty;

        if (!isServiceOrder) {
          const currentFulfilled = order.fulfilledKg || 0;
          const remainingOrderQty = Math.max(0, order.quantityKg - currentFulfilled);

          if (remainingOrderQty <= 0.001) {
            showToast('Este pedido ya está completamente armado.', 'info');
            return;
          }

          const maxPossible = Math.min(stockAvailable, remainingOrderQty);

          if (requestedQty > maxPossible + 0.001) {
            showToast(
              `Solo se despacharán ${maxPossible.toFixed(
                2
              )} Kg por límite de stock o pedido.`,
              'info'
            );
          }

          deductionQty = Math.min(requestedQty, maxPossible);
        } else {
          if (requestedQty > stockAvailable + 0.001) {
            showToast(
              `Solo se despacharán ${stockAvailable.toFixed(
                2
              )} Kg por límite de stock disponible.`,
              'info'
            );
          }
          deductionQty = Math.min(requestedQty, stockAvailable);
        }

        if (deductionQty <= 0) {
          showToast('No hay cantidad válida para despachar.', 'error');
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
          await db.roastedStocks.update(selectedStock.id, {
            remainingQtyKg: updatedStock.remainingQtyKg
          });
          await syncToCloud('roastedStocks', updatedStock);
        }

        const bagsUsed = additionalInfo.bagsUsed;

        if (bagsUsed && bagsUsed > 0) {
          if (additionalInfo.packagingType === 'grainpro') {
            const grainProItems = productionInventory.filter(
              item => item.type === 'unit' && item.name === 'Grain Pro'
            );
            for (const item of grainProItems) {
              const newQty = Math.max(0, item.quantity - bagsUsed);
              await db.productionInventory.update(item.id, { quantity: newQty });
              await syncToCloud('productionInventory', { ...item, quantity: newQty });
            }
          }

          if (additionalInfo.packagingType === 'bags') {
            const bagItems = productionInventory.filter(
              item => item.type === 'unit' && item.format === '1kg'
            );
            for (const item of bagItems) {
              const newQty = Math.max(0, item.quantity - bagsUsed);
              await db.productionInventory.update(item.id, { quantity: newQty });
              await syncToCloud('productionInventory', { ...item, quantity: newQty });
            }
          }
        }

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
            updates.progress = Number.isNaN(progressPercentage)
              ? 0
              : Math.min(100, Math.max(0, progressPercentage));
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
        showToast('Debe seleccionar un lote de café para envasar.', 'error');
        return;
      }
    }

    const orderForActivity = selectedOrderForActivities;
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
        stockClientName: stockForActivity?.clientName,
        retailLines: activeMode === 'Armado de Bolsas Retail' ? retailLines : undefined
      }
    };

    await db.history.add(newActivity);
    await syncToCloud('history', newActivity);

    if (orderForActivity) {
      const prevCompleted = orderForActivity.completedActivities || [];
      const alreadyCompleted = prevCompleted.includes(activeMode);
      const updatedCompleted = alreadyCompleted ? prevCompleted : [...prevCompleted, activeMode];
      await db.orders.update(orderForActivity.id, { completedActivities: updatedCompleted });
      await syncToCloud('orders', { ...orderForActivity, completedActivities: updatedCompleted });
      setSelectedOrderForActivities({ ...orderForActivity, completedActivities: updatedCompleted });
    }

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
      resetActivityForm();
    }
  };

  const selectedOrderForContinuation =
    selectedOrderIdForContinuation
      ? orders.find(o => o.id === selectedOrderIdForContinuation) || null
      : null;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-black pb-6">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black tracking-tighter">PEDIDOS</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em]">Gestión de Demanda Activa</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => { resetFormState(); setShowModal(true); }}
            className="group flex-1 sm:flex-none bg-white border border-black text-black px-8 py-3 flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all duration-300"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nuevo Pedido</span>
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      {selectedOrderForContinuation && (
        <div className="fixed bottom-6 right-6 z-[90]">
          <button
            type="button"
            onClick={() => {
              setSelectedOrderForActivities(selectedOrderForContinuation);
              resetActivityForm();
            }}
            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.25em] shadow-lg border border-emerald-700"
          >
            Continuar con el pedido
          </button>
        </div>
      )}

      <div className="bg-white border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white border-b border-black">
              <tr>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] w-12"></th>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] w-56">Cliente</th>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em]">Detalle</th>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] w-32 text-center">Entrega</th>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] w-40 text-center">Estado</th>
                <th className="px-4 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] w-56 text-right">Progreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.filter(o => o.status !== 'Facturado' && o.status !== 'Enviado').length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-stone-400 text-xs font-mono uppercase tracking-widest">
                    Sin pedidos activos
                  </td>
                </tr>
              ) : (
                orders
                  .filter(o => o.status !== 'Facturado' && o.status !== 'Enviado')
                  .map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-4 py-6 w-12">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedOrderIdForContinuation(prev =>
                            prev === o.id ? null : o.id
                          )
                        }
                        className={`w-4 h-4 border ${
                          selectedOrderIdForContinuation === o.id
                            ? 'border-black bg-black'
                            : 'border-stone-300 bg-white'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-bold text-black text-sm tracking-tight">{o.clientName}</div>
                      <div className="text-[9px] text-stone-400 font-mono mt-1">ID: {o.id.slice(-4)}</div>
                    </td>
                    <td className="px-4 py-6">
                      {(() => {
                        const displayQty =
                          o.type === 'Servicio de Tueste' && typeof o.serviceRoastedQtyKg === 'number'
                            ? o.serviceRoastedQtyKg
                            : o.quantityKg;
                        return (
                      <div className="flex flex-col gap-1">
                        {o.orderLines && o.orderLines.length > 0 ? (
                          <>
                            <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">Múltiples cafés</span>
                            <div className="space-y-1">
                              {o.orderLines.slice(0, 3).map(line => (
                                <div key={line.id} className="flex justify-between text-[10px] text-stone-500 font-mono">
                                  <span>{line.variety}</span>
                                  <span>{line.quantityKg.toFixed(2)} Kg</span>
                                </div>
                              ))}
                              {o.orderLines.length > 3 && (
                                <div className="text-[9px] text-stone-400 font-mono">
                                  +{o.orderLines.length - 3} más
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {o.type} • {displayQty.toFixed(2)} Kg totales
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">{o.variety}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{o.type} • {displayQty.toFixed(2)} Kg</span>
                          </>
                        )}
                      </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-6 text-xs text-stone-500 font-mono text-center">{o.dueDate}</td>
                    <td className="px-4 py-6 text-center">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex flex-col items-end gap-2">
                          <div className="w-24 bg-stone-100 h-0.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                o.progress === 100 ? 'bg-black' : 'bg-stone-400'
                              }`}
                              style={{ width: `${Number.isNaN(o.progress) ? 0 : o.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-mono text-stone-400">
                            {Number.isNaN(o.progress) ? 0 : o.progress}%
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => { setShowModal(false); resetFormState(); }}
        >
          <div 
            className="bg-white w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 border border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black p-8 text-white flex justify-between items-start">
              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tighter uppercase">Nuevo Pedido</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Requerimientos del Cliente</p>
              </div>
              <button onClick={() => { setShowModal(false); resetFormState(); }} className="text-white hover:text-stone-300 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Cliente</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-stone-300 group-focus-within:text-black transition-colors" />
                    <input 
                      type="text" 
                      required 
                      placeholder="Nombre del Cliente" 
                      className="w-full pl-12 pr-4 py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors placeholder:text-stone-300" 
                      value={formData.clientName} 
                      onChange={e => setFormData({...formData, clientName: e.target.value})} 
                    />
                  </div>
                </div>

                {formData.type !== 'Servicio de Tueste' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Dirección</label>
                      <input
                        type="text"
                        placeholder="Calle, número, referencia principal"
                        className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors placeholder:text-stone-300"
                        value={formData.deliveryAddress}
                        onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Detalle de dirección</label>
                      <input
                        type="text"
                        placeholder="Piso, departamento, indicaciones adicionales"
                        className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors placeholder:text-stone-300"
                        value={formData.deliveryAddressDetail}
                        onChange={e => setFormData({ ...formData, deliveryAddressDetail: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Nombre de Café</label>
                      <input 
                        type="text" 
                        placeholder="Nombre del café..." 
                        className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors placeholder:text-stone-300" 
                        value={formData.variety} 
                        onChange={e => setFormData({...formData, variety: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Tipo</label>
                      <select 
                        className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                        value={formData.type}
                        onChange={e => {
                          const nextType = e.target.value as OrderType;
                          setFormData({...formData, type: nextType});
                          if (nextType !== 'Servicio de Tueste') {
                            setServiceUnitMode('green');
                          }
                        }}
                      >
                        <option value="Venta Café Tostado">Venta Café Tostado</option>
                        <option value="Servicio de Tueste">Servicio de Tueste</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Entrega en</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, defaultGrindType: 'grano' })}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            formData.defaultGrindType === 'grano'
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          Grano
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, defaultGrindType: 'molido' })}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            formData.defaultGrindType === 'molido'
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          Molido
                        </button>
                      </div>
                    </div>

                    {formData.type === 'Servicio de Tueste' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Empaque preferido</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, packagingType: 'grainpro' })}
                            className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                              formData.packagingType === 'grainpro'
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                            }`}
                          >
                            GrainPro
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, packagingType: 'bags' })}
                            className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                              formData.packagingType === 'bags'
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                            }`}
                          >
                            Bolsas de Kg
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.defaultGrindType === 'molido' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          Número de molienda (1-9)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={9}
                          className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors placeholder:text-stone-300"
                          value={lineGrindNumber === '' ? '' : lineGrindNumber}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isNaN(val)) {
                              setLineGrindNumber('');
                            } else {
                              setLineGrindNumber(val);
                            }
                          }}
                          placeholder="Ej: 5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          Referencia de molienda
                        </label>
                        <input
                          type="text"
                          className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors placeholder:text-stone-300"
                          value={lineGrindReference}
                          onChange={e => setLineGrindReference(e.target.value)}
                          placeholder="Ej: V60, Espresso, Prensa francesa..."
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === 'Servicio de Tueste' && (
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                        Unidades del pedido
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setServiceUnitMode('green')}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            serviceUnitMode === 'green'
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          Kg verdes
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceUnitMode('roasted')}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            serviceUnitMode === 'roasted'
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          Kg tostados
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`grid gap-6 items-end ${formData.type === 'Servicio de Tueste' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {formData.type === 'Servicio de Tueste' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          {serviceUnitMode === 'green' ? 'Kg verdes' : 'Kg tostados'}
                        </label>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.0" 
                          className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors placeholder:text-stone-300" 
                          value={formData.quantityKg || ''} 
                          onChange={e => setFormData({...formData, quantityKg: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    )}
                    {formData.type === 'Venta Café Tostado' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          Bolsas y formato
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="Cantidad de bolsas"
                            className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors placeholder:text-stone-300"
                            value={lineBagsCount === '' ? '' : lineBagsCount}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (Number.isNaN(val)) {
                                setLineBagsCount('');
                              } else {
                                setLineBagsCount(val);
                              }
                            }}
                          />
                          <select
                            className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-medium transition-colors"
                            value={lineBagSizeGrams}
                            onChange={e => setLineBagSizeGrams(parseInt(e.target.value, 10) || 1000)}
                          >
                            <option value={250}>250 g</option>
                            <option value={500}>500 g</option>
                            <option value={1000}>1 Kg</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={addCurrentLine}
                        className="px-4 py-3 border border-stone-200 hover:border-black text-xs font-black uppercase tracking-[0.2em] bg-white hover:bg-stone-50 transition-colors w-full sm:w-auto"
                      >
                        Agregar café al pedido
                      </button>
                    </div>
                  </div>

                  {orderLines.length > 0 && (
                    <div className="border border-stone-100 bg-stone-50 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Cafés en este pedido</span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {orderLines.reduce((sum, l) => sum + l.quantityKg, 0).toFixed(2)} Kg totales
                        </span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {orderLines.map(line => (
                          <div key={line.id} className="flex items-center justify-between text-xs text-stone-700">
                            <span className="font-bold uppercase tracking-wide">{line.variety}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-stone-500">{line.quantityKg.toFixed(2)} Kg</span>
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-600"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {formData.type === 'Servicio de Tueste' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Tipo de Tueste</label>
                    <select 
                      className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                      value={formData.roastType}
                      onChange={e => setFormData({...formData, roastType: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar Tueste...</option>
                      <option value="Filtrado">Filtrado</option>
                      <option value="Espresso">Espresso</option>
                      <option value="Medio">Medio</option>
                      <option value="Espresso Oscuro">Espresso Oscuro</option>
                      <option value="Según cliente">Según cliente</option>
                    </select>
                  </div>
                )}

              </div>

              <button 
                type="submit" 
                className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-[0.3em] hover:bg-stone-800 transition-colors"
              >
                Crear Pedido
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {shippingModalOpen && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={() => setShippingModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Truck className="w-6 h-6" /> Confirmar Envío
              </h3>
              <button onClick={() => setShippingModalOpen(false)}>
                <X className="w-6 h-6 hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {selectedOrderForShipping && (selectedOrderForShipping.deliveryAddress || selectedOrderForShipping.deliveryAddressDetail) && (
                <div className="bg-stone-50 border border-stone-200 p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Dirección de envío</p>
                    <p className="text-sm font-bold text-black">
                      {selectedOrderForShipping.deliveryAddress}
                    </p>
                    {selectedOrderForShipping.deliveryAddressDetail && (
                      <p className="text-xs text-stone-500 mt-1">
                        {selectedOrderForShipping.deliveryAddressDetail}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 border border-stone-200 hover:border-black text-[10px] font-black uppercase tracking-[0.2em] bg-white hover:bg-stone-100 transition-colors"
                    onClick={() => {
                      if (!selectedOrderForShipping) return;
                      const parts = [
                        selectedOrderForShipping.deliveryAddress,
                        selectedOrderForShipping.deliveryAddressDetail
                      ].filter(Boolean);
                      const text = parts.join(' - ');
                      if (!text) return;
                      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(
                          () => showToast('Dirección copiada al portapapeles', 'success'),
                          () => showToast('No se pudo copiar la dirección', 'error')
                        );
                      }
                    }}
                  >
                    Copiar
                  </button>
                </div>
              )}

              <p className="font-medium text-stone-600">
                ¿Cuál es el costo de envío para este pedido?
              </p>
              
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full p-4 pl-12 bg-stone-50 border border-stone-200 focus:border-black focus:ring-0 font-bold text-xl transition-colors"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  autoFocus
                />
                <DollarSign className="w-6 h-6 absolute left-4 top-4 text-stone-400" />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-stone-100">
                <button 
                  onClick={() => setShippingModalOpen(false)}
                  className="px-6 py-3 border border-stone-200 hover:border-black text-stone-600 hover:text-black font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmShipping}
                  className="px-8 py-3 bg-black text-white border border-black hover:bg-stone-800 font-bold uppercase tracking-wider transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedOrderForDelete && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md border-2 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-red-100 bg-red-50">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" /> Eliminar Pedido
              </h3>
              <button onClick={() => setDeleteModalOpen(false)}>
                <X className="w-6 h-6 text-red-400 hover:text-red-600 transition-colors" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="font-medium text-stone-600">
                ¿Estás seguro de que deseas eliminar el pedido de <span className="font-bold text-black">{selectedOrderForDelete.clientName}</span>?
              </p>
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-50 p-3 border border-red-100">
                Esta acción no se puede deshacer
              </p>

              <div className="flex justify-end gap-4 pt-4 border-t border-stone-100">
                <button 
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-6 py-3 border border-stone-200 hover:border-black text-stone-600 hover:text-black font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-8 py-3 bg-red-600 text-white border border-red-600 hover:bg-red-700 font-bold uppercase tracking-wider transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Panel */}
      {selectedOrderForActivities && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          onClick={() => setSelectedOrderForActivities(null)}
        >
          <div
            className="bg-white w-full max-w-6xl shadow-2xl border border-black max-h-[95vh] overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black text-white px-8 py-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
                  Flujo de Producción
                </p>
                <h3 className="text-2xl font-black tracking-tight">
                  {selectedOrderForActivities.clientName}
                </h3>
                <p className="text-[11px] text-stone-300 font-mono">
                  #{selectedOrderForActivities.id.slice(0, 8)} • {selectedOrderForActivities.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForActivities(null)}
                className="text-white hover:text-stone-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
              <div className="p-6 space-y-4 overflow-y-auto">
                <h4 className="text-xs font-black uppercase tracking-[0.25em] text-stone-400">
                  Datos y requerimientos
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                      Tipo de pedido
                    </p>
                    <p className="font-bold text-black">
                      {selectedOrderForActivities.type === 'Servicio de Tueste'
                        ? 'Servicio de tueste'
                        : 'Venta de café'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        Cantidad total
                      </p>
                      <p className="font-mono text-sm">
                        {(
                          selectedOrderForActivities.type === 'Servicio de Tueste' &&
                          typeof selectedOrderForActivities.serviceRoastedQtyKg === 'number'
                            ? selectedOrderForActivities.serviceRoastedQtyKg
                            : selectedOrderForActivities.quantityKg
                        ).toFixed(2)}{' '}
                        Kg
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        Entrega
                      </p>
                      <p className="text-sm font-medium text-stone-700">
                        {selectedOrderForActivities.defaultGrindType === 'molido'
                          ? 'Molido'
                          : 'Grano'}
                      </p>
                    </div>
                  </div>

                  {selectedOrderForActivities.deliveryAddress && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        Dirección de envío
                      </p>
                      <p className="text-sm font-medium text-black">
                        {selectedOrderForActivities.deliveryAddress}
                      </p>
                      {selectedOrderForActivities.deliveryAddressDetail && (
                        <p className="text-xs text-stone-600 mt-1">
                          {selectedOrderForActivities.deliveryAddressDetail}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedOrderForActivities.orderLines &&
                    selectedOrderForActivities.orderLines.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-2">
                          Cafés en el pedido
                        </p>
                        <div className="space-y-1">
                          {selectedOrderForActivities.orderLines.map(line => (
                            <div
                              key={line.id}
                              className="flex items-center justify-between text-xs text-stone-700"
                            >
                              <span className="font-bold uppercase tracking-wide">
                                {line.variety}
                              </span>
                              <span className="font-mono text-stone-500">
                                {line.quantityKg.toFixed(2)} Kg
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                {canEdit ? (
                  <>
                    {!activeMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedOrderForActivities.type !== 'Servicio de Tueste') return;
                            if (isActivityCompleted(selectedOrderForActivities, 'Selección de Café')) return;
                            setActiveMode('Selección de Café');
                          }}
                          className={`flex items-center justify-between px-4 py-3 border text-left ${
                            selectedOrderForActivities.type !== 'Servicio de Tueste'
                              ? 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
                              : isActivityCompleted(selectedOrderForActivities, 'Selección de Café')
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-stone-200 hover:border-black hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                              Servicio de tueste
                            </p>
                            <p className="text-sm font-bold text-black">
                              Selección y merma
                            </p>
                          </div>
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedOrderForActivities.type !== 'Servicio de Tueste') return;
                            if (isActivityCompleted(selectedOrderForActivities, 'Armado de Pedido')) return;
                            setActiveMode('Armado de Pedido');
                          }}
                          className={`flex items-center justify-between px-4 py-3 border text-left ${
                            selectedOrderForActivities.type !== 'Servicio de Tueste'
                              ? 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
                              : isActivityCompleted(selectedOrderForActivities, 'Armado de Pedido')
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-stone-200 hover:border-black hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                              Empaque
                            </p>
                            <p className="text-sm font-bold text-black">
                              Armado de pedido
                            </p>
                          </div>
                          <Truck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedOrderForActivities.type !== 'Venta Café Tostado') return;
                            if (isActivityCompleted(selectedOrderForActivities, 'Armado de Bolsas Retail')) return;
                            setActiveMode('Armado de Bolsas Retail');
                          }}
                          className={`flex items-center justify-between px-4 py-3 border text-left ${
                            selectedOrderForActivities.type !== 'Venta Café Tostado'
                              ? 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
                              : isActivityCompleted(selectedOrderForActivities, 'Armado de Bolsas Retail')
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-stone-200 hover:border-black hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                              Venta café tostado
                            </p>
                            <p className="text-sm font-bold text-black">
                              Bolsas retail
                            </p>
                          </div>
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleActivitySubmit} className="space-y-6">
                        {['Selección de Café', 'Armado de Pedido'].includes(
                          activeMode
                        ) && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                              Existencias de café tostado
                            </p>
                            <select
                              required
                              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all appearance-none"
                              value={selectedStockId}
                              onChange={e => setSelectedStockId(e.target.value)}
                            >
                              <option value="">-- Elija un lote tostado --</option>
                              {stocks
                                .filter(s => s.remainingQtyKg > 0)
                                .map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.clientName} — {s.variety} — Disp:{' '}
                                    {s.remainingQtyKg.toFixed(2)} Kg
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        {activeMode === 'Selección de Café' && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                              Merma detectada (g)
                            </p>
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              required
                              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                              value={additionalInfo.merma || ''}
                              onChange={e =>
                                setAdditionalInfo({
                                  ...additionalInfo,
                                  merma: parseFloat(e.target.value) || 0
                                })
                              }
                            />
                          </div>
                        )}

                        {activeMode === 'Armado de Bolsas Retail' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                  Formato bolsa
                                </p>
                                <select
                                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold appearance-none"
                                  value={additionalInfo.bagType}
                                  onChange={e =>
                                    setAdditionalInfo({
                                      ...additionalInfo,
                                      bagType: e.target.value as '250g' | '500g' | '1kg'
                                    })
                                  }
                                >
                                  <option value="250g">250g</option>
                                  <option value="500g">500g</option>
                                  <option value="1kg">1kg</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                  Café de retail
                                </p>
                                <select
                                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold appearance-none"
                                  value={selectedRetailBagId}
                                  onChange={e => setSelectedRetailBagId(e.target.value)}
                                >
                                  <option value="">-- Elija un café en retail --</option>
                                  {retailBags
                                    .filter(
                                      b =>
                                        b.quantity > 0 &&
                                        b.type === additionalInfo.bagType
                                    )
                                    .map(b => (
                                      <option key={b.id} value={b.id}>
                                        {b.coffeeName} • {b.type} • {b.quantity} bolsas
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                  Número de bolsas
                                </p>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                                  value={retailUnits === '' ? '' : retailUnits}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10);
                                    if (Number.isNaN(val)) {
                                      setRetailUnits('');
                                    } else {
                                      setRetailUnits(val);
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                  Entrega
                                </p>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setRetailGrindType('grano')}
                                    className={`px-3 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                                      retailGrindType === 'grano'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                                    }`}
                                  >
                                    Grano
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRetailGrindType('molido')}
                                    className={`px-3 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                                      retailGrindType === 'molido'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                                    }`}
                                  >
                                    Molido
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!selectedRetailBagId) {
                                      showToast('Elige un café de retail', 'error');
                                      return;
                                    }
                                    if (!retailUnits || retailUnits <= 0) {
                                      showToast('Ingresa el número de bolsas', 'error');
                                      return;
                                    }
                                    const bag = retailBags.find(
                                      b => b.id === selectedRetailBagId
                                    );
                                    if (!bag) {
                                      showToast('Stock de retail no encontrado', 'error');
                                      return;
                                    }
                                    const line: RetailSelectionLine = {
                                      id: Math.random().toString(36).substr(2, 9),
                                      retailBagId: bag.id,
                                      coffeeName: bag.coffeeName,
                                      bagType: bag.type,
                                      units: typeof retailUnits === 'number' ? retailUnits : 0,
                                      grindType: retailGrindType
                                    };
                                    setRetailLines(prev => [...prev, line]);
                                    setRetailUnits('');
                                  }}
                                  className="px-4 py-3 border border-stone-200 hover:border-black text-xs font-black uppercase tracking-[0.2em] bg-white hover:bg-stone-50 transition-colors w-full sm:w-auto"
                                >
                                  Agregar
                                </button>
                              </div>
                            </div>

                            {retailLines.length > 0 && (
                              <div className="border border-stone-100 bg-stone-50 p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">
                                    Cafés agregados al envío
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-500">
                                    {retailLines
                                      .reduce((sum, l) => sum + l.units, 0)
                                      .toFixed(0)}{' '}
                                    bolsas
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                  {retailLines.map(line => (
                                    <div
                                      key={line.id}
                                      className="flex items-center justify-between text-xs text-stone-700"
                                    >
                                      <span className="font-bold uppercase tracking-wide">
                                        {line.coffeeName} • {line.bagType} •{' '}
                                        {line.grindType === 'molido'
                                          ? 'Molido'
                                          : 'Grano'}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-stone-500">
                                          {line.units} bolsas
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setRetailLines(prev =>
                                              prev.filter(l => l.id !== line.id)
                                            )
                                          }
                                          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-600"
                                        >
                                          Quitar
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {activeMode === 'Armado de Pedido' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                Tipo de carga
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdditionalInfo({
                                      ...additionalInfo,
                                      packagingType: 'grainpro'
                                    })
                                  }
                                  className={`p-3 border flex flex-col items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${
                                    additionalInfo.packagingType === 'grainpro'
                                      ? 'bg-black text-white border-black'
                                      : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                                  }`}
                                >
                                  GrainPro
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdditionalInfo({
                                      ...additionalInfo,
                                      packagingType: 'bags'
                                    })
                                  }
                                  className={`p-3 border flex flex-col items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${
                                    additionalInfo.packagingType === 'bags'
                                      ? 'bg-black text-white border-black'
                                      : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                                  }`}
                                >
                                  Bolsas
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                Cantidad a despachar (Kg)
                              </p>
                              <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                required
                                className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                                value={productionValue || ''}
                                onChange={e =>
                                  setProductionValue(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>

                            {(additionalInfo.packagingType === 'bags' ||
                              additionalInfo.packagingType === 'grainpro') && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                  Cantidad de bolsas
                                </p>
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors"
                                  value={additionalInfo.bagsUsed || ''}
                                  onChange={e =>
                                    setAdditionalInfo({
                                      ...additionalInfo,
                                      bagsUsed: parseInt(e.target.value, 10) || 0
                                    })
                                  }
                                />
                              </div>
                            )}

                            {selectedOrderForActivities.type === 'Servicio de Tueste' && (
                              <div className="flex items-center gap-3">
                                <input
                                  id="mark-ready"
                                  type="checkbox"
                                  className="w-4 h-4 border-stone-300"
                                  checked={additionalInfo.markOrderReady}
                                  onChange={e =>
                                    setAdditionalInfo({
                                      ...additionalInfo,
                                      markOrderReady: e.target.checked
                                    })
                                  }
                                />
                                <label
                                  htmlFor="mark-ready"
                                  className="text-xs font-bold text-stone-700 uppercase tracking-[0.2em]"
                                >
                                  Marcar pedido listo para despacho
                                </label>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={resetActivityForm}
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-black"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.25em] hover:bg-stone-800 border border-black"
                          >
                            Guardar actividad
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="border border-dashed border-stone-300 p-6 text-center text-xs text-stone-400 font-medium uppercase tracking-[0.2em]">
                    Solo usuarios autorizados pueden registrar actividades
                  </div>
                )}
              </div>
            </div>

            {canEdit &&
              areAllRequiredActivitiesCompleted(selectedOrderForActivities) &&
              selectedOrderForActivities.status !== 'Enviado' &&
              selectedOrderForActivities.status !== 'Facturado' && (
                <div className="absolute bottom-4 right-4">
                  <button
                    type="button"
                    onClick={() => handleSendOrder(selectedOrderForActivities)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-700 shadow-lg"
                  >
                    Enviar
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
