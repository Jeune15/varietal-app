import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, getSupabase } from '../db';
import { RoastedStock, RetailBagStock, Roast, ProductionItem } from '../types';
import { ShoppingBag, CheckCircle, XCircle, Tag, Layers, Plus, Settings2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Props {
  stocks: RoastedStock[];
  roasts: Roast[];
  retailBags: RetailBagStock[];
  setRetailBags: React.Dispatch<React.SetStateAction<RetailBagStock[]>>;
  mode?: 'coffee' | 'utility';
}

const InventoryView: React.FC<Props> = ({ stocks, roasts, retailBags, mode = 'coffee' }) => {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const productionInventory = useLiveQuery(
    () => db.productionInventory.toArray() as Promise<ProductionItem[]>
  ) || [];

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedStockForSelection, setSelectedStockForSelection] = useState<RoastedStock | null>(null);
  const [selectionMerma, setSelectionMerma] = useState<number | ''>('');

  const [showRetailModal, setShowRetailModal] = useState(false);
  const [selectedRoastedStockId, setSelectedRoastedStockId] = useState('');
  const [selectedBagType, setSelectedBagType] = useState<'250g' | '500g' | '1kg'>('250g');
  const [bagUnits, setBagUnits] = useState<number | ''>('');

  const [showBagStockModal, setShowBagStockModal] = useState(false);
  const [selectedBagItemId, setSelectedBagItemId] = useState('');
  const [bagStockToAdd, setBagStockToAdd] = useState<number | ''>('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [prodForm, setProdForm] = useState<{
    name: string;
    type: 'unit' | 'rechargeable';
    quantity: number;
    minThreshold: number;
    format?: '250g' | '500g' | '1kg';
  }>({
    name: '',
    type: 'unit',
    quantity: 0,
    minThreshold: 10,
    format: undefined
  });

  const bagTemplates: { name: string; format: '250g' | '500g' | '1kg' | undefined; minThreshold: number }[] = [
    { name: 'Bolsas 250 gr', format: '250g', minThreshold: 25 },
    { name: 'Bolsas 500 gr', format: '500g', minThreshold: 20 },
    { name: 'Bolsas 1 kg', format: '1kg', minThreshold: 40 },
    { name: 'Grain Pro', format: undefined, minThreshold: 5 }
  ];

  useEffect(() => {
    if (!canEdit) return;
    const ensureDefaults = async () => {
      const existing = await db.productionInventory.toArray();
      for (const template of bagTemplates) {
        const existingItem = existing.find(i => i.name === template.name);
        if (!existingItem) {
          const newItem: ProductionItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: template.name,
            type: 'unit',
            quantity: 0,
            minThreshold: template.minThreshold,
            format: template.format as '250g' | '500g' | '1kg' | undefined
          };
          await db.productionInventory.add(newItem);
          await syncToCloud('productionInventory', newItem);
        } else if (existingItem.minThreshold !== template.minThreshold) {
          const updatedItem: ProductionItem = {
            ...existingItem,
            minThreshold: template.minThreshold
          };
          await db.productionInventory.update(existingItem.id, { minThreshold: updatedItem.minThreshold });
          await syncToCloud('productionInventory', updatedItem);
        }
      }
    };
    ensureDefaults();
  }, [canEdit]);

  const getRoastDate = (stock: RoastedStock) => {
    const roast = roasts.find(r => r.id === stock.roastId);
    return roast?.roastDate || null;
  };

  const openSelectionModal = (stock: RoastedStock) => {
    if (!canEdit) return;
    if (stock.isSelected) return;
    setSelectedStockForSelection(stock);
    setSelectionMerma('');
    setShowSelectionModal(true);
  };

  const handleConfirmSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!selectedStockForSelection) return;

    const mermaValue =
      typeof selectionMerma === 'string' ? parseFloat(selectionMerma) : selectionMerma;

    if (!mermaValue || mermaValue <= 0) {
      showToast('Ingresa una merma válida en gramos.', 'error');
      return;
    }

    const selectedStock = selectedStockForSelection;
    const weightReductionKg = mermaValue / 1000;

    if (weightReductionKg > selectedStock.remainingQtyKg) {
      showToast('La merma no puede ser mayor al stock restante.', 'error');
      return;
    }

    const newRemaining = selectedStock.remainingQtyKg - weightReductionKg;

    if (newRemaining <= 0.001) {
      await db.roastedStocks.delete(selectedStock.id);
      if (getSupabase()) {
        await getSupabase().from('roastedStocks').delete().eq('id', selectedStock.id);
      }
    } else {
      const updatedStock: RoastedStock = {
        ...selectedStock,
        isSelected: true,
        mermaGrams: selectedStock.mermaGrams + mermaValue,
        remainingQtyKg: newRemaining
      };
      await db.roastedStocks.update(selectedStock.id, updatedStock);
      await syncToCloud('roastedStocks', updatedStock);
    }

    setShowSelectionModal(false);
    setSelectedStockForSelection(null);
    showToast('Selección registrada', 'success');
  };

  const handleRetailBagsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const stock = stocks.find(s => s.id === selectedRoastedStockId);
    if (!stock) {
      showToast('Selecciona un lote tostado válido.', 'error');
      return;
    }

    const unitsValue =
      typeof bagUnits === 'string' ? parseInt(bagUnits, 10) : bagUnits;

    if (!unitsValue || unitsValue <= 0) {
      showToast('Ingresa una cantidad de bolsas mayor a 0.', 'error');
      return;
    }

    const bagSizeKg =
      selectedBagType === '250g' ? 0.25 : selectedBagType === '500g' ? 0.5 : 1;
    const reductionKg = unitsValue * bagSizeKg;

    if (reductionKg > stock.remainingQtyKg + 0.0001) {
      const maxBags = Math.floor(stock.remainingQtyKg / bagSizeKg);
      showToast(
        `No hay suficiente stock a granel. Máximo posible: ${maxBags} bolsas.`,
        'error'
      );
      return;
    }

    const newRemaining = stock.remainingQtyKg - reductionKg;

    if (newRemaining <= 0.001) {
      await db.roastedStocks.delete(stock.id);
      if (getSupabase()) {
        await getSupabase().from('roastedStocks').delete().eq('id', stock.id);
      }
    } else {
      const updatedStock: RoastedStock = {
        ...stock,
        remainingQtyKg: newRemaining
      };
      await db.roastedStocks.update(stock.id, { remainingQtyKg: updatedStock.remainingQtyKg });
      await syncToCloud('roastedStocks', updatedStock);
    }

    const existingBag = retailBags.find(
      b =>
        b.coffeeName === stock.variety &&
        b.type === selectedBagType &&
        b.roastId === stock.roastId
    );

    if (existingBag) {
      const updatedBag: RetailBagStock = {
        ...existingBag,
        quantity: existingBag.quantity + unitsValue
      };
      await db.retailBags.update(existingBag.id, { quantity: updatedBag.quantity });
      await syncToCloud('retailBags', updatedBag);
    } else {
      const roast = roasts.find(r => r.id === stock.roastId);
      const newBag: RetailBagStock = {
        id: Math.random().toString(36).substr(2, 9),
        coffeeName: stock.variety,
        type: selectedBagType,
        quantity: unitsValue,
        clientName: stock.clientName,
        roastDate: roast?.roastDate,
        roastId: stock.roastId
      };
      await db.retailBags.add(newBag);
      await syncToCloud('retailBags', newBag);
    }

    setShowRetailModal(false);
    setSelectedRoastedStockId('');
    setBagUnits('');
    setSelectedBagType('250g');
    showToast('Bolsas retail armadas correctamente.', 'success');
  };

  const updateItemQuantity = async (id: string, newQty: number) => {
    if (!canEdit) return;
    const item = productionInventory.find(i => i.id === id);
    if (!item) return;

    let validatedQty = newQty;
    if (item.type === 'rechargeable') {
      if (validatedQty < 0) validatedQty = 0;
      if (validatedQty > 100) validatedQty = 100;
    } else {
      if (validatedQty < 0) validatedQty = 0;
    }

    const updated: ProductionItem = { ...item, quantity: validatedQty };
    await db.productionInventory.update(id, { quantity: validatedQty });
    await syncToCloud('productionInventory', updated);
  };

  const handleSaveProdItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!prodForm.name.trim()) {
      showToast('Ingresa un nombre para el producto.', 'error');
      return;
    }

    const newItem: ProductionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: prodForm.name.trim(),
      type: prodForm.type,
      quantity: prodForm.quantity || 0,
      minThreshold: prodForm.minThreshold || 0,
      format: prodForm.type === 'unit' ? prodForm.format : undefined
    };

    await db.productionInventory.add(newItem);
    await syncToCloud('productionInventory', newItem);
    setShowProductModal(false);
    setProdForm({ name: '', type: 'unit', quantity: 0, minThreshold: 10, format: undefined });
    showToast('Producto agregado a utilería.', 'success');
  };

  const handleAddBagStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!selectedBagItemId) {
      showToast('Selecciona una bolsa.', 'error');
      return;
    }

    const unitsValue =
      typeof bagStockToAdd === 'string' ? parseInt(bagStockToAdd, 10) : bagStockToAdd;

    if (!unitsValue || unitsValue <= 0) {
      showToast('Ingresa una cantidad mayor a 0.', 'error');
      return;
    }

    const item = productionInventory.find(i => i.id === selectedBagItemId);
    if (!item) {
      showToast('No se encontró la bolsa seleccionada.', 'error');
      return;
    }

    const newQty = item.quantity + unitsValue;
    await updateItemQuantity(item.id, newQty);
    setShowBagStockModal(false);
    setSelectedBagItemId('');
    setBagStockToAdd('');
    showToast('Stock de bolsas actualizado.', 'success');
  };

  const bagItems = productionInventory.filter(i =>
    bagTemplates.some(t => t.name === i.name)
  );
  const bagItemIds = new Set(bagItems.map(i => i.id));
  const productItems = productionInventory.filter(i => !bagItemIds.has(i.id));

  if (mode === 'utility') {
    return (
      <div className="space-y-16">
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b-4 border-black pb-6">
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Utilería</h3>
              <div className="flex items-center gap-3">
                <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  Insumos
                </div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                  Bolsas y productos
                </p>
              </div>
            </div>
            <Settings2 className="w-12 h-12 text-stone-200" strokeWidth={1} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight">Bolsas</h4>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                  250g, 500g, 1kg y Grain Pro
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (bagItems.length === 0) return;
                    setSelectedBagItemId(bagItems[0].id);
                    setBagStockToAdd('');
                    setShowBagStockModal(true);
                  }}
                  disabled={bagItems.length === 0}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border ${
                    bagItems.length === 0
                      ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                      : 'border-black bg-black text-white hover:bg-white hover:text-black'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  Agregar stock
                </button>
              )}
            </div>

            <div className="bg-white border border-stone-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-stone-100 border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Bolsa
                      </th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Formato
                      </th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Stock
                      </th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {bagItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <ShoppingBag className="w-12 h-12 text-stone-200" strokeWidth={1} />
                            <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">
                              No hay bolsas registradas
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bagItems.map(item => (
                        <tr key={item.id} className="hover:bg-stone-50 transition-colors group">
                          <td className="px-6 py-6 font-black text-black text-sm uppercase">
                            {item.name}
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-[10px] font-bold bg-black text-white px-3 py-1.5 tracking-widest uppercase">
                              {item.format || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.quantity}
                                disabled={!canEdit}
                                onChange={e =>
                                  updateItemQuantity(item.id, parseInt(e.target.value || '0', 10))
                                }
                                className="w-24 px-3 py-2 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold text-black transition-all text-center disabled:bg-stone-50 disabled:text-stone-500"
                              />
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                Uds
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            {item.quantity <= item.minThreshold && (
                              <span className="inline-flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 border border-red-100">
                                <AlertCircle className="w-3 h-3" /> Reordenar
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <h4 className="text-lg font-black uppercase tracking-tight">Otros productos</h4>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                Insumos adicionales de producción
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
              >
                <Plus className="w-3 h-3" />
                Nuevo producto
              </button>
            )}
          </div>

          <div className="bg-white border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Producto
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Tipo
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Existencias
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {productItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Settings2 className="w-12 h-12 text-stone-200" strokeWidth={1} />
                          <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">
                            No hay productos registrados
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productItems.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-6 font-black text-black text-sm uppercase">
                          {item.name}
                        </td>
                        <td className="px-6 py-6">
                          {item.type === 'rechargeable' ? (
                            <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-3 py-1 border border-stone-200 uppercase tracking-wider">
                              Recargable
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold bg-white text-black px-3 py-1 border border-black w-fit uppercase tracking-wider">
                                Unidad
                              </span>
                              {item.format && (
                                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-1">
                                  {item.format}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          {item.type === 'rechargeable' ? (
                            <div className="flex items-center gap-4 w-48">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={item.quantity}
                                disabled={!canEdit}
                                onChange={e =>
                                  updateItemQuantity(item.id, parseInt(e.target.value, 10))
                                }
                                className="w-full h-1 bg-stone-200 rounded-none appearance-none cursor-pointer accent-black disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-xs font-black text-black w-12 text-right">
                                {item.quantity}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={item.quantity}
                                disabled={!canEdit}
                                onChange={e =>
                                  updateItemQuantity(item.id, parseInt(e.target.value || '0', 10))
                                }
                                className="w-24 px-3 py-2 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold text-black transition-all text-center disabled:bg-stone-50 disabled:text-stone-500"
                              />
                              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                Uds
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          {item.quantity <= item.minThreshold && (
                            <span className="inline-flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 border border-red-100">
                              <AlertCircle className="w-3 h-3" /> Reordenar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {showBagStockModal && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              setShowBagStockModal(false);
              setSelectedBagItemId('');
              setBagStockToAdd('');
            }}
          >
            <div
              className="bg-white w-full max-w-md shadow-2xl border border-black"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-black p-6 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-lg font-black tracking-tighter uppercase">
                    Agregar stock de bolsas
                  </h4>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Utilería
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBagStockModal(false);
                    setSelectedBagItemId('');
                    setBagStockToAdd('');
                  }}
                  className="text-white hover:text-stone-300 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddBagStock} className="p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Bolsa
                  </p>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                    value={selectedBagItemId}
                    onChange={e => setSelectedBagItemId(e.target.value)}
                  >
                    <option value="">Selecciona una bolsa</option>
                    {bagItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.format ? `(${item.format})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Cantidad a agregar
                  </p>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                    value={bagStockToAdd}
                    onChange={e =>
                      setBagStockToAdd(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBagStockModal(false);
                      setSelectedBagItemId('');
                      setBagStockToAdd('');
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-stone-300 text-stone-500 hover:border-black hover:text-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showProductModal && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowProductModal(false)}
          >
            <div
              className="bg-white w-full max-w-lg shadow-2xl border border-black"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-black p-6 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-lg font-black tracking-tighter uppercase">
                    Nuevo producto
                  </h4>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Inventario de utilería
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="text-white hover:text-stone-300 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveProdItem} className="p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Nombre del producto
                  </p>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                    value={prodForm.name}
                    onChange={e => setProdForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                      Tipo
                    </p>
                    <select
                      className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                      value={prodForm.type}
                      onChange={e =>
                        setProdForm(prev => ({
                          ...prev,
                          type: e.target.value as 'unit' | 'rechargeable'
                        }))
                      }
                    >
                      <option value="unit">Unidad</option>
                      <option value="rechargeable">Recargable</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                      Cantidad inicial
                    </p>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                      value={prodForm.quantity}
                      onChange={e =>
                        setProdForm(prev => ({
                          ...prev,
                          quantity: parseInt(e.target.value || '0', 10)
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                      Umbral mínimo
                    </p>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                      value={prodForm.minThreshold}
                      onChange={e =>
                        setProdForm(prev => ({
                          ...prev,
                          minThreshold: parseInt(e.target.value || '0', 10)
                        }))
                      }
                    />
                  </div>
                  {prodForm.type === 'unit' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        Formato
                      </p>
                      <select
                        className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                        value={prodForm.format || ''}
                        onChange={e =>
                          setProdForm(prev => ({
                            ...prev,
                            format: (e.target.value || undefined) as
                              | '250g'
                              | '500g'
                              | '1kg'
                              | undefined
                          }))
                        }
                      >
                        <option value="">Sin formato</option>
                        <option value="250g">250g</option>
                        <option value="500g">500g</option>
                        <option value="1kg">1kg</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-stone-300 text-stone-500 hover:border-black hover:text-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Roasted Bulk Inventory */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-6">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Silos de Café</h3>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Granel
              </div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Existencias Tostadas</p>
            </div>
          </div>
          <Layers className="w-12 h-12 text-stone-200" strokeWidth={1} />
        </div>

        <div className="bg-white border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Variedad / Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Stock Disponible</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-right">Mermas Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {stocks.filter(s => s.remainingQtyKg > 0.001).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Layers className="w-12 h-12 text-stone-200" strokeWidth={1} />
                        <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">Sin stock a granel en sistema</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stocks.filter(s => s.remainingQtyKg > 0.001).map((s) => {
                    const roastDate = getRoastDate(s);
                    return (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="font-black text-black text-lg uppercase tracking-tight">{s.clientName}</div>
                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1 group-hover:text-black transition-colors">
                          {s.variety}
                        </div>
                        {roastDate && (
                          <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                            Tueste: {roastDate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black tracking-tight ${s.remainingQtyKg < 5 ? 'text-red-600' : 'text-black'}`}>
                            {s.remainingQtyKg.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Kg</span>
                        </div>
                        {s.remainingQtyKg < 5 && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                            Stock Crítico
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {s.isSelected ? (
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black border border-black px-3 py-1.5 bg-stone-50">
                              <CheckCircle className="w-3 h-3" /> Selección
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => openSelectionModal(s)}
                              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${
                                canEdit
                                  ? 'text-stone-400 border-stone-200 hover:border-black hover:text-black'
                                  : 'text-stone-300 border-stone-200 cursor-not-allowed'
                              }`}
                            >
                              <XCircle className="w-3 h-3" /> Base
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-sm font-bold text-stone-400 tabular-nums border-b border-stone-200 pb-0.5">{s.mermaGrams}g</span>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Retail Bags Inventory */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-6">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Inventario Retail</h3>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Empaque
              </div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Producto Terminado</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (stocks.filter(s => s.remainingQtyKg > 0.001).length === 0) {
                    showToast('No hay stock tostado disponible para armar bolsas.', 'error');
                    return;
                  }
                  setSelectedRoastedStockId('');
                  setSelectedBagType('250g');
                  setBagUnits('');
                  setShowRetailModal(true);
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
              >
                Armar bolsas retail
              </button>
            )}
            <ShoppingBag className="w-12 h-12 text-stone-200" strokeWidth={1} />
          </div>
        </div>

        <div className="bg-white border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                    Variedad
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                    Origen
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                    Fecha de tueste
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                    Formato
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-black uppercase tracking-[0.2em] text-right">
                    Unidades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {retailBags.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Tag className="w-12 h-12 text-stone-200" strokeWidth={1} />
                        <p className="text-stone-400 font-medium text-sm uppercase tracking-widest">No se han procesado bolsas retail</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  retailBags.map((bag) => (
                    <tr key={bag.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 group-hover:border-black group-hover:text-black transition-all">
                            <Tag className="w-5 h-5" />
                          </div>
                          <span className="font-black text-black text-lg uppercase tracking-tight">{bag.coffeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">
                          {bag.clientName || 'Sin origen'}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-xs font-mono text-stone-500">
                          {bag.roastDate ? bag.roastDate.split('T')[0] : 'Sin fecha'}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[10px] font-bold bg-black text-white px-3 py-1.5 tracking-widest uppercase">
                          {bag.type}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-3xl font-black tracking-tighter ${bag.quantity < 5 ? 'text-red-600' : 'text-black'}`}>
                            {bag.quantity}
                          </span>
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Unidades</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showSelectionModal && selectedStockForSelection && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => {
            setShowSelectionModal(false);
            setSelectedStockForSelection(null);
            setSelectionMerma('');
          }}
        >
          <div
            className="bg-white w-full max-w-md shadow-2xl border border-black"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black p-6 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tighter uppercase">
                  Selección y merma
                </h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {selectedStockForSelection.clientName} — {selectedStockForSelection.variety}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSelectionModal(false);
                  setSelectedStockForSelection(null);
                  setSelectionMerma('');
                }}
                className="text-white hover:text-stone-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmSelection} className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Stock disponible
                </p>
                <p className="font-mono text-sm">
                  {selectedStockForSelection.remainingQtyKg.toFixed(2)} Kg
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Merma técnica (g)
                </p>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                  value={selectionMerma}
                  onChange={e =>
                    setSelectionMerma(
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSelectionModal(false);
                    setSelectedStockForSelection(null);
                    setSelectionMerma('');
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-stone-300 text-stone-500 hover:border-black hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRetailModal && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => {
            setShowRetailModal(false);
            setSelectedRoastedStockId('');
            setBagUnits('');
            setSelectedBagType('250g');
          }}
        >
          <div
            className="bg-white w-full max-w-lg shadow-2xl border border-black"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black p-6 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tighter uppercase">
                  Armar bolsas retail
                </h4>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Conversión desde stock tostado
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRetailModal(false);
                  setSelectedRoastedStockId('');
                  setBagUnits('');
                  setSelectedBagType('250g');
                }}
                className="text-white hover:text-stone-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRetailBagsSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Café tostado
                </p>
                <select
                  required
                  className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                  value={selectedRoastedStockId}
                  onChange={e => setSelectedRoastedStockId(e.target.value)}
                >
                  <option value="">Selecciona un lote tostado</option>
                  {stocks
                    .filter(s => s.remainingQtyKg > 0.001)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.clientName} — {s.variety} — Disp: {s.remainingQtyKg.toFixed(2)} Kg
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Tipo de bolsa
                  </p>
                  <select
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                    value={selectedBagType}
                    onChange={e =>
                      setSelectedBagType(e.target.value as '250g' | '500g' | '1kg')
                    }
                  >
                    <option value="250g">250 g</option>
                    <option value="500g">500 g</option>
                    <option value="1kg">1 kg</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                    Número de bolsas
                  </p>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-bold"
                    value={bagUnits}
                    onChange={e =>
                      setBagUnits(
                        e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRetailModal(false);
                    setSelectedRoastedStockId('');
                    setBagUnits('');
                    setSelectedBagType('250g');
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-stone-300 text-stone-500 hover:border-black hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] border border-black bg-black text-white hover:bg-white hover:text-black"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
