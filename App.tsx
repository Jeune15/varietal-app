
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Calendar,
  DollarSign,
  LogOut,
  Settings2,
  BookOpen
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSupabase, pullFromCloud, initSupabase, subscribeToChanges } from './db';
import RoastingView from './views/RoastingView';
import OrdersView from './views/OrdersView';
import InventoryView from './views/InventoryView';
import DashboardView from './views/DashboardView';
import CalendarPage from './views/CalendarPage';
import SalesPage from './views/SalesPage';
import SalesHistorialTab from './views/sales/SalesHistorialTab';
import ExpensesView from './views/ExpensesView';
import LoginView from './views/LoginView';
import CuppingView from './views/CuppingView';
import ModulesView from './views/ModulesView';
import { RecipesView } from './views/RecipesView';
import SettingsModal from './components/SettingsModal';
import FullScreenMenu from './components/FullScreenMenu';
import LandingPage from './views/LandingPage';
import NavigationMenu from './components/NavigationMenu';
import { AudiobooksView } from './views/AudiobooksView';
import { AudiobookChaptersView } from './views/AudiobookChaptersView';
import { AudiobookReaderView } from './views/AudiobookReaderView';
import Loader from './components/Loader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BrandLogoFull } from './components/BrandLogo';
import ErrorBoundary from './components/ErrorBoundary';

