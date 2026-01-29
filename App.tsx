
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
import ModulesView from './views/ModulesView';
import SettingsModal from './components/SettingsModal';
import FullScreenMenu from './components/FullScreenMenu';
import LandingPage from './views/LandingPage';
import NavigationMenu from './components/NavigationMenu';
import Loader from './components/Loader';
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
  
  // Navigation State
  const [viewState, setViewState] = useState<'landing' | 'app'>('landing');
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [imagesLoaded, setImagesLoaded] = useState(false); // Track image loading

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
    // Preload critical images
    const img = new Image();
    img.src = '/inicio%202.jpg';
    img.onload = () => setImagesLoaded(true);
    img.onerror = () => setImagesLoaded(true); // Proceed even if error
  }, []);

  useEffect(() => {
    // Initial check for cloud status
    let unsubscribe: () => void;
    
    // Check session storage for existing auth
    const storedAccess = sessionStorage.getItem('varietal_access');
    const storedRole = sessionStorage.getItem('varietal_role');
    
    if (storedAccess === 'true' && storedRole) {
      setUserRole(storedRole as 'admin' | 'student');
      setViewState('app');
      // If student, default to cupping immediately
      if (storedRole === 'student') {
        setActiveTab('cupping');
      }
      setIsLoading(false);
    } else {
        // Only wait for image if we are showing landing page
        if (imagesLoaded) {
             // Artificial delay to ensure loader is seen at least briefly or for smooth transition
             setTimeout(() => setIsLoading(false), 2000);
        }
    }

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
  }, [user, loading, imagesLoaded]);

  useEffect(() => {
    if (userRole === 'student' && !['cupping', 'modules', 'recipes'].includes(activeTab)) {
      setActiveTab('cupping');
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
        }
      }
      // Clear session
      sessionStorage.removeItem('varietal_access');
      sessionStorage.removeItem('varietal_role');
      window.location.reload();
  };

  const handleAuthenticate = async (role: 'admin' | 'student', password: string): Promise<boolean> => {
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    if (role === 'admin' && password === '10666234') {
      setUserRole('admin');
      setActiveTab('dashboard');
      sessionStorage.setItem('varietal_access', 'true');
      sessionStorage.setItem('varietal_role', 'admin');
      setIsLoading(true); // Trigger loader for transition
      return true;
    } 
    
    if (role === 'student' && password === 'alumnos.varietal') {
      setUserRole('student');
      setActiveTab('cupping');
      sessionStorage.setItem('varietal_access', 'true');
      sessionStorage.setItem('varietal_role', 'student');
      setIsLoading(true); // Trigger loader for transition
      return true;
    }

    return false;
  };

  const handleLoaderComplete = () => {
    if (userRole) {
      setViewState('app');
      setIsLoading(false);
      setIsNavMenuOpen(false); // Close menu if open
    } else {
      setIsLoading(false);
    }
  };

  const handleSelectSection = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    setIsDesktopSidebarOpen(false);
  };

  // Filter menu items based on role
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'stock', label: 'Stock', icon: Package, roles: ['admin'] },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList, roles: ['admin'] },
    { id: 'roasting', label: 'Tostado', icon: Flame, roles: ['admin'] },
    // Cupping is for everyone, but handled differently in UI flow
    { id: 'cupping', label: 'Catación', icon: BarChart3, roles: ['admin', 'student'] }, 
    { id: 'invoicing', label: 'Facturación', icon: Receipt, roles: ['admin'] },
  ].filter(item => !userRole || (item.roles.includes(userRole)));

  // If loading (initial or transition)
  if (isLoading) {
    return <Loader onComplete={handleLoaderComplete} />;
  }

  // Landing Page View
  if (viewState === 'landing') {
    return (
      <>
        <LandingPage onMenuOpen={() => setIsNavMenuOpen(true)} />
        <NavigationMenu 
          isOpen={isNavMenuOpen} 
          onClose={() => setIsNavMenuOpen(false)} 
          onAuthenticate={handleAuthenticate}
        />
      </>
    );
  }

  // Student Specific View (Clean, minimal, just Cupping)
  if (userRole === 'student') {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 flex flex-col">
        {/* Student Content Area */}
        <div className="flex-1 overflow-y-auto pb-24">
           <div className="max-w-7xl mx-auto p-4 md:p-8">
             <div className="flex justify-end items-center mb-4">
               <button 
                 onClick={handleLogout}
                 className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
               >
                 Salir
               </button>
             </div>
             
             {activeTab === 'cupping' && <CuppingView stocks={roastedStocks} mode="free" />}
             
             {activeTab === 'modules' && <ModulesView />}
             
             {activeTab === 'recipes' && (
               <div className="space-y-10 max-w-6xl mx-auto pb-48 animate-fade-in">
                 <div className="space-y-2 mb-8">
                   <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Recetas</h3>
                   <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                     Guías de preparación y métodos
                   </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <button className="group flex flex-col items-center justify-center gap-6 p-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300">
                       <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                         <Coffee className="w-8 h-8" />
                       </div>
                       <div className="text-center space-y-2">
                         <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Espresso</h3>
                         <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Guías de extracción y calibración</p>
                       </div>
                    </button>
                    
                    <button className="group flex flex-col items-center justify-center gap-6 p-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300">
                       <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                         <ClipboardList className="w-8 h-8" />
                       </div>
                       <div className="text-center space-y-2">
                         <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Filtrados</h3>
                         <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">V60, Chemex, Aeropress y más</p>
                       </div>
                    </button>
                 </div>

                 <div className="space-y-4 pt-8 border-t border-stone-100 dark:border-stone-800">
                    <h3 className="text-xl font-black text-black dark:text-white tracking-tighter uppercase">Historial de Actividades</h3>
                    <div className="border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center rounded-lg bg-stone-50 dark:bg-stone-900/50">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Próximamente</p>
                    </div>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Student Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150] safe-area-pb">
          <div className="flex items-center justify-around px-4 py-2">
            {[
              { id: 'cupping', label: 'Catación', icon: BarChart3 },
              { id: 'modules', label: 'Módulos', icon: Package },
              { id: 'recipes', label: 'Recetas', icon: ClipboardList },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 min-w-[3.5rem] rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-brand dark:text-brand-light' 
                      : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : ''}`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Admin / Full App View
  return (
    <div className="flex h-[100dvh] bg-white dark:bg-stone-900 overflow-hidden font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-brand-light selection:text-white">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
        userRole={userRole}
      />

      {/* Full Screen Menu Overlay - Only for Admin in this context */}
      <FullScreenMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        items={menuItems} 
        onNavigate={handleSelectSection}
        activeTab={activeTab}
      />

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
                      <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Inventario</h2>
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
                 // Should technically not be reachable by admin based on requirements, but kept as fallback
                <CuppingView stocks={roastedStocks} mode="internal" />
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
                  userRole={userRole}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150] safe-area-pb lg:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id)}
                className={`flex flex-col items-center gap-1 p-2 min-w-[3.5rem] rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-brand dark:text-brand-light' 
                    : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : ''}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 p-2 min-w-[3.5rem] text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
          >
            <Settings2 className="w-5 h-5" strokeWidth={2} />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 hidden">Ajustes</span>
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
