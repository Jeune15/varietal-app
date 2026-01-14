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
    <div className="space-y-16">
      {/* Roasted Bulk Inventory */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b-4 border-black pb-6">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Silos de Café</h3>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Granel
              </div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Existencias Tostadas</p>
            </div>
          </div>
          <Layers className="w-12 h-12 text-stone-200" strokeWidth={1} />
        </div>

        <div className="bg-white border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Variedad / Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Stock Disponible</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">Mermas Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {stocks.filter(s => s.remainingQtyKg > 0.001).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Layers className="w-12 h-12 text-stone-200" strokeWidth={1} />
                        <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">Sin stock a granel en sistema</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stocks.filter(s => s.remainingQtyKg > 0.001).map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="font-black text-black text-lg uppercase tracking-tight">{s.variety}</div>
                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1 group-hover:text-black transition-colors">{s.clientName}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black tracking-tight ${s.remainingQtyKg < 5 ? 'text-red-600' : 'text-black'}`}>
                            {s.remainingQtyKg.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Kg</span>
                        </div>
                        {s.remainingQtyKg < 5 && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                            Stock Crítico
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {s.isSelected ? (
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black border border-black px-3 py-1.5 bg-stone-50">
                              <CheckCircle className="w-3 h-3" /> Selección
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 border border-stone-200 px-3 py-1.5">
                              <XCircle className="w-3 h-3" /> Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-sm font-bold text-stone-400 tabular-nums border-b border-stone-200 pb-0.5">{s.mermaGrams}g</span>
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
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b-4 border-black pb-6">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Inventario Retail</h3>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Empaque
              </div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Producto Terminado</p>
            </div>
          </div>
          <ShoppingBag className="w-12 h-12 text-stone-200" strokeWidth={1} />
        </div>

        <div className="bg-white border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">Variedad</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">Formato</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em] text-right">Disponibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {retailBags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Tag className="w-12 h-12 text-stone-200" strokeWidth={1} />
                        <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">No se han procesado bolsas retail</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  retailBags.map((bag) => (
                    <tr key={bag.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 group-hover:border-black group-hover:text-black transition-all">
                            <Tag className="w-5 h-5" />
                          </div>
                          <span className="font-black text-black text-lg uppercase tracking-tight">{bag.coffeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[10px] font-bold bg-black text-white px-3 py-1.5 tracking-widest uppercase">{bag.type}</span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-3xl font-black tracking-tighter ${bag.quantity < 5 ? 'text-red-600' : 'text-black'}`}>
                            {bag.quantity}
                          </span>
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Unidades</span>
                        </div>
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