// Main App Content
const AppContent: React.FC = () => {
  const { user, loading, profile, refreshSession } = useAuth();
  const greenCoffees = useLiveQuery(() => db.greenCoffees.toArray()) || [];
  const roasts = useLiveQuery(() => db.roasts.toArray()) || [];
  const salesOrders = useLiveQuery(() => db.salesOrders.toArray()) || [];
  // Use a simpler approach since hooks inside useMemo cause issues
  const rawOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const orders = useMemo(() => {
    const salesAsOrders = salesOrders
      .filter(so => so.status === 'despachado')
      .map(so => ({
        id: so.id,
        clientName: so.clientName,
        variety: 'Pedido de Ventas',
        type: 'Venta Café Tostado' as const,
        quantityKg: 0,
        status: so.invoicedAt ? 'Facturado' : 'Pendiente',
        progress: so.invoicedAt ? 100 : 0,
        entryDate: so.despachadoAt || so.createdAt,
        dueDate: so.createdAt,
        orderLines: so.items.map(item => ({
          id: item.id,
          variety: item.productName,
          quantityKg: item.quantity,
          bagSizeGrams: 0,
          bagsCount: item.quantity
        })),
        isSalesOrder: true,
        salesOrderOriginal: so
      }));
    return [...rawOrders, ...salesAsOrders] as any[];
  }, [salesOrders, rawOrders]);
  const roastedStocks = useLiveQuery(() => db.roastedStocks.toArray()) || [];
  const retailBags = useLiveQuery(() => db.retailBags.toArray()) || [];
  const productionInventory = useLiveQuery(() => db.productionInventory.toArray()) || [];

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('varietal_active_tab') || 'dashboard');
  const [selectedAudiobookCategory, setSelectedAudiobookCategory] = useState<string | null>(null);
  const [selectedAudiobookChapter, setSelectedAudiobookChapter] = useState<string | null>(null);
  const [stockTab, setStockTab] = useState<'roasted' | 'utility'>(() => {
    const stored = sessionStorage.getItem('varietal_stock_tab');
    if (stored && ['roasted', 'utility'].includes(stored)) return stored as any;
    return 'roasted';
  });
  const [billingTab, setBillingTab] = useState<'historial' | 'gastos'>('historial');
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
  const [isCalendarIndependent, setIsCalendarIndependent] = useState(false); // Track if calendar is accessed from landing
  const [isSalesPage, setIsSalesPage] = useState(false); // Track if sales page is accessed from landing

  // ---- HISTORY API SYNC ----
  // Sync state to URL
  const updateURL = (state: {
    view: 'landing' | 'app';
    role?: 'admin' | 'student' | null;
    tab?: string;
    sales?: boolean;
    calendar?: boolean;
  }) => {
    const params = new URLSearchParams();
    params.set('view', state.view);
    if (state.role) params.set('role', state.role);
    if (state.tab && state.view === 'app' && state.role === 'admin') params.set('tab', state.tab);
    if (state.sales) params.set('sales', 'true');
    if (state.calendar) params.set('calendar', 'true');
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(state, '', newUrl);
  };

  // Replace State (for initial load to not break history back)
  const replaceURL = (state: any) => {
    const params = new URLSearchParams();
    params.set('view', state.view);
    if (state.role) params.set('role', state.role);
    if (state.tab && state.view === 'app' && state.role === 'admin') params.set('tab', state.tab);
    if (state.sales) params.set('sales', 'true');
    if (state.calendar) params.set('calendar', 'true');
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(state, '', newUrl);
  };

  // Listen to PopState (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        setViewState(state.view || 'landing');
        setUserRole(state.role || null);
        if (state.tab) setActiveTab(state.tab);
        setIsSalesPage(!!state.sales);
        setIsCalendarIndependent(!!state.calendar);
      } else {
        // Fallback if no state object
        const params = new URLSearchParams(window.location.search);
        setViewState((params.get('view') as 'landing' | 'app') || 'landing');
        setUserRole((params.get('role') as 'admin' | 'student' | null));
        if (params.get('tab')) setActiveTab(params.get('tab')!);
        setIsSalesPage(params.get('sales') === 'true');
        setIsCalendarIndependent(params.get('calendar') === 'true');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial Load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as 'landing' | 'app';
    const role = params.get('role') as 'admin' | 'student' | null;
    const tab = params.get('tab');
    const sales = params.get('sales') === 'true';
    const calendar = params.get('calendar') === 'true';

    if (view) setViewState(view);
    if (role) setUserRole(role);
    if (tab) setActiveTab(tab);
    if (sales) setIsSalesPage(true);
    if (calendar) setIsCalendarIndependent(true);

    // Set initial state in history
    replaceURL({ view: view || 'landing', role, tab, sales, calendar });
  }, []);
  // ---- END HISTORY API SYNC ----

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
    sessionStorage.setItem('varietal_active_tab', activeTab);
    updateURL({ view: viewState, role: userRole, tab: activeTab, sales: isSalesPage, calendar: isCalendarIndependent });
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('varietal_stock_tab', stockTab);
  }, [stockTab]);

  useEffect(() => {
    if (isCalendarIndependent) sessionStorage.setItem('varietal_calendar_independent', 'true');
    else sessionStorage.removeItem('varietal_calendar_independent');
    updateURL({ view: viewState, role: userRole, tab: activeTab, sales: isSalesPage, calendar: isCalendarIndependent });
  }, [isCalendarIndependent]);

  useEffect(() => {
    if (isSalesPage) sessionStorage.setItem('varietal_sales_page', 'true');
    else sessionStorage.removeItem('varietal_sales_page');
    updateURL({ view: viewState, role: userRole, tab: activeTab, sales: isSalesPage, calendar: isCalendarIndependent });
  }, [isSalesPage]);

  useEffect(() => {
    updateURL({ view: viewState, role: userRole, tab: activeTab, sales: isSalesPage, calendar: isCalendarIndependent });
  }, [viewState, userRole]);

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
    const calendarAccess = sessionStorage.getItem('varietal_calendar');
    const storedTab = sessionStorage.getItem('varietal_active_tab');
    
    if (storedAccess === 'true' && storedRole) {
      setUserRole(storedRole as 'admin' | 'student');
      setViewState('app');
      if (calendarAccess === 'true') {
        setActiveTab('calendar');
        setIsCalendarIndependent(true);
        sessionStorage.removeItem('varietal_calendar');
      } else if (sessionStorage.getItem('varietal_sales_page') === 'true') {
        setIsSalesPage(true);
      } else {
        if (storedRole === 'student') {
          const desired = storedTab && ['cupping', 'modules', 'recipes', 'audiobooks'].includes(storedTab) ? storedTab : 'cupping';
          setActiveTab(desired);
        } else {
          setActiveTab(storedTab || 'dashboard');
        }
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
    if (userRole === 'student' && !['cupping', 'modules', 'recipes', 'audiobooks'].includes(activeTab)) {
      setActiveTab('cupping');
    }
  }, [userRole, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (userRole === 'student') {
      studentContentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      adminContentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [activeTab, userRole, viewState, isCalendarIndependent]);

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

      // 1. Update React State
      setUserRole(null);
      setViewState('landing');
      setIsNavMenuOpen(false);
      setIsCalendarIndependent(false);
      setIsSalesPage(false);

      // 2. Clear Session Storage
      sessionStorage.removeItem('varietal_access');
      sessionStorage.removeItem('varietal_role');
      sessionStorage.removeItem('varietal_active_tab');
      sessionStorage.removeItem('varietal_stock_tab');
      sessionStorage.removeItem('varietal_calendar');
      sessionStorage.removeItem('varietal_calendar_independent');
      sessionStorage.removeItem('varietal_sales_page');
      sessionStorage.removeItem('varietal_sales_tab');

      // 3. Clear URL History API state
      const params = new URLSearchParams();
      params.set('view', 'landing');
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ view: 'landing' }, '', newUrl);

      // 4. Force a hard reload to completely reset the application state (optional but safe)
      // window.location.reload(); 
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
      setActiveTab('modules');
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
    { id: 'sales-history', label: 'Facturación', icon: Receipt, roles: ['admin'] }
  ].filter(item => !userRole || (item.roles.includes(userRole)));

  // If loading (initial or transition)
  if (isLoading) {
    return <Loader onComplete={handleLoaderComplete} />;
  }

  // Landing Page View
  if (viewState === 'landing' && !isCalendarIndependent && !isSalesPage) {
    return (
      <div className="animate-zoom-in">
        <LandingPage 
          onMenuOpen={() => setIsNavMenuOpen(true)} 
          onCalendarOpen={() => {
            setIsCalendarIndependent(true);
            setActiveTab('calendar');
          }}
          onSalesOpen={() => setIsSalesPage(true)}
        />
        <NavigationMenu 
          isOpen={isNavMenuOpen} 
          onClose={() => setIsNavMenuOpen(false)} 
          onAuthenticate={handleAuthenticate}
        />
      </div>
    );
  }

  // Student Specific View (Clean, minimal, just Cupping)
  if (userRole === 'student') {
    return (
      <div className="min-h-[100dvh] bg-white dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 flex flex-col">
        {/* Student Content Area */}
        <div ref={studentContentRef} className="flex-1 overflow-y-auto pb-28">
           <div className="max-w-7xl mx-auto p-4 md:p-8">
             <div className="flex justify-end items-center mb-4">
               <button 
                 onClick={handleLogout}
                 className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
               >
                 Salir
               </button>
             </div>
             
             {activeTab === 'modules' && <ModulesView />}
             
             {activeTab === 'recipes' && <RecipesView />}

             {activeTab === 'audiobooks' && (
               <ErrorBoundary>
                 {!selectedAudiobookCategory && (
                   <AudiobooksView onSelectCategory={setSelectedAudiobookCategory} />
                 )}
                 {selectedAudiobookCategory && !selectedAudiobookChapter && (
                   <AudiobookChaptersView 
                     categoryId={selectedAudiobookCategory} 
                     onBack={() => setSelectedAudiobookCategory(null)}
                     onSelectChapter={setSelectedAudiobookChapter}
                   />
                 )}
                 {selectedAudiobookCategory && selectedAudiobookChapter && (
                   <AudiobookReaderView 
                     categoryId={selectedAudiobookCategory}
                     chapterId={selectedAudiobookChapter}
                     onSelectChapter={setSelectedAudiobookChapter}
                     onBack={() => setSelectedAudiobookChapter(null)}
                   />
                 )}
               </ErrorBoundary>
             )}
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
        {!(activeTab === 'audiobooks' && selectedAudiobookChapter) && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150] safe-area-pb">
            <div className="flex items-center justify-center gap-4 px-2 py-2">
              {[
                 { id: 'modules', label: 'Módulos', icon: Package },
                 { id: 'audiobooks', label: 'AudioLibros', icon: BookOpen },
                 { id: 'recipes', label: 'Herramientas', icon: ClipboardList }
               ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedAudiobookCategory(null);
                      setSelectedAudiobookChapter(null);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 min-w-[3.5rem] rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'text-brand dark:text-brand-light' 
                        : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                    }`}
                  >
                    <Icon 
                      className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : ''}`} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    );
  }

  // Independent Sales Page (accessed from landing page)
  if (isSalesPage) {
    const handleExitSales = () => {
      setIsSalesPage(false);
      sessionStorage.removeItem('varietal_sales_page');
      sessionStorage.removeItem('varietal_sales_tab');
      setViewState('landing');
    };

    return (
      <div className="animate-zoom-in">
        <ErrorBoundary>
          <SalesPage onExit={handleExitSales} />
        </ErrorBoundary>
      </div>
    );
  }

  // Independent Calendar Page (accessed from landing page)
  if (isCalendarIndependent) { 
    const handleExitCalendar = () => {
      setIsCalendarIndependent(false);
      sessionStorage.removeItem('varietal_access');
      sessionStorage.removeItem('varietal_role');
      sessionStorage.removeItem('varietal_calendar');
      sessionStorage.removeItem('varietal_calendar_independent');
      setUserRole(null);
      setViewState('landing');
    };

    return (
      <div className="animate-zoom-in">
        <ErrorBoundary>
          <CalendarPage onExit={handleExitCalendar} />
        </ErrorBoundary>
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
        <section ref={adminContentRef} className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin">
          <div className="p-4 md:p-8 lg:p-10 pb-32 max-w-7xl mx-auto">
            {/* Admin Top Bar */}
            <div className="flex justify-end items-center mb-6 gap-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Configuración"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Salir
              </button>
            </div>

            <div key={activeTab} className="animate-slide-up">
              {activeTab === 'dashboard' ? (
                <DashboardView 
                  roasts={roasts} 
                  orders={orders} 
                  productionInventory={productionInventory}
                  roastedStocks={roastedStocks}
                  onNavigate={(tabId) => setActiveTab(tabId)} 
                  userRole={userRole}
                />
              ) : activeTab === 'roasting' ? (
                <RoastingView 
                  roasts={roasts} 
                  greenCoffees={greenCoffees} 
                  orders={orders} 
                />
              ) : activeTab === 'orders' ? (
                <OrdersView orders={orders} />
              ) : activeTab === 'sales-history' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Facturación</h2>
                    </div>
                    <div className="flex gap-4 md:gap-8">
                      {['historial', 'gastos'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setBillingTab(tab as any)}
                          className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
                            billingTab === tab 
                              ? 'text-black dark:text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black dark:after:bg-white' 
                              : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                          }`}
                        >
                          {tab === 'historial' ? 'Ventas' : 'Gastos'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
                    {billingTab === 'historial' ? <SalesHistorialTab /> : <ExpensesView />}
                  </div>
                </div>
              ) : activeTab === 'stock' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Inventario</h2>
                    </div>
                    <div className="flex gap-4 md:gap-8">
                      {['roasted', 'utility'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStockTab(tab as any)}
                          className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
                            stockTab === tab 
                              ? 'text-black dark:text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black dark:after:bg-white' 
                              : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                          }`}
                        >
                          {tab === 'roasted' ? 'Café Tostado' : 'Utilería'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div key={stockTab} className="animate-fade-in">
                    {stockTab === 'roasted' ? (
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
              ) : (
                <DashboardView 
                  roasts={roasts} 
                  orders={orders} 
                  productionInventory={productionInventory}
                  roastedStocks={roastedStocks}
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150] safe-area-pb">
        <div className="flex items-center justify-center gap-4 px-2 py-2">
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
                  className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : ''}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
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
