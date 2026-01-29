
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
import FullScreenMenu from './components/FullScreenMenu';
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
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
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
    const storedRole = sessionStorage.getItem('varietal_role');
    if (stored === 'true') {
      setIsUnlocked(true);
      setUserRole((storedRole as 'admin' | 'student') || 'admin');
    }
  }, []);

  useEffect(() => {
    if (userRole === 'student' && !['dashboard', 'cupping'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

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
      setUserRole('admin');
      setAccessError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('varietal_access', 'true');
        sessionStorage.setItem('varietal_role', 'admin');
      }
    } else if (accessPassword === 'alumnos.varietal') {
      setIsUnlocked(true);
      setUserRole('student');
      setAccessError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('varietal_access', 'true');
        sessionStorage.setItem('varietal_role', 'student');
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
      <div className="flex h-[100dvh] items-center justify-center bg-stone-900 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: 'url(/inicio.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-[2px]" />

        <div className="w-full max-w-sm border border-white/20 shadow-2xl p-8 space-y-6 bg-white/10 backdrop-blur-md relative z-20 text-white">
          <div className="flex justify-center pb-4">
             <BrandLogoFull className="h-16 text-white" color="#FFFFFF" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mt-1 text-center font-sans">
              Acceso restringido
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-white/80 font-sans">
              Contraseña de acceso
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-white/20 bg-black/20 focus:border-white outline-none text-sm text-white placeholder-white/30 font-sans transition-colors"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAccess();
                }
              }}
            />
            {accessError && (
              <p className="text-[11px] text-red-300 font-medium font-sans">
                {accessError}
              </p>
            )}
          </div>
          <button
            onClick={handleAccess}
            className="w-full py-3 bg-white text-black font-black uppercase tracking-[0.2em] text-xs border border-white hover:bg-transparent hover:text-white transition-colors font-sans"
          >
            Entrar
          </button>
          <p className="text-[10px] text-white/50 leading-relaxed font-sans">
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
        userRole={userRole}
      />

      {/* Full Screen Menu Overlay */}
      <FullScreenMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        items={menuItems} 
        onNavigate={handleSelectSection}
        activeTab={activeTab}
      />

      {/* Sidebar Removed as per user request */}

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white dark:bg-stone-950">
        


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
                  userRole={userRole}
                />
              ) : activeTab === 'roasting' && userRole === 'admin' ? (
                <RoastingView 
                  roasts={roasts} 
                  greenCoffees={greenCoffees} 
                  orders={orders} 
                />
              ) : activeTab === 'green-coffee' && userRole === 'admin' ? (
                <GreenCoffeeView 
                  coffees={greenCoffees}
                  setCoffees={() => {}} 
                />
              ) : activeTab === 'orders' && userRole === 'admin' ? (
                <OrdersView orders={orders} />
              ) : activeTab === 'stock' && userRole === 'admin' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div>
                      <h2 className="text-4xl font-serif italic text-black dark:text-white tracking-tight">Inventario</h2>
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
              ) : activeTab === 'invoicing' && userRole === 'admin' ? (
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
                  userRole={userRole}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Aesthetic Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150] safe-area-pb transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-4">
          
          {/* Menu Trigger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 group text-stone-900 dark:text-stone-100"
          >
            <div className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-brand group-hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest hidden md:block group-hover:text-brand transition-colors">Menú</span>
          </button>

          {/* Current Section Indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em] block mb-0.5 font-sans">Sección Actual</span>
            <span className="font-serif text-lg md:text-xl italic text-brand">
              {menuItems.find(i => i.id === activeTab)?.label || 'Inicio'}
            </span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 group text-stone-900 dark:text-stone-100"
          >
            <span className="text-xs font-bold uppercase tracking-widest hidden md:block group-hover:text-brand transition-colors">Ajustes</span>
            <div className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-brand group-hover:text-white transition-colors">
              <Settings2 className="w-5 h-5" />
            </div>
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
