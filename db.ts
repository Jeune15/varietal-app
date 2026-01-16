
import { Dexie, type EntityTable } from 'dexie';
import { createClient } from '@supabase/supabase-js';
import { GreenCoffee, Roast, Order, RoastedStock, RetailBagStock, ProductionActivity, Expense, ProductionItem, UserProfile } from './types';

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
};

const db = new Dexie('VarietalDB') as VarietalDB;

db.version(3).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role'
});

export { db };

let supabase: any = null;

const tableColumnWhitelist: Record<string, string[]> = {
  greenCoffees: ['id', 'clientName', 'variety', 'origin', 'entryDate', 'quantityKg'],
  roasts: [
    'id',
    'greenCoffeeId',
    'orderId',
    'clientName',
    'greenQtyKg',
    'roastedQtyKg',
    'weightLossPercentage',
    'profile',
    'roastDate'
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
    'mermaGrams'
  ],
  retailBags: ['id', 'coffeeName', 'type', 'quantity'],
  history: ['id', 'type', 'date', 'details'],
  expenses: ['id', 'reason', 'amount', 'documentType', 'documentId', 'date', 'status', 'relatedOrderId'],
  productionInventory: ['id', 'name', 'type', 'quantity', 'minThreshold', 'format'],
  profiles: ['id', 'email', 'role', 'isActive']
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

// Auto-initialize if env vars are present
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (envUrl && envKey) {
  initSupabase(envUrl, envKey);
}

export const getSupabase = () => supabase;

export async function syncToCloud(table: string, data: any) {
  if (!supabase) return;
  try {
    const payload = sanitizeRecord(table, data);
    const { error } = await supabase.from(table).upsert(payload);
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
        
        await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles], async () => {
          await db.greenCoffees.clear();
          await db.roasts.clear();
          await db.orders.clear();
          await db.roastedStocks.clear();
          await db.retailBags.clear();
          await db.history.clear();
          await db.expenses.clear();
          await db.productionInventory.clear();
          await db.profiles.clear();
        });
        
        localStorage.setItem('varietal_last_reset_processed', lastReset.date);
        console.log('Local database wiped successfully.');
      }
    }
  } catch (err) {
    console.error('Error checking for reset signal:', err);
  }

  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles'];
  let success = true;

  for (const table of tables) {
    try {
      // console.log(`Attempting to pull ${table}...`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`Supabase error pulling ${table}:`, error);
        success = false;
        continue;
      }

      if (data && data.length > 0) {
        // Use bulkPut to merge cloud data instead of clearing local data
        // This prevents data loss if cloud is empty or connection fails
        // @ts-ignore
        await db[table].bulkPut(data);
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
  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles'];
  let success = true;
  let errorMessage = '';

  for (const table of tables) {
    try {
      // @ts-ignore
      const localData = await db[table].toArray();
      if (localData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < localData.length; i += batchSize) {
          const batch = localData.slice(i, i + batchSize).map((record: any) => sanitizeRecord(table, record));
          const { error } = await supabase.from(table).upsert(batch);
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
    exportDate: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabaseFromJson(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles], async () => {
      await db.greenCoffees.clear();
      await db.roasts.clear();
      await db.orders.clear();
      await db.roastedStocks.clear();
      await db.retailBags.clear();
      await db.history.clear();
      await db.expenses.clear();
      await db.productionInventory.clear();
      await db.profiles.clear();
      
      if (data.greenCoffees) await db.greenCoffees.bulkAdd(data.greenCoffees);
      if (data.roasts) await db.roasts.bulkAdd(data.roasts);
      if (data.orders) await db.orders.bulkAdd(data.orders);
      if (data.roastedStocks) await db.roastedStocks.bulkAdd(data.roastedStocks);
      if (data.retailBags) await db.retailBags.bulkAdd(data.retailBags);
      if (data.history) await db.history.bulkAdd(data.history);
      if (data.expenses) await db.expenses.bulkAdd(data.expenses);
      if (data.productionInventory) await db.productionInventory.bulkAdd(data.productionInventory);
      if (data.profiles) await db.profiles.bulkAdd(data.profiles);
    });
    return true;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}

export function subscribeToChanges() {
  if (!supabase) return () => {};

  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles'];

  const channel = supabase.channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      async (payload: any) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        
        // Case-insensitive match for table names
        const targetTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
        
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
  const tables = ['greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags', 'history', 'expenses', 'productionInventory', 'profiles'];
  
  // Clear local DB
  await db.transaction('rw', [db.greenCoffees, db.roasts, db.orders, db.roastedStocks, db.retailBags, db.history, db.expenses, db.productionInventory, db.profiles], async () => {
      await db.greenCoffees.clear();
      await db.roasts.clear();
      await db.orders.clear();
      await db.roastedStocks.clear();
      await db.retailBags.clear();
      await db.history.clear();
      await db.expenses.clear();
      await db.productionInventory.clear();
      await db.profiles.clear();
  });

  // Clear Cloud DB if connected
  if (supabase) {
    for (const table of tables) {
      try {
        let query = supabase.from(table).delete();
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
