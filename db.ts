
import { Dexie, type EntityTable } from 'dexie';
import { createClient } from '@supabase/supabase-js';
import { GreenCoffee, Roast, Order, RoastedStock, RetailBagStock, ProductionActivity, Expense, ProductionItem, UserProfile, CuppingSession, EspressoSession, FilterSession, FilterRecipe, TeamMember, ScheduleEntry, SalesProduct, SalesCategory, SalesOrder, CashRegister, SalesCashSession, GuiaRemision, Client } from './types';

type VarietalDB = Dexie & {
  greenCoffees: EntityTable<GreenCoffee, 'id'>;
  roasts: EntityTable<Roast, 'id'>;
  orders: EntityTable<Order, 'id'>;
  roastedStocks: EntityTable<RoastedStock, 'id'>;
  retailBags: EntityTable<RetailBagStock, 'id'>;
  history: EntityTable<ProductionActivity, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  productionInventory: EntityTable<ProductionItem, 'id'>;
  profiles: EntityTable<UserProfile, 'id'>;
  cuppingSessions: EntityTable<CuppingSession, 'id'>;
  espressoSessions: EntityTable<EspressoSession, 'id'>;
  filterSessions: EntityTable<FilterSession, 'id'>;
  filterRecipes: EntityTable<FilterRecipe, 'id'>;
  teamMembers: EntityTable<TeamMember, 'id'>;
  scheduleEntries: EntityTable<ScheduleEntry, 'id'>;
  salesProducts: EntityTable<SalesProduct, 'id'>;
  salesCategories: EntityTable<SalesCategory, 'id'>;
  salesOrders: EntityTable<SalesOrder, 'id'>;
  cashRegisters: EntityTable<CashRegister, 'id'>;
  salesCashSessions: EntityTable<SalesCashSession, 'id'>;
  guiasRemision: EntityTable<GuiaRemision, 'id'>;
  clients: EntityTable<Client, 'id'>;
};

const db = new Dexie('VarietalDB') as VarietalDB;

db.version(12).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen'
});

db.version(13).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen'
});

db.version(14).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen',
  guiasRemision: 'id, destinatario, createdAt'
});

db.version(15).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen',
  guiasRemision: 'id, destinatario, createdAt',
  clients: 'id, name, district, clientType'
});

export { db };

let supabase: any = null;

