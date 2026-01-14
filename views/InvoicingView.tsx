import React, { useState } from 'react';
import { db, syncToCloud } from '../db';
import { Order, Roast, RoastedStock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, Search, X, Printer, Download, Coffee, Scale, DollarSign, Receipt, ArrowRight } from 'lucide-react';
import ExpensesView from './ExpensesView';

interface Props {
  orders: Order[];
  roasts: Roast[];
  stocks: RoastedStock[];
}

const InvoicingView: React.FC<Props> = ({ orders, roasts, stocks }) => {
  const { canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPendingReport, setShowPendingReport] = useState(false);

  const shippedOrders = orders.filter(o => o.status === 'Enviado' || o.status === 'Facturado');
  const pendingOrders = orders.filter(o => o.status === 'Enviado');

  const handleMarkAsInvoiced = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const updates = { status: 'Facturado' as const, invoicedDate: new Date().toISOString() };
    await db.orders.update(id, updates);
    await syncToCloud('orders', { ...order, ...updates });

    if (selectedOrder?.id === id) {
       setSelectedOrder(prev => prev ? {...prev, ...updates} : null);
    }
  };

  // Helper to get traceability data
  const getTraceabilityData = (order: Order) => {
    // Stock (for Selection Merma)
    const stock = order.fulfilledFromStockId 
      ? stocks.find(s => s.id === order.fulfilledFromStockId)
      : null;

    // Roasts: Prioritize direct link, fallback to stock origin
    let relatedRoasts: Roast[] = [];
    
    if (order.relatedRoastIds && order.relatedRoastIds.length > 0) {
      relatedRoasts = roasts.filter(r => order.relatedRoastIds?.includes(r.id));
    } else if (stock && stock.roastId) {
      const stockRoast = roasts.find(r => r.id === stock.roastId);
      if (stockRoast) relatedRoasts = [stockRoast];
    }
    
    return {
      roasts: relatedRoasts,
      stock,
      totalGreenUsed: relatedRoasts.reduce((sum, r) => sum + r.greenQtyKg, 0),
      totalRoasted: relatedRoasts.reduce((sum, r) => sum + r.roastedQtyKg, 0),
      avgRoastLoss: relatedRoasts.length > 0 
        ? relatedRoasts.reduce((sum, r) => sum + r.weightLossPercentage, 0) / relatedRoasts.length 
        : 0
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-black pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Facturación</h2>
          <p className="text-stone-500 font-medium uppercase tracking-wide">Cierre y Gestión de Cobros</p>
        </div>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeTab === 'invoices' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black'
            }`}
          >
            <Receipt className="w-4 h-4" /> Facturas
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeTab === 'expenses' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Gastos
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="border border-stone-200 bg-white print:border-none">
          <div className="p-6 border-b border-stone-200 bg-stone-50 flex justify-between items-center print:hidden">
             <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Pedidos Despachados</span>
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setShowPendingReport(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all"
               >
                 <Download className="w-4 h-4" /> Reporte Pendientes
               </button>
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                 <input 
                   type="text" 
                   placeholder="BUSCAR..." 
                   className="pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs font-bold focus:border-black focus:ring-0 w-48 transition-colors"
                 />
               </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100">Fecha Envío</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100">Fecha Facturación</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shippedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-stone-400 font-medium uppercase text-sm">
                      No hay pedidos pendientes de facturar.
                    </td>
                  </tr>
                ) : (
                  shippedOrders.map((o) => (
                    <tr 
                      key={o.id} 
                      className="group hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-6 py-4 border-r border-stone-100">
                        <div className="font-bold text-black text-sm tracking-tight">{o.clientName}</div>
                        <div className="text-xs text-stone-500 font-bold uppercase mt-1">{o.variety} • {o.quantityKg} Kg</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-600 font-bold uppercase tracking-wider tabular-nums border-r border-stone-100">
                        {o.shippedDate?.split('T')[0] || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider tabular-nums border-r border-stone-100">
                        {o.invoicedDate ? (
                          <span className="text-black">{o.invoicedDate.split('T')[0]}</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-r border-stone-100">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                          o.status === 'Facturado' 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-stone-500 border-stone-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {o.status === 'Enviado' && canEdit && (
                            <button 
                              onClick={() => handleMarkAsInvoiced(o.id)}
                              className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black"
                              title="Marcar como Facturado"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedOrder(o);
                              setShowSummary(true);
                            }}
                            className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black"
                            title="Ver Ficha / Descargar"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === 'expenses' && <ExpensesView />}

      {/* Summary Modal (Printable) */}
      {showSummary && selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header - Hidden on Print */}
            <div className="sticky top-0 bg-white border-b border-black p-6 flex justify-between items-center print:hidden z-10">
              <h3 className="text-xl font-black uppercase tracking-tight">Resumen de Trazabilidad</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 print:p-0">
              {/* Printable Header */}
              <div className="mb-8 text-center border-b border-black pb-8">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Varietal</h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500">Desarrolladores de Café</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Cliente</h4>
                  <p className="text-xl font-bold">{selectedOrder.clientName}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Orden #</h4>
                  <p className="text-xl font-bold">{selectedOrder.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="bg-stone-50 p-6 border border-stone-200 mb-8 print:border-black print:bg-white">
                <h4 className="text-sm font-black uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">Detalles del Producto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase">Variedad</span>
                    <span className="font-bold text-lg">{selectedOrder.variety}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase">Cantidad</span>
                    <span className="font-bold text-lg">{selectedOrder.quantityKg} Kg</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase">Fecha Envío</span>
                    <span className="font-bold text-lg">{selectedOrder.shippedDate?.split('T')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Traceability Data */}
              <div className="mb-8">
                <h4 className="text-sm font-black uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">Trazabilidad de Tueste</h4>
                {(() => {
                  const trace = getTraceabilityData(selectedOrder);
                  return (
                    <div className="space-y-4">
                      {trace.stock && (
                         <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 print:bg-white print:border-stone-300">
                           <Scale className="w-5 h-5 mt-1" />
                           <div>
                             <p className="font-bold text-sm uppercase">Origen: Stock Tostado</p>
                             <p className="text-xs text-stone-500 uppercase font-medium">Lote: {trace.stock.roastId}</p>
                           </div>
                         </div>
                      )}
                      
                      {trace.roasts.length > 0 ? (
                        <table className="w-full text-sm border-collapse border border-stone-200">
                          <thead>
                            <tr className="bg-stone-100 print:bg-stone-50">
                              <th className="p-2 text-left font-bold border border-stone-200 uppercase text-xs">Fecha</th>
                              <th className="p-2 text-left font-bold border border-stone-200 uppercase text-xs">Lote</th>
                              <th className="p-2 text-right font-bold border border-stone-200 uppercase text-xs">Merma</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trace.roasts.map(r => (
                              <tr key={r.id}>
                                <td className="p-2 border border-stone-200 font-medium">{r.roastDate.split('T')[0]}</td>
                                <td className="p-2 border border-stone-200 font-bold">{r.id.slice(0, 8)}</td>
                                <td className="p-2 text-right border border-stone-200 font-medium">{r.weightLossPercentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-stone-400 italic text-sm border border-dashed border-stone-300 p-4 text-center">Sin datos de tueste vinculados</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-12 pt-8 border-t-2 border-black text-center print:mt-24">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Varietal - Calidad Garantizada</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Report Modal */}
      {showPendingReport && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPendingReport(false)}
        >
          <div 
            className="bg-white w-full max-w-lg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black">
              <h3 className="text-xl font-black uppercase tracking-tight">Reporte Pendientes</h3>
              <button onClick={() => setShowPendingReport(false)}>
                <X className="w-6 h-6 hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-2">Total por Cobrar</p>
                <h2 className="text-5xl font-black tracking-tighter">
                  {pendingOrders.length} <span className="text-lg font-bold text-stone-400">PEDIDOS</span>
                </h2>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-8 border border-stone-200 p-4 bg-stone-50">
                {pendingOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b border-stone-200 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-sm uppercase">{order.clientName}</p>
                      <p className="text-xs text-stone-500 font-medium">{order.shippedDate?.split('T')[0]}</p>
                    </div>
                    <span className="font-bold text-sm">{order.quantityKg} kg</span>
                  </div>
                ))}
              </div>

              <button 
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Imprimir Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicingView;
