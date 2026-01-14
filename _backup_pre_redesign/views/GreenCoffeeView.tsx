
import React, { useState } from 'react';
import { GreenCoffee } from '../types';
import { db, syncToCloud } from '../db';
import { Plus, MapPin, Weight, X, Coffee, Calendar, Search } from 'lucide-react';

interface Props {
  coffees: GreenCoffee[];
  setCoffees: (val: any) => void;
}

const GreenCoffeeView: React.FC<Props> = ({ coffees }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Filter out empty stock
  const activeCoffees = coffees.filter(c => c.quantityKg > 0);

  const [formData, setFormData] = useState({
    clientName: '',
    variety: '',
    origin: '',
    entryDate: new Date().toISOString().split('T')[0],
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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">Café Verde</h3>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em]">Inventario de Materia Prima</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="w-full sm:w-auto bg-stone-900 hover:bg-black text-white px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-stone-200 transition-all active:scale-95 font-bold text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Nuevo Lote
        </button>
      </div>

      {/* Grid de Contenido - Lista en móvil, Tabla en Desktop */}
      <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-sm">
        {/* Vista Mobile / Tablet (Lista de Cards) */}
        <div className="block lg:hidden divide-y divide-stone-100">
          {activeCoffees.length === 0 ? (
            <div className="p-12 text-center text-stone-400 italic font-medium">No hay existencias registradas.</div>
          ) : (
            activeCoffees.map((c) => (
              <div key={c.id} className="p-5 active:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-stone-900 tracking-tight">{c.clientName}</h4>
                    <p className="text-xs font-semibold text-amber-800">{c.variety}</p>
                  </div>
                  <div className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {c.entryDate}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{c.origin}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-stone-900">{c.quantityKg.toFixed(1)}</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase">Kg</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Desktop (Tabla Tradicional) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-4 text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Variedad / Origen</th>
                <th className="px-6 py-4 text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Fecha Ingreso</th>
                <th className="px-6 py-4 text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Cantidad Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activeCoffees.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-stone-900 tracking-tight">{c.clientName}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-stone-700 tracking-tight">{c.variety}</span>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <MapPin className="w-2.5 h-2.5" /> {c.origin}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-stone-500 font-black uppercase tracking-widest">{c.entryDate}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-2xl font-black text-stone-900 tracking-tighter group-hover:text-amber-900 transition-colors">{c.quantityKg.toFixed(1)}</span>
                    <span className="text-[10px] ml-2 font-black text-stone-400 uppercase tracking-widest">Kg</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Optimizado para Touch */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-500">
            <div className="bg-stone-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-xl font-bold tracking-tight">Ingreso Café Verde</h4>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">Nuevo Lote en Stock</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white p-2.5 bg-white/5 rounded-2xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Cliente / Dueño</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-stone-900/5 outline-none text-base sm:text-sm font-bold transition-all placeholder:text-stone-300" 
                  placeholder="Ej: Finca Las Camelias"
                  value={formData.clientName} 
                  onChange={e => setFormData({...formData, clientName: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Variedad</label>
                  <input type="text" required className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-stone-900/5 text-base sm:text-sm font-bold" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Origen</label>
                  <input type="text" required className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-stone-900/5 text-base sm:text-sm font-bold" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Peso (Kg)</label>
                  <input type="number" step="0.1" required className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-stone-900/5 text-base sm:text-sm font-black" value={formData.quantityKg} onChange={e => setFormData({...formData, quantityKg: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest ml-1">Fecha</label>
                  <input type="date" required className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-stone-900/5 text-base sm:text-sm font-bold" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 pb-4 sm:pb-0">
                <button type="submit" className="w-full py-5 bg-stone-900 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-stone-200 transition-all text-xs uppercase tracking-[0.3em] active:scale-95">
                  Confirmar e Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenCoffeeView;
