import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { History, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AggregatedEntry {
  id: string;
  type: 'ingreso' | 'egreso';
  date: string;
  description: string;
  amount: number;
}

const EquipoCajaView: React.FC = () => {
  const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const salesOrders = useLiveQuery(() => db.salesOrders.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];

  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const entries: AggregatedEntry[] = useMemo(() => {
    const list: AggregatedEntry[] = [];

    // 1. Ingresos: Pedidos facturados desde Equipo Varietal (excluyendo los que son ventas directas pura, o incluyendo si vienen facturados desde panel admin?)
    // "Los pedidos ingresados y facturados en equipo varietal"
    // Normal orders don't have monetary totals directly stored. Wait, does Order have a total? 
    // Sales orders generated from sales module have totals. SalesOrders that are "Facturado" (invoicedAt) should be here.
    // If regular orders don't have money, they might not be quantifiable, but salesOrders marked as invoice from Equipo Varietal are.
    // Let's include everything from salesOrders that has "invoicedAt".
    const invoicedSalesOrders = salesOrders.filter(so => !!so.invoicedAt);
    for (const so of invoicedSalesOrders) {
      list.push({
        id: so.id,
        type: 'ingreso',
        date: so.invoicedAt!,
        description: `Ingreso - Pedido Facturado: ${so.orderName}`,
        amount: so.total || 0,
      });
    }

    // 2. Egresos: Gastos pagados
    const paidExpenses = expenses.filter(ex => ex.status === 'paid');
    for (const ex of paidExpenses) {
      list.push({
        id: ex.id,
        type: 'egreso',
        date: ex.date,
        description: `Egreso - Gasto: ${ex.reason} (${ex.paidBy || 'General'})`,
        amount: ex.amount || 0,
      });
    }

    // Filter by search
    let filteredList = list;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filteredList = filteredList.filter(item => 
        item.description.toLowerCase().includes(lower)
      );
    }

    // Filter by date
    if (dateFilter) {
      filteredList = filteredList.filter(item => 
        item.date.startsWith(dateFilter)
      );
    }

    return filteredList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesOrders, expenses, dateFilter, searchTerm]);

  const totalIngresos = entries.filter(e => e.type === 'ingreso').reduce((sum, e) => sum + e.amount, 0);
  const totalEgresos = entries.filter(e => e.type === 'egreso').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIngresos - totalEgresos;

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };
  const formatTime = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = 'Historial de Facturación - Equipo Varietal';
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Total Ingresos: S/ ${totalIngresos.toFixed(2)}`, 14, 45);
    doc.text(`Total Egresos: S/ ${totalEgresos.toFixed(2)}`, 14, 52);
    doc.text(`Balance Total: S/ ${balance.toFixed(2)}`, 14, 59);

    if (entries.length > 0) {
      const entryData = entries.map(e => [
        `${formatDate(e.date)} ${formatTime(e.date)}`,
        e.type.toUpperCase(),
        e.description,
        `S/ ${e.amount.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Fecha', 'Tipo', 'Descripción', 'Monto']],
        body: entryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 3 }
      });
    }

    doc.save(`Equipo_Caja_Historial.pdf`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 dark:border-stone-800 pb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial General</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Facturación total de equipo y gastos pagados</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar movimiento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold focus:border-black dark:focus:border-white focus:ring-0 w-full md:w-64 transition-colors text-black dark:text-white"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold focus:border-black dark:focus:border-white focus:ring-0 w-full md:w-40 transition-colors text-black dark:text-white"
          />
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest w-full md:w-auto hover:opacity-80 transition-opacity"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">Total Ingresos</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">S/ {totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">Total Gastos</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">S/ {totalEgresos.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">Balance General</p>
          <p className={`text-2xl font-black ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            S/ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-stone-400 dark:text-stone-600">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay registros de facturación o egresos.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  entry.type === 'ingreso'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <span className={`text-sm font-black ${
                    entry.type === 'ingreso'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {entry.type === 'ingreso' ? '+' : '-'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{entry.description}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{formatDate(entry.date)} · {formatTime(entry.date)}</p>
                </div>
                <div className={`text-sm font-black flex-shrink-0 ${
                  entry.type === 'ingreso'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  S/ {entry.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipoCajaView;
