
import React, { useState, useEffect, useRef } from 'react';
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
  ChevronUp,
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
import { RecipesView } from './views/RecipesView';
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
  const adminContentRef = useRef<HTMLElement | null>(null);
  const [showAdminScrollTop, setShowAdminScrollTop] = useState(false);
  const studentContentRef = useRef<HTMLDivElement | null>(null);
  const [showStudentScrollTop, setShowStudentScrollTop] = useState(false);

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
    const el = adminContentRef.current;
    if (!el) return;
    const onScroll = () => setShowAdminScrollTop(el.scrollTop > 400);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [adminContentRef]);

  useEffect(() => {
    const el = studentContentRef.current;
    if (!el) return;
    const onScroll = () => setShowStudentScrollTop(el.scrollTop > 400);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [studentContentRef]);

  useEffect(() => {
    // Preload critical images
    const images = [
      '/inicio-2.webp', 
      '/iniciomovil.webp',
      '/equipo.webp',
      '/alumnos.webp'
    ];
    let loadedCount = 0;

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        setImagesLoaded(true);
      }
    };

    images.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = handleLoad;
      img.onerror = handleLoad;
    });
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
        <div ref={studentContentRef} className="flex-1 overflow-y-auto pb-24">
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
             
             {activeTab === 'recipes' && <RecipesView />}
           </div>
        </div>
        {showStudentScrollTop && (
          <button
            onClick={() => studentContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Subir"
            className="lg:hidden fixed right-4 bottom-24 z-[160] w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-md flex items-center justify-center transition-transform duration-200 active:scale-95 touch-target"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}

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
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Menú"
        className="lg:hidden fixed top-3 left-3 z-[200] w-12 h-12 rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 backdrop-blur-md shadow-sm flex items-center justify-center transition-transform duration-200 active:scale-95 touch-target"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
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
        <section ref={adminContentRef} className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
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
                      <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Inventario</h2>
                    </div>
                    <div className="flex gap-4 md:gap-8">
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
      {showAdminScrollTop && (
        <button
          onClick={() => adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Subir"
          className="lg:hidden fixed right-4 bottom-24 z-[160] w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-md flex items-center justify-center transition-transform duration-200 active:scale-95 touch-target"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

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
