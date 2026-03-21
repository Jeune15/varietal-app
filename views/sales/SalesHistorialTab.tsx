import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CashRegister, SalesOrder } from '../../types';
import { History, Calendar, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  register: CashRegister | null;
  deliveredOrders: SalesOrder[];
  totalSales: number;
}

const SalesHistorialTab: React.FC = () => {
  const registers = useLiveQuery(() => db.cashRegisters.toArray()) || [];
  const orders = useLiveQuery(() => db.salesOrders.toArray()) || [];

  const [expandedWeek, setExpandedWeek] = React.useState<string | null>(null);

  const deliveredOrders = useMemo(
    () => orders.filter(o => o.status === 'entregado').sort((a, b) => new Date(b.deliveredAt!).getTime() - new Date(a.deliveredAt!).getTime()),
    [orders]
  );

  // Group by week
  const weekSummaries = useMemo(() => {
    const weeksMap = new Map<string, WeekSummary>();

    // Add weeks from registers
    for (const reg of registers) {
      weeksMap.set(reg.weekStart, {
        weekStart: reg.weekStart,
        weekEnd: reg.weekEnd,
        register: reg,
        deliveredOrders: [],
        totalSales: 0,
      });
    }

    // Add delivered orders to their respective weeks
    for (const order of deliveredOrders) {
      const deliveredDate = new Date(order.deliveredAt!);
      const day = deliveredDate.getDay() || 7;
      const monday = new Date(deliveredDate);
      monday.setDate(deliveredDate.getDate() - day + 1);
      monday.setHours(0, 0, 1, 0);
      const weekKey = monday.toISOString();

      if (!weeksMap.has(weekKey)) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 0);
        weeksMap.set(weekKey, {
          weekStart: weekKey,
          weekEnd: sunday.toISOString(),
          register: null,
          deliveredOrders: [],
          totalSales: 0,
        });
      }

      const week = weeksMap.get(weekKey)!;
      week.deliveredOrders.push(order);
      week.totalSales += order.total;
    }

    return Array.from(weeksMap.values()).sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }, [registers, deliveredOrders]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  const formatDateFull = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  if (weekSummaries.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-6 mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen semanal de ventas</p>
        </div>
        <div className="text-center py-16 text-stone-400 dark:text-stone-600">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay historial aún</p>
          <p className="text-xs mt-1">El historial aparecerá cuando se entreguen pedidos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen semanal de ventas</p>
      </div>

      <div className="space-y-4">
        {weekSummaries.map(week => {
          const isExpanded = expandedWeek === week.weekStart;
          const reg = week.register;
          const balance = reg
            ? reg.openingAmount + reg.totalIncome - reg.totalExpense
            : week.totalSales;

          return (
            <div key={week.weekStart} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              {/* Week Header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : week.weekStart)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {formatDate(week.weekStart)} — {formatDate(week.weekEnd)}
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">
                    {week.deliveredOrders.length} pedido{week.deliveredOrders.length !== 1 ? 's' : ''} entregado{week.deliveredOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/ {week.totalSales.toFixed(2)}</p>
                  {reg && (
                    <p className={`text-[10px] font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      Balance: S/ {balance.toFixed(2)}
                    </p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                )}
              </button>

              {/* Expandable Detail */}
              {isExpanded && (
                <div className="border-t border-stone-100 dark:border-stone-800">
                  {/* Cash Summary */}
                  {reg && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-stone-50 dark:bg-stone-800/30">
                      <MiniStat label="Apertura" value={reg.openingAmount} />
                      <MiniStat label="Ingresos" value={reg.totalIncome} color="emerald" />
                      <MiniStat label="Egresos" value={reg.totalExpense} color="red" />
                      <MiniStat label="Balance" value={balance} color={balance >= 0 ? 'emerald' : 'red'} />
                    </div>
                  )}

                  {/* Delivered Orders */}
                  <div className="p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Pedidos Entregados</h4>
                    {week.deliveredOrders.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-4">Sin pedidos entregados</p>
                    ) : (
                      <div className="space-y-2">
                        {week.deliveredOrders.map(order => (
                          <div key={order.id} className="flex items-start gap-3 bg-stone-50 dark:bg-stone-800/30 rounded-lg px-3 py-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{order.orderName}</p>
                              <p className="text-[10px] text-stone-400">{order.clientName}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.items.map(item => (
                                  <span key={item.id} className="text-[9px] bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-500">
                                    {item.quantity}× {item.productName}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">S/ {order.total.toFixed(2)}</p>
                              {order.deliveredAt && (
                                <p className="text-[9px] text-stone-400 mt-0.5">
                                  {formatDateFull(order.deliveredAt)} · {formatTime(order.deliveredAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; color?: 'emerald' | 'red' }> = ({ label, value, color }) => {
  const textColor = color === 'emerald'
    ? 'text-emerald-600 dark:text-emerald-400'
    : color === 'red'
      ? 'text-red-600 dark:text-red-400'
      : 'text-stone-700 dark:text-stone-300';

  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{label}</p>
      <p className={`text-sm font-black ${textColor}`}>S/ {value.toFixed(2)}</p>
    </div>
  );
};

export default SalesHistorialTab;