const tableColumnWhitelist: Record<string, string[]> = {
  greenCoffees: ['id', 'clientName', 'variety', 'origin', 'entryDate', 'quantityKg'],
  roasts: [
    'id',
    'greenCoffeeId',
    'greenCoffeeName',
    'orderId',
    'clientName',
    'greenQtyKg',
    'roastedQtyKg',
    'weightLossPercentage',
    'profile',
    'roastDate',
    'roastCode'
  ],
  orders: [
    'id',
    'clientName',
    'variety',
    'type',
    'quantityKg',
    'entryDate',
    'dueDate',
    'status',
    'progress',
    'relatedRoastIds',
    'requiresRoasting',
    'roastType',
    'accumulatedRoastedKg',
    'accumulatedGreenUsedKg',
    'packagingType',
    'bagsUsed',
    'sortingLossKg',
    'fulfilledFromStockId',
    'shippedDate',
    'shippingCost',
    'invoicedDate'
  ],
  roastedStocks: [
    'id',
    'roastId',
    'variety',
    'clientName',
    'totalQtyKg',
    'remainingQtyKg',
    'isSelected',
    'mermaGrams',
    'roastDate',
    'roastType',
    'roastCode'
  ],
  retailBags: ['id', 'coffeeName', 'type', 'quantity', 'clientName', 'roastDate', 'roastId'],
  history: ['id', 'type', 'date', 'details'],
  expenses: ['id', 'reason', 'amount', 'documentType', 'documentId', 'date', 'status', 'relatedOrderId', 'createdBy', 'paidBy'],
  productionInventory: ['id', 'name', 'type', 'quantity', 'minThreshold', 'format'],
  profiles: ['id', 'email', 'role', 'isActive'],
  cuppingSessions: ['id', 'roastStockId', 'roastId', 'coffeeName', 'clientName', 'tasterName', 'date', 'objective', 'form', 'notes', 'sessionType', 'samples', 'deleted'],
  espressoSessions: ['id', 'date', 'baristaName', 'coffeeName', 'shots', 'notes', 'coffeeOrigin', 'coffeeProcess', 'roastDate', 'deleted'],
  filterSessions: ['id', 'date', 'brewerName', 'coffeeName', 'coffeeOrigin', 'coffeeProcess', 'roastDate', 'recipes', 'notes', 'deleted'],
  filterRecipes: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'method',
    'coffeeName',
    'coffeeOrigin',
    'coffeeDate',
    'doseGrams',
    'waterTempCelsius',
    'grinderModel',
    'grinderClicks',
    'totalWaterMl',
    'ratio',
    'totalTimeSeconds',
    'pressureBars',
    'filterType',
    'waterBrand',
    'phases',
    'tasting',
    'notes',
    'deleted'
  ],
  teamMembers: ['id', 'name'],
  scheduleEntries: ['id', 'user_id', 'type', 'date', 'time', 'endDate', 'details'],
  salesProducts: ['id', 'name', 'categoryId', 'price', 'isFavorite', 'createdAt'],
  salesCategories: ['id', 'name', 'color', 'createdAt'],
  salesOrders: ['id', 'clientName', 'total', 'status', 'createdAt', 'completedAt', 'items', 'orderName', 'source', 'deliveredAt', 'despachadoAt', 'invoicedAt', 'usedRoastedCoffee', 'usedRetailBags', 'usedUtilityBags', 'shippingCost', 'shippingPaidBy', 'clientId'],
  cashRegisters: ['id', 'monthStart', 'monthEnd', 'isOpen', 'openingAmount', 'totalIncome', 'totalExpense', 'closedAt', 'entries'],
  salesCashSessions: ['id', 'openedAt', 'closedAt', 'openingAmount', 'isOpen', 'entries', 'totalIncome', 'totalExpense', 'label', 'legacyRegisterId'],
  guiasRemision: ['id', 'createdAt', 'fechaEmision', 'fechaInicio', 'fechaFin', 'emisor', 'rucEmisor', 'transportista', 'ceDniTransportista', 'placa', 'puntoPartida', 'destinatario', 'rucDestinatario', 'motivo', 'direccionDestino', 'descripcion', 'productos', 'numeroGuia'],
  clients: ['id', 'name', 'district', 'address', 'reference', 'phone', 'clientType', 'observations', 'createdAt']
};

function sanitizeRecord(table: string, record: any) {
  const allowed = tableColumnWhitelist[table];
  if (!allowed) return record;
  const sanitized: any = {};
  for (const key of allowed) {
    if (key in record) {
      sanitized[key] = record[key];
    }
  }
  return sanitized;
}

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
};

export const getSupabase = () => supabase;

// Auto-initialize if env vars are present
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (envUrl && envKey) {
  initSupabase(envUrl, envKey);
}

export async function deleteFromCloud(table: string, id: string) {
  if (!supabase) return;
  try {
    const supabaseTable = table === 'teamMembers' ? 'team_members' : table;
    const { error } = await supabase.from(supabaseTable).delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error(`Error deleting from ${table}:`, err);
  }
}

export async function syncToCloud(table: string, data: any) {
  if (!supabase) return;
  try {
    let payload;
    if (Array.isArray(data)) {
      payload = data.map(item => sanitizeRecord(table, item));
    } else {
      payload = sanitizeRecord(table, data);
    }
    const supabaseTable = table === 'teamMembers' ? 'team_members' : table;
    const { error } = await supabase.from(supabaseTable).upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error(`Error sync ${table}:`, err);
  }
}

