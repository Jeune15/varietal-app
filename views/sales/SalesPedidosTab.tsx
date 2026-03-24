import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../../db';
import { SalesOrder } from '../../types';
import { ClipboardList, Clock, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Package, Trash2, X, ChevronLeft } from 'lucide-react';

const SalesPedidosTab: React.FC = () => {
  const orders = useLiveQuery(() => db.salesOrders.toArray()) || [];
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const pendingOrders = useMemo(
    () => orders
      .filter(o => o.status === 'pendiente')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const deliveredOrders = useMemo(
    () => orders
      .filter(o => o.status === 'despachado')
      .sort((a, b) => new Date(b.despachadoAt || b.createdAt).getTime() - new Date(a.despachadoAt || a.createdAt).getTime())
      .slice(0, 20), // Show last 20 delivered
    [orders]
  );

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const totalPendingAmount = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + o.total, 0),
    [pendingOrders]
  );

  const markAsDelivered = async (order: SalesOrder) => {
    const now = new Date().toISOString();
    const updatedOrder = {
      ...order,
      status: 'despachado' as const, // Changed from entregado to despachado
      despachadoAt: now,
    };
    await db.salesOrders.update(order.id, updatedOrder);
    await syncToCloud('salesOrders', updatedOrder);

    // Auto-add as income to current month's cash register
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthStartStr = startOfMonth.toISOString();

    // Find or create register for this month
    const registers = await db.cashRegisters.toArray();
    let register = registers.find(r => r.monthStart === monthStartStr);

    if (register) {
      const newEntry = {
        id: crypto.randomUUID(),
        registerId: register.id,
        type: 'ingreso' as const,
        amount: order.total,
        description: `Pedido: ${order.orderName}`,
        orderId: order.id,
        createdAt: now,
      };
      const updatedEntries = [...register.entries, newEntry];
      const totalIncome = updatedEntries.filter(e => e.type === 'ingreso').reduce((s, e) => s + e.amount, 0);
      const updatedRegister = {
        ...register,
        entries: updatedEntries,
        totalIncome,
      };
      await db.cashRegisters.update(register.id, updatedRegister);
      await syncToCloud('cashRegisters', updatedRegister);
    }

    setSelectedOrderId(null);
  };

  const deleteOrder = async (orderId: string) => {
    await db.salesOrders.delete(orderId);
    // Again, handle cloud deletion elsewhere or implement soft delete
    setDeleteConfirm(null);
    if (selectedOrderId === orderId) setSelectedOrderId(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      {/* Left: Orders List */}
      <div className={`flex-1 flex flex-col min-w-0 border-r-0 lg:border-r border-stone-200 dark:border-stone-800 ${selectedOrder ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 py-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-black dark:text-white tracking-tighter uppercase">Pedidos Pendientes</h2>
              <p className="text-xs text-stone-500 mt-1">
                {pendingOrders.length} pendiente{pendingOrders.length !== 1 ? 's' : ''}
                {pendingOrders.length > 0 && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    · S/ {totalPendingAmount.toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending Orders */}
          {pendingOrders.length === 0 ? (
            <div className="text-center py-16 text-stone-400 dark:text-stone-600">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay pedidos pendientes</p>
              <p className="text-xs mt-1">Los pedidos creados aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {pendingOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left px-4 py-4 flex items-center gap-3 transition-colors ${
                    selectedOrderId === order.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{order.orderName}</p>
                    <p className="text-[11px] text-stone-400 truncate">{order.clientName} · {order.items.length} items</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/ {order.total.toFixed(2)}</p>
                    <p className="text-[10px] text-stone-400">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Delivered Orders Section */}
          {deliveredOrders.length > 0 && (
            <div className="border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowDelivered(!showDelivered)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                    Despachados ({deliveredOrders.length})
                  </span>
                </div>
                {showDelivered ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>
              {showDelivered && (
                <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {deliveredOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors opacity-70 ${
                        selectedOrderId === order.id
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 opacity-100'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-600 dark:text-stone-400 truncate">{order.orderName}</p>
                        <p className="text-[10px] text-stone-400 truncate">{order.clientName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-stone-500">S/ {order.total.toFixed(2)}</p>
                        <p className="text-[9px] text-stone-400">
                          {order.despachadoAt ? formatDate(order.despachadoAt) : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Order Detail */}
      <div className={`w-full lg:w-[380px] flex-shrink-0 bg-white dark:bg-stone-900 border-t lg:border-t-0 border-stone-200 dark:border-stone-800 flex-col absolute inset-0 lg:relative lg:flex ${selectedOrder ? 'flex z-10' : 'hidden lg:flex'}`}>
        {!selectedOrder ? (
          <div className="flex-1 flex items-center justify-center text-stone-300 dark:text-stone-700">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">Selecciona un pedido</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="lg:hidden p-1.5 -ml-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{selectedOrder.orderName}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{selectedOrder.clientName}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{formatDate(selectedOrder.createdAt)} • {formatTime(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      selectedOrder.status === 'pendiente'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {selectedOrder.status === 'pendiente' ? 'Pendiente' : 'Despachado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] lg:min-h-0">
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {selectedOrder.items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{item.productName}</p>
                      {item.observation && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">📝 {item.observation}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 flex-shrink-0">×{item.quantity}</span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex-shrink-0 w-16 text-right">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200 dark:border-stone-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Total</span>
                <span className="text-2xl font-black text-black dark:text-white">S/ {selectedOrder.total.toFixed(2)}</span>
              </div>
              {selectedOrder.status === 'pendiente' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(selectedOrder.id)}
                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => markAsDelivered(selectedOrder)}
                    className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como Producido
                  </button>
                </div>
              )}
              {selectedOrder.status === 'despachado' && selectedOrder.despachadoAt && (
                <p className="text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                  ✓ Despachado a Equipo el {formatDate(selectedOrder.despachadoAt)} a las {formatTime(selectedOrder.despachadoAt)}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <button onClick={() => setDeleteConfirm(null)} className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-bold">¿Eliminar este pedido?</p>
              <p className="text-xs text-stone-500">Esta acción no se puede deshacer</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                  Cancelar
                </button>
                <button
                  onClick={() => deleteOrder(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
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

export default SalesPedidosTab;
