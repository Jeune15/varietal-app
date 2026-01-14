
import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Flame, 
  ClipboardList, 
  Package, 
  Settings, 
  Receipt, 
  Menu,
  X,
  BarChart3,
  User,
  Cloud,
  CloudOff,
  RefreshCw,
  LayoutDashboard,
  DollarSign
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSupabase, pullFromCloud, initSupabase } from './db';
import GreenCoffeeView from './views/GreenCoffeeView';
import RoastingView from './views/RoastingView';
import OrdersView from './views/OrdersView';
import InventoryView from './views/InventoryView';
import ProductionView from './views/ProductionView';
import InvoicingView from './views/InvoicingView';
import DashboardView from './views/DashboardView';

const App: React.FC = () => {
  const greenCoffees = useLiveQuery(() => db.greenCoffees.toArray()) || [];
  const roasts = useLiveQuery(() => db.roasts.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const roastedStocks = useLiveQuery(() => db.roastedStocks.toArray()) || [];
  const retailBags = useLiveQuery(() => db.retailBags.toArray()) || [];
  const productionInventory = useLiveQuery(() => db.productionInventory.toArray()) || [];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    
    if (url && key) {
      initSupabase(url, key);
    }
    
    const supabase = getSupabase();
    if (supabase) setCloudStatus('connected');
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await pullFromCloud();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'green', label: 'Inventario Verde', icon: Coffee },
    { id: 'inventory', label: 'Inventario Tostado', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'roasting', label: 'Tostado', icon: Flame },
    { id: 'production', label: 'Producción', icon: Settings },
    { id: 'invoicing', label: 'Facturación', icon: Receipt },
  ];

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-stone-900 antialiased selection:bg-amber-100">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar - Responsive Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-stone-200 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 p-2 rounded-xl shadow-lg shadow-stone-200">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">Varietal</h1>
              <span className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em]">Developers</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-stone-400 hover:bg-stone-50 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-amber-900/5 text-amber-900' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-amber-800' : 'text-stone-300 group-hover:text-stone-500'}`} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-800" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-stone-100">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{cloudStatus === 'connected' ? 'Cloud Sync' : 'Offline'}</span>
            </div>
            <button 
              onClick={handleManualSync} 
              disabled={isSyncing}
              className={`p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-stone-200 transition-all ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Fixed Height */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2.5 text-stone-500 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] leading-none mb-1">Sección Actual</h2>
              <span className="text-sm md:text-base font-bold text-stone-900 tracking-tight">
                {menuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs font-bold text-stone-900">Admin Tostaduría</p>
              <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest">Varietal Pro</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-400 transition-colors cursor-pointer">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
          <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === 'dashboard' ? (
                <DashboardView green={greenCoffees} roasts={roasts} orders={orders} />
              ) : activeTab === 'green' ? (
                <GreenCoffeeView coffees={greenCoffees} setCoffees={() => {}} />
              ) : activeTab === 'roasting' ? (
                <RoastingView 
                  roasts={roasts} 
                  greenCoffees={greenCoffees} 
                  orders={orders}
                />
              ) : activeTab === 'orders' ? (
                <OrdersView orders={orders} />
              ) : activeTab === 'inventory' ? (
                <InventoryView stocks={roastedStocks} retailBags={retailBags} setRetailBags={() => {}} />
              ) : activeTab === 'production' ? (
                <ProductionView 
                  orders={orders} 
                  setOrders={() => {}} 
                  stocks={roastedStocks} 
                  setStocks={() => {}} 
                  retailBags={retailBags} 
                  setRetailBags={() => {}} 
                  setHistory={() => {}}
                  productionInventory={productionInventory}
                />
              ) : activeTab === 'invoicing' ? (
                <InvoicingView 
                  orders={orders} 
                  roasts={roasts}
                  stocks={roastedStocks}
                />
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