export async function pullFromCloud() {
  if (!supabase) return false;
  
  // 1. Check for global reset signal first
  try {
    const { data: resets } = await supabase
      .from('history')
      .select('*')
      .eq('type', 'SYSTEM_RESET')
      .order('date', { ascending: false })
      .limit(1);

    if (resets && resets.length > 0) {
      const lastReset = resets[0];
      const lastProcessed = localStorage.getItem('varietal_last_reset_processed');
      
      // If we haven't processed this reset yet, wipe local data
      if (!lastProcessed || new Date(lastReset.date) > new Date(lastProcessed)) {
        console.warn('GLOBAL RESET SIGNAL DETECTED. Wiping local database...');
        
        await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles, db.cuppingSessions, db.espressoSessions, db.filterSessions, db.filterRecipes, db.teamMembers, db.scheduleEntries, db.salesProducts, db.salesCategories, db.salesOrders, db.cashRegisters, db.salesCashSessions, db.guiasRemision], async () => {
          await db.greenCoffees.clear();
          await db.roasts.clear();
          await db.orders.clear();
          await db.roastedStocks.clear();
          await db.retailBags.clear();
          await db.history.clear();
          await db.expenses.clear();
          await db.productionInventory.clear();
          await db.profiles.clear();
          await db.cuppingSessions.clear();
          await db.espressoSessions.clear();
          await db.filterSessions.clear();
          await db.filterRecipes.clear();
          await db.teamMembers.clear();
          await db.scheduleEntries.clear();
          await db.salesProducts.clear();
          await db.salesCategories.clear();
          await db.salesOrders.clear();
          await db.cashRegisters.clear();
          await db.salesCashSessions.clear();
          await db.guiasRemision.clear();
        });
        
        localStorage.setItem('varietal_last_reset_processed', lastReset.date);
        console.log('Local database wiped successfully.');
      }
    }
  } catch (err) {
    console.error('Error checking for reset signal:', err);
  }

  // 2. Fetch all tables using exactly the casing Supabase expects
  // In Supabase, if a table was created with quotes like "salesCategories", we MUST query it as "salesCategories"
  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles', 'cuppingSessions', 'espressoSessions', 'filterSessions', 'filterRecipes', 'teamMembers', 'scheduleEntries', 'salesProducts', 'salesCategories', 'salesOrders', 'cashRegisters', 'salesCashSessions', 'guiasRemision', 'clients'];
  let success = true;

  for (const table of tables) {
    try {
      // In Supabase client, we use the exact string name or the mapped mapped name
      const supabaseTable = table === 'teamMembers' ? 'team_members' : table;
      const { data, error } = await supabase.from(supabaseTable).select('*');
      
      if (error) {
        const message = (error as any)?.message || '';
        const code = (error as any)?.code;
        const isNetworkError = typeof message === 'string' && message.includes('Failed to fetch');

        if (isNetworkError) {
          console.warn(`Supabase network error pulling ${table}:`, message);
        } else if (code === '42P01') {
          console.warn(`Supabase table "${table}" does not exist. Skipping sync for this table.`);
        } else {
          console.error(`Supabase error pulling ${table}:`, error);
          success = false;
        }
        continue;
      }

      if (data) {
        if (data.length > 0) {
          // Use bulkPut to merge cloud data
          // @ts-ignore
          await db[table].bulkPut(data);
        }
        // Reconcile: remove local records that no longer exist in the cloud
        // This ensures deletes on one device propagate to others
        try {
          const cloudIds = new Set(data.map((r: any) => r.id));
          // @ts-ignore
          const localRecords = await db[table].toArray();
          const toDelete = localRecords.filter((r: any) => !cloudIds.has(r.id)).map((r: any) => r.id);
          if (toDelete.length > 0) {
            // @ts-ignore
            await db[table].bulkDelete(toDelete);
          }
        } catch (reconcileErr) {
          console.warn(`Reconciliation skipped for ${table}:`, reconcileErr);
        }
      }
    } catch (e) {
      console.error(`Error pulling ${table}:`, e);
      success = false;
    }
  }
  return success;
}

export async function pushToCloud(): Promise<{ success: boolean; message?: string }> {
  if (!supabase) return { success: false, message: 'No hay conexión con Supabase' };
  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles', 'cuppingSessions', 'espressoSessions', 'filterSessions', 'filterRecipes', 'teamMembers', 'scheduleEntries', 'salesProducts', 'salesCategories', 'salesOrders', 'cashRegisters', 'salesCashSessions', 'guiasRemision', 'clients'];
  let success = true;
  let errorMessage = '';

  for (const table of tables) {
    try {
      // @ts-ignore
      const localData = await db[table].toArray();
      if (localData.length > 0) {
        const batchSize = 50;
        const supabaseTable = table === 'teamMembers' ? 'team_members' : table;
        for (let i = 0; i < localData.length; i += batchSize) {
          const batch = localData.slice(i, i + batchSize).map((record: any) => sanitizeRecord(table, record));
          const { error } = await supabase.from(supabaseTable).upsert(batch);
          if (error) {
            console.error(`Error pushing batch for ${table}:`, error);
            success = false;
            errorMessage = `Error en tabla ${table}: ${error.message}`;
          }
        }
      }
    } catch (e: any) {
      console.error(`Error processing push for ${table}:`, e);
      success = false;
      errorMessage = `Excepción en tabla ${table}: ${e.message || e}`;
    }
  }
  return { success, message: errorMessage };
}

