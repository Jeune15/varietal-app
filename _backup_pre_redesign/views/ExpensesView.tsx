import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { Expense } from '../types';
import { Plus, Trash2, Search, Filter, DollarSign, FileText, Calendar, CheckCircle } from 'lucide-react';

export const ExpensesView = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    amount: '',
    documentType: 'Factura' as 'Factura' | 'Boleta',
    documentId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Only show pending expenses as per "eliminen al pagar" request (interpreted as filter)
  const expenses = useLiveQuery(() => 
    db.expenses
      .where('status')
      .equals('pending')
      .reverse()
      .sortBy('date')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || !formData.amount || !formData.date) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      reason: formData.reason,
      amount: parseFloat(formData.amount),
      documentType: formData.documentType,
      documentId: formData.documentId,
      date: formData.date,
      status: 'pending'
    };

    await db.expenses.add(newExpense);
    await syncToCloud('expenses', newExpense);
    
    setShowModal(false);
    setFormData({
      reason: '',
      amount: '',
      documentType: 'Factura',
      documentId: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handlePay = async (expense: Expense) => {
    if (window.confirm(`¿Marcar como pagado el gasto: ${expense.reason}? Desaparecerá de la lista.`)) {
      const updated = { ...expense, status: 'paid' as const };
      await db.expenses.update(expense.id, updated);
      await syncToCloud('expenses', updated);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (window.confirm(`¿Eliminar definitivamente el gasto: ${expense.reason}?`)) {
      await db.expenses.delete(expense.id);
      // Ideally delete from cloud too if we had a delete sync helper exposed
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Gastos</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Cuentas por Pagar</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-xs font-bold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </button>
      </div>

      {/* Expenses List */}
      <div className="grid gap-4">
        {expenses?.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Sin gastos pendientes</h3>
            <p className="text-stone-500">No hay cuentas por pagar registradas.</p>
          </div>
        ) : (
          expenses?.map(expense => (
            <div key={expense.id} className="bg-white p-4 rounded-2xl border border-stone-100 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-stone-900">{expense.reason}</h4>
                  {expense.documentId && (
                    <span className="bg-stone-100 text-stone-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                      {expense.documentType ? `${expense.documentType} ` : ''}#{expense.documentId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {expense.date}
                  </span>
                  {expense.relatedOrderId && (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      Pedido Vinculado
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xl font-black text-stone-900 font-mono">
                  ${expense.amount.toLocaleString('es-CL')}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePay(expense)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Marcar como Pagado"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(expense)}
                    className="p-2 text-stone-400 hover:bg-stone-100 hover:text-rose-500 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-stone-900 mb-6">Registrar Nuevo Gasto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Motivo</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  placeholder="Ej: Compra de insumos, Luz, Agua..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Monto</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tipo Doc.</label>
                  <select
                    value={formData.documentType}
                    onChange={e => setFormData({...formData, documentType: e.target.value as 'Factura' | 'Boleta'})}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium"
                  >
                    <option value="Factura">Factura</option>
                    <option value="Boleta">Boleta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nº Documento</label>
                <input
                  type="text"
                  value={formData.documentId}
                  onChange={e => setFormData({...formData, documentId: e.target.value})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  placeholder="Ej: 123456"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-rose-200"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;