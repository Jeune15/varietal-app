import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { SalesProduct, SalesCategory, SalesOrderItem } from '../../types';
import { Heart, Grid3X3, Plus, MoreVertical, Trash2, Edit2, MessageSquare, User, FileText, X, ShoppingCart, Check, Package, ChevronLeft } from 'lucide-react';

type SalesTab = 'home' | 'pedidos' | 'productos' | 'caja' | 'historial';
type FilterMode = 'categories' | 'favorites' | string; // string = categoryId | '__uncategorized__'

const SalesHomeTab = () => {
  const products = useLiveQuery(() => db.salesProducts.toArray()) || [];
  const categories = useLiveQuery(() => db.salesCategories.toArray()) || [];

  const [filterMode, setFilterMode] = useState<FilterMode>('categories');
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [orderName, setOrderName] = useState('');

  // Context menu for order items
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState<{ itemId: string; price: string } | null>(null);
  const [editingItemObs, setEditingItemObs] = useState<{ itemId: string; obs: string } | null>(null);

  // Free product
  const [showFreeProduct, setShowFreeProduct] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [freePrice, setFreePrice] = useState('');

  // Mobile sidebar toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Success toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Tap animation
  const [tappedProductId, setTappedProductId] = useState<string | null>(null);

  const uncategorizedCount = useMemo(() => products.filter(p => !p.categoryId).length, [products]);

  const selectedCategory = useMemo(() => {
    if (filterMode === 'categories' || filterMode === 'favorites' || filterMode === '__uncategorized__') return null;
    return categories.find(c => c.id === filterMode) || null;
  }, [categories, filterMode]);

  const filteredProducts = useMemo(() => {
    if (filterMode === 'favorites') return products.filter(p => p.isFavorite);
    if (filterMode === '__uncategorized__') return products.filter(p => !p.categoryId);
    if (filterMode === 'categories') return [];
    return products.filter(p => p.categoryId === filterMode);
  }, [products, filterMode]);

  const getCategoryForProduct = (p: SalesProduct) =>
    categories.find(c => c.id === p.categoryId);

  const total = useMemo(() => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [orderItems]);
  const itemCount = useMemo(() => orderItems.reduce((sum, i) => sum + i.quantity, 0), [orderItems]);

  const navigateToTab = (tab: SalesTab) => {
    sessionStorage.setItem('varietal_sales_tab', tab);
    window.dispatchEvent(new CustomEvent('varietal_sales_navigate', { detail: tab }));
  };

  const contextMenuItem = useMemo(() => {
    if (!contextMenu) return null;
    return orderItems.find(i => i.id === contextMenu.itemId) || null;
  }, [contextMenu, orderItems]);

  const getMenuPosition = (x: number, y: number) => {
    const width = 180;
    const height = 150;
    const padding = 8;
    return {
      top: Math.max(padding, Math.min(y, window.innerHeight - height - padding)),
      left: Math.max(padding, Math.min(x - width, window.innerWidth - width - padding)),
    };
  };

  // Add product to order
  const addToOrder = (product: SalesProduct) => {
    // Tap animation
    setTappedProductId(product.id);
    setTimeout(() => setTappedProductId(null), 300);

    const existing = orderItems.find(i => i.productId === product.id);
    if (existing) {
      setOrderItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
      }]);
    }
  };

  const addFreeProduct = () => {
    if (!freeName.trim() || !freePrice) return;
    const price = parseFloat(freePrice);
    if (isNaN(price) || price < 0) return;
    setOrderItems(prev => [...prev, {
      id: crypto.randomUUID(),
      productName: freeName.trim(),
      price,
      quantity: 1,
    }]);
    setFreeName('');
    setFreePrice('');
    setShowFreeProduct(false);
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    setOrderItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== itemId));
    setContextMenu(null);
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setOrderItems(prev => prev.map(i => i.id === itemId ? { ...i, price: newPrice } : i));
    setEditingItemPrice(null);
  };

  const updateItemObs = (itemId: string, obs: string) => {
    setOrderItems(prev => prev.map(i => i.id === itemId ? { ...i, observation: obs || undefined } : i));
    setEditingItemObs(null);
  };

  const createOrder = async () => {
    if (orderItems.length === 0) return;
    const id = crypto.randomUUID();
    const name = orderName.trim() || `Pedido #${Date.now().toString(36).slice(-4).toUpperCase()}`;
    await db.salesOrders.add({
      id,
      clientName: clientName.trim() || 'Sin nombre',
      orderName: name,
      items: orderItems,
      total,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    });
    // Reset
    setOrderItems([]);
    setClientName('');
    setOrderName('');
    setShowMobileSidebar(false);

    // Show success toast
    setToastMessage(`✓ ${name} creado — S/ ${total.toFixed(2)}`);
    setShowToast(true);
  };

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="flex flex-col lg:flex-row h-full relative" onClick={() => contextMenu && setContextMenu(null)}>
      {/* Left: Products Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r-0 lg:border-r border-stone-200 dark:border-stone-800">
        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-stone-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterMode('categories')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterMode === 'categories'
                ? 'bg-stone-800 dark:bg-white text-white dark:text-black'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterMode === 'favorites'
                ? 'bg-red-500 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <Heart className="w-3 h-3" />
            Favoritos
          </button>
          <button
            onClick={() => setShowFreeProduct(true)}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Producto libre
          </button>
          {(filterMode !== 'categories' && filterMode !== 'favorites') && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-px h-5 bg-stone-200 dark:bg-stone-700" />
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
              >
                <Grid3X3 className="w-3 h-3 text-stone-400" />
                {filterMode === '__uncategorized__' ? 'Sin categoría' : (selectedCategory?.name || 'Categoría')}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterMode('categories');
                  }}
                  className="p-0.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            /* Empty state CTA */
            <div className="text-center py-16 text-stone-400">
              <Package className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-1">Sin productos aún</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-5">Crea productos en la pestaña Productos para empezar a vender</p>
              <button
                onClick={() => navigateToTab('productos')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Ir a Productos ↗
              </button>
            </div>
          ) : filterMode === 'categories' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">Categorías</h2>
                  <p className="text-[11px] text-stone-500 dark:text-stone-500 mt-1">
                    {categories.length} categoría{categories.length !== 1 ? 's' : ''}{uncategorizedCount > 0 ? ` · ${uncategorizedCount} sin categoría` : ''}
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('productos')}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear
                </button>
              </div>

              {(categories.length === 0 && uncategorizedCount === 0) ? (
                <div className="text-center py-14 text-stone-400">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-1">Sin categorías aún</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">Crea categorías y productos para empezar a vender</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.map(cat => {
                    const count = products.filter(p => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterMode(cat.id)}
                        className="relative rounded-xl p-4 text-left text-white shadow-sm hover:shadow-lg transition-all min-h-[90px] flex flex-col justify-between overflow-hidden hover:scale-[1.02] active:scale-[0.95]"
                        style={{ backgroundColor: cat.color, transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out' }}
                      >
                        <span className="text-xs font-black uppercase tracking-wider opacity-95 line-clamp-2">{cat.name}</span>
                        <span className="text-[11px] font-bold opacity-90">{count} producto{count !== 1 ? 's' : ''}</span>
                      </button>
                    );
                  })}
                  {uncategorizedCount > 0 && (
                    <button
                      onClick={() => setFilterMode('__uncategorized__')}
                      className="relative rounded-xl p-4 text-left text-white shadow-sm hover:shadow-lg transition-all min-h-[90px] flex flex-col justify-between overflow-hidden hover:scale-[1.02] active:scale-[0.95] bg-stone-700"
                      style={{ transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out' }}
                    >
                      <span className="text-xs font-black uppercase tracking-wider opacity-95">Sin categoría</span>
                      <span className="text-[11px] font-bold opacity-90">{uncategorizedCount} producto{uncategorizedCount !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="text-sm">No hay productos {filterMode === 'favorites' ? 'favoritos' : 'en esta categoría'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const cat = getCategoryForProduct(product);
                const bgColor = cat?.color || '#6B7280';
                const isTapped = tappedProductId === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToOrder(product)}
                    className={`relative rounded-xl p-4 text-left text-white shadow-sm hover:shadow-lg transition-all min-h-[90px] flex flex-col justify-between overflow-hidden ${
                      isTapped ? 'scale-[0.92] shadow-inner' : 'hover:scale-[1.02] active:scale-[0.95]'
                    }`}
                    style={{ backgroundColor: bgColor, transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out' }}
                  >
                    <span className="text-xs font-bold leading-tight line-clamp-2">{product.name}</span>
                    <span className="text-lg font-black mt-1">S/ {product.price.toFixed(2)}</span>
                    {product.isFavorite && (
                      <Heart className="absolute top-2 right-2 w-3.5 h-3.5 fill-white/80 text-white/80" />
                    )}
                    {/* Tap ripple effect */}
                    {isTapped && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Badge (shown only on <lg when sidebar is hidden) */}
      {orderItems.length > 0 && (
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden fixed bottom-16 right-4 z-[100] flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-black">{itemCount}</span>
          <span className="text-[10px] font-bold opacity-80">S/ {total.toFixed(2)}</span>
        </button>
      )}

      {/* Right: Order Sidebar — Desktop (always visible) */}
      <div className="hidden lg:flex w-[360px] flex-shrink-0 flex-col bg-white dark:bg-stone-900 border-t lg:border-t-0 border-stone-200 dark:border-stone-800 overflow-hidden">
        <SidebarContent
          orderItems={orderItems}
          clientName={clientName}
          setClientName={setClientName}
          orderName={orderName}
          setOrderName={setOrderName}
          total={total}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          updateItemQuantity={updateItemQuantity}
          removeItem={removeItem}
          editingItemPrice={editingItemPrice}
          setEditingItemPrice={setEditingItemPrice}
          editingItemObs={editingItemObs}
          setEditingItemObs={setEditingItemObs}
          updateItemPrice={updateItemPrice}
          updateItemObs={updateItemObs}
          createOrder={createOrder}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
            </div>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="absolute top-3 right-4 p-2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              orderItems={orderItems}
              clientName={clientName}
              setClientName={setClientName}
              orderName={orderName}
              setOrderName={setOrderName}
              total={total}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              updateItemQuantity={updateItemQuantity}
              removeItem={removeItem}
              editingItemPrice={editingItemPrice}
              setEditingItemPrice={setEditingItemPrice}
              editingItemObs={editingItemObs}
              setEditingItemObs={setEditingItemObs}
              updateItemPrice={updateItemPrice}
              updateItemObs={updateItemObs}
              createOrder={createOrder}
            />
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingItemPrice && (
        <ModalOverlay onClose={() => setEditingItemPrice(null)}>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight">Editar Precio</h3>
            <input
              type="number"
              step="0.5"
              min="0"
              autoFocus
              value={editingItemPrice.price}
              onChange={e => setEditingItemPrice({ ...editingItemPrice, price: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingItemPrice(null)} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-xs font-bold uppercase rounded-lg">Cancelar</button>
              <button
                onClick={() => {
                  const p = parseFloat(editingItemPrice.price);
                  if (!isNaN(p) && p >= 0) updateItemPrice(editingItemPrice.itemId, p);
                }}
                className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Edit Observation Modal */}
      {editingItemObs && (
        <ModalOverlay onClose={() => setEditingItemObs(null)}>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight">Observación</h3>
            <textarea
              autoFocus
              value={editingItemObs.obs}
              onChange={e => setEditingItemObs({ ...editingItemObs, obs: e.target.value })}
              rows={3}
              placeholder="Ej: Sin azúcar, extra caliente..."
              className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingItemObs(null)} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-xs font-bold uppercase rounded-lg">Cancelar</button>
              <button
                onClick={() => updateItemObs(editingItemObs.itemId, editingItemObs.obs)}
                className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Free Product Modal */}
      {showFreeProduct && (
        <ModalOverlay onClose={() => setShowFreeProduct(false)}>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight">Producto Libre</h3>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1">Nombre</label>
              <input
                autoFocus
                value={freeName}
                onChange={e => setFreeName(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1">Precio (S/)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={freePrice}
                onChange={e => setFreePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFreeProduct(false)} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-xs font-bold uppercase rounded-lg">Cancelar</button>
              <button
                onClick={addFreeProduct}
                disabled={!freeName.trim() || !freePrice}
                className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {contextMenu && contextMenuItem && createPortal(
        <div
          className="fixed inset-0 z-[500]"
          onClick={() => setContextMenu(null)}
        >
          <div
            className="absolute bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1 min-w-[180px]"
            style={getMenuPosition(contextMenu.x, contextMenu.y)}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setEditingItemObs({ itemId: contextMenuItem.id, obs: contextMenuItem.observation || '' });
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100 dark:hover:bg-stone-700 text-left"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Observación
            </button>
            <button
              onClick={() => {
                setEditingItemPrice({ itemId: contextMenuItem.id, price: String(contextMenuItem.price) });
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-100 dark:hover:bg-stone-700 text-left"
            >
              <Edit2 className="w-3.5 h-3.5" /> Editar precio
            </button>
            <button
              onClick={() => removeItem(contextMenuItem.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ---- Sidebar Content (shared between desktop & mobile drawer) ----
interface SidebarContentProps {
  orderItems: SalesOrderItem[];
  clientName: string;
  setClientName: (v: string) => void;
  orderName: string;
  setOrderName: (v: string) => void;
  total: number;
  contextMenu: { itemId: string; x: number; y: number } | null;
  setContextMenu: (v: { itemId: string; x: number; y: number } | null) => void;
  updateItemQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  editingItemPrice: { itemId: string; price: string } | null;
  setEditingItemPrice: (v: { itemId: string; price: string } | null) => void;
  editingItemObs: { itemId: string; obs: string } | null;
  setEditingItemObs: (v: { itemId: string; obs: string } | null) => void;
  updateItemPrice: (itemId: string, newPrice: number) => void;
  updateItemObs: (itemId: string, obs: string) => void;
  createOrder: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  orderItems, clientName, setClientName, orderName, setOrderName, total,
  contextMenu, setContextMenu, updateItemQuantity, removeItem,
  setEditingItemPrice, setEditingItemObs, createOrder,
}) => (
  <>
    {/* Client / Order Name */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 dark:border-stone-800">
      <div className="flex items-center gap-1.5 flex-1">
        <User className="w-3.5 h-3.5 text-stone-400" />
        <input
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          placeholder="Cliente"
          className="bg-transparent text-xs font-medium w-full focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
        />
      </div>
      <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />
      <div className="flex items-center gap-1.5 flex-1">
        <FileText className="w-3.5 h-3.5 text-stone-400" />
        <input
          value={orderName}
          onChange={e => setOrderName(e.target.value)}
          placeholder="Nom. Pedido"
          className="bg-transparent text-xs font-medium w-full focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
        />
      </div>
    </div>

    {/* Order Items */}
    <div className="flex-1 overflow-y-auto">
      {orderItems.length === 0 ? (
        <div className="text-center py-12 text-stone-300 dark:text-stone-700">
          <p className="text-xs">Selecciona productos para agregar</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {orderItems.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              {/* Colored index badge */}
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                P{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{item.productName}</p>
                <p className="text-[10px] text-stone-400">S/ {item.price.toFixed(2)}</p>
                {item.observation && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">📝 {item.observation}</p>
                )}
              </div>
              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateItemQuantity(item.id, -1)}
                  className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.id, 1)}
                  className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
              {/* Price */}
              <span className="text-xs font-black text-stone-800 dark:text-stone-200 w-16 text-right">
                S/ {(item.price * item.quantity).toFixed(2)}
              </span>
              {/* 3-dot menu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  const x = r.right;
                  const y = r.top;
                  setContextMenu(contextMenu?.itemId === item.id ? null : { itemId: item.id, x, y });
                }}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:text-stone-300 dark:hover:bg-stone-800 transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Total & Create Button */}
    <div className="border-t border-stone-200 dark:border-stone-800 p-4 pb-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Total</span>
        <span className="text-2xl font-black text-black dark:text-white">S/ {total.toFixed(2)}</span>
      </div>
      <button
        onClick={createOrder}
        disabled={orderItems.length === 0}
        className="w-full py-3.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
      >
        Crear Pedido
      </button>
    </div>
  </>
);

const ModalOverlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
      <button onClick={onClose} className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>
  </div>
);

export default SalesHomeTab;
