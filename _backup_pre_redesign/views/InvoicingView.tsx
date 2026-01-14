
import React, { useState, useRef } from 'react';
import { db, syncToCloud } from '../db';
import { Order, Roast, RoastedStock } from '../types';
import { FileText, CheckCircle, Search, ExternalLink, X, Printer, Download, Coffee, Scale, Package, Flame, DollarSign, Receipt } from 'lucide-react';
import ExpensesView from './ExpensesView';

interface Props {
  orders: Order[];
  roasts: Roast[];
  stocks: RoastedStock[];
}

const InvoicingView: React.FC<Props> = ({ orders, roasts, stocks }) => {
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-stone-900 tracking-tight">Facturación</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Cierre y Gestión de Cobros</p>
        </div>
        
        <div className="bg-stone-100 p-1 rounded-xl flex items-center self-start md:self-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'invoices' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Facturas
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'expenses' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Gastos
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden print:hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
             <span className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Pedidos Despachados</span>
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setShowPendingReport(true)}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 hover:border-stone-300 transition-colors"
               >
                 <Download className="w-3.5 h-3.5" /> Reporte Pendientes
               </button>
               <Search className="w-4 h-4 text-stone-300" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-stone-50/30 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha Envío</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha Facturación</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {shippedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-stone-400 font-medium text-sm italic">
                      No hay pedidos pendientes de facturar.
                    </td>
                  </tr>
                ) : (
                  shippedOrders.map((o) => (
                    <tr 
                      key={o.id} 
                      className="group hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-stone-900 text-sm tracking-tight">{o.clientName}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">{o.variety} • {o.quantityKg} Kg</div>
                      </td>
                      <td className="px-6 py-5 text-xs text-stone-500 font-bold uppercase tracking-wider tabular-nums">{o.shippedDate?.split('T')[0] || '—'}</td>
                      <td className="px-6 py-5 text-xs text-stone-500 font-bold uppercase tracking-wider tabular-nums">
                        {o.invoicedDate ? (
                          <span className="text-emerald-600">{o.invoicedDate.split('T')[0]}</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          o.status === 'Facturado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {o.status === 'Enviado' && (
                            <button 
                              onClick={() => handleMarkAsInvoiced(o.id)}
                              className="p-2 text-stone-400 hover:text-emerald-600 transition-colors bg-white border border-stone-200 rounded-lg hover:border-emerald-200 shadow-sm"
                              title="Marcar como Facturado"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedOrder(o);
                              setShowSummary(true);
                            }}
                            className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-white border border-stone-200 rounded-lg hover:border-stone-300 shadow-sm"
                            title="Ver Ficha / Descargar"
                          >
                            <FileText className="w-4 h-4" />
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
        <div className="fixed inset-0 z-[100] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-none print:h-auto">
            {/* Modal Header - Hidden on Print */}
            <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center print:hidden z-10">
              <h3 className="text-lg font-bold text-stone-900">Resumen de Trazabilidad</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowSummary(false)} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-8 print:p-12">
              <div className="flex justify-between items-end border-b-2 border-stone-900 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">VARIETAL</h1>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em]">Informe de Trazabilidad</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">Orden #{selectedOrder.id.slice(0, 8)}</p>
                  <p className="text-xs text-stone-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Cliente</h4>
                  <p className="text-lg font-bold text-stone-900">{selectedOrder.clientName}</p>
                  <p className="text-sm text-stone-600">{selectedOrder.type}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Producto</h4>
                  <p className="text-lg font-bold text-stone-900">{selectedOrder.variety}</p>
                  <p className="text-sm text-stone-600">{selectedOrder.quantityKg} Kg Solicitados</p>
                </div>
              </div>

              {(() => {
                const trace = getTraceabilityData(selectedOrder);
                return (
                  <div className="space-y-8">
                    {/* Roasting Section */}
                    {trace.roasts.length > 0 && (
                      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 print:border print:border-stone-300">
                        <div className="flex items-center gap-2 mb-4 text-amber-800">
                          <Flame className="w-5 h-5" />
                          <h4 className="font-bold text-sm uppercase tracking-wide">Proceso de Tueste</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Café Verde</span>
                            <p className="text-sm font-bold text-stone-900">{trace.totalGreenUsed.toFixed(2)} Kg</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Café Tostado</span>
                            <p className="text-sm font-bold text-stone-900">{trace.totalRoasted.toFixed(2)} Kg</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Merma Tueste</span>
                            <p className="text-sm font-bold text-stone-900">{trace.avgRoastLoss.toFixed(2)}%</p>
                          </div>
                        </div>
                        <div className="text-xs text-stone-500">
                          <span className="font-bold">Perfiles:</span> {trace.roasts.map(r => r.profile).join(', ')}
                        </div>
                      </div>
                    )}

                    {/* Selection Section */}
                    {trace.stock && trace.stock.mermaGrams > 0 && (
                      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 print:border print:border-stone-300">
                         <div className="flex items-center gap-2 mb-4 text-stone-800">
                          <Scale className="w-5 h-5" />
                          <h4 className="font-bold text-sm uppercase tracking-wide">Selección y Calidad</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Merma Selección</span>
                             <p className="text-sm font-bold text-stone-900">{trace.stock.mermaGrams} g</p>
                          </div>
                          <div>
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Estado</span>
                             <p className="text-sm font-bold text-stone-900">Defectos Eliminados</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dispatch Section */}
                    <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 print:border print:border-stone-300">
                        <div className="flex items-center gap-2 mb-4 text-emerald-800">
                          <Package className="w-5 h-5" />
                          <h4 className="font-bold text-sm uppercase tracking-wide">Despacho</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Fecha Envío</span>
                             <p className="text-sm font-bold text-stone-900">{selectedOrder.shippedDate?.split('T')[0]}</p>
                          </div>
                          <div>
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Empaque</span>
                             <p className="text-sm font-bold text-stone-900">
                               {selectedOrder.packagingType === 'grainpro' ? 'GrainPro' : 'Bolsas'}
                             </p>
                          </div>
                          <div>
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Insumos</span>
                             <p className="text-sm font-bold text-stone-900">{selectedOrder.bagsUsed || 0} Uds</p>
                          </div>
                        </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-12 mt-12 border-t border-stone-200 text-center">
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">Documento Generado por Varietal System</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invoices Report Modal */}
      {showPendingReport && (
        <div className="fixed inset-0 z-[100] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-none print:h-auto">
             {/* Header */}
             <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex justify-between items-center print:hidden z-10">
              <h3 className="text-lg font-bold text-stone-900">Reporte de Pendientes</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowPendingReport(false)} className="p-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 print:p-12 space-y-8">
               {/* Print Header */}
               <div className="flex justify-between items-end border-b-2 border-stone-900 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">VARIETAL</h1>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em]">Facturación Pendiente</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">Reporte General</p>
                  <p className="text-xs text-stone-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Content Table */}
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pedido</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Kg</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha Envío</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Costo Envío</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {pendingOrders.map(o => (
                        <tr key={o.id}>
                            <td className="px-6 py-5 text-sm font-bold text-stone-900">{o.clientName}</td>
                            <td className="px-6 py-5 text-sm text-stone-600">{o.variety} ({o.type})</td>
                            <td className="px-6 py-5 text-sm font-bold text-stone-900 text-right">{o.quantityKg.toFixed(2)}</td>
                            <td className="px-6 py-5 text-sm text-stone-600 tabular-nums">{o.shippedDate?.split('T')[0]}</td>
                            <td className="px-6 py-5 text-sm font-bold text-stone-900 text-right">${o.shippingCost?.toFixed(2) || '0.00'}</td>
                        </tr>
                    ))}
                    {pendingOrders.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-stone-400 text-sm">No hay facturaciones pendientes.</td></tr>
                    )}
                </tbody>
                {pendingOrders.length > 0 && (
                    <tfoot className="border-t-2 border-stone-200">
                        <tr>
                            <td colSpan={2} className="px-4 py-4 text-xs font-bold text-stone-900 uppercase text-right">Totales</td>
                            <td className="px-4 py-4 text-sm font-bold text-stone-900 text-right">
                                {pendingOrders.reduce((acc, o) => acc + o.quantityKg, 0).toFixed(2)}
                            </td>
                            <td></td>
                             <td className="px-4 py-4 text-sm font-bold text-stone-900 text-right">
                                ${pendingOrders.reduce((acc, o) => acc + (o.shippingCost || 0), 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                )}
              </table>
              <div className="pt-12 mt-12 border-t border-stone-200 text-center">
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">Documento Generado por Varietal System</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicingView;