export async function exportDatabaseToJson() {
  const data = {
    greenCoffees: await db.greenCoffees.toArray(),
    roasts: await db.roasts.toArray(),
    orders: await db.orders.toArray(),
    roastedStocks: await db.roastedStocks.toArray(),
    retailBags: await db.retailBags.toArray(),
    history: await db.history.toArray(),
    expenses: await db.expenses.toArray(),
    productionInventory: await db.productionInventory.toArray(),
    profiles: await db.profiles.toArray(),
    cuppingSessions: await db.cuppingSessions.toArray(),
    espressoSessions: await db.espressoSessions.toArray(),
    filterSessions: await db.filterSessions.toArray(),
    filterRecipes: await db.filterRecipes.toArray(),
    teamMembers: await db.teamMembers.toArray(),
    scheduleEntries: await db.scheduleEntries.toArray(),
    salesProducts: await db.salesProducts.toArray(),
    salesCategories: await db.salesCategories.toArray(),
    salesOrders: await db.salesOrders.toArray(),
    cashRegisters: await db.cashRegisters.toArray(),
    salesCashSessions: await db.salesCashSessions.toArray(),
    guiasRemision: await db.guiasRemision.toArray(),
    clients: await db.clients.toArray(),
    exportDate: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabaseFromJson(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles, db.cuppingSessions, db.espressoSessions, db.filterSessions, db.filterRecipes, db.teamMembers, db.scheduleEntries, db.salesProducts, db.salesCategories, db.salesOrders, db.cashRegisters, db.salesCashSessions, db.guiasRemision, db.clients], async () => {
      await db.greenCoffees.clear();
      await db.roasts.clear();
      await db.orders.clear();
      await db.roastedStocks.clear();
      await db.retailBags.clear();
      await db.history.clear();
      await db.expenses.clear();
      await db.productionInventory.clear();
      await db.profiles.clear();
      await db.cuppingSessions.clear();
      await db.espressoSessions.clear();
      await db.filterSessions.clear();
      await db.filterRecipes.clear();
      await db.teamMembers.clear();
      await db.scheduleEntries.clear();
      await db.salesProducts.clear();
      await db.salesCategories.clear();
      await db.salesOrders.clear();
      await db.cashRegisters.clear();
      await db.salesCashSessions.clear();
      await db.guiasRemision.clear();
      
      if (data.greenCoffees) await db.greenCoffees.bulkAdd(data.greenCoffees);
      if (data.roasts) await db.roasts.bulkAdd(data.roasts);
      if (data.orders) await db.orders.bulkAdd(data.orders);
      if (data.roastedStocks) await db.roastedStocks.bulkAdd(data.roastedStocks);
      if (data.retailBags) await db.retailBags.bulkAdd(data.retailBags);
      if (data.history) await db.history.bulkAdd(data.history);
      if (data.expenses) await db.expenses.bulkAdd(data.expenses);
      if (data.productionInventory) await db.productionInventory.bulkAdd(data.productionInventory);
      if (data.profiles) await db.profiles.bulkAdd(data.profiles);
      if (data.cuppingSessions) await db.cuppingSessions.bulkAdd(data.cuppingSessions);
      if (data.espressoSessions) await db.espressoSessions.bulkAdd(data.espressoSessions);
      if (data.filterSessions) await db.filterSessions.bulkAdd(data.filterSessions);
      if (data.filterRecipes) await db.filterRecipes.bulkAdd(data.filterRecipes);
      if (data.teamMembers) await db.teamMembers.bulkAdd(data.teamMembers);
      if (data.scheduleEntries) await db.scheduleEntries.bulkAdd(data.scheduleEntries);
      if (data.salesProducts) await db.salesProducts.bulkAdd(data.salesProducts);
      if (data.salesCategories) await db.salesCategories.bulkAdd(data.salesCategories);
      if (data.salesOrders) await db.salesOrders.bulkAdd(data.salesOrders);
      if (data.cashRegisters) await db.cashRegisters.bulkAdd(data.cashRegisters);
      if (data.salesCashSessions) await db.salesCashSessions.bulkAdd(data.salesCashSessions);
      if (data.guiasRemision) await db.guiasRemision.bulkAdd(data.guiasRemision);
      if (data.clients) await db.clients.bulkAdd(data.clients);
    });
    return true;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}

