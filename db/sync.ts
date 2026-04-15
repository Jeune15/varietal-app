/**
 * db/sync.ts — Cloud Synchronization Engine
 * 
 * Handles all Supabase ↔ Dexie data synchronization:
 * - syncToCloud: Push individual records
 * - deleteFromCloud: Remove records from Supabase
 * - pullFromCloud: Full reconciliation (pull + delete orphans)
 * - pushToCloud: Bulk push all local data
 * - subscribeToChanges: Realtime listener
 * - resetDatabase: Wipe local + cloud with broadcast signal
 */

import { db, ALL_TABLES, sanitizeRecord, getSupabaseTableName } from './config';
import { getSupabase } from './supabase';

// ── Single-Record Operations ─────────────────────────────────────

/** Delete a single record from a Supabase table by ID. */
export async function deleteFromCloud(table: string, id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const supabaseTable = getSupabaseTableName(table);
    const { error } = await supabase.from(supabaseTable).delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error(`Error deleting from ${table}:`, err);
  }
}

/** Upsert one or more records to a Supabase table. */
export async function syncToCloud(table: string, data: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    let payload;
    if (Array.isArray(data)) {
      payload = data.map(item => sanitizeRecord(table, item));
    } else {
      payload = sanitizeRecord(table, data);
    }
    const supabaseTable = getSupabaseTableName(table);
    const { error } = await supabase.from(supabaseTable).upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error(`Error sync ${table}:`, err);
  }
}

// ── Full Sync Operations ─────────────────────────────────────────

/** Pull all data from Supabase and reconcile with local Dexie state. */
export async function pullFromCloud() {
  const supabase = getSupabase();
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

  // 2. Fetch all tables and reconcile
  const tables = [...ALL_TABLES];
  let success = true;

  for (const table of tables) {
    try {
      const supabaseTable = getSupabaseTableName(table);
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
          // @ts-ignore
          await db[table].bulkPut(data);
        }
        // Reconcile: remove local records that no longer exist in cloud
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

/** Push all local data to Supabase (bulk upsert in batches of 50). */
export async function pushToCloud(): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'No hay conexión con Supabase' };
  const tables = [...ALL_TABLES];
  let success = true;
  let errorMessage = '';

  for (const table of tables) {
    try {
      // @ts-ignore
      const localData = await db[table].toArray();
      if (localData.length > 0) {
        const batchSize = 50;
        const supabaseTable = getSupabaseTableName(table);
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

// ── Realtime Subscription ────────────────────────────────────────

/** Subscribe to Supabase Realtime changes and apply them to Dexie. */
export function subscribeToChanges() {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const tables = [...ALL_TABLES];

  const channel = supabase.channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      async (payload: any) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        
        let targetTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
        
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
            targetTable = (tableMap[table.toLowerCase()] || undefined) as typeof tables[number] | undefined;
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

// ── Reset ────────────────────────────────────────────────────────

/** Wipe local and cloud databases, broadcast a reset signal. */
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

  const supabase = getSupabase();
  if (supabase) {
    for (const table of tables) {
      try {
        const supabaseTable = getSupabaseTableName(table);
        let query = supabase.from(supabaseTable).delete();
        let error;

        if (table === 'profiles' && excludeUserId) {
             const result = await query.neq('id', excludeUserId);
             error = result.error;
        } else {
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
