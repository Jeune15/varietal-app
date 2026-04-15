
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
  BookOpen,
  Database
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSupabase, pullFromCloud, initSupabase, subscribeToChanges } from './db';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

const RoastingView = React.lazy(() => import('./views/RoastingView'));
const OrdersView = React.lazy(() => import('./views/OrdersView'));
const InventoryView = React.lazy(() => import('./views/InventoryView'));
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const CalendarPage = React.lazy(() => import('./views/CalendarPage'));
const SalesPage = React.lazy(() => import('./views/SalesPage'));
const EquipoCajaView = React.lazy(() => import('./views/EquipoCajaView'));
const ExpensesView = React.lazy(() => import('./views/ExpensesView'));
const CuppingView = React.lazy(() => import('./views/CuppingView'));
const ModulesView = React.lazy(() => import('./views/ModulesView'));
const RecipesView = React.lazy(() => import('./views/RecipesView').then(m => ({ default: m.RecipesView })));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const FullScreenMenu = React.lazy(() => import('./components/FullScreenMenu'));
const LandingPage = React.lazy(() => import('./views/LandingPage'));
const NavigationMenu = React.lazy(() => import('./components/NavigationMenu'));
const AudiobooksView = React.lazy(() => import('./views/AudiobooksView').then(m => ({ default: m.AudiobooksView })));
const AudiobookChaptersView = React.lazy(() => import('./views/AudiobookChaptersView').then(m => ({ default: m.AudiobookChaptersView })));
const AudiobookReaderView = React.lazy(() => import('./views/AudiobookReaderView').then(m => ({ default: m.AudiobookReaderView })));
import Loader from './components/Loader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BrandLogoFull } from './components/BrandLogo';
import ErrorBoundary from './components/ErrorBoundary';
import ClientDatabaseView from './views/ClientDatabaseView';
import { validatePassword, validateSession, generateSessionToken, clearSession } from './security';

// Main App Content
const AppContent: React.FC = () => {
  const { user, loading, profile, refreshSession } = useAuth();

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
  const navigate = useNavigate();
  const location = useLocation();

  // Route-to-state synchronization
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setViewState('landing');
      setIsCalendarIndependent(false);
      setIsSalesPage(false);
    } else if (path === '/ventas') {
      setIsSalesPage(true);
      setViewState('app');
    } else if (path === '/calendario') {
      setIsCalendarIndependent(true);
      setViewState('app');
    } else if (path.startsWith('/admin/')) {
      const tab = path.replace('/admin/', '');
      setActiveTab(tab || 'dashboard');
      setViewState('app');
    } else if (path.startsWith('/student/')) {
      const tab = path.replace('/student/', '');
      setActiveTab(tab || 'cupping');
      setViewState('app');
    }
  }, [location.pathname]);

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
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('varietal_stock_tab', stockTab);
  }, [stockTab]);

  useEffect(() => {
    if (isCalendarIndependent) sessionStorage.setItem('varietal_calendar_independent', 'true');
    else sessionStorage.removeItem('varietal_calendar_independent');
  }, [isCalendarIndependent]);

  useEffect(() => {
    if (isSalesPage) sessionStorage.setItem('varietal_sales_page', 'true');
    else sessionStorage.removeItem('varietal_sales_page');
  }, [isSalesPage]);

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
    
    // Validate session using secure token verification
    const sessionResult = validateSession();
    const calendarAccess = sessionStorage.getItem('varietal_calendar');
    const storedTab = sessionStorage.getItem('varietal_active_tab');
    
    if (sessionResult.valid && sessionResult.role) {
      setUserRole(sessionResult.role);
      setViewState('app');
      if (calendarAccess === 'true') {
        setActiveTab('calendar');
        setIsCalendarIndependent(true);
        sessionStorage.removeItem('varietal_calendar');
      } else if (sessionStorage.getItem('varietal_sales_page') === 'true') {
        setIsSalesPage(true);
      } else {
        if (sessionResult.role === 'student') {
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
          // Silently handle sign-out errors
        }
      }

      // 1. Update React State
      setUserRole(null);
      setViewState('landing');
      setIsNavMenuOpen(false);
      setIsCalendarIndependent(false);
      setIsSalesPage(false);

      // 2. Securely clear all session data (token + storage)
      clearSession();

      // 3. Clear URL History API state
      navigate('/');
  };

  const handleAuthenticate = async (role: 'admin' | 'student', password: string): Promise<boolean> => {
    // Validate password using SHA-256 hash comparison (passwords are never in plaintext)
    const isValid = await validatePassword(role, password);

    if (isValid) {
      // Generate a cryptographic session token to prevent sessionStorage tampering
      generateSessionToken(role);
      setUserRole(role);
      setActiveTab(role === 'admin' ? 'dashboard' : 'modules');
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
      navigate(userRole === 'admin' ? '/admin/dashboard' : '/student/modules');
    } else {
      setIsLoading(false);
    }
  };

  const handleSelectSection = (id: string) => {
    navigate(`/admin/${id}`);
    setIsSidebarOpen(false);
    setIsDesktopSidebarOpen(false);
  };

  // Filter menu items based on role
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'stock', label: 'Stock', icon: Package, roles: ['admin'] },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList, roles: ['admin'] },
    { id: 'roasting', label: 'Tostado', icon: Flame, roles: ['admin'] },
    { id: 'sales-history', label: 'Facturación', icon: Receipt, roles: ['admin'] },
    { id: 'clients-db', label: 'Clientes', icon: Database, roles: ['admin'] }
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
              <React.Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/student/modules" element={<ModulesView />} />
                  <Route path="/student/recipes" element={<RecipesView />} />
                  <Route path="/student/audiobooks" element={
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
                  } />
                  <Route path="/student/cupping" element={<CuppingView />} />
                  <Route path="/student/*" element={<Navigate to="/student/cupping" replace />} />
                </Routes>
              </React.Suspense>
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
                      setSelectedAudiobookCategory(null);
                      setSelectedAudiobookChapter(null);
                      navigate(`/student/${item.id}`);
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

            <div className="animate-slide-up">
              <React.Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/admin/dashboard" element={<DashboardView onNavigate={(tabId) => navigate(`/admin/${tabId}`)} userRole={userRole} />} />
                  <Route path="/admin/roasting" element={<RoastingView />} />
                  <Route path="/admin/orders" element={<OrdersView />} />
                  <Route path="/admin/sales-history" element={
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
                        {billingTab === 'historial' ? <EquipoCajaView /> : <ExpensesView />}
                      </div>
                    </div>
                  } />
                  <Route path="/admin/clients-db" element={<ClientDatabaseView />} />
                  <Route path="/admin/stock" element={
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
                          <InventoryView mode="coffee" />
                        ) : (
                          <InventoryView mode="utility" />
                        )}
                      </div>
                    </div>
                  } />
                  <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </React.Suspense>
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
