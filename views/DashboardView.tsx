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
}

const DashboardView: React.FC<Props> = ({ green, roasts, orders }) => {
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

  const roastHistoryData = useMemo(() => {
     return roasts.slice(-7).map(r => ({
        name: r.roastDate.split('-').slice(1).join('/'),
        kg: Number(r.roastedQtyKg) || 0
      }));
  }, [roasts]);

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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black pb-6">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Dashboard</h2>
          <p className="text-stone-500 font-mono text-xs mt-1 uppercase tracking-widest">Vista General de Operaciones</p>
        </div>
        <div className="hidden md:flex gap-2">
           <div className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {new Date().toLocaleDateString()}
           </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          label="STOCK VERDE" 
          value={`${totalGreen.toFixed(0)} Kg`} 
          icon={<Package strokeWidth={1.5} />} 
          description="Inventario Disponible"
        />
        <MetricCard 
          label="TOTAL TOSTADO" 
          value={`${totalRoasted.toFixed(0)} Kg`} 
          icon={<Flame strokeWidth={1.5} />} 
          description="Producción Histórica"
        />
        <MetricCard 
          label="ORDENES PENDIENTES" 
          value={pendingOrders} 
          icon={<Clock strokeWidth={1.5} />} 
          description="Por Procesar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras - Producción */}
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
