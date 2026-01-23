import React, { useState } from 'react';
import { GreenCoffee } from '../types';
import { db, syncToCloud } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { Plus, MapPin, Weight, X, Coffee, Calendar, Search, Pencil } from 'lucide-react';

interface Props {
  coffees: GreenCoffee[];
  setCoffees: (val: any) => void;
}

const GreenCoffeeView: React.FC<Props> = ({ coffees }) => {
  const { canEdit } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState<GreenCoffee | null>(null);
  
  // Filter out empty stock
  const activeCoffees = coffees.filter(c => c.quantityKg > 0);

  const [formData, setFormData] = useState({
    clientName: '',
    variety: '',
    origin: '',
    entryDate: new Date().toISOString().split('T')[0],
    quantityKg: 0
  });

  const [editFormData, setEditFormData] = useState({
    quantityKg: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCoffee: GreenCoffee = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };
    await db.greenCoffees.add(newCoffee);
    syncToCloud('greenCoffees', await db.greenCoffees.toArray());
    setShowModal(false);
    setFormData({ clientName: '', variety: '', origin: '', entryDate: new Date().toISOString().split('T')[0], quantityKg: 0 });
  };

  const openEditModal = (coffee: GreenCoffee) => {
    if (!canEdit) return;
    setEditingCoffee(coffee);
    setEditFormData({ quantityKg: coffee.quantityKg });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoffee) return;

    const newQuantity = parseFloat(editFormData.quantityKg.toString());

    if (newQuantity <= 0.001) {
      // Delete if 0 or very close to 0
      await db.greenCoffees.delete(editingCoffee.id);
      const remaining = await db.greenCoffees.toArray();
      syncToCloud('greenCoffees', remaining);
    } else {
      // Update
      const updatedCoffee = { ...editingCoffee, quantityKg: newQuantity };
      await db.greenCoffees.update(editingCoffee.id, { quantityKg: newQuantity });
      syncToCloud('greenCoffees', await db.greenCoffees.toArray());
    }
    
    setShowEditModal(false);
    setEditingCoffee(null);
  };

  return (
    <>
    <div className="space-y-6 md:space-y-8 pb-48">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Café Verde</h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-2 pl-1">Inventario &middot; Materia Prima</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowModal(true)} 
            className="w-full sm:w-auto bg-black text-white px-8 py-4 flex items-center justify-center gap-3 transition-all hover:bg-stone-800 active:scale-95 font-bold text-xs uppercase tracking-widest border border-black"
          >
            <Plus className="w-4 h-4" /> Nuevo Lote
          </button>
        )}
      </div>

      {/* Grid de Contenido - Lista en móvil, Tabla en Desktop */}
      <div className="bg-white border border-stone-200 shadow-sm">
        {/* Vista Mobile / Tablet (Lista de Cards) */}
        <div className="block lg:hidden divide-y divide-stone-100">
          {activeCoffees.length === 0 ? (
            <div className="p-12 text-center text-stone-400 font-medium uppercase text-xs tracking-widest">Sin existencias</div>
          ) : (
            activeCoffees.map((c) => (
              <div key={c.id} className="p-6 active:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-black text-black dark:text-orange-600 uppercase tracking-tight">{c.clientName}</h4>
                    <p className="text-xs font-bold text-stone-500 mt-1 uppercase tracking-wide">{c.variety}</p>
                  </div>
                  <div className="border border-stone-200 px-3 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-50">
                    {c.entryDate}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{c.origin}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-black dark:text-white">{c.quantityKg.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">Kg</span>
                    </div>
                    {canEdit && (
                      <button 
                        onClick={() => openEditModal(c)}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-black dark:text-orange-600 dark:hover:text-orange-500"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Desktop (Tabla Tradicional) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white dark:bg-stone-900 border-b-2 border-black dark:border-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-6 text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Variedad / Origen</th>
                <th className="px-6 py-6 text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">Fecha Ingreso</th>
                <th className="px-8 py-6 text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] text-right">Stock (Kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {activeCoffees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-stone-400 dark:text-stone-500 font-medium uppercase text-xs tracking-widest">
                    Sin existencias
                  </td>
                </tr>
              ) : (
                activeCoffees.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group">
                    <td className="px-8 py-6 font-bold text-sm text-black dark:text-orange-600 uppercase tracking-wide">{c.clientName}</td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wide">{c.variety}</span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                          <MapPin className="w-2.5 h-2.5" /> {c.origin}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-xs text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">{c.entryDate}</td>
                    <td className="px-8 py-6 text-right flex items-center justify-end gap-4">
                      <span className="text-xl font-black text-stone-500 dark:text-stone-400 tracking-tighter group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">{c.quantityKg.toFixed(1)}</span>
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors text-stone-400 hover:text-black dark:text-orange-600 dark:hover:text-orange-500 opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Optimizado - Architectural Style */}
      </div>
      {showModal && (
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 shadow-2xl w-full max-w-lg overflow-hidden border border-black dark:border-white max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black dark:bg-stone-950 p-8 text-white flex justify-between items-center shrink-0 sticky top-0 z-10 border-b border-stone-800">
              <div>
                <h4 className="text-lg font-black uppercase tracking-wider">Ingreso Café Verde</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Nuevo Lote</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Cliente / Dueño</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-sm font-bold uppercase tracking-wide transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 rounded-none dark:text-white" 
                  placeholder="NOMBRE DEL CLIENTE"
                  value={formData.clientName} 
                  onChange={e => setFormData({...formData, clientName: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Variedad</label>
                  <input type="text" required className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-sm font-bold uppercase tracking-wide rounded-none dark:text-white" placeholder="VARIEDAD" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Origen</label>
                  <input type="text" required className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-sm font-bold uppercase tracking-wide rounded-none dark:text-white" placeholder="FINCA / REGIÓN" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Peso (Kg)</label>
                  <input type="number" step="0.1" required className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-xl font-black text-black dark:text-white rounded-none" value={formData.quantityKg} onChange={e => setFormData({...formData, quantityKg: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Fecha</label>
                  <input type="date" required className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-sm font-bold uppercase tracking-wide rounded-none dark:text-white" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-black hover:bg-stone-900 text-white font-black shadow-lg transition-all text-xs uppercase tracking-[0.3em] active:scale-95 border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-stone-200">
                  Confirmar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && editingCoffee && (
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white dark:bg-stone-900 shadow-2xl w-full max-w-sm overflow-hidden border border-black dark:border-white animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black dark:bg-stone-950 p-6 text-white flex justify-between items-center border-b border-stone-800">
              <div>
                <h4 className="text-lg font-black uppercase tracking-wider">Ajustar Stock</h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {editingCoffee?.variety}
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-stone-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">
                  Peso Actual (Kg)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  className="w-full px-0 py-3 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-black dark:focus:border-white outline-none text-2xl font-black text-black dark:text-white rounded-none" 
                  value={editFormData.quantityKg} 
                  onChange={e => setEditFormData({...editFormData, quantityKg: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                />
                <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium leading-relaxed">
                  Si ajustas el stock a 0, el lote se eliminará automáticamente del inventario.
                </p>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-black hover:bg-stone-900 text-white font-black shadow-lg transition-all text-xs uppercase tracking-[0.2em] active:scale-95 border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-stone-200">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GreenCoffeeView;