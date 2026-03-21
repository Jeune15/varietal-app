import React, { useState } from 'react';
import { Home, ClipboardList, Package, Wallet, History, ChevronLeft } from 'lucide-react';
import SalesHomeTab from './sales/SalesHomeTab';
import SalesPedidosTab from './sales/SalesPedidosTab';
import SalesProductosTab from './sales/SalesProductosTab';
import SalesCajaTab from './sales/SalesCajaTab';
import SalesHistorialTab from './sales/SalesHistorialTab';

type SalesTab = 'home' | 'pedidos' | 'productos' | 'caja' | 'historial';

interface Props {
  onExit: () => void;
}

const tabs: { id: SalesTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'caja', label: 'Caja', icon: Wallet },
  { id: 'historial', label: 'Historial', icon: History },
];

const SalesPage: React.FC<Props> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<SalesTab>('home');

  return (
    <div className="h-[100dvh] overflow-hidden bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 flex flex-col">
      {/* Top Bar */}
      <header className="flex-shrink-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-black dark:text-white">Ventas</h1>
          <div className="w-[44px]" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full" key={activeTab}>
          {activeTab === 'home' && <SalesHomeTab />}
          {activeTab === 'pedidos' && <SalesPedidosTab />}
          {(activeTab === 'productos' || activeTab === 'caja' || activeTab === 'historial') && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'productos' && <SalesProductosTab />}
                {activeTab === 'caja' && <SalesCajaTab />}
                {activeTab === 'historial' && <SalesHistorialTab />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="flex-shrink-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-[150]">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 p-2 min-w-[3rem] rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default SalesPage;
