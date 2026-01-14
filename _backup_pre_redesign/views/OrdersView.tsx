
import React, { useState } from 'react';
import { db, syncToCloud, getSupabase } from '../db';
import { Order, OrderType } from '../types';
import { Plus, Clock, Filter, CheckCircle2, User, Coffee as CoffeeIcon, X, LayoutGrid, List, ArrowRight, Truck, PackageCheck, Flame, Trash2 } from 'lucide-react';

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
  <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all group relative">
    {onDelete && (
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(order); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-500"
        title="Eliminar pedido"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
    <div className="flex justify-between items-start mb-2 pr-6">
      <div>
        <h4 className="font-bold text-stone-900 text-sm">{order.clientName}</h4>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-0.5">{order.variety}</span>
      </div>
      <span className="text-[10px] font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{order.id.slice(-4)}</span>
    </div>
    
    <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-3">
      <span className="bg-stone-50 px-2 py-1 rounded-md border border-stone-100">{order.quantityKg} Kg</span>
      <span className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide ${
        order.type === 'Servicio de Tueste' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
      }`}>
        {order.type === 'Servicio de Tueste' ? 'Servicio' : 'Venta'}
      </span>
    </div>

    <div className="flex justify-between items-center mt-2">
      <div className="flex gap-1">
        {onPrev && (
          <button 
            onClick={() => onPrev(order)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 text-stone-500 p-1.5 rounded-lg hover:bg-stone-200 hover:text-stone-700"
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
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white p-1.5 rounded-lg hover:bg-black"
            title="Avanzar estado"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
    
    <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden mt-3">
      <div 
        className={`h-full transition-all duration-500 ${order.progress === 100 ? 'bg-emerald-500' : 'bg-stone-900'}`}
        style={{ width: `${order.progress}%` }}
      />
    </div>
  </div>
);

const KanbanColumn: React.FC<{
  title: string;
  orders: Order[];
  color: string;
  bg: string;
  icon: React.ReactNode;
  onNext?: (order: Order) => void;
  onPrev?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  isFinal?: boolean;
}> = ({ title, orders, color, bg, icon, onNext, onPrev, onDelete, isFinal }) => (
  <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-[calc(100vh-200px)]">
    <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl border ${color} ${bg}`}>
      {icon}
      <h4 className="font-bold text-stone-700 text-sm uppercase tracking-wide flex-1">{title}</h4>
      <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-bold text-stone-600 border border-white/20">
        {orders.length}
      </span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-stone-200">
      {orders.length === 0 ? (
        <div className="h-24 border-2 border-dashed border-stone-100 rounded-xl flex items-center justify-center text-stone-300 text-xs font-medium italic">
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
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [formData, setFormData] = useState({
    clientName: '',
    variety: '',
    type: 'Venta Café Tostado' as OrderType,
    quantityKg: 0,
    entryDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pendiente',
      progress: 0,
      requiresRoasting: true, // Default assumption, logic can be refined
      ...formData
    };
    await db.orders.add(newOrder);
    await syncToCloud('orders', newOrder);
    
    setShowModal(false);
    setFormData({
      clientName: '',
      variety: '',
      type: 'Venta Café Tostado' as OrderType,
      quantityKg: 0,
      entryDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    // Intercept "Listo para Despacho" -> "Enviado" to ask for shipping cost
    if (newStatus === 'Enviado' && order.status !== 'Enviado') {
      const shippingCostStr = window.prompt("Ingrese el costo de envío (0 si no aplica):", "0");
      if (shippingCostStr === null) return; // Cancelled

      const shippingCost = parseFloat(shippingCostStr) || 0;
      
      const updates: Partial<Order> = { 
        status: newStatus,
        shippingCost,
        shippedDate: new Date().toISOString()
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
  };

  const handleDeleteOrder = async (order: Order) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido de ${order.clientName}? Esta acción no se puede deshacer.`)) {
      await db.orders.delete(order.id);
      // For cloud sync delete, we might need a specific delete function or just ignore if strict sync isn't set up for deletes yet.
      // Assuming syncToCloud handles upsert, we might need a deleteFromCloud helper, but for now let's just delete locally 
      // and assume the user knows. If we had full sync:
      // await deleteFromCloud('orders', order.id);
      
      // Since syncToCloud is upsert-only in current implementation, we'll just log it.
      // Ideally, we should implement a delete sync. For now, local delete is immediate.
      if (getSupabase()) {
        await getSupabase().from('orders').delete().eq('id', order.id);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Pendiente': 'bg-stone-100 text-stone-500 border-stone-200',
      'En Producción': 'bg-blue-50 text-blue-600 border-blue-100',
      'Listo para Despacho': 'bg-amber-50 text-amber-700 border-amber-100',
      'Enviado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Facturado': 'bg-purple-50 text-purple-700 border-purple-100'
    };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Pedidos</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Gestión de Demanda Activa</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Detalle</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Entrega Estimada</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-stone-400 font-medium text-sm italic">
                      Sin pedidos activos en el sistema.
                    </td>
                  </tr>
                ) : (
                  orders.filter(o => o.status !== 'Facturado').map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-stone-900 text-sm tracking-tight">{o.clientName}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">ID: {o.id.slice(-4)}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-stone-700 tracking-tight">{o.variety}</span>
                          <span className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">{o.type} • {o.quantityKg.toFixed(2)} Kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-stone-500 font-bold uppercase tracking-wider">{o.dueDate}</td>
                      <td className="px-6 py-5">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${o.progress === 100 ? 'bg-emerald-500' : 'bg-stone-900'}`}
                              style={{ width: `${o.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-stone-400">{o.progress}%</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
          <KanbanColumn 
            title="Pendiente" 
            orders={orders.filter(o => o.status === 'Pendiente')} 
            color="border-stone-200"
            bg="bg-stone-50"
            icon={<Clock className="w-4 h-4" />}
            onNext={(o) => handleStatusChange(o, 'En Producción')}
            onDelete={handleDeleteOrder}
          />
          <KanbanColumn 
            title="En Producción" 
            orders={orders.filter(o => o.status === 'En Producción')} 
            color="border-blue-200"
            bg="bg-blue-50/50"
            icon={<CoffeeIcon className="w-4 h-4 text-blue-600" />}
            onNext={(o) => handleStatusChange(o, 'Listo para Despacho')}
            onPrev={(o) => handleStatusChange(o, 'Pendiente')}
          />
          <KanbanColumn 
            title="Listo para Despacho" 
            orders={orders.filter(o => o.status === 'Listo para Despacho')} 
            color="border-amber-200"
            bg="bg-amber-50/50"
            icon={<PackageCheck className="w-4 h-4 text-amber-600" />}
            onNext={(o) => handleStatusChange(o, 'Enviado')}
            onPrev={(o) => handleStatusChange(o, 'En Producción')}
          />
          <KanbanColumn 
            title="Enviado / Facturado" 
            orders={orders.filter(o => o.status === 'Enviado')} 
            color="border-emerald-200"
            bg="bg-emerald-50/50"
            icon={<Truck className="w-4 h-4 text-emerald-600" />}
            isFinal
            onPrev={(o) => handleStatusChange(o, 'Listo para Despacho')}
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-200">
            <div className="bg-stone-900 p-8 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xl font-bold tracking-tight">Nuevo Pedido</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Requerimientos del Cliente</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cliente</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-stone-400" />
                  <input type="text" required placeholder="Nombre del Cliente" className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-sm font-medium transition-all" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Variedad</label>
                  <input type="text" required placeholder="Café Variedad..." className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-sm font-medium transition-all" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Tipo de Pedido</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-xs font-semibold"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as OrderType})}
                  >
                    <option value="Venta Café Tostado">Venta Café Tostado</option>
                    <option value="Servicio de Tueste">Servicio de Tueste</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cant. Kg</label>
                  <input type="number" step="0.01" required placeholder="0.0" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-sm font-bold transition-all" value={formData.quantityKg} onChange={e => setFormData({...formData, quantityKg: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Ingreso</label>
                  <input type="date" required className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-xs font-semibold" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Entrega</label>
                  <input type="date" required className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none text-xs font-semibold" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-stone-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-[0.2em]">
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
