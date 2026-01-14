
import React, { useRef, useState } from 'react';
import { GreenCoffee, Roast, Order } from '../types';
import { exportDatabaseToJson, importDatabaseFromJson, initSupabase } from '../db';
import { TrendingUp, Package, Clock, Flame, CheckCircle2, Download, Link, Globe, Info, Menu } from 'lucide-react';
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
  Cell
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
  
  const totalGreen = green.reduce((acc, curr) => acc + (Number(curr.quantityKg) || 0), 0);
  const totalRoasted = roasts.reduce((acc, curr) => acc + (Number(curr.roastedQtyKg) || 0), 0);
  const pendingOrders = orders.filter(o => o.status !== 'Enviado' && o.status !== 'Facturado').length;
  
  const COLORS = ['#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b'];

  const ordersByStatus = [
    { name: 'Pendiente', value: orders.filter(o => o.status === 'Pendiente').length },
    { name: 'En Producción', value: orders.filter(o => o.status === 'En Producción').length },
    { name: 'Listo', value: orders.filter(o => o.status === 'Listo para Despacho').length },
    { name: 'Enviado', value: orders.filter(o => o.status === 'Enviado').length },
    { name: 'Facturado', value: orders.filter(o => o.status === 'Facturado').length },
  ].filter(item => item.value > 0);

  const roastHistoryData = roasts.slice(-7).map(r => ({
    name: r.roastDate.split('-').slice(1).join('/'),
    kg: Number(r.roastedQtyKg) || 0
  }));

  const handleSaveConnection = () => {
    let url = syncForm.url.trim();
    if (url && syncForm.key) {
      // Si no tiene protocolo, se lo agregamos
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      // Si la URL no contiene puntos (es solo un ID de proyecto), le agregamos el dominio de Supabase
      if (!url.includes('.')) {
        // Remover https:// para verificar si es solo el ID, aunque ya se lo agregamos arriba
        // Mejor lógica: si después del protocolo no hay puntos, agregar .supabase.co
        const cleanUrl = url.replace(/^https?:\/\//, '');
        if (!cleanUrl.includes('.')) {
           url = `${url}.supabase.co`;
        }
      }

      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_key', syncForm.key);
      initSupabase(url, syncForm.key);
      setShowSyncConfig(false);
      // Optional: Trigger a sync or notify parent to update status
      window.location.reload(); // Simple way to refresh app state and trigger init in App.tsx
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
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Metrics Grid - Responsive Cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard label="Stock Verde" value={`${totalGreen.toFixed(0)} Kg`} icon={<Package />} color="text-stone-500" />
        <MetricCard label="Total Tostado" value={`${totalRoasted.toFixed(0)} Kg`} icon={<Flame />} color="text-amber-700" />
        <MetricCard label="Pendientes" value={pendingOrders} icon={<Clock />} color="text-stone-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-6 md:mb-8">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Estado Operativo
          </h4>
          <div className="h-[280px] md:h-[320px] w-full flex-1">
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={6} dataKey="value" stroke="none">
                    {ordersByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-300">
                <Package className="w-10 h-10 mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest italic">Sin datos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-6 md:mb-8">
            <Flame className="w-4 h-4 text-amber-800" /> Producción Semanal
          </h4>
          <div className="h-[280px] md:h-[320px] w-full flex-1">
            {roasts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roastHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={10} stroke="#a8a29e" />
                  <YAxis fontSize={10} fontWeight="900" axisLine={false} tickLine={false} stroke="#a8a29e" />
                  <Tooltip cursor={{fill: '#fafaf9'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="kg" fill="#44403c" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-300">
                <Flame className="w-10 h-10 mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest italic">Sin registros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Card - Optimized for mobile */}
      <div className="bg-stone-900 text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group shadow-2xl shadow-stone-300">
         <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 -mr-20 -mt-20 rounded-full blur-3xl" />
         <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">Varietal Cloud</h3>
              </div>
              <p className="text-stone-400 text-sm md:text-base font-medium leading-relaxed">
                Sincroniza tus datos entre Android, Web y Tablets. Tus clientes y lotes siempre disponibles en tiempo real.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                 <button onClick={() => setShowSyncConfig(!showSyncConfig)} className="px-6 py-4 bg-white text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-200 active:scale-95 transition-all">
                    <Link className="w-4 h-4" /> Configurar
                 </button>
                 <button onClick={handleExport} className="px-6 py-4 bg-stone-800 text-stone-300 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-700 active:scale-95 transition-all border border-stone-700">
                    <Download className="w-4 h-4" /> Backup
                 </button>
              </div>
            </div>

            {showSyncConfig && (
              <div className="w-full lg:w-96 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 animate-in zoom-in-95">
                <div className="space-y-4">
                  <input type="text" className="w-full bg-stone-800/50 border border-stone-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-amber-500" placeholder="URL Proyecto Supabase" value={syncForm.url} onChange={e => setSyncForm({...syncForm, url: e.target.value})} />
                  <input type="password" className="w-full bg-stone-800/50 border border-stone-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-amber-500" placeholder="Anon Key" value={syncForm.key} onChange={e => setSyncForm({...syncForm, key: e.target.value})} />
                  <button onClick={handleSaveConnection} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Guardar Conexión</button>
                </div>
              </div>
            )}
         </div>
      </div>

      <div className="flex justify-center py-6">
        <div className="flex items-center gap-2 text-stone-300 px-4 py-2 bg-white rounded-full border border-stone-100 shadow-sm">
          <Info className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Varietal Engine v1.2 — Multiplatform Build</span>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-stone-200 flex flex-col justify-between shadow-sm hover:border-stone-400 transition-all active:scale-[0.98]">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{label}</span>
      <div className={`p-3 bg-stone-50 rounded-2xl ${color} shadow-inner`}>
        {/* Fix: Use type assertion to allow React.cloneElement to correctly handle className for the icon element */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
      </div>
    </div>
    <h5 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tighter">{value}</h5>
  </div>
);

export default DashboardView;
