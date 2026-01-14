
import React from 'react';
import { RoastedStock, RetailBagStock } from '../types';
import { ShoppingBag, CheckCircle, XCircle, Tag, Layers } from 'lucide-react';

interface Props {
  stocks: RoastedStock[];
  retailBags: RetailBagStock[];
  setRetailBags: React.Dispatch<React.SetStateAction<RetailBagStock[]>>;
}

const InventoryView: React.FC<Props> = ({ stocks, retailBags }) => {
  return (
    <div className="space-y-12">
      {/* Roasted Bulk Inventory */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-stone-900 p-2.5 rounded-xl text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-stone-900 tracking-tight leading-none">Silos de Café Tostado</h3>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Existencias a Granel</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Variedad / Cliente</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Stock Disponible</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">Mermas Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stocks.filter(s => s.remainingQtyKg > 0.001).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-stone-300 italic text-sm font-medium">Sin stock a granel en sistema.</td>
                  </tr>
                ) : (
                  stocks.filter(s => s.remainingQtyKg > 0.001).map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-stone-900 text-sm tracking-tight">{s.variety}</div>
                        <div className="text-[10px] text-stone-400 font-semibold mt-0.5">{s.clientName}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-sm font-bold tracking-tight ${s.remainingQtyKg < 5 ? 'text-amber-600' : 'text-stone-900'}`}>{s.remainingQtyKg.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {s.isSelected ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <CheckCircle className="w-3 h-3" /> Selección
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-stone-300 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-100">
                              <XCircle className="w-3 h-3" /> Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-semibold text-stone-400 tabular-nums">{s.mermaGrams}g</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Retail Bags Inventory */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-stone-100 p-2.5 rounded-xl text-stone-900 border border-stone-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-stone-900 tracking-tight leading-none">Bolsas Retail</h3>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Empaque Terminado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Variedad</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Formato</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">Disponibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {retailBags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-stone-300 italic text-sm font-medium">No se han procesado bolsas retail.</td>
                  </tr>
                ) : (
                  retailBags.map((bag) => (
                    <tr key={bag.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400">
                            <Tag className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-stone-900 text-sm tracking-tight">{bag.coffeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded-lg tracking-wider uppercase border border-stone-200/50">{bag.type}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-xl font-bold tracking-tight ${bag.quantity < 5 ? 'text-amber-700' : 'text-stone-900'}`}>{bag.quantity}</span>
                        <span className="text-[11px] ml-2 font-bold text-stone-400 uppercase tracking-widest">Uds</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InventoryView;
