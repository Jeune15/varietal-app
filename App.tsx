
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
  ChevronLeft,
  ChevronRight,
  BarChart3,
  User,
  Cloud,
  CloudOff,
  RefreshCw,
  LayoutDashboard,
  DollarSign,
  LogOut,
  Settings2
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSupabase, pullFromCloud, initSupabase, subscribeToChanges } from './db';
import GreenCoffeeView from './views/GreenCoffeeView';
import RoastingView from './views/RoastingView';
import OrdersView from './views/OrdersView';
import InventoryView from './views/InventoryView';
import ProductionView from './views/ProductionView';
import InvoicingView from './views/InvoicingView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import SettingsModal from './components/SettingsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

const AppContent: React.FC = () => {
  const { user, loading, profile, refreshSession } = useAuth();
  const greenCoffees = useLiveQuery(() => db.greenCoffees.toArray()) || [];
  const roasts = useLiveQuery(() => db.roasts.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const roastedStocks = useLiveQuery(() => db.roastedStocks.toArray()) || [];
  const retailBags = useLiveQuery(() => db.retailBags.toArray()) || [];
  const productionInventory = useLiveQuery(() => db.productionInventory.toArray()) || [];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stockTab, setStockTab] = useState<'green' | 'roasted'>('green');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    // Restore connection from local storage
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    if (url && key) {
        initSupabase(url, key);
    }
  }, []);

  useEffect(() => {
    // Initial check for cloud status
    let unsubscribe: () => void;

    if (loading) return;

    const checkCloud = async () => {
        const supabase = getSupabase();
        if (supabase) {
            // Auto-sync on startup if connected
            setIsSyncing(true);
            const success = await pullFromCloud();
            setIsSyncing(false);
            
            if (success) {
                setCloudStatus('connected');
                // Setup Realtime Subscription only if connected/successful
                unsubscribe = subscribeToChanges();
            } else {
                setCloudStatus('disconnected');
                console.warn('Could not sync with cloud. Running in offline mode.');
            }
        }
    };
    checkCloud();
    
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [user, loading]); // Only re-check when user changes and auth is ready

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('varietal_access');
    if (stored === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await pullFromCloud();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleLogout = async () => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        } finally {
          // Forzar limpieza local si es necesario o recargar
          window.location.reload();
        }
      }
  };

  const handleAccess = () => {
    if (accessPassword === '10666234') {
      setIsUnlocked(true);
      setAccessError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('varietal_access', 'true');
      }
    } else {
      setAccessError('Contraseña incorrecta');
    }
  };

  const handleSelectSection = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    setIsDesktopSidebarOpen(false);
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Cargando Varietal...</p>
              </div>
          </div>
      );
  }

  if (!isUnlocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Varietal</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">
              Acceso restringido
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Contraseña de acceso
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-stone-300 focus:border-black outline-none text-sm"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAccess();
                }
              }}
            />
            {accessError && (
              <p className="text-[11px] text-red-600 font-medium">
                {accessError}
              </p>
            )}
          </div>
          <button
            onClick={handleAccess}
            className="w-full py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-xs border border-black hover:bg-white hover:text-black transition-colors"
          >
            Entrar
          </button>
          <p className="text-[10px] text-stone-400 leading-relaxed">
            La contraseña se recordará mientras esta ventana del navegador permanezca abierta.
          </p>
        </div>
      </div>
    );
  }

  // Comentado para permitir acceso directo sin login
  // if (!user) {
  //     return <LoginView />;
  // }

  // if (profile && !profile.isActive) {
  //   return (
  //       <div className="flex h-screen items-center justify-center bg-stone-50 p-4">
  //           {/* ... Contenido de cuenta inactiva ... */}
  //       </div>
  //   );
  // }

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'roasting', label: 'Tostado', icon: Flame },
    { id: 'production', label: 'Producción', icon: Settings2 },
    { id: 'invoicing', label: 'Facturación', icon: Receipt },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-stone-900 antialiased selection:bg-stone-200 selection:text-black">
      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[140] lg:hidden transition-opacity duration-500 ease-in-out" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar - Architectural Navigation */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-stone-200 z-[150] transform transition-transform duration-500 ease-in-out w-80 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-stone-200 min-w-[20rem]">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder - Removed Icon, Text Only */}
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Varietal</h1>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Desarrolladores de Café</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-stone-500 hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-0 overflow-y-auto h-[calc(100vh-160px)] scrollbar-hide">
          <div className="px-8 py-6">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4 pl-4">Menu Principal</p>
            <div className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 border-l-2 transition-all duration-200 group ${
                    activeTab === item.id 
                      ? 'border-black text-black bg-stone-50' 
                      : 'border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-200'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-black' : 'text-stone-300 group-hover:text-stone-400'}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === item.id ? 'text-black' : ''}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-stone-200 bg-white min-w-[20rem]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'connected' ? 'bg-green-500' : 'bg-black'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${cloudStatus === 'connected' ? 'text-green-600' : 'text-stone-400'}`}>
                {cloudStatus === 'connected' ? 'Online' : 'Offline'}
              </span>
              </div>
              <button 
                onClick={() => { 
                  setShowSettings(true);
                  setIsSidebarOpen(false);
                  setIsDesktopSidebarOpen(false);
                }}
                className="p-2 -mr-2 text-stone-400 hover:text-black transition-colors"
                title="Configuración"
            >
                <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white">
        
        {/* Desktop Sidebar Toggle Button */}
        {isDesktopSidebarOpen && (
          <button
            onClick={() => setIsDesktopSidebarOpen(false)}
            className="hidden lg:flex fixed left-80 top-1/2 -translate-y-1/2 z-[130] -ml-3 bg-white border border-stone-200 shadow-md p-1.5 rounded-full hover:border-black hover:bg-stone-50 transition-all duration-300"
            title="Colapsar Menú"
          >
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>
        )}

        {/* Header - Minimalist */}
        <header className="h-20 bg-white/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between px-8 shrink-0 z-[120]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                } else {
                  setIsSidebarOpen(true);
                }
              }} 
              className={`p-2 -ml-2 text-stone-500 hover:text-black transition-colors ${isDesktopSidebarOpen ? 'lg:hidden' : 'lg:block'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <span className="text-2xl font-black uppercase tracking-tighter text-black">
                {menuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-black">
                  {user ? (profile?.role === 'admin' ? 'Administrador' : profile?.role === 'editor' ? 'Editor' : 'Visualizador') : 'Administrador'}
              </p>
              {/* Ocultado para limpieza visual
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest truncate max-w-[120px]">
                {user ? user.email : 'Sin Conexión'}
              </p>
              */}
            </div>
            {user && (
              <button 
                  onClick={handleLogout}
                  className="w-10 h-10 border border-stone-200 flex items-center justify-center text-stone-400 hover:border-black hover:text-black transition-colors cursor-pointer bg-stone-50"
                  title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
          <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === 'dashboard' ? (
                <DashboardView 
                  green={greenCoffees} 
                  roasts={roasts} 
                  orders={orders} 
                  onNavigate={(tabId) => setActiveTab(tabId)} 
                />
              ) : activeTab === 'stock' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black pb-6">
                    <div>
                      <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Stock</h2>
                      <p className="text-stone-500 font-mono text-xs uppercase tracking-widest">
                        Inventario verde y tostado
                      </p>
                    </div>
                    <div className="flex gap-4 mt-2 md:mt-0">
                      <button
                        onClick={() => setStockTab('green')}
                        className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                          stockTab === 'green'
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black'
                        }`}
                      >
                        <Coffee className="w-4 h-4" /> Café Verde
                      </button>
                      <button
                        onClick={() => setStockTab('roasted')}
                        className={`px-6 py-3 font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                          stockTab === 'roasted'
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-stone-500 border-stone-200 hover:border-black hover:text-black'
                        }`}
                      >
                        <Package className="w-4 h-4" /> Café Tostado
                      </button>
                    </div>
                  </div>

                  {stockTab === 'green' ? (
                    <GreenCoffeeView coffees={greenCoffees} setCoffees={() => {}} />
                  ) : (
                    <InventoryView stocks={roastedStocks} retailBags={retailBags} setRetailBags={() => {}} />
                  )}
                </div>
              ) : activeTab === 'roasting' ? (
                <RoastingView 
                  roasts={roasts} 
                  greenCoffees={greenCoffees} 
                  orders={orders}
                />
              ) : activeTab === 'orders' ? (
                <OrdersView orders={orders} />
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

const App: React.FC = () => (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
);

export default App;
