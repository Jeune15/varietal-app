/**
 * components/orders/ClientSelectorModal.tsx
 *
 * Modal for assigning a client from the client database to a sales order.
 * Extracted from the monolithic OrdersView.tsx.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Search, User, X } from 'lucide-react';
import { Client, Order } from '../../types';

interface Props {
  order: Order | null;
  clients: Client[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectClient: (client: Client) => void;
  onClose: () => void;
}

const ClientSelectorModal: React.FC<Props> = ({
  order,
  clients,
  searchTerm,
  onSearchChange,
  onSelectClient,
  onClose,
}) => {
  if (!order) return null;

  const filtered = clients
    .filter(c => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 px-5 py-4 border-b border-stone-200 dark:border-stone-800 z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-black dark:text-white tracking-tight uppercase">
              Asignar Cliente
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              autoFocus
              className="pl-9 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold focus:border-black dark:focus:border-white focus:ring-0 w-full transition-colors text-black dark:text-white rounded-xl"
            />
          </div>
        </div>

        {/* Client List */}
        <div className="overflow-y-auto max-h-[50vh] p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs font-medium">
              {clients.length === 0
                ? 'No hay clientes en la base de datos'
                : 'Sin resultados para esa búsqueda'}
            </div>
          ) : (
            filtered.map(client => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    client.clientType === 'empresa'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-stone-100 dark:bg-stone-800'
                  }`}
                >
                  <User className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black dark:text-white truncate">
                    {client.name}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate">
                    {client.district || 'Sin distrito'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClientSelectorModal;
