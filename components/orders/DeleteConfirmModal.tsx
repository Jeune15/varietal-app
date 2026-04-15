/**
 * components/orders/DeleteConfirmModal.tsx
 *
 * Confirmation dialog before permanently deleting an order.
 * Extracted from the monolithic OrdersView.tsx.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Order } from '../../types';

interface Props {
  order: Order | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<Props> = ({ order, onConfirm, onCancel }) => {
  if (!order) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-stone-900 w-full max-w-md border border-stone-200 dark:border-stone-700 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
              Eliminar Pedido
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors rounded"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que quieres eliminar el pedido de{' '}
            <span className="font-black text-black dark:text-white">{order.clientName}</span>?
          </p>
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 space-y-1">
            <div className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
              Detalle del pedido
            </div>
            <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {order.variety} — {order.type}
            </div>
            <div className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
              ID: {order.id.slice(-8)}
            </div>
          </div>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;
