
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
import InvoicingView from './views/InvoicingView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import CuppingView from './views/CuppingView';
import SettingsModal from './components/SettingsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BrandLogoFull } from './components/BrandLogo';

const AppContent: React.FC = () => {
  const { user, loading, profile, refreshSession } = useAuth();
  const greenCoffees = useLiveQuery(() => db.greenCoffees.toArray()) || [];
  const roasts = useLiveQuery(() => db.roasts.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const roastedStocks = useLiveQuery(() => db.roastedStocks.toArray()) || [];
  const retailBags = useLiveQuery(() => db.retailBags.toArray()) || [];
  const productionInventory = useLiveQuery(() => db.productionInventory.toArray()) || [];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stockTab, setStockTab] = useState<'green' | 'roasted' | 'utility'>('green');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [accessError, setAccessError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

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
          <div className="flex h-screen items-center justify-center bg-white dark:bg-stone-950">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin dark:border-white"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Cargando Varietal...</p>
              </div>
          </div>
      );
  }

  if (!isUnlocked) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-white dark:bg-stone-950">
        <div className="w-full max-w-sm border-2 border-brand shadow-[8px_8px_0px_0px_rgba(205,133,102,1)] p-8 space-y-6 dark:bg-stone-900 dark:border-stone-800 dark:text-white">
          <div className="flex justify-center pb-4">
             <BrandLogoFull className="h-16" color="#CD8566" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1 text-center dark:text-stone-500">
              Acceso restringido
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 dark:text-stone-300">
              Contraseña de acceso
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-stone-300 focus:border-black outline-none text-sm dark:bg-stone-950 dark:border-stone-700 dark:focus:border-stone-500 dark:text-white"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAccess();
                }
              }}
            />
            {accessError && (
              <p className="text-[11px] text-red-600 font-medium dark:text-red-400">
                {accessError}
              </p>
            )}
          </div>
          <button
            onClick={handleAccess}
            className="w-full py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-xs border border-black hover:bg-white hover:text-black transition-colors dark:bg-stone-800 dark:border-stone-700 dark:hover:bg-stone-700 dark:hover:text-white"
          >
            Entrar
          </button>
          <p className="text-[10px] text-stone-400 leading-relaxed dark:text-stone-600">
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
    { id: 'cupping', label: 'Catación', icon: BarChart3 },
    { id: 'invoicing', label: 'Facturación', icon: Receipt },
  ];

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-stone-950 overflow-hidden font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-brand-light selection:text-white">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
      />

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[140] lg:hidden transition-opacity duration-500 ease-in-out" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Removed as per user request */}

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-stone-950">
        
        {/* Header - Minimalist */}
        <header className="hidden lg:flex h-20 bg-white/95 backdrop-blur-sm border-b border-stone-200 items-center justify-between px-8 shrink-0 relative z-[300] dark:bg-stone-950/95 dark:border-stone-800">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
                {menuItems.find(m => m.id === activeTab)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-black dark:text-white">
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
                  className="w-10 h-10 border border-stone-200 flex items-center justify-center text-stone-400 hover:border-black hover:text-black transition-colors cursor-pointer bg-stone-50 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500 dark:hover:border-stone-500 dark:hover:text-white"
                  title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        <section className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
          <div className="p-4 md:p-8 lg:p-10 pb-32 max-w-7xl mx-auto">
            <div key={activeTab} className="animate-slide-up">
              {activeTab === 'dashboard' ? (
                <DashboardView 
                  green={greenCoffees} 
                  roasts={roasts} 
                  orders={orders} 
                  onNavigate={(tabId) => setActiveTab(tabId)} 
                />
              ) : activeTab === 'roasting' ? (
                <RoastingView 
                  roasts={roasts} 
                  greenCoffees={greenCoffees} 
                  orders={orders} 
                />
              ) : activeTab === 'green-coffee' ? (
                <GreenCoffeeView 
                  coffees={greenCoffees}
                  setCoffees={() => {}} 
                />
              ) : activeTab === 'orders' ? (
                <OrdersView orders={orders} />
              ) : activeTab === 'stock' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div>
                      <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Inventario</h2>
                    </div>
                    <div className="flex gap-8">
                      {['green', 'roasted', 'utility'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStockTab(tab as any)}
                          className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
                            stockTab === tab 
                              ? 'text-black dark:text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black dark:after:bg-white' 
                              : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                          }`}
                        >
                          {tab === 'green' ? 'Café Verde' : tab === 'roasted' ? 'Café Tostado' : 'Utilería'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div key={stockTab} className="animate-fade-in">
                    {stockTab === 'green' ? (
                      <GreenCoffeeView 
                        coffees={greenCoffees}
                        setCoffees={() => {}}
                      />
                    ) : stockTab === 'roasted' ? (
                      <InventoryView
                        stocks={roastedStocks}
                        roasts={roasts}
                        retailBags={retailBags}
                        setRetailBags={() => {}}
                        mode="coffee"
                      />
                    ) : (
                      <InventoryView
                        stocks={roastedStocks}
                        roasts={roasts}
                        retailBags={retailBags}
                        setRetailBags={() => {}}
                        mode="utility"
                      />
                    )}
                  </div>
                </div>
              ) : activeTab === 'cupping' ? (
                <CuppingView stocks={roastedStocks} />
              ) : activeTab === 'invoicing' ? (
                <InvoicingView 
                  orders={orders}
                  roasts={roasts}
                  stocks={roastedStocks}
                />
              ) : (
                <DashboardView 
                  green={greenCoffees} 
                  roasts={roasts} 
                  orders={orders} 
                  onNavigate={(tabId) => setActiveTab(tabId)} 
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation - Visible on all screens now as per user request to replace sidebar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 z-[200] safe-area-pb">
        <div className="flex items-center justify-around p-2">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center gap-2 p-3 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-brand text-white px-5' : 'text-stone-400 hover:text-brand dark:text-stone-500 dark:hover:text-brand'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-full transition-all duration-300 text-stone-400 hover:text-brand dark:text-stone-500 dark:hover:text-brand"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </nav>
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
