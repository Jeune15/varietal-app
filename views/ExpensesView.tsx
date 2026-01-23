import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { Expense } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Search, Filter, DollarSign, FileText, Calendar, CheckCircle, X, User } from 'lucide-react';

export const ExpensesView = () => {
  const { canEdit } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    amount: '',
    documentType: 'Factura' as 'Factura' | 'Boleta',
    documentId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'envio' as 'envio' | 'compra',
    createdBy: 'Anthony' as 'Anthony' | 'Alei'
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
    if (!canEdit) return;
    if (!formData.reason || !formData.amount || !formData.date) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      reason: formData.reason,
      amount: parseFloat(formData.amount),
      documentType: formData.type === 'compra' ? formData.documentType : undefined,
      documentId: formData.type === 'compra' ? formData.documentId : '',
      date: formData.date,
      status: 'pending',
      createdBy: formData.createdBy
    };

    await db.expenses.add(newExpense);
    await syncToCloud('expenses', newExpense);
    
    setShowModal(false);
    setFormData({
      reason: '',
      amount: '',
      documentType: 'Factura',
      documentId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'envio',
      createdBy: 'Anthony'
    });
  };

  const handlePay = async (expense: Expense) => {
    if (!canEdit) return;
    if (window.confirm(`¿Marcar como pagado el gasto: ${expense.reason}? Desaparecerá de la lista.`)) {
      const updated = { ...expense, status: 'paid' as const };
      await db.expenses.update(expense.id, updated);
      await syncToCloud('expenses', updated);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!canEdit) return;
    if (window.confirm(`¿Eliminar definitivamente el gasto: ${expense.reason}?`)) {
      await db.expenses.delete(expense.id);
      // Ideally delete from cloud too if we had a delete sync helper exposed
    }
  };

  return (
    <>
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-48">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Gastos</h3>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Cuentas por Pagar</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-black text-white border border-black hover:bg-white hover:text-black px-6 py-3 flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </button>
        )}
      </div>

      {/* Expenses List */}
      <div className="grid gap-4">
        {expenses?.length === 0 ? (
          <div className="bg-white p-12 text-center border border-dashed border-stone-300">
            <div className="w-16 h-16 bg-stone-50 flex items-center justify-center mx-auto mb-4 border border-stone-200">
              <DollarSign className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-black text-black uppercase mb-1">Sin gastos pendientes</h3>
            <p className="text-stone-500 font-medium text-sm">No hay cuentas por pagar registradas.</p>
          </div>
        ) : (
          expenses?.map(expense => (
            <div key={expense.id} className="bg-white p-6 border border-stone-200 hover:border-black transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-black text-lg text-black uppercase tracking-tight">{expense.reason}</h4>
                  {expense.documentId && (
                    <span className="bg-stone-100 border border-stone-200 text-stone-600 text-[10px] px-2 py-1 font-bold uppercase tracking-wide">
                      {expense.documentType ? `${expense.documentType} ` : ''}#{expense.documentId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500 font-bold uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {expense.date}
                  </span>
                  {expense.createdBy && (
                    <span className="flex items-center gap-1 text-black dark:text-white">
                      <User className="w-3 h-3" />
                      {expense.createdBy}
                    </span>
                  )}
                  {expense.relatedOrderId && (
                    <span className="text-black bg-stone-100 px-2 py-0.5 border border-stone-200">
                      Pedido Vinculado
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-2xl font-black text-black tracking-tighter">
                  ${expense.amount.toLocaleString('es-CL')}
                </span>
                
                <div className="flex gap-2">
                  {canEdit && (
                    <>
                      <button 
                        onClick={() => handlePay(expense)}
                        className="p-2 text-stone-400 hover:text-black hover:bg-stone-100 border border-transparent hover:border-black transition-all"
                        title="Marcar como Pagado"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense)}
                        className="p-2 text-stone-400 hover:text-black hover:bg-stone-100 border border-transparent hover:border-black transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

      {/* New Expense Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 w-full max-w-md border-2 border-black dark:border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-0 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black dark:bg-stone-950 dark:border-stone-800">
              <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Registrar Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-stone-100 dark:hover:bg-stone-800 p-1 transition-colors dark:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Motivo</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 transition-all font-bold dark:text-white"
                  placeholder="Ej: Compra de insumos..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Monto</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-9 p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 transition-all font-bold text-lg dark:text-white"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Tipo de Gasto</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'envio' })}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-widest border ${
                        formData.type === 'envio'
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
                      }`}
                    >
                      Envío
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'compra' })}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-widest border ${
                        formData.type === 'compra'
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
                      }`}
                    >
                      Compra
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Responsable</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, createdBy: 'Anthony' })}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-widest border ${
                        formData.createdBy === 'Anthony'
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
                      }`}
                    >
                      Anthony
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, createdBy: 'Alei' })}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-widest border ${
                        formData.createdBy === 'Alei'
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700 dark:hover:border-white dark:hover:text-white'
                      }`}
                    >
                      Alei
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 transition-all font-medium text-sm dark:text-white"
                    required
                  />
                </div>
                {formData.type === 'compra' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Tipo Doc.</label>
                    <select
                      value={formData.documentType}
                      onChange={e => setFormData({...formData, documentType: e.target.value as 'Factura' | 'Boleta'})}
                      className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 transition-all text-sm font-bold dark:text-white"
                    >
                      <option value="Factura">Factura</option>
                      <option value="Boleta">Boleta</option>
                    </select>
                  </div>
                )}
              </div>
              
              {formData.type === 'compra' && (
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Nº Documento</label>
                  <input
                    type="text"
                    value={formData.documentId}
                    onChange={e => setFormData({...formData, documentId: e.target.value})}
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-white focus:ring-0 transition-all font-bold dark:text-white"
                    placeholder="Opcional"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white border border-black dark:bg-white dark:text-black dark:border-white font-bold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-all text-xs"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesView;
