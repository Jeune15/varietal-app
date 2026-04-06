import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, deleteFromCloud } from '../../db';
import { SalesCategory, SalesProduct } from '../../types';
import { Plus, Edit2, Trash2, Star, X, Palette, Check, Package, Search } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#2563EB', '#1D4ED8', // Blues
  '#10B981', '#059669', '#047857', // Greens
  '#F59E0B', '#D97706', '#B45309', // Ambers
  '#EF4444', '#DC2626', '#B91C1C', // Reds
  '#8B5CF6', '#7C3AED', '#6D28D9', // Purples
  '#EC4899', '#DB2777', '#BE185D', // Pinks
  '#6366F1', '#4F46E5', '#4338CA', // Indigos
  '#14B8A6', '#0D9488', '#0F766E', // Teals
];

const SalesProductosTab: React.FC = () => {
  const categories = useLiveQuery(() => db.salesCategories.toArray()) || [];
  const products = useLiveQuery(() => db.salesProducts.toArray()) || [];

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SalesCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SalesProduct | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'product'; id: string } | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Category CRUD ----
  const openCategoryForm = (cat?: SalesCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatColor(cat.color);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatColor(PRESET_COLORS[0]);
    }
    setShowCategoryForm(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    if (editingCategory) {
      const updated = { ...editingCategory, name: catName.trim(), color: catColor };
      await db.salesCategories.update(editingCategory.id, updated);
      await syncToCloud('salesCategories', updated);
    } else {
      const id = crypto.randomUUID();
      const newCat = { id, name: catName.trim(), color: catColor, createdAt: new Date().toISOString() };
      await db.salesCategories.add(newCat);
      await syncToCloud('salesCategories', newCat);
    }
    setShowCategoryForm(false);
  };

  const deleteCategory = async (id: string) => {
    // Unassign products from this category
    const prods = products.filter(p => p.categoryId === id);
    for (const p of prods) {
      const updatedProd = { ...p, categoryId: undefined };
      await db.salesProducts.update(p.id, updatedProd);
      await syncToCloud('salesProducts', updatedProd);
    }
    await db.salesCategories.delete(id);
    await deleteFromCloud('salesCategories', id);
    setDeleteConfirm(null);
  };

  // ---- Product CRUD ----
  const openProductForm = (prod?: SalesProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdPrice(String(prod.price));
      setProdCategoryId(prod.categoryId || '');
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdCategoryId('');
    }
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim() || !prodPrice) return;
    const price = parseFloat(prodPrice);
    if (isNaN(price) || price < 0) return;

    if (editingProduct) {
      const updatedProd = {
        ...editingProduct,
        name: prodName.trim(),
        price,
        categoryId: prodCategoryId || undefined,
      };
      await db.salesProducts.update(editingProduct.id, updatedProd);
      await syncToCloud('salesProducts', updatedProd);
    } else {
      const id = crypto.randomUUID();
      const newProd = {
        id,
        name: prodName.trim(),
        price,
        categoryId: prodCategoryId || undefined,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
      await db.salesProducts.add(newProd);
      await syncToCloud('salesProducts', newProd);
    }
    setShowProductForm(false);
  };

  const deleteProduct = async (id: string) => {
    await db.salesProducts.delete(id);
    await deleteFromCloud('salesProducts', id);
    setDeleteConfirm(null);
  };

  const toggleFavorite = async (prod: SalesProduct) => {
    const updatedProd = { ...prod, isFavorite: !prod.isFavorite };
    await db.salesProducts.update(prod.id, updatedProd);
    await syncToCloud('salesProducts', updatedProd);
  };

  // Group products by category
  const filterBySearch = (prods: typeof products) =>
    searchQuery.trim()
      ? prods.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : prods;

  const uncategorized = filterBySearch(products.filter(p => !p.categoryId));
  const getCategoryProducts = (catId: string) => filterBySearch(products.filter(p => p.categoryId === catId));
  const totalCount = products.length;
  const categoryCount = categories.length;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Productos</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {totalCount} producto{totalCount !== 1 ? 's' : ''} · {categoryCount} categoría{categoryCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCategoryForm()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span>Categoría</span>
          </button>
          <button
            onClick={() => openProductForm()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Producto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {totalCount > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Categories Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">Categorías</h3>
        {categories.length === 0 ? (
          <div className="text-center py-12 text-stone-400 dark:text-stone-600">
            <Palette className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay categorías creadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: cat.color + '18' }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{cat.name}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                    {getCategoryProducts(cat.id).length} producto{getCategoryProducts(cat.id).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openCategoryForm(cat)}
                    className="p-1.5 bg-white/90 dark:bg-stone-800/90 rounded-lg hover:bg-white dark:hover:bg-stone-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}
                    className="p-1.5 bg-white/90 dark:bg-stone-800/90 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products by Category */}
      {categories.map(cat => {
        const catProds = getCategoryProducts(cat.id);
        if (catProds.length === 0) return null;
        return (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">{cat.name}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {catProds.map(prod => (
                <ProductCard key={prod.id} product={prod} category={cat} onEdit={() => openProductForm(prod)} onDelete={() => setDeleteConfirm({ type: 'product', id: prod.id })} onToggleFav={() => toggleFavorite(prod)} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4">Sin Categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {uncategorized.map(prod => (
              <ProductCard key={prod.id} product={prod} onEdit={() => openProductForm(prod)} onDelete={() => setDeleteConfirm({ type: 'product', id: prod.id })} onToggleFav={() => toggleFavorite(prod)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for products */}
      {products.length === 0 && (
        <div className="text-center py-16 text-stone-400 dark:text-stone-600">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay productos creados</p>
          <p className="text-xs mt-1.5">Crea categorías y productos para empezar a vender</p>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryForm && (
        <ModalOverlay onClose={() => setShowCategoryForm(false)}>
          <div className="space-y-5">
            <h3 className="text-lg font-black uppercase tracking-tight">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Nombre</label>
              <input
                autoFocus
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Ej: Bebidas calientes"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-2">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCatColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${catColor === c ? 'ring-2 ring-offset-2 ring-stone-500 dark:ring-offset-stone-900 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  >
                    {catColor === c && <Check className="w-4 h-4 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCategoryForm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button onClick={saveCategory} disabled={!catName.trim()} className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Product Modal */}
      {showProductForm && (
        <ModalOverlay onClose={() => setShowProductForm(false)}>
          <div className="space-y-5">
            <h3 className="text-lg font-black uppercase tracking-tight">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Nombre</label>
              <input
                autoFocus
                value={prodName}
                onChange={e => setProdName(e.target.value)}
                placeholder="Ej: Café Latte"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Precio (S/)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={prodPrice}
                onChange={e => setProdPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">Categoría (opcional)</label>
              <select
                value={prodCategoryId}
                onChange={e => setProdCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowProductForm(false)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button onClick={saveProduct} disabled={!prodName.trim() || !prodPrice} className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 hover:bg-emerald-700 transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ModalOverlay onClose={() => setDeleteConfirm(null)}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-bold">¿Eliminar {deleteConfirm.type === 'category' ? 'esta categoría' : 'este producto'}?</p>
            {deleteConfirm.type === 'category' && (
              <p className="text-xs text-stone-500">Los productos de esta categoría quedarán sin categoría</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest rounded-lg">
                Cancelar
              </button>
              <button
                onClick={() => deleteConfirm.type === 'category' ? deleteCategory(deleteConfirm.id) : deleteProduct(deleteConfirm.id)}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// ---- Subcomponents ----

const ProductCard: React.FC<{
  product: SalesProduct;
  category?: SalesCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
}> = ({ product, category, onEdit, onDelete, onToggleFav }) => (
  <div className="group relative bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{product.name}</p>
        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">S/ {product.price.toFixed(2)}</p>
        {category && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="text-[10px] text-stone-400 uppercase tracking-widest">{category.name}</span>
          </div>
        )}
      </div>
      <button onClick={onToggleFav} className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center">
        <Star className={`w-5 h-5 transition-colors ${product.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'}`} />
      </button>
    </div>
    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
        <Edit2 className="w-3.5 h-3.5 text-stone-500" />
      </button>
      <button onClick={onDelete} className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  </div>
);

const ModalOverlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>
  </div>
);

export default SalesProductosTab;