export function subscribeToChanges() {
  if (!supabase) return () => {};

  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles', 'cuppingSessions', 'espressoSessions', 'filterSessions', 'filterRecipes', 'teamMembers', 'scheduleEntries', 'salesProducts', 'salesCategories', 'salesOrders', 'cashRegisters', 'salesCashSessions', 'guiasRemision', 'clients'];

  const channel = supabase.channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      async (payload: any) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        
        // Case-insensitive match for table names
        // Special case for salesCategories which in Supabase is created as salesCategories but postgres returns it as salescategories (all lowercase)
        // Ensure accurate mapping by standardizing to our known Dexie table names
        let targetTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
        
        // Sometimes postgres returns quotes or exact cases, let's have a fallback map just in case
        if (!targetTable) {
            const tableMap: Record<string, string> = {
                'salescategories': 'salesCategories',
                'salesproducts': 'salesProducts',
                'salesorders': 'salesOrders',
                'cashregisters': 'cashRegisters',
                'salescashsessions': 'salesCashSessions',
                'scheduleentries': 'scheduleEntries',
                'team_members': 'teamMembers',
                'guiasremision': 'guiasRemision'
            };
            targetTable = tableMap[table.toLowerCase()] || undefined;
        }
        
        if (targetTable) {
            console.log('Realtime update:', table, eventType);
            try {
                if (eventType === 'DELETE') {
                    // @ts-ignore
                    await db[targetTable].delete(oldRecord.id);
                } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    // @ts-ignore
                    await db[targetTable].put(newRecord);
                }
            } catch (err) {
                console.error('Error applying realtime update:', err);
            }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function resetDatabase(excludeUserId?: string) {
  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles', 'cuppingSessions', 'espressoSessions', 'filterSessions', 'filterRecipes', 'teamMembers', 'scheduleEntries', 'salesProducts', 'salesCategories', 'salesOrders', 'cashRegisters', 'salesCashSessions', 'guiasRemision'];
  
  await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles, db.cuppingSessions, db.espressoSessions, db.filterSessions, db.filterRecipes, db.teamMembers, db.scheduleEntries, db.salesProducts, db.salesCategories, db.salesOrders, db.cashRegisters, db.salesCashSessions, db.guiasRemision], async () => {
      await db.greenCoffees.clear();
      await db.roasts.clear();
      await db.orders.clear();
      await db.roastedStocks.clear();
      await db.retailBags.clear();
      await db.history.clear();
      await db.expenses.clear();
      await db.productionInventory.clear();
      await db.profiles.clear();
      await db.cuppingSessions.clear();
      await db.espressoSessions.clear();
      await db.filterSessions.clear();
      await db.filterRecipes.clear();
      await db.teamMembers.clear();
      await db.scheduleEntries.clear();
      await db.salesProducts.clear();
      await db.salesCategories.clear();
      await db.salesOrders.clear();
      await db.cashRegisters.clear();
      await db.salesCashSessions.clear();
      await db.guiasRemision.clear();
  });

  // Clear Cloud DB if connected
  if (supabase) {
    for (const table of tables) {
      try {
        const supabaseTable = table === 'teamMembers' ? 'team_members' : table;
        let query = supabase.from(supabaseTable).delete();
        let error;

        if (table === 'profiles' && excludeUserId) {
             // Delete everyone except the current user to prevent lockout
             const result = await query.neq('id', excludeUserId);
             error = result.error;
        } else {
             // Use nil UUID to allow deleting all rows (compatible with UUID and Text columns)
             // Previously caused error 22P02 with "_______" on UUID columns
             const result = await query.neq('id', '00000000-0000-0000-0000-000000000000'); 
             error = result.error;
        }

        if (error) console.error(`Error clearing cloud table ${table}:`, error);
      } catch (e) {
        console.error(`Exception clearing cloud table ${table}:`, e);
      }
    }

    // Broadcast Global Reset Signal
    try {
      const resetId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
        
      await supabase.from('history').insert({
        id: resetId,
        type: 'SYSTEM_RESET',
        date: new Date().toISOString(),
        details: { initiatedBy: excludeUserId || 'unknown' }
      });
      console.log('Global reset signal broadcasted.');
    } catch (err) {
      console.error('Error broadcasting reset signal:', err);
    }
  }
}
