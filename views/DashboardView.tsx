import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GreenCoffee, Roast, Order, ProductionItem } from '../types';
import { exportDatabaseToJson, initSupabase } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, Flame, Download, Link, Globe, Info, BarChart as BarChartIcon, PieChart as PieChartIcon, X } from 'lucide-react';
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
  productionInventory: ProductionItem[];
  onNavigate?: (tabId: string) => void;
  userRole?: 'admin' | 'student' | null;
}

const DashboardView: React.FC<Props> = ({ green, roasts, orders, productionInventory, onNavigate, userRole }) => {
  const [showSyncConfig, setShowSyncConfig] = useState(false);
  const [syncForm, setSyncForm] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });
  
  const { canEdit } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];
  const totalGreen = green.reduce((acc, curr) => acc + (Number(curr.quantityKg) || 0), 0);
  const totalOrders = orders.length;
  
  const roastedToday = roasts
    .filter(r => r.roastDate === today)
    .reduce((acc, curr) => acc + (Number(curr.roastedQtyKg) || 0), 0);
  
  const lowGreen = useMemo(
    () =>
      green
        .filter(g => g.quantityKg > 0 && g.quantityKg <= 5)
        .sort((a, b) => a.quantityKg - b.quantityKg)
        .slice(0, 5),
    [green]
  );
  
  const dedupedUtility = useMemo(() => {
    const map = new Map<string, ProductionItem>();
    productionInventory.forEach(item => {
      const key = `${item.name}__${item.format || ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        map.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          minThreshold: Math.min(existing.minThreshold, item.minThreshold)
        });
      }
    });
    return Array.from(map.values());
  }, [productionInventory]);
  
  const lowUtility = useMemo(
    () =>
      dedupedUtility
        .filter(item => item.quantity <= item.minThreshold)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5),
    [dedupedUtility]
  );

  const formatUtilityQuantity = (item: ProductionItem) => {
    if (item.type === 'rechargeable') {
      return `${item.quantity.toFixed(0)}%`;
    }
    return `${item.quantity.toFixed(0)} unid`;
  };

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
    <div className="space-y-8 animate-fade-in pb-48 text-stone-900 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Panel Diario</h3>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Resumen operativo para la tostaduría
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className="bg-black dark:bg-stone-800 text-white dark:text-stone-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest self-end">
            {today}
          </div>
          {userRole === 'admin' && (
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => onNavigate && onNavigate('orders')}
                className="px-3 py-1 border border-stone-200 dark:border-stone-700 text-[10px] font-bold uppercase tracking-widest hover:border-black dark:hover:border-stone-500 hover:bg-black dark:hover:bg-stone-800 hover:text-white transition-colors"
              >
                Pedidos
              </button>
              <button
                onClick={() => onNavigate && onNavigate('roasting')}
                className="px-3 py-1 border border-stone-200 dark:border-stone-700 text-[10px] font-bold uppercase tracking-widest hover:border-black dark:hover:border-stone-500 hover:bg-black dark:hover:bg-stone-800 hover:text-white transition-colors"
              >
                Tostado
              </button>
              <button
                onClick={() => onNavigate && onNavigate('invoicing')}
                className="px-3 py-1 border border-stone-200 dark:border-stone-700 text-[10px] font-bold uppercase tracking-widest hover:border-black dark:hover:border-stone-500 hover:bg-black dark:hover:bg-stone-800 hover:text-white transition-colors"
              >
                Facturación
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Stock café verde"
          value={`${totalGreen.toFixed(0)} Kg`}
          icon={<Package strokeWidth={1.5} />}
          description="Total disponible en verde"
        />
        <MetricCard
          label="Tostado hoy"
          value={`${roastedToday.toFixed(1)} Kg`}
          icon={<Flame strokeWidth={1.5} />}
          description="Kg tostados en la fecha actual"
        />
        <MetricCard
          label="Pedidos en sistema"
          value={totalOrders}
          icon={<Package strokeWidth={1.5} />}
          description="Número total de pedidos registrados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300 dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 dark:text-stone-500">
                Alertas de stock
              </p>
              <h3 className="text-lg font-black uppercase tracking-tight dark:text-white">
                Café verde — stock bajo
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-stone-900 text-white px-3 py-1 tracking-widest uppercase dark:bg-stone-800 dark:text-stone-200">
              {lowGreen.length}
            </span>
          </div>
          {lowGreen.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-[11px] text-stone-400 font-mono uppercase tracking-widest dark:text-stone-600">
              Sin alertas de stock verde
            </div>
          ) : (
            <div className="space-y-3">
              {lowGreen.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-stone-100 px-3 py-2 text-xs dark:border-stone-800"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-black uppercase tracking-wide truncate max-w-[140px] dark:text-white">
                      {item.variety}
                    </span>
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest truncate max-w-[140px] dark:text-stone-500">
                      {item.clientName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-600 dark:text-red-500">
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

        <div className="border border-stone-200 bg-white p-6 hover:border-black transition-colors duration-300 dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 dark:text-stone-500">
                Compras pendientes
              </p>
              <h3 className="text-lg font-black uppercase tracking-tight dark:text-white">
                Utilería — stock bajo
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-stone-900 text-white px-3 py-1 tracking-widest uppercase dark:bg-stone-800 dark:text-stone-200">
              {lowUtility.length}
            </span>
          </div>
          {lowUtility.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-[11px] text-stone-400 font-mono uppercase tracking-widest dark:text-stone-600">
              Sin insumos con stock bajo
            </div>
          ) : (
            <div className="space-y-3">
              {lowUtility.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-stone-100 px-3 py-2 text-xs dark:border-stone-800"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-black uppercase tracking-wide truncate max-w-[160px] dark:text-white">
                      {item.name}
                    </span>
                    {item.format && (
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest truncate max-w-[160px] dark:text-stone-500">
                        {item.format}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-600 dark:text-red-500">
                      {formatUtilityQuantity(item)}
                    </span>
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest ml-1">
                      Comprar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2 text-stone-400">
          <Info className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Varietal App V1.0</span>
        </div>
      </div>

      {showSyncConfig && createPortal(
        <div
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowSyncConfig(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 w-full max-w-md border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black dark:bg-stone-950 text-white p-4 border-b border-stone-800 shrink-0 sticky top-0 z-10 flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tighter uppercase">
                  Configuración de Sincronización
                </h4>
                <p className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Conexión a Base de Datos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncConfig(false)}
                className="text-white hover:text-stone-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  URL del Proyecto Supabase
                </p>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-stone-500 outline-none text-sm font-bold text-black dark:text-white"
                  placeholder="https://tu-proyecto.supabase.co"
                  value={syncForm.url}
                  onChange={e => setSyncForm({ ...syncForm, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  Clave Anónima (anon key)
                </p>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-black dark:focus:border-stone-500 outline-none text-sm font-bold text-black dark:text-white"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={syncForm.key}
                  onChange={e => setSyncForm({ ...syncForm, key: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSyncConfig(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnection}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                >
                  Guardar Conexión
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; description?: string }> = ({ label, value, icon, description }) => (
  <div className="bg-white border border-stone-200 p-8 flex items-start justify-between hover:border-black transition-all duration-300 group dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-600">
    <div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3 dark:text-stone-500">{label}</p>
      <h3 className="text-4xl font-black text-black tracking-tighter mt-1 dark:text-white">{value}</h3>
      {description && <p className="text-[10px] text-stone-400 mt-3 font-mono border-l-2 border-stone-100 pl-2 dark:text-stone-500 dark:border-stone-800">{description}</p>}
    </div>
    <div className="text-stone-300 group-hover:text-black transition-colors duration-300 transform group-hover:scale-110 dark:text-stone-700 dark:group-hover:text-stone-200">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
  </div>
);

export default DashboardView;
