import React, { useState, useMemo } from 'react';
import { GreenCoffee, Roast, Order } from '../types';
import { exportDatabaseToJson, initSupabase } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, Flame, Download, Link, Globe, Info, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';

interface Props {
  green: GreenCoffee[];
  roasts: Roast[];
  orders: Order[];
  onNavigate?: (tabId: string) => void;
}

const DashboardView: React.FC<Props> = ({ green, roasts, orders, onNavigate }) => {
  const [showSyncConfig, setShowSyncConfig] = useState(false);
  const [syncForm, setSyncForm] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });
  
  const { canEdit } = useAuth();
  
  const totalGreen = green.reduce((acc, curr) => acc + (Number(curr.quantityKg) || 0), 0);
  const totalRoasted = roasts.reduce((acc, curr) => acc + (Number(curr.roastedQtyKg) || 0), 0);
  const pendingOrders = orders.filter(o => o.status !== 'Enviado' && o.status !== 'Facturado').length;
  
  // Architectural Monochromatic Palette
  const COLORS = ['#000000', '#404040', '#737373', '#A3A3A3', '#D4D4D4'];

  const today = new Date().toISOString().split('T')[0];

  const orderNeedsRoast = (order: Order) => {
    const isServiceOrder = order.type === 'Servicio de Tueste';
    const currentAccumulated = order.accumulatedRoastedKg || 0;
    const currentGreenAccumulated = order.accumulatedGreenUsedKg || 0;

    if (isServiceOrder) {
      return currentGreenAccumulated < (order.quantityKg - 0.1);
    }

    return currentAccumulated < (order.quantityKg - 0.1);
  };

  const roastingQueue = useMemo(
    () =>
      orders.filter(
        o =>
          (o.status === 'Pendiente' || o.status === 'En Producción') &&
          (o.requiresRoasting ?? true) &&
          orderNeedsRoast(o)
      ),
    [orders]
  );

  const packingQueue = useMemo(
    () => orders.filter(o => o.status === 'Listo para Despacho'),
    [orders]
  );

  const invoicingQueue = useMemo(
    () => orders.filter(o => o.status === 'Enviado'),
    [orders]
  );

  const openOrders = useMemo(
    () => orders.filter(o => o.status !== 'Facturado'),
    [orders]
  );

  const roastingQueuePreview = useMemo(
    () => roastingQueue.slice(0, 5),
    [roastingQueue]
  );

  const lowGreen = useMemo(
    () =>
      green
        .filter(g => g.quantityKg > 0 && g.quantityKg <= 5)
        .sort((a, b) => a.quantityKg - b.quantityKg)
        .slice(0, 5),
    [green]
  );

  const ordersByStatus = useMemo(() => {
    const totalOrders = orders.length;
    const getStats = (status: string) => {
        const filtered = orders.filter(o => o.status === status);
        const count = filtered.length;
        const kg = filtered.reduce((acc, curr) => acc + curr.quantityKg, 0);
        return { count, kg };
    };

    const statuses = ['Pendiente', 'En Producción', 'Listo para Despacho', 'Enviado', 'Facturado'];
    
    return statuses.map(status => {
        const stats = getStats(status);
        return {
            name: status === 'Listo para Despacho' ? 'Listo' : status,
            fullName: status,
            value: stats.count,
            kg: stats.kg,
            percentage: totalOrders > 0 ? ((stats.count / totalOrders) * 100).toFixed(1) : '0'
        };
    }).filter(item => item.value > 0);
  }, [orders]);

  const roastHistoryData = useMemo(
    () =>
      roasts.slice(-7).map(r => ({
        name: r.roastDate.split('-').slice(1).join('/'),
        kg: Number(r.roastedQtyKg) || 0
      })),
    [roasts]
  );

  const handleSaveConnection = () => {
    let url = syncForm.url.trim();
    if (url && syncForm.key) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      const cleanUrl = url.replace(/^https?:\/\//, '');
      if (!cleanUrl.includes('.')) {
           url = `https://${cleanUrl}.supabase.co`;
      }

      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', syncForm.key);
      initSupabase(url, syncForm.key);
      setShowSyncConfig(false);
      window.location.reload();
    }
  };

  const handleExport = async () => {
    const json = await exportDatabaseToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varietal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Panel Diario</h2>
          <p className="text-stone-500 font-mono text-xs uppercase tracking-widest">
            Resumen operativo para la tostaduría
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            {today}
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => onNavigate && onNavigate('orders')}
              className="px-3 py-1 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-colors"
            >
              Pedidos
            </button>
            <button
              onClick={() => onNavigate && onNavigate('roasting')}
              className="px-3 py-1 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-colors"
            >
              Tostado
            </button>
            <button
              onClick={() => onNavigate && onNavigate('invoicing')}
              className="px-3 py-1 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-colors"
            >
              Facturación
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Para Tostar"
          value={roastingQueue.length}
          icon={<Flame strokeWidth={1.5} />}
          description="Órdenes que requieren tueste"
        />
        <MetricCard
          label="Para Despacho"
          value={packingQueue.length}
          icon={<Package strokeWidth={1.5} />}
          description="Órdenes listas para armar y enviar"
        />
        <MetricCard
          label="Para Facturar"
          value={invoicingQueue.length}
          icon={<Clock strokeWidth={1.5} />}
          description="Órdenes enviadas sin factura"
        />
        <MetricCard
          label="Stock Verde"
          value={`${totalGreen.toFixed(0)} Kg`}
          icon={<Package strokeWidth={1.5} />}
          description="Total disponible en verde"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">
                  Cola de producción
                </p>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Órdenes para tostar
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-black text-white px-3 py-1 tracking-widest uppercase">
                {roastingQueue.length} activas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest">
                      Pedido
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest">
                      Café
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest text-right">
                      Pendiente Kg
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest text-right">
                      Entrega
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {roastingQueuePreview.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-[11px] text-stone-400 font-mono uppercase tracking-widest"
                      >
                        No hay órdenes pendientes de tueste
                      </td>
                    </tr>
                  ) : (
                    roastingQueuePreview.map(order => {
                      const isService = order.type === 'Servicio de Tueste';
                      const produced = isService
                        ? order.accumulatedGreenUsedKg || 0
                        : order.accumulatedRoastedKg || 0;
                      const remaining = Math.max(0, order.quantityKg - produced);
                      return (
                        <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3 align-top">
                            <div className="font-bold text-black text-xs truncate max-w-[140px]">
                              {order.clientName}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              #{order.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wide truncate max-w-[140px]">
                                {order.orderLines && order.orderLines.length > 0 ? 'Múltiples cafés' : order.variety}
                              </span>
                              {order.orderLines && order.orderLines.length > 0 && (
                                <div className="space-y-0.5 text-[9px] text-stone-500 font-mono max-w-[160px]">
                                  {order.orderLines.slice(0, 2).map(line => (
                                    <div key={line.id} className="flex justify-between">
                                      <span className="truncate max-w-[100px]">{line.variety}</span>
                                      <span>{line.quantityKg.toFixed(1)} Kg</span>
                                    </div>
                                  ))}
                                  {order.orderLines.length > 2 && (
                                    <div className="text-[8px] text-stone-400">
                                      +{order.orderLines.length - 2} más
                                    </div>
                                  )}
                                </div>
                              )}
                              {order.roastType && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-100">
                                  {order.roastType}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <span className="text-sm font-black text-black">
                              {remaining.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest ml-1">
                              Kg
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <span className="text-[11px] font-mono text-stone-500">
                              {order.dueDate}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {roastingQueue.length > roastingQueuePreview.length && (
              <div className="pt-3 mt-3 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => onNavigate && onNavigate('roasting')}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-black underline underline-offset-4"
                >
                  Ver cola completa en Tostado
                </button>
              </div>
            )}
          </div>

          <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">
                  Flujo de pedidos
                </p>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Órdenes abiertas
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-stone-900 text-white px-3 py-1 tracking-widest uppercase">
                {openOrders.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest">
                      Cliente
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest">
                      Estado
                    </th>
                    <th className="px-4 py-3 font-bold text-stone-500 uppercase tracking-widest text-right">
                      Progreso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {openOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-[11px] text-stone-400 font-mono uppercase tracking-widest"
                      >
                        No hay pedidos activos
                      </td>
                    </tr>
                  ) : (
                    openOrders.slice(0, 6).map(order => (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-black text-xs truncate max-w-[140px]">
                            {order.clientName}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {order.variety} • {order.quantityKg.toFixed(2)} Kg
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="border border-black px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-black whitespace-nowrap">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col items-end gap-1">
                            <div className="w-20 bg-stone-100 h-0.5 overflow-hidden">
                              <div
                                className={`h-full ${order.progress === 100 ? 'bg-black' : 'bg-stone-400'}`}
                                style={{
                                  width: `${Number.isNaN(order.progress) ? 0 : order.progress}%`
                                }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-stone-400">
                              {Number.isNaN(order.progress) ? 0 : order.progress}%
                            </span>
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

        <div className="space-y-6">
          <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">
                  Alertas de stock
                </p>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Verde crítico
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-stone-900 text-white px-3 py-1 tracking-widest uppercase">
                {lowGreen.length}
              </span>
            </div>
            {lowGreen.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-[11px] text-stone-400 font-mono uppercase tracking-widest">
                Sin alertas de stock verde
              </div>
            ) : (
              <div className="space-y-3">
                {lowGreen.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border border-stone-100 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-black uppercase tracking-wide truncate max-w-[140px]">
                        {item.variety}
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest truncate max-w-[140px]">
                        {item.clientName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-red-600">
                        {item.quantityKg.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest ml-1">
                        Kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                Resumen rápido
              </h3>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                {pendingOrders} pedidos abiertos
              </span>
            </div>
            <div className="space-y-2 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span>Kg tostados históricos</span>
                <span className="font-bold">{totalRoasted.toFixed(1)} Kg</span>
              </div>
              <div className="flex justify-between">
                <span>Kg verdes en sistema</span>
                <span className="font-bold">{totalGreen.toFixed(1)} Kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-stone-200 bg-white p-8 hover:border-black transition-colors duration-300">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2 border-b border-stone-100 pb-4">
            <BarChartIcon className="w-4 h-4" />
            Producción Reciente
          </h3>
          <div className="h-64 w-full">
            {roasts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roastHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#000', fontSize: 10, fontFamily: 'Inter', fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#A3A3A3', fontSize: 10, fontFamily: 'Inter'}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#F5F5F5'}} 
                    contentStyle={{
                        backgroundColor: '#000', 
                        border: 'none', 
                        color: '#fff',
                        fontFamily: 'Inter',
                        fontSize: '12px',
                        borderRadius: '0px'
                    }} 
                  />
                  <Bar dataKey="kg" fill="#000000" radius={[0, 0, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-300">
                    <Flame className="w-10 h-10 mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Sin registros</p>
                </div>
            )}
          </div>
        </div>

        {/* Gráfico de Pastel - Estado de Ordenes */}
        <div className="border border-stone-200 bg-white p-8 hover:border-black transition-colors duration-300 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2 border-b border-stone-100 pb-4">
            <PieChartIcon className="w-4 h-4" />
            Estado de Ordenes
          </h3>
          <div className="h-64 w-full relative">
             {orders.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    >
                    {ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <Label
                        value={orders.length}
                        position="center"
                        className="text-3xl font-black"
                        style={{ fill: '#000', fontSize: '24px', fontWeight: '900', fontFamily: 'Inter' }}
                    />
                    </Pie>
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-black text-white p-3 shadow-xl">
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1">{data.fullName}</p>
                                <p className="text-sm font-mono">{data.value} Ordenes ({data.percentage}%)</p>
                                <p className="text-xs text-stone-400 font-mono mt-1">{data.kg.toFixed(1)} Kg</p>
                                </div>
                            );
                            }
                            return null;
                        }}
                    />
                </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-300">
                    <Package className="w-10 h-10 mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Sin datos</p>
                </div>
             )}
          </div>
            
          <div className="mt-6 space-y-3">
              {ordersByStatus.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] uppercase tracking-wider text-stone-600 font-bold group-hover:text-black transition-colors">{entry.fullName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-stone-400">{entry.kg.toFixed(1)} Kg</span>
                    <span className="text-xs font-bold text-black min-w-[3rem] text-right">{entry.value} ({entry.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-stone-100">
        <div className="flex items-center gap-2 text-stone-400">
          <Info className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Varietal App V1.0</span>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; description?: string }> = ({ label, value, icon, description }) => (
  <div className="bg-white border border-stone-200 p-8 flex items-start justify-between hover:border-black transition-all duration-300 group">
    <div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3">{label}</p>
      <h3 className="text-4xl font-black text-black tracking-tighter mt-1">{value}</h3>
      {description && <p className="text-[10px] text-stone-400 mt-3 font-mono border-l-2 border-stone-100 pl-2">{description}</p>}
    </div>
    <div className="text-stone-300 group-hover:text-black transition-colors duration-300 transform group-hover:scale-110">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
  </div>
);

export default DashboardView;
