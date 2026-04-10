import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, deleteFromCloud } from '../db';
import { Client, ClientType, SalesOrder } from '../types';
import { Search, Plus, X, Copy, Check, MoreVertical, Pencil, Trash2, Download, Building2, User, Calendar } from 'lucide-react';

// ===== Client Form Modal =====
interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient?: Client | null;
}

const ClientFormModal: React.FC<ClientFormProps> = ({ isOpen, onClose, editingClient }) => {
  const [name, setName] = useState(editingClient?.name || '');
  const [district, setDistrict] = useState(editingClient?.district || '');
  const [address, setAddress] = useState(editingClient?.address || '');
  const [reference, setReference] = useState(editingClient?.reference || '');
  const [phone, setPhone] = useState(editingClient?.phone || '');
  const [clientType, setClientType] = useState<ClientType>(editingClient?.clientType || 'natural');
  const [observations, setObservations] = useState(editingClient?.observations || '');

  React.useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setDistrict(editingClient.district);
      setAddress(editingClient.address);
      setReference(editingClient.reference);
      setPhone(editingClient.phone);
      setClientType(editingClient.clientType);
      setObservations(editingClient.observations);
    } else {
      setName(''); setDistrict(''); setAddress(''); setReference('');
      setPhone(''); setClientType('natural'); setObservations('');
    }
  }, [editingClient, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const client: Client = {
      id: editingClient?.id || crypto.randomUUID(),
      name: name.trim(),
      district: district.trim(),
      address: address.trim(),
      reference: reference.trim(),
      phone: phone.trim(),
      clientType,
      observations: observations.trim(),
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };
    await db.clients.put(client);
    await syncToCloud('clients', client);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-stone-900 px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between z-10">
          <h3 className="text-lg font-black text-black dark:text-white tracking-tight uppercase">
            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del cliente"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Distrito</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Ej: Miraflores"
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Tipo</label>
              <select value={clientType} onChange={e => setClientType(e.target.value as ClientType)}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors">
                <option value="natural">Natural</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Dirección</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección completa"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Referencia</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Referencia de ubicación"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Teléfono</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="999 999 999"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Observaciones</label>
            <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Notas adicionales..."
              rows={3}
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-medium text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 transition-colors resize-none" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-stone-900 px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity disabled:opacity-30">
            {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== Copy Button =====
const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* fallback */ }
  };

  if (!text) return null;

  return (
    <button onClick={handleCopy} title="Copiar"
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 ${
        copied
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
      } ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// ===== Mobile Detail Modal =====
interface MobileDetailProps {
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  lastOrderDate?: string;
}

const MobileDetailModal: React.FC<MobileDetailProps> = ({ client, onClose, onEdit, onDelete, lastOrderDate }) => {
  if (!client) return null;

  const InfoRow: React.FC<{ label: string; value: string; copiable?: boolean }> = ({ label, value, copiable }) => (
    <div className="flex items-start justify-between gap-2 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 break-words">{value || '—'}</p>
      </div>
      {copiable && value && <CopyButton text={value} className="flex-shrink-0 mt-3" />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              client.clientType === 'empresa'
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-stone-100 dark:bg-stone-800'
            }`}>
              {client.clientType === 'empresa'
                ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                : <User className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              }
            </div>
            <div>
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">{client.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {client.clientType === 'empresa' ? 'Empresa' : 'Natural'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-2">
          <InfoRow label="Distrito" value={client.district} />
          <InfoRow label="Dirección" value={client.address} copiable />
          <InfoRow label="Referencia" value={client.reference} />
          <InfoRow label="Teléfono" value={client.phone} copiable />
          <InfoRow label="Observaciones" value={client.observations} />
          {lastOrderDate && (
            <div className="flex items-center gap-2 py-3">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Último pedido: {new Date(lastOrderDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-stone-900 px-5 py-4 border-t border-stone-200 dark:border-stone-800 flex gap-3">
          <button onClick={() => { onEdit(client); onClose(); }}
            className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button onClick={() => { onDelete(client); onClose(); }}
            className="py-3 px-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== Main View =====
const ClientDatabaseView: React.FC = () => {
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const salesOrders = useLiveQuery(() => db.salesOrders.toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [mobileDetailClient, setMobileDetailClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Compute last order date per client
  const lastOrderByClient = useMemo(() => {
    const map: Record<string, string> = {};
    for (const order of salesOrders) {
      if (order.clientId) {
        const date = order.invoicedAt || order.despachadoAt || order.createdAt;
        if (!map[order.clientId] || date > map[order.clientId]) {
          map[order.clientId] = date;
        }
      }
    }
    return map;
  }, [salesOrders]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients.sort((a, b) => a.name.localeCompare(b.name));
    return clients
      .filter(c => c.name.toLowerCase().includes(term) || c.district.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  const handleDelete = async (client: Client) => {
    await db.clients.delete(client.id);
    await deleteFromCloud('clients', client.id);
    setDeleteConfirm(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Distrito', 'Dirección', 'Referencia', 'Teléfono', 'Tipo', 'Observaciones', 'Fecha Creación'];
    const rows = clients.map(c => [
      c.name, c.district, c.address, c.reference, c.phone,
      c.clientType === 'empresa' ? 'Empresa' : 'Natural',
      c.observations,
      new Date(c.createdAt).toLocaleDateString('es-PE')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_varietal_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Base de Datos</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o distrito..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold focus:border-black dark:focus:border-white focus:ring-0 w-full md:w-64 transition-colors text-black dark:text-white rounded-xl"
            />
          </div>
          <button onClick={handleExportCSV}
            className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Exportar CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 text-stone-400 dark:text-stone-600">
          <User className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">{searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
          <p className="text-xs mt-1">{searchTerm ? 'Intenta con otro término' : 'Agrega tu primer cliente con el botón "Nuevo"'}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Nombre</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Distrito</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Dirección</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Referencia</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Teléfono</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Tipo</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Último Pedido</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Obs.</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            client.clientType === 'empresa'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-stone-100 dark:bg-stone-800'
                          }`}>
                            {client.clientType === 'empresa'
                              ? <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              : <User className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                            }
                          </div>
                          <span className="text-sm font-bold text-black dark:text-white">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-600 dark:text-stone-400">{client.district || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-stone-600 dark:text-stone-400 truncate max-w-[180px]">{client.address || '—'}</span>
                          <CopyButton text={client.address} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-500 truncate max-w-[120px]">{client.reference || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-stone-600 dark:text-stone-400">{client.phone || '—'}</span>
                          <CopyButton text={client.phone} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          client.clientType === 'empresa'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}>
                          {client.clientType === 'empresa' ? 'Empresa' : 'Natural'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-500">
                        {lastOrderByClient[client.id] ? formatDate(lastOrderByClient[client.id]) : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500 dark:text-stone-500 truncate max-w-[100px]">{client.observations || '—'}</td>
                      <td className="px-3 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === client.id && (
                            <>
                              <div className="fixed inset-0 z-[50]" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-[60] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl py-1 min-w-[140px]">
                                <button onClick={() => handleEdit(client)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2.5 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button onClick={() => { setDeleteConfirm(client); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-2">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => setMobileDetailClient(client)}
                className="w-full text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors active:scale-[0.99]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  client.clientType === 'empresa'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  {client.clientType === 'empresa'
                    ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    : <User className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black dark:text-white truncate">{client.name}</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{client.district || 'Sin distrito'}</p>
                </div>
                {lastOrderByClient[client.id] && (
                  <span className="text-[10px] text-stone-400 flex-shrink-0">
                    {formatDate(lastOrderByClient[client.id])}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        editingClient={editingClient}
      />

      {/* Mobile Detail Modal */}
      <MobileDetailModal
        client={mobileDetailClient}
        onClose={() => setMobileDetailClient(null)}
        onEdit={handleEdit}
        onDelete={(c) => setDeleteConfirm(c)}
        lastOrderDate={mobileDetailClient ? lastOrderByClient[mobileDetailClient.id] : undefined}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <button onClick={() => setDeleteConfirm(null)} className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-bold text-black dark:text-white">¿Eliminar a {deleteConfirm.name}?</p>
              <p className="text-xs text-stone-500">Esta acción no se puede deshacer</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors">
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

export default ClientDatabaseView;
