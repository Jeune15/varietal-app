import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../../db';
import { CashRegister, CashEntry } from '../../types';
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, Lock, Unlock, X, ArrowUpCircle, ArrowDownCircle, Trash2, LockKeyhole, Calendar, FileDown, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function getMonthRange(date: Date = new Date()) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { 
    monthStart: startOfMonth.toISOString(), 
    monthEnd: endOfMonth.toISOString(), 
    startOfMonth, 
    endOfMonth 
  };
}

const SalesCajaTab: React.FC = () => {
  const registers = useLiveQuery(() => db.cashRegisters.toArray()) || [];
  const salesOrders = useLiveQuery(() => db.salesOrders.toArray()) || [];

  const { monthStart, monthEnd, startOfMonth, endOfMonth } = useMemo(() => getMonthRange(), []);

  const currentRegister = useMemo(
    () => registers.find(r => r.monthStart === monthStart) || null,
    [registers, monthStart]
  );

  // Auto-open register if it doesn't exist for current month
  useEffect(() => {
    if (!currentRegister && registers.length > 0) { // Check length to ensure DB is loaded
      const openCurrentMonth = async () => {
        const id = crypto.randomUUID();
        const newReg: CashRegister = {
          id,
          monthStart,
          monthEnd,
          openingAmount: 0,
          isOpen: true,
          entries: [],
          totalIncome: 0,
          totalExpense: 0,
        };
        await db.cashRegisters.add(newReg);
        await syncToCloud('cashRegisters', newReg);
      };
      openCurrentMonth();
    }
  }, [currentRegister, registers.length, monthStart, monthEnd]);

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incAmount, setIncAmount] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const openRegister = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return;
    const id = crypto.randomUUID();
    const newReg: CashRegister = {
      id,
      monthStart,
      monthEnd,
      openingAmount: amount,
      isOpen: true,
      entries: [],
      totalIncome: 0,
      totalExpense: 0,
    };
    await db.cashRegisters.add(newReg);
    await syncToCloud('cashRegisters', newReg);
    setShowOpenForm(false);
    setOpeningAmount('');
  };

  const addExpense = async () => {
    if (!currentRegister || !expAmount || !expDesc.trim()) return;
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newEntry: CashEntry = {
      id: crypto.randomUUID(),
      registerId: currentRegister.id,
      type: 'egreso',
      amount,
      description: expDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [...currentRegister.entries, newEntry];
    const totalExpense = updatedEntries.filter(e => e.type === 'egreso').reduce((s, e) => s + e.amount, 0);

    const updatedReg = {
      ...currentRegister,
      entries: updatedEntries,
      totalExpense,
    };
    await db.cashRegisters.update(currentRegister.id, updatedReg);
    await syncToCloud('cashRegisters', updatedReg);

    setShowExpenseForm(false);
    setExpAmount('');
    setExpDesc('');
  };

  const addIncome = async () => {
    if (!currentRegister || !incAmount || !incDesc.trim()) return;
    const amount = parseFloat(incAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newEntry: CashEntry = {
      id: crypto.randomUUID(),
      registerId: currentRegister.id,
      type: 'ingreso',
      amount,
      description: incDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [...currentRegister.entries, newEntry];
    const totalIncome = updatedEntries.filter(e => e.type === 'ingreso').reduce((s, e) => s + e.amount, 0);

    const updatedReg = {
      ...currentRegister,
      entries: updatedEntries,
      totalIncome,
    };
    await db.cashRegisters.update(currentRegister.id, updatedReg);
    await syncToCloud('cashRegisters', updatedReg);

    setShowIncomeForm(false);
    setIncAmount('');
    setIncDesc('');
  };

  const balance = currentRegister
    ? currentRegister.openingAmount + currentRegister.totalIncome - currentRegister.totalExpense
    : 0;

  // Compute month stats
  const { topProducts, bottomProducts } = useMemo(() => {
    if (!currentRegister) return { topProducts: [], bottomProducts: [] };
    
    // Filter sales orders for this month
    const monthOrders = salesOrders.filter(o => 
      o.status !== 'pendiente' && // consider dispatched/invoiced
      o.createdAt >= currentRegister.monthStart && 
      o.createdAt <= currentRegister.monthEnd
    );

    const productCounts: Record<string, number> = {};
    
    monthOrders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
      });
    });

    const sortedProducts = Object.entries(productCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    return {
      topProducts: sortedProducts.slice(0, 5),
      bottomProducts: sortedProducts.slice(-5).reverse() // Show least sold
    };
  }, [salesOrders, currentRegister]);

  const formatDate = (d: Date) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const formateDateISO = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

  const sortedEntries = useMemo(
    () => currentRegister?.entries.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [],
    [currentRegister]
  );

  const deleteEntry = async (entryId: string) => {
    if (!currentRegister) return;
    const updatedEntries = currentRegister.entries.filter(e => e.id !== entryId);
    const totalIncome = updatedEntries.filter(e => e.type === 'ingreso').reduce((s, e) => s + e.amount, 0);
    const totalExpense = updatedEntries.filter(e => e.type === 'egreso').reduce((s, e) => s + e.amount, 0);
    const updatedReg = {
      ...currentRegister,
      entries: updatedEntries,
      totalIncome,
      totalExpense,
    };
    await db.cashRegisters.update(currentRegister.id, updatedReg);
    await syncToCloud('cashRegisters', updatedReg);
    setDeleteEntryId(null);
  };

  const closeRegister = async () => {
    if (!currentRegister) return;
    const updatedReg = { ...currentRegister, isOpen: false };
    await db.cashRegisters.update(currentRegister.id, updatedReg);
    await syncToCloud('cashRegisters', updatedReg);
    setShowCloseConfirm(false);
  };

  return (
    <>
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Caja</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Mes: {formatDate(startOfMonth)} — {formatDate(endOfMonth)}
          </p>
        </div>
        {currentRegister && currentRegister.isOpen && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const doc = new jsPDF();
                const title = `Resumen de Caja - ${formatDate(startOfMonth)}`;
                
                doc.setFontSize(18);
                doc.text(title, 14, 22);
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
            
                // Summary
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text(`Apertura: S/ ${currentRegister.openingAmount.toFixed(2)}`, 14, 45);
                doc.text(`Ingresos: S/ ${currentRegister.totalIncome.toFixed(2)}`, 14, 52);
                doc.text(`Egresos: S/ ${currentRegister.totalExpense.toFixed(2)}`, 14, 59);
                doc.text(`Balance Final: S/ ${balance.toFixed(2)}`, 14, 66);
            
                // Top Products
                if (topProducts.length > 0) {
                  doc.setFontSize(14);
                  doc.text('Productos Más Vendidos', 14, 80);
                  const topData = topProducts.map((p, i) => [`${i+1}`, p.name, `${p.qty} unid.`]);
                  autoTable(doc, {
                    startY: 85,
                    head: [['#', 'Producto', 'Cantidad']],
                    body: topData,
                    theme: 'grid',
                    headStyles: { fillColor: [0, 0, 0] },
                  });
                }
            
                const finalY = (doc as any).lastAutoTable?.finalY || 80;
            
                // Entries
                if (sortedEntries.length > 0) {
                  doc.setFontSize(14);
                  doc.text('Movimientos de Caja', 14, finalY + 15);
                  const entryData = sortedEntries.map(e => [
                    formateDateISO(e.createdAt),
                    e.type.toUpperCase(),
                    e.description,
                    `S/ ${e.amount.toFixed(2)}`
                  ]);
                  autoTable(doc, {
                    startY: finalY + 20,
                    head: [['Fecha', 'Tipo', 'Descripción', 'Monto']],
                    body: entryData,
                    theme: 'grid',
                    headStyles: { fillColor: [0, 0, 0] },
                  });
                }
            
                doc.save(`Resumen_Caja_${monthStart.split('T')[0]}.pdf`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Resumen PDF
            </button>
            <button
              onClick={() => setShowIncomeForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Ingreso
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Egreso
            </button>
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Cerrar Caja"
            >
              <LockKeyhole className="w-4 h-4" />
            </button>
          </div>
        )}
        {currentRegister && !currentRegister.isOpen && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-lg">
            Caja cerrada
          </span>
        )}
      </div>

      {/* Not opened - Shouldn't happen often now, but fallback */}
      {!currentRegister ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-stone-400 dark:text-stone-500" />
          </div>
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">Cargando caja del mes...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              label="Apertura"
              value={currentRegister.openingAmount}
              icon={<Wallet className="w-5 h-5" />}
              color="stone"
            />
            <SummaryCard
              label="Ingresos"
              value={currentRegister.totalIncome}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />
            <SummaryCard
              label="Egresos"
              value={currentRegister.totalExpense}
              icon={<TrendingDown className="w-5 h-5" />}
              color="red"
            />
            <SummaryCard
              label="Balance"
              value={balance}
              icon={<DollarSign className="w-5 h-5" />}
              color={balance >= 0 ? 'emerald' : 'red'}
              highlight
            />
          </div>

          {/* Month Stats */}
          <div className="bg-stone-50 dark:bg-stone-800/30 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Estadísticas del Mes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Productos más vendidos</p>
                {topProducts.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">No hay ventas registradas aún.</p>
                ) : (
                  <ul className="space-y-2">
                    {topProducts.map((p, idx) => (
                      <li key={p.name} className="flex justify-between items-center text-xs">
                        <span className="font-medium flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 font-mono w-4">{idx + 1}.</span> 
                          {p.name}
                        </span>
                        <span className="font-bold text-emerald-600">{p.qty} unid.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Sugerencias de rotación</p>
                {bottomProducts.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">No hay suficientes datos para sugerir.</p>
                ) : (
                  <ul className="space-y-2">
                    {bottomProducts.map((p, idx) => (
                      <li key={p.name} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-stone-600 dark:text-stone-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {p.name}
                        </span>
                        <span className="text-[10px] text-stone-400">Solo {p.qty} unid.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">
              Movimientos ({sortedEntries.length})
            </h3>
            {sortedEntries.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <p className="text-xs">No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      entry.type === 'ingreso'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {entry.type === 'ingreso' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{entry.description}</p>
                      <p className="text-[10px] text-stone-400">{formateDateISO(entry.createdAt)} · {formatTime(entry.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${
                      entry.type === 'ingreso'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {entry.type === 'ingreso' ? '+' : '-'} S/ {entry.amount.toFixed(2)}
                    </span>
                    {currentRegister?.isOpen && (
                      <button
                        onClick={() => setDeleteEntryId(entry.id)}
                        className="p-1 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0"
                        title="Eliminar entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Open Register Modal */}
      {showOpenForm && (
        <ModalOverlay onClose={() => setShowOpenForm(false)}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <Unlock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Abrir Caja</h3>
              <p className="text-xs text-stone-500 mt-1">Mes: {formatDate(startOfMonth)} — {formatDate(endOfMonth)}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Monto Inicial (S/)</label>
              <input
                type="number"
                step="1"
                min="0"
                autoFocus
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOpenForm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button
                onClick={openRegister}
                disabled={!openingAmount}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 hover:bg-emerald-700 transition-colors"
              >
                Abrir
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Expense Modal */}
      {showExpenseForm && (
        <ModalOverlay onClose={() => setShowExpenseForm(false)}>
          <div className="space-y-5">
            <h3 className="text-lg font-black uppercase tracking-tight">Registrar Egreso</h3>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Descripción</label>
              <input
                autoFocus
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                placeholder="Ej: Compra de leche"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Monto (S/)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExpenseForm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button
                onClick={addExpense}
                disabled={!expAmount || !expDesc.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 hover:bg-red-700 transition-colors"
              >
                Registrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Income Modal */}
      {showIncomeForm && (
        <ModalOverlay onClose={() => setShowIncomeForm(false)}>
          <div className="space-y-5">
            <h3 className="text-lg font-black uppercase tracking-tight">Registrar Ingreso</h3>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Descripción</label>
              <input
                autoFocus
                value={incDesc}
                onChange={e => setIncDesc(e.target.value)}
                placeholder="Ej: Venta directa"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Monto (S/)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={incAmount}
                onChange={e => setIncAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowIncomeForm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button
                onClick={addIncome}
                disabled={!incAmount || !incDesc.trim()}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 hover:bg-emerald-700 transition-colors"
              >
                Registrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>

      {/* Close Register Confirmation */}
      {showCloseConfirm && (
        <ModalOverlay onClose={() => setShowCloseConfirm(false)}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto">
              <LockKeyhole className="w-6 h-6 text-stone-500" />
            </div>
            <h3 className="text-sm font-bold">¿Cerrar la caja de este mes?</h3>
            <p className="text-xs text-stone-500">No podrás agregar más movimientos</p>
            <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-lg px-4 py-3">
              <span className="text-xs font-bold text-stone-500">Balance final</span>
              <span className={`text-lg font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>S/ {balance.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button onClick={closeRegister} className="flex-1 py-2.5 bg-stone-800 dark:bg-stone-200 text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-900 dark:hover:bg-white transition-colors">
                Cerrar Caja
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Entry Confirmation */}
      {deleteEntryId && (
        <ModalOverlay onClose={() => setDeleteEntryId(null)}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-bold">¿Eliminar este movimiento?</p>
            <p className="text-xs text-stone-500">El balance se recalculará automáticamente</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEntryId(null)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button
                onClick={() => deleteEntry(deleteEntryId!)}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
};

// ---- Subcomponents ----

const SummaryCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'stone' | 'emerald' | 'red';
  highlight?: boolean;
}> = ({ label, value, icon, color, highlight }) => {
  const colorClasses = {
    stone: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  const iconClasses = {
    stone: 'text-stone-400 dark:text-stone-500',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    red: 'text-red-500 dark:text-red-400',
  };

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]} ${highlight ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-stone-950' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconClasses[color]}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
      </div>
      <p className="text-xl font-black">S/ {value.toFixed(2)}</p>
    </div>
  );
};

const ModalOverlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-md">
      <button onClick={onClose} className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>
  </div>
);

export default SalesCajaTab;
