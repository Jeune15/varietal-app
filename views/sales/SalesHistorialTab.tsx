import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CashRegister, SalesOrder } from '../../types';
import { History, Calendar, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, Package, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    () => orders.filter(o => o.invoicedAt).sort((a, b) => new Date(b.invoicedAt!).getTime() - new Date(a.invoicedAt!).getTime()),
    [orders]
  );

  const [groupBy, setGroupBy] = React.useState<'day' | 'week'>('day');

  // Group by day or week
  const groupedData = useMemo(() => {
    const map = new Map<string, WeekSummary>();

    for (const order of deliveredOrders) {
      const deliveredDate = new Date(order.invoicedAt!);
      let key = '';
      let endKey = '';

      if (groupBy === 'day') {
        key = deliveredDate.toISOString().split('T')[0];
        endKey = key;
      } else {
        const day = deliveredDate.getDay() || 7;
        const monday = new Date(deliveredDate);
        monday.setDate(deliveredDate.getDate() - day + 1);
        monday.setHours(0, 0, 1, 0);
        key = monday.toISOString().split('T')[0];

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endKey = sunday.toISOString().split('T')[0];
      }

      if (!map.has(key)) {
        map.set(key, {
          weekStart: key,
          weekEnd: endKey,
          register: null,
          deliveredOrders: [],
          totalSales: 0,
        });
      }

      const group = map.get(key)!;
      group.deliveredOrders.push(order);
      group.totalSales += order.total;
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  }, [deliveredOrders, groupBy]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  const formatDateFull = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const downloadPDF = (group: WeekSummary) => {
    const doc = new jsPDF();
    const title = groupBy === 'day' 
      ? `Resumen de Ventas - Día: ${formatDate(group.weekStart)}` 
      : `Resumen de Ventas - Semana: ${formatDate(group.weekStart)} al ${formatDate(group.weekEnd)}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = group.deliveredOrders.map(order => {
      const itemsStr = order.items.map(i => `${i.quantity}x ${i.productName}`).join('\n');
      const coffeeStr = order.usedRoastedCoffee?.map(c => `${c.qtyKg}kg ${c.variety}`).join('\n') || '-';
      const bagsStr = order.usedUtilityBags?.map(b => `${b.qty}x ${b.format}`).join('\n') || '-';
      const shippingStr = order.shippingCost ? `S/${order.shippingCost} (${order.shippingPaidBy})` : '-';
      
      return [
        order.clientName,
        itemsStr,
        coffeeStr,
        bagsStr,
        shippingStr,
        `S/ ${order.total.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Cliente', 'Productos', 'Café Usado', 'Bolsas', 'Envío', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Ingresos: S/ ${group.totalSales.toFixed(2)}`, 14, finalY);

    doc.save(`Ventas_${group.weekStart}.pdf`);
  };

  if (groupedData.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-6 mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen semanal de ventas</p>
        </div>
        <div className="text-center py-16 text-stone-400 dark:text-stone-600">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay historial aún</p>
          <p className="text-xs mt-1">El historial aparecerá cuando se despachen pedidos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial de Facturación</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen de pedidos facturados</p>
        </div>
        <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-md">
            <button
              onClick={() => setGroupBy('day')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${groupBy === 'day' ? 'bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white' : 'text-stone-500 hover:text-black dark:hover:text-white'}`}
            >
              Por Día
            </button>
            <button
              onClick={() => setGroupBy('week')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${groupBy === 'week' ? 'bg-white dark:bg-stone-800 shadow-sm text-black dark:text-white' : 'text-stone-500 hover:text-black dark:hover:text-white'}`}
            >
              Por Semana
            </button>
          </div>
      </div>

      <div className="space-y-4">
        {groupedData.map(group => {
          const isExpanded = expandedWeek === group.weekStart;
          const balance = group.totalSales; // You might want to update this if you need actual balance logic

          return (
            <div key={group.weekStart} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : group.weekStart)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {groupBy === 'day' ? formatDate(group.weekStart) : `${formatDate(group.weekStart)} — ${formatDate(group.weekEnd)}`}
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">
                    {group.deliveredOrders.length} pedido{group.deliveredOrders.length !== 1 ? 's' : ''} facturado{group.deliveredOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-4">
                  <div>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">S/ {group.totalSales.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(group);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors"
                    title="Descargar PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expandable Detail */}
              {isExpanded && (
                <div className="border-t border-stone-100 dark:border-stone-800">
                  {/* Delivered Orders */}
                  <div className="p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Pedidos Facturados</h4>
                    {group.deliveredOrders.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-4">Sin pedidos facturados</p>
                    ) : (
                      <div className="space-y-2">
                        {group.deliveredOrders.map(order => (
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
                                {order.usedRoastedCoffee?.map((c, i) => (
                                  <span key={`coffee-${i}`} className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                    {c.qtyKg}kg {c.variety}
                                  </span>
                                ))}
                                {order.shippingCost ? (
                                  <span className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    Envío: S/{order.shippingCost} ({order.shippingPaidBy})
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">S/ {order.total.toFixed(2)}</p>
                              {order.invoicedAt && (
                                <p className="text-[9px] text-stone-400 mt-0.5">
                                  {formatDateFull(order.invoicedAt)} · {formatTime(order.invoicedAt)}
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
