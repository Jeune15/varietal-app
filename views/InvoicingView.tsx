import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { Order, Roast, RoastedStock, ProductionActivity } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, Search, X, Printer, Download, Coffee, Scale, DollarSign, Receipt, ArrowRight, Calendar, Filter, ChevronLeft, ChevronRight, BarChart } from 'lucide-react';
import ExpensesView from './ExpensesView';

interface Props {
  orders: Order[];
  roasts: Roast[];
  stocks: RoastedStock[];
}

const InvoicingView: React.FC<Props> = ({ orders, roasts, stocks }) => {
  const { canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'history'>('invoices');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPendingReport, setShowPendingReport] = useState(false);

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyType, setHistoryType] = useState<'all' | 'service' | 'sale'>('all');
  const [historyPage, setHistoryPage] = useState(1);
  
  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'annual'>('daily');
  const [reportData, setReportData] = useState<{
    count: number;
    totalKg: number;
    serviceCount: number;
    saleCount: number;
    serviceKg: number;
    saleKg: number;
    dateRange: string;
  } | null>(null);

  const history = useLiveQuery(() => db.history.toArray() as Promise<ProductionActivity[]>) || [];

  const pendingServiceOrders = orders.filter(
    o => o.type === 'Servicio de Tueste' && o.status === 'Enviado'
  );
  // Only show pending (Enviado) orders in the main tab, move Facturado to History
  const shippedSaleOrders = orders.filter(
    o => o.type === 'Venta Café Tostado' && o.status === 'Enviado'
  );

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
    
    const activitiesForOrder = history.filter(a => {
      const details: any = a.details || {};
      return details.selectedOrderId === order.id;
    });

    return {
      roasts: relatedRoasts,
      stock,
      totalGreenUsed: relatedRoasts.reduce((sum, r) => sum + r.greenQtyKg, 0),
      totalRoasted: relatedRoasts.reduce((sum, r) => sum + r.roastedQtyKg, 0),
      avgRoastLoss: relatedRoasts.length > 0 
        ? relatedRoasts.reduce((sum, r) => sum + r.weightLossPercentage, 0) / relatedRoasts.length 
        : 0,
      activities: activitiesForOrder
    };
  };

  // History Logic
  const invoicedOrders = orders
    .filter(o => o.status === 'Facturado')
    .sort((a, b) => {
      const dateA = a.invoicedDate || a.shippedDate || '';
      const dateB = b.invoicedDate || b.shippedDate || '';
      return dateB.localeCompare(dateA);
    });

  const filteredHistory = invoicedOrders.filter(o => {
    const matchesSearch = o.clientName.toLowerCase().includes(historySearch.toLowerCase()) || 
                          o.variety.toLowerCase().includes(historySearch.toLowerCase());
    const matchesDate = historyDate ? (o.invoicedDate?.startsWith(historyDate)) : true;
    const matchesType = historyType === 'all' 
      ? true 
      : historyType === 'service' 
        ? o.type === 'Servicio de Tueste'
        : o.type === 'Venta Café Tostado';
    return matchesSearch && matchesDate && matchesType;
  });

  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  const generateReport = (type: 'daily' | 'weekly' | 'annual') => {
    const now = new Date();
    let startDate = new Date();
    let dateRangeStr = '';

    if (type === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      dateRangeStr = now.toLocaleDateString();
    } else if (type === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      dateRangeStr = `Semana del ${startDate.toLocaleDateString()}`;
    } else if (type === 'annual') {
      startDate = new Date(now.getFullYear(), 0, 1);
      dateRangeStr = `Año ${now.getFullYear()}`;
    }

    const reportOrders = invoicedOrders.filter(o => {
      if (!o.invoicedDate) return false;
      const d = new Date(o.invoicedDate);
      return d >= startDate;
    });

    const stats = reportOrders.reduce((acc, o) => {
      const qty = o.type === 'Servicio de Tueste' && typeof o.serviceRoastedQtyKg === 'number' 
        ? o.serviceRoastedQtyKg 
        : o.quantityKg;
      
      acc.count++;
      acc.totalKg += qty;
      
      if (o.type === 'Servicio de Tueste') {
        acc.serviceCount++;
        acc.serviceKg += qty;
      } else {
        acc.saleCount++;
        acc.saleKg += qty;
      }
      return acc;
    }, {
      count: 0,
      totalKg: 0,
      serviceCount: 0,
      saleCount: 0,
      serviceKg: 0,
      saleKg: 0
    });

    setReportType(type);
    setReportData({ ...stats, dateRange: dateRangeStr });
    setShowReportModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="bg-white min-h-screen text-black font-sans p-8 animate-fade-in dark:bg-black dark:text-white pb-48">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Facturación</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Cierre y Gestión de Cobros</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeTab === 'invoices' 
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-black dark:text-stone-400 dark:border-stone-800 dark:hover:border-white dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" /> Facturas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeTab === 'history' 
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-black dark:text-stone-400 dark:border-stone-800 dark:hover:border-white dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> Historial
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
              activeTab === 'expenses' 
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black dark:bg-black dark:text-stone-400 dark:border-stone-800 dark:hover:border-white dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Gastos
          </button>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="space-y-10">
          <div className="border border-stone-200 bg-white print:border-none dark:bg-black dark:border-stone-800">
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex justify-between items-center print:hidden dark:bg-stone-900 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest dark:text-stone-400">
                Pendiente de Facturación (Servicios de Tueste)
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPendingReport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all dark:bg-black dark:text-white dark:border-stone-800 dark:hover:bg-white dark:hover:text-black"
                >
                  <Download className="w-4 h-4" /> Reporte Pendientes
                </button>
              </div>
            </div>

            {/* Mobile Cards for Pending Service Orders */}
            <div className="lg:hidden space-y-4 px-4 pb-4">
              {pendingServiceOrders.length === 0 ? (
                <div className="p-8 text-center text-stone-400 font-medium uppercase text-sm border border-dashed border-stone-300 dark:border-stone-700">
                  No hay servicios de tueste pendientes
                </div>
              ) : (
                pendingServiceOrders.map(o => (
                  <div key={o.id} className="bg-white border border-stone-200 p-4 shadow-sm space-y-3 dark:bg-stone-900 dark:border-stone-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-black text-sm dark:text-white">{o.clientName}</div>
                        <div className="text-xs text-stone-500 font-bold uppercase mt-1 dark:text-stone-400">
                          {o.variety} • {typeof o.serviceRoastedQtyKg === 'number' ? o.serviceRoastedQtyKg : o.quantityKg} Kg
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-white border border-stone-200 text-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400">
                        {o.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs dark:border-stone-800">
                      <div>
                        <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Envío</span>
                        <span className="font-mono text-stone-600 dark:text-stone-400">{o.shippedDate?.split('T')[0] || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Facturación</span>
                        <span className="font-mono text-stone-600 dark:text-stone-400">{o.invoicedDate ? o.invoicedDate.split('T')[0] : '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {o.status === 'Enviado' && canEdit && (
                        <button
                          onClick={() => handleMarkAsInvoiced(o.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-stone-200"
                        >
                          <CheckCircle className="w-4 h-4" /> Facturar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowSummary(true);
                        }}
                        className="p-2 border border-stone-200 text-stone-500 hover:text-black hover:border-black transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:text-white dark:hover:border-white"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 dark:bg-stone-900 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Fecha Envío
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Fecha Facturación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {pendingServiceOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-stone-400 font-medium uppercase text-sm"
                      >
                        No hay servicios de tueste pendientes de facturar.
                      </td>
                    </tr>
                  ) : (
                    pendingServiceOrders.map(o => (
                      <tr key={o.id} className="group hover:bg-stone-50 transition-colors dark:hover:bg-stone-800">
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <div className="font-bold text-black text-sm tracking-tight dark:text-white">
                            {o.clientName}
                          </div>
                          <div className="text-xs text-stone-500 font-bold uppercase mt-1 dark:text-stone-400">
                            {o.variety} •{' '}
                            {(
                              typeof o.serviceRoastedQtyKg === 'number'
                                ? o.serviceRoastedQtyKg
                                : o.quantityKg
                            )}{' '}
                            Kg
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-600 font-bold uppercase tracking-wider tabular-nums border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                          {o.shippedDate?.split('T')[0] || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider tabular-nums border-r border-stone-100 dark:border-stone-800">
                          {o.invoicedDate ? (
                            <span className="text-black dark:text-white">{o.invoicedDate.split('T')[0]}</span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider border bg-white text-stone-500 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {o.status === 'Enviado' && canEdit && (
                              <button
                                onClick={() => handleMarkAsInvoiced(o.id)}
                                className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black dark:text-stone-500 dark:hover:text-white dark:hover:bg-stone-700 dark:hover:border-white"
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
                              className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black dark:text-stone-500 dark:hover:text-white dark:hover:bg-stone-700 dark:hover:border-white"
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

          <div className="border border-stone-200 bg-white print:border-none dark:bg-black dark:border-stone-800">
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex justify-between items-center print:hidden dark:bg-stone-900 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest dark:text-stone-400">
                Pedidos Enviados (Ventas de Café Tostado)
              </span>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="BUSCAR..."
                    className="pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs font-bold focus:border-black focus:ring-0 w-48 transition-colors dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Cards for Shipped Orders */}
            <div className="lg:hidden space-y-4 px-4 pb-4">
              {shippedSaleOrders.length === 0 ? (
                <div className="p-8 text-center text-stone-400 font-medium uppercase text-sm border border-dashed border-stone-300 dark:border-stone-700">
                  No hay ventas de café tostado enviadas
                </div>
              ) : (
                shippedSaleOrders.map(o => (
                  <div key={o.id} className="bg-white border border-stone-200 p-4 shadow-sm space-y-3 dark:bg-stone-900 dark:border-stone-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-black text-sm dark:text-white">{o.clientName}</div>
                        <div className="text-xs text-stone-500 font-bold uppercase mt-1 dark:text-stone-400">
                          {o.variety} • {o.quantityKg} Kg
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                        o.status === 'Facturado' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-white text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs dark:border-stone-800">
                      <div>
                        <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Envío</span>
                        <span className="font-mono text-stone-600 dark:text-stone-400">{o.shippedDate?.split('T')[0] || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Facturación</span>
                        <span className="font-mono text-stone-600 dark:text-stone-400">{o.invoicedDate ? o.invoicedDate.split('T')[0] : '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {o.status === 'Enviado' && canEdit && (
                        <button
                          onClick={() => handleMarkAsInvoiced(o.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-stone-200"
                        >
                          <CheckCircle className="w-4 h-4" /> Facturar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowSummary(true);
                        }}
                        className="p-2 border border-stone-200 text-stone-500 hover:text-black hover:border-black transition-colors dark:border-stone-800 dark:text-stone-400 dark:hover:text-white dark:hover:border-white"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 dark:bg-stone-900 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Fecha Envío
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Fecha Facturación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {shippedSaleOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-stone-400 font-medium uppercase text-sm"
                      >
                        No hay ventas de café tostado enviadas.
                      </td>
                    </tr>
                  ) : (
                    shippedSaleOrders.map(o => (
                      <tr key={o.id} className="group hover:bg-stone-50 transition-colors dark:hover:bg-stone-800">
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <div className="font-bold text-black text-sm tracking-tight dark:text-white">
                            {o.clientName}
                          </div>
                          <div className="text-xs text-stone-500 font-bold uppercase mt-1 dark:text-stone-400">
                            {o.variety} • {o.quantityKg} Kg
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-600 font-bold uppercase tracking-wider tabular-nums border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                          {o.shippedDate?.split('T')[0] || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider tabular-nums border-r border-stone-100 dark:border-stone-800">
                          {o.invoicedDate ? (
                            <span className="text-black dark:text-white">{o.invoicedDate.split('T')[0]}</span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <span
                            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                              o.status === 'Facturado'
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                                : 'bg-white text-stone-500 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {o.status === 'Enviado' && canEdit && (
                              <button
                                onClick={() => handleMarkAsInvoiced(o.id)}
                                className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black dark:text-stone-500 dark:hover:text-white dark:hover:bg-stone-700 dark:hover:border-white"
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
                              className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black dark:text-stone-500 dark:hover:text-white dark:hover:bg-stone-700 dark:hover:border-white"
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
        </div>
      ) : null}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-stone-50 p-6 border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="BUSCAR CLIENTE..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs font-bold focus:border-black focus:ring-0 w-full lg:w-64 transition-colors dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-white"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="pl-4 pr-4 py-2 bg-white border border-stone-200 text-xs font-bold focus:border-black focus:ring-0 w-full lg:w-40 transition-colors dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-white"
                />
              </div>

              {/* Type Filter */}
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value as any)}
                className="pl-4 pr-8 py-2 bg-white border border-stone-200 text-xs font-bold focus:border-black focus:ring-0 w-full lg:w-48 transition-colors dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-white"
              >
                <option value="all">Todos los Servicios</option>
                <option value="service">Servicio de Tueste</option>
                <option value="sale">Venta Café Tostado</option>
              </select>
            </div>

            {/* Report Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => generateReport('daily')}
                className="px-4 py-2 bg-white border border-stone-200 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-white dark:hover:text-black"
              >
                Hoy
              </button>
              <button
                onClick={() => generateReport('weekly')}
                className="px-4 py-2 bg-white border border-stone-200 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-white dark:hover:text-black"
              >
                Semana
              </button>
              <button
                onClick={() => generateReport('annual')}
                className="px-4 py-2 bg-white border border-stone-200 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-white dark:hover:text-black"
              >
                Anual
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="border border-stone-200 bg-white dark:bg-black dark:border-stone-800">
             <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 dark:bg-stone-900 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Fecha Factura</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">Tipo</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest border-r border-stone-100 dark:text-stone-400 dark:border-stone-800 text-right">Cantidad</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-stone-400 font-medium uppercase text-sm">
                        No hay facturaciones que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map(o => (
                      <tr key={o.id} className="group hover:bg-stone-50 transition-colors dark:hover:bg-stone-800">
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <div className="font-bold text-black text-sm tracking-tight dark:text-white">{o.clientName}</div>
                          <div className="text-xs text-stone-500 font-bold uppercase mt-1 dark:text-stone-400">{o.variety}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-stone-600 border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                          {o.invoicedDate?.split('T')[0]}
                        </td>
                        <td className="px-6 py-4 border-r border-stone-100 dark:border-stone-800">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                            o.type === 'Servicio de Tueste' 
                              ? 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                              : 'bg-black text-white border-black dark:bg-stone-700 dark:text-white dark:border-stone-600'
                          }`}>
                            {o.type === 'Servicio de Tueste' ? 'Servicio' : 'Venta'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-stone-600 text-right tabular-nums border-r border-stone-100 dark:text-stone-400 dark:border-stone-800">
                          {(o.type === 'Servicio de Tueste' && typeof o.serviceRoastedQtyKg === 'number' 
                            ? o.serviceRoastedQtyKg 
                            : o.quantityKg).toFixed(2)} Kg
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setShowSummary(true);
                            }}
                            className="p-2 text-stone-400 hover:text-black hover:bg-stone-200 transition-colors border border-transparent hover:border-black dark:text-stone-500 dark:hover:text-white dark:hover:bg-stone-700 dark:hover:border-white"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest dark:text-stone-400">
                  Página {historyPage} de {totalPages}
                </span>
                <button
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  disabled={historyPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-white"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && <ExpensesView />}

      </div>

      {/* Summary Modal (Printable) */}
      {showSummary && selectedOrder && createPortal(
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0 dark:bg-black/90">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto animate-in fade-in zoom-in duration-200 dark:bg-stone-900 dark:border-white dark:text-white">
            {/* Modal Header - Hidden on Print */}
            <div className="sticky top-0 bg-white border-b border-black p-6 flex justify-between items-center print:hidden z-10 dark:bg-stone-900 dark:border-white">
              <h3 className="text-xl font-black uppercase tracking-tight">Resumen de Trazabilidad</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200 dark:hover:bg-stone-800 dark:hover:border-stone-700">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200 dark:hover:bg-stone-800 dark:hover:border-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 print:p-0">
              {/* Printable Header */}
              <div className="mb-8 text-center border-b border-black pb-8 dark:border-white">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Varietal</h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">Desarrolladores de Café</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 dark:text-stone-500">Cliente</h4>
                  <p className="text-xl font-bold">{selectedOrder.clientName}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 dark:text-stone-500">Orden #</h4>
                  <p className="text-xl font-bold">{selectedOrder.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="bg-stone-50 p-6 border border-stone-200 mb-8 print:border-black print:bg-white dark:bg-stone-950 dark:border-stone-800">
                <h4 className="text-sm font-black uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 dark:border-stone-800">Detalles del Producto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase dark:text-stone-500">Variedad</span>
                    <span className="font-bold text-lg">{selectedOrder.variety}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase dark:text-stone-500">Cantidad</span>
                    <span className="font-bold text-lg">
                      {(() => {
                        const order = selectedOrder;
                        const displayQty =
                          order.type === 'Servicio de Tueste' && typeof order.serviceRoastedQtyKg === 'number'
                            ? order.serviceRoastedQtyKg
                            : order.quantityKg;
                        return `${displayQty} Kg`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-400 uppercase dark:text-stone-500">Fecha Envío</span>
                    <span className="font-bold text-lg">{selectedOrder.shippedDate?.split('T')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Traceability Data */}
              <div className="mb-8">
                <h4 className="text-sm font-black uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 dark:border-stone-800">Trazabilidad de Tueste</h4>
                {(() => {
                  const trace = getTraceabilityData(selectedOrder);
                  return (
                    <div className="space-y-4">
                      {trace.stock && (
                         <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 print:bg-white print:border-stone-300 dark:bg-stone-950 dark:border-stone-800">
                           <Scale className="w-5 h-5 mt-1" />
                           <div>
                             <p className="font-bold text-sm uppercase">Origen: Stock Tostado</p>
                             <p className="text-xs text-stone-500 uppercase font-medium dark:text-stone-400">Lote: {trace.stock.roastId}</p>
                           </div>
                         </div>
                      )}
                      
                      {trace.roasts.length > 0 ? (
                        <table className="w-full text-sm border-collapse border border-stone-200 dark:border-stone-800">
                          <thead>
                            <tr className="bg-stone-100 print:bg-stone-50 dark:bg-stone-800">
                              <th className="p-2 text-left font-bold border border-stone-200 uppercase text-xs dark:border-stone-700">Fecha Tueste</th>
                              <th className="p-2 text-left font-bold border border-stone-200 uppercase text-xs dark:border-stone-700">Lote</th>
                              <th className="p-2 text-right font-bold border border-stone-200 uppercase text-xs dark:border-stone-700">Café Verde (Kg)</th>
                              <th className="p-2 text-right font-bold border border-stone-200 uppercase text-xs dark:border-stone-700">Café Tostado (Kg)</th>
                              <th className="p-2 text-right font-bold border border-stone-200 uppercase text-xs dark:border-stone-700">Merma (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trace.roasts.map(r => (
                              <tr key={r.id}>
                                <td className="p-2 border border-stone-200 font-medium dark:border-stone-800">{r.roastDate.split('T')[0]}</td>
                                <td className="p-2 border border-stone-200 font-bold dark:border-stone-800">{r.id.slice(0, 8)}</td>
                                <td className="p-2 text-right border border-stone-200 font-medium dark:border-stone-800">{r.greenQtyKg.toFixed(2)} Kg</td>
                                <td className="p-2 text-right border border-stone-200 font-medium dark:border-stone-800">{r.roastedQtyKg.toFixed(2)} Kg</td>
                                <td className="p-2 text-right border border-stone-200 font-medium dark:border-stone-800">{r.weightLossPercentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-stone-400 italic text-sm border border-dashed border-stone-300 p-4 text-center dark:border-stone-700">Sin datos de tueste vinculados</p>
                      )}

                      {trace.activities && trace.activities.length > 0 && (
                        <div className="mt-6">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2 dark:text-stone-400">Actividades de Producción</h5>
                          <table className="w-full text-xs border-collapse border border-stone-200 dark:border-stone-800">
                            <thead>
                              <tr className="bg-stone-100 print:bg-stone-50 dark:bg-stone-800">
                                <th className="p-2 text-left font-bold border border-stone-200 uppercase dark:border-stone-700">Fecha</th>
                                <th className="p-2 text-left font-bold border border-stone-200 uppercase dark:border-stone-700">Actividad</th>
                                <th className="p-2 text-left font-bold border border-stone-200 uppercase dark:border-stone-700">Lote</th>
                                <th className="p-2 text-right font-bold border border-stone-200 uppercase dark:border-stone-700">Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trace.activities.map((a: ProductionActivity) => {
                                const details: any = a.details || {};
                                const date = a.date.split('T')[0];
                                const packaging =
                                  details.packagingType === 'grainpro'
                                    ? `GrainPro x${details.bagsUsed || 0}`
                                    : details.packagingType === 'bags'
                                    ? `Bolsas x${details.bagsUsed || 0}`
                                    : '';
                                return (
                                  <tr key={a.id}>
                                    <td className="p-2 border border-stone-200 font-medium dark:border-stone-800">{date}</td>
                                    <td className="p-2 border border-stone-200 font-medium dark:border-stone-800">{a.type}</td>
                                    <td className="p-2 border border-stone-200 font-medium dark:border-stone-800">{details.stockVariety || '—'}</td>
                                    <td className="p-2 border border-stone-200 text-right font-medium dark:border-stone-800">{packaging || '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-12 pt-8 border-t-2 border-black text-center print:mt-24 dark:border-white">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Varietal - Calidad Garantizada</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pending Report Modal */}
      {showPendingReport && createPortal(
        <div 
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowPendingReport(false)}
        >
          <div 
            className="bg-white w-full max-w-lg border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 dark:bg-stone-900 dark:border-stone-800 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-black dark:bg-stone-950 dark:border-stone-800">
              <h3 className="text-xl font-black uppercase tracking-tight">Reporte Pendientes</h3>
              <button onClick={() => setShowPendingReport(false)}>
                <X className="w-6 h-6 hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-2 dark:text-stone-400">Total por Cobrar</p>
                <h2 className="text-5xl font-black tracking-tighter">
                  {pendingServiceOrders.length}{' '}
                  <span className="text-lg font-bold text-stone-400 dark:text-stone-500">PEDIDOS</span>
                </h2>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-8 border border-stone-200 p-4 bg-stone-50 dark:bg-stone-950 dark:border-stone-800">
                {pendingServiceOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b border-stone-200 pb-2 last:border-0 last:pb-0 dark:border-stone-800">
                    <div>
                      <p className="font-bold text-sm uppercase">{order.clientName}</p>
                      <p className="text-xs text-stone-500 font-medium dark:text-stone-400">{order.shippedDate?.split('T')[0]}</p>
                    </div>
                    <span className="font-bold text-sm">{order.quantityKg} kg</span>
                  </div>
                ))}
              </div>

              <button 
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 dark:bg-white dark:text-black dark:hover:bg-stone-200"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Imprimir Reporte
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Report Modal */}
      {showReportModal && reportData && createPortal(
        <div className="fixed inset-0 z-[200] bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md border border-black dark:border-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-black dark:bg-stone-950 text-white border-b border-stone-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight">
                Reporte {reportType === 'daily' ? 'Diario' : reportType === 'weekly' ? 'Semanal' : 'Anual'}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-white hover:text-stone-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Periodo</p>
                <p className="text-xl font-black uppercase">{reportData.dateRange}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 border border-stone-200 dark:bg-stone-950 dark:border-stone-800">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Facturas</p>
                  <p className="text-2xl font-black">{reportData.count}</p>
                </div>
                <div className="bg-stone-50 p-4 border border-stone-200 dark:bg-stone-950 dark:border-stone-800">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Kg</p>
                  <p className="text-2xl font-black">{reportData.totalKg.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase text-stone-500 dark:text-stone-400">Servicios</span>
                  <div className="text-right">
                    <span className="block font-bold">{reportData.serviceCount} órdenes</span>
                    <span className="text-xs text-stone-400 font-mono">{reportData.serviceKg.toFixed(2)} Kg</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase text-stone-500 dark:text-stone-400">Ventas</span>
                  <div className="text-right">
                    <span className="block font-bold">{reportData.saleCount} órdenes</span>
                    <span className="text-xs text-stone-400 font-mono">{reportData.saleKg.toFixed(2)} Kg</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowReportModal(false)}
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-stone-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InvoicingView;
