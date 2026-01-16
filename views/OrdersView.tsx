import React, { useState } from 'react';
import { db, syncToCloud, getSupabase } from '../db';
import { Order, OrderType, OrderLine } from '../types';
import { Plus, Clock, Filter, CheckCircle2, User, Coffee as CoffeeIcon, X, LayoutGrid, List, ArrowRight, Truck, PackageCheck, Flame, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Props {
  orders: Order[];
}

interface OrderCardProps { 
  order: Order; 
  onNext?: (order: Order) => void;
  onPrev?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  isFinal?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onNext, onPrev, onDelete, isFinal }) => (
  <div className="bg-white p-6 border border-stone-200 hover:border-black transition-all group relative flex flex-col gap-4">
    {onDelete && (
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(order); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-600"
        title="Eliminar pedido"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
    <div className="flex justify-between items-start">
      <div>
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
          {order.orderLines && order.orderLines.length > 0
            ? 'Múltiples cafés'
            : order.variety}
        </span>
        <h4 className="font-black text-black text-lg leading-tight mt-1">{order.clientName}</h4>
      </div>
      <span className="text-[10px] font-mono border border-stone-200 px-1.5 py-0.5 text-stone-400">#{order.id.slice(-4)}</span>
    </div>
    
    <div className="flex flex-col gap-2 text-xs text-stone-600 font-medium border-t border-stone-100 pt-3">
      {order.orderLines && order.orderLines.length > 0 && (
        <div className="space-y-1">
          {order.orderLines.slice(0, 3).map(line => (
            <div key={line.id} className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>{line.variety}</span>
              <span>{line.quantityKg.toFixed(2)} Kg</span>
            </div>
          ))}
          {order.orderLines.length > 3 && (
            <div className="text-[9px] text-stone-400 font-mono">
              +{order.orderLines.length - 3} más
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="font-bold">{order.quantityKg.toFixed(2)} Kg</span>
        <span className="text-stone-300">|</span>
        <span className="uppercase tracking-wide text-[10px] font-bold">
          {order.type === 'Servicio de Tueste' ? 'Servicio' : 'Venta'}
        </span>
      </div>
    </div>

    <div className="flex justify-between items-center mt-auto pt-2">
      <div className="flex gap-1">
        {onPrev && (
          <button 
            onClick={() => onPrev(order)}
            className="opacity-0 group-hover:opacity-100 transition-opacity border border-stone-200 text-stone-400 p-2 hover:bg-stone-100 hover:text-black hover:border-black"
            title="Volver etapa anterior"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {!isFinal && onNext && (
          <button 
            onClick={() => onNext(order)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-2 hover:bg-stone-800"
            title="Avanzar estado"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
    
    <div className="w-full bg-stone-100 h-0.5 overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 ${order.progress === 100 ? 'bg-black' : 'bg-stone-400'}`}
        style={{ width: `${Number.isNaN(order.progress) ? 0 : order.progress}%` }}
      />
    </div>
  </div>
);

const KanbanColumn: React.FC<{
  title: string;
  orders: Order[];
  onNext?: (order: Order) => void;
  onPrev?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  isFinal?: boolean;
}> = ({ title, orders, onNext, onPrev, onDelete, isFinal }) => (
  <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-[calc(100vh-200px)]">
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
      <h4 className="font-black text-black text-xs uppercase tracking-widest">{title}</h4>
      <span className="text-[10px] font-bold text-stone-400">
        {orders.length}
      </span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-stone-200">
      {orders.length === 0 ? (
        <div className="h-24 border border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-[10px] font-bold uppercase tracking-widest">
          Sin pedidos
        </div>
      ) : (
        orders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onNext={onNext}
            onPrev={onPrev}
            onDelete={onDelete}
            isFinal={isFinal}
          />
        ))
      )}
    </div>
  </div>
);

const OrdersView: React.FC<Props> = ({ orders }) => {
  const { canEdit, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  
  // Shipping Modal State
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<Order | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);

  const createInitialFormData = () => ({
    clientName: '',
    variety: '',
    type: 'Venta Café Tostado' as OrderType,
    roastType: '',
    quantityKg: 0,
    entryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requiresRoasting: true
  });
  const [formData, setFormData] = useState(createInitialFormData);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [description, setDescription] = useState('');

  const resetFormState = () => {
    setFormData(createInitialFormData());
    setOrderLines([]);
    setDescription('');
  };

  const addCurrentLine = () => {
    const variety = formData.variety.trim();
    const quantity = formData.quantityKg;
    if (!variety || !quantity || quantity <= 0) {
      showToast('Ingresa variedad y kilos mayores a 0', 'error');
      return;
    }
    const line: OrderLine = {
      id: Math.random().toString(36).substr(2, 9),
      variety,
      quantityKg: quantity
    };
    setOrderLines(prev => [...prev, line]);
    setFormData(prev => ({
      ...prev,
      variety: '',
      quantityKg: 0
    }));
  };

  const removeLine = (id: string) => {
    setOrderLines(prev => prev.filter(l => l.id !== id));
  };

  const generateFromDescription = () => {
    const text = description.trim();
    if (!text) {
      showToast('Escribe una descripción del pedido', 'error');
      return;
    }
    let clientName = formData.clientName;
    let variety = formData.variety;
    let quantity = formData.quantityKg;
    let type: OrderType = formData.type;
    let requiresRoasting = formData.requiresRoasting;

    const clientMatch = text.match(/cliente\s+(?:llamado|llamada)?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+)*)/i);
    if (clientMatch) {
      clientName = clientMatch[1].trim();
    }

    const varietyMatch = text.match(/variedad\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]+?)(?=,|\.|\s+quiere|\s+para|$)/i);
    if (varietyMatch) {
      variety = varietyMatch[1].trim();
    }

    const qtyMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilos)/i);
    if (qtyMatch) {
      const parsed = parseFloat(qtyMatch[1].replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        quantity = parsed;
      }
    }

    const lower = text.toLowerCase();
    if (lower.includes('servicio de tueste') || lower.includes('servicio de tost')) {
      type = 'Servicio de Tueste';
    } else if (lower.includes('venta')) {
      type = 'Venta Café Tostado';
    }

    if (type === 'Servicio de Tueste') {
      requiresRoasting = true;
    }

    setFormData(prev => ({
      ...prev,
      clientName: clientName || prev.clientName,
      variety: variety || prev.variety,
      quantityKg: quantity || prev.quantityKg,
      type,
      requiresRoasting
    }));

    showToast('Datos propuestos a partir de la descripción. Revisa y ajusta antes de crear el pedido.', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const lines: OrderLine[] = [...orderLines];
    if (formData.variety.trim() && formData.quantityKg > 0) {
      lines.push({
        id: Math.random().toString(36).substr(2, 9),
        variety: formData.variety.trim(),
        quantityKg: formData.quantityKg
      });
    }
    const hasLines = lines.length > 0;
    const totalQuantity = hasLines ? lines.reduce((sum, l) => sum + l.quantityKg, 0) : formData.quantityKg;
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
      quantityKg: totalQuantity,
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

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-black pb-6">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black tracking-tighter">PEDIDOS</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em]">Gestión de Demanda Activa</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex border border-stone-200 p-1 bg-white">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'text-stone-400 hover:text-black'}`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-3 transition-all ${viewMode === 'board' ? 'bg-black text-white' : 'text-stone-400 hover:text-black'}`}
              title="Vista Tablero"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => { resetFormState(); setShowModal(true); }}
            className="group flex-1 sm:flex-none bg-white border border-black text-black px-8 py-3 flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all duration-300"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nuevo Pedido</span>
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-white border-b border-black">
                <tr>
                  <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em]">Detalle</th>
                  <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em]">Entrega</th>
                  <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-6 py-6 text-[10px] font-black text-black uppercase tracking-[0.2em] text-right">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-stone-400 text-xs font-mono uppercase tracking-widest">
                      Sin pedidos activos
                    </td>
                  </tr>
                ) : (
                  orders.filter(o => o.status !== 'Facturado').map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="font-bold text-black text-sm tracking-tight">{o.clientName}</div>
                        <div className="text-[9px] text-stone-400 font-mono mt-1">ID: {o.id.slice(-4)}</div>
                      </td>
                      <td className="px-6 py-6">
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
                                {o.type} • {o.quantityKg.toFixed(2)} Kg totales
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">{o.variety}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{o.type} • {o.quantityKg.toFixed(2)} Kg</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-xs text-stone-500 font-mono">{o.dueDate}</td>
                      <td className="px-6 py-6">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col items-end gap-2">
                          <div className="w-24 bg-stone-100 h-0.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${o.progress === 100 ? 'bg-black' : 'bg-stone-400'}`}
                              style={{ width: `${Number.isNaN(o.progress) ? 0 : o.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-mono text-stone-400">{Number.isNaN(o.progress) ? 0 : o.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 overflow-x-auto pb-4">
          <KanbanColumn 
            title="Pendiente" 
            orders={orders.filter(o => o.status === 'Pendiente')} 
            onNext={canEdit ? (o) => handleStatusChange(o, 'En Producción') : undefined}
            onDelete={isAdmin ? handleDeleteOrder : undefined}
          />
          <KanbanColumn 
            title="En Producción" 
            orders={orders.filter(o => o.status === 'En Producción')} 
            onNext={canEdit ? (o) => handleStatusChange(o, 'Listo para Despacho') : undefined}
            onPrev={canEdit ? (o) => handleStatusChange(o, 'Pendiente') : undefined}
          />
          <KanbanColumn 
            title="Listo para Despacho" 
            orders={orders.filter(o => o.status === 'Listo para Despacho')} 
            onNext={canEdit ? (o) => handleStatusChange(o, 'Enviado') : undefined}
            onPrev={canEdit ? (o) => handleStatusChange(o, 'En Producción') : undefined}
          />
          <KanbanColumn 
            title="Enviado / Facturado" 
            orders={orders.filter(o => o.status === 'Enviado')} 
            isFinal
            onPrev={canEdit ? (o) => handleStatusChange(o, 'Listo para Despacho') : undefined}
          />
        </div>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => { setShowModal(false); resetFormState(); }}
        >
          <div 
            className="bg-white w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-black"
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
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Descripción del pedido</label>
                  <textarea
                    className="w-full min-h-[80px] bg-white border border-stone-200 focus:border-black outline-none text-xs font-medium transition-colors placeholder:text-stone-300 p-3"
                    placeholder="Ejemplo: Llegó un cliente llamado Andrés con 10 kg de caturra para servicio de tueste..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={generateFromDescription}
                    className="px-4 py-2 border border-stone-200 hover:border-black text-[10px] font-black uppercase tracking-[0.2em] bg-white hover:bg-stone-50 transition-colors"
                  >
                    Proponer datos
                  </button>
                </div>
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
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Nombre de Café</label>
                      <input 
                        type="text" 
                        placeholder="Café Variedad..." 
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
                        onChange={e => setFormData({...formData, type: e.target.value as OrderType})}
                      >
                        <option value="Venta Café Tostado">Venta Café Tostado</option>
                        <option value="Servicio de Tueste">Servicio de Tueste</option>
                      </select>
                    </div>
                  </div>

                  {formData.type === 'Servicio de Tueste' && (
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                        ¿Requiere tueste?
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, requiresRoasting: true }))}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            formData.requiresRoasting
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, requiresRoasting: false }))}
                          className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.2em] ${
                            !formData.requiresRoasting
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Kg</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.0" 
                        className="w-full py-3 bg-white border-b border-stone-200 focus:border-black outline-none text-sm font-bold transition-colors placeholder:text-stone-300" 
                        value={formData.quantityKg || ''} 
                        onChange={e => setFormData({...formData, quantityKg: parseFloat(e.target.value) || 0})} 
                      />
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
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
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
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
    </div>
  );
};

export default OrdersView;
