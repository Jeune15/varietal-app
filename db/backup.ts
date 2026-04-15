/**
 * db/backup.ts — Import/Export Database as JSON
 * 
 * Handles full database serialization and deserialization
 * with validation and sanitization.
 */

import { db, ALL_TABLES, sanitizeRecord } from './config';

// ── Export ────────────────────────────────────────────────────────

/** Export the entire local database as a JSON string. */
export async function exportDatabaseToJson() {
  const data: Record<string, any> = {};
  for (const table of ALL_TABLES) {
    // @ts-ignore
    data[table] = await db[table].toArray();
  }
  data.exportDate = new Date().toISOString();
  return JSON.stringify(data, null, 2);
}

// ── Import Validation ────────────────────────────────────────────

const MAX_IMPORT_RECORDS_PER_TABLE = 10_000;
const VALID_IMPORT_TABLES = new Set(ALL_TABLES);

/**
 * Validates the structure of imported data before inserting into the database.
 * Returns { valid, errors } describing any problems found.
 */
function validateImportData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Los datos importados deben ser un objeto JSON válido'] };
  }

  const obj = data as Record<string, unknown>;

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'exportDate') continue;

    if (!VALID_IMPORT_TABLES.has(key as any)) {
      errors.push(`Tabla desconocida ignorada: "${key}"`);
      continue;
    }

    if (!Array.isArray(value)) {
      errors.push(`La tabla "${key}" debe ser un array, se recibió ${typeof value}`);
      continue;
    }

    if (value.length > MAX_IMPORT_RECORDS_PER_TABLE) {
      errors.push(`La tabla "${key}" excede el límite de ${MAX_IMPORT_RECORDS_PER_TABLE} registros (tiene ${value.length})`);
      continue;
    }

    for (let i = 0; i < value.length; i++) {
      const record = value[i];
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        errors.push(`${key}[${i}]: registro inválido (no es un objeto)`);
        break;
      }
      if (typeof (record as any).id !== 'string' || (record as any).id.trim() === '') {
        errors.push(`${key}[${i}]: campo "id" faltante o inválido`);
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Import ───────────────────────────────────────────────────────

/** Import a JSON string into the local database, replacing all existing data. */
export async function importDatabaseFromJson(jsonString: string) {
  try {
    if (jsonString.length > 50 * 1024 * 1024) {
      console.error('Import rejected: file exceeds 50MB');
      return false;
    }

    const data = JSON.parse(jsonString);
    
    const validation = validateImportData(data);
    if (!validation.valid) {
      console.error('Import validation failed:', validation.errors);
      return false;
    }

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
      
      if (data.greenCoffees) await db.greenCoffees.bulkAdd(data.greenCoffees.map((r: any) => sanitizeRecord('greenCoffees', r)));
      if (data.roasts) await db.roasts.bulkAdd(data.roasts.map((r: any) => sanitizeRecord('roasts', r)));
      if (data.orders) await db.orders.bulkAdd(data.orders.map((r: any) => sanitizeRecord('orders', r)));
      if (data.roastedStocks) await db.roastedStocks.bulkAdd(data.roastedStocks.map((r: any) => sanitizeRecord('roastedStocks', r)));
      if (data.retailBags) await db.retailBags.bulkAdd(data.retailBags.map((r: any) => sanitizeRecord('retailBags', r)));
      if (data.history) await db.history.bulkAdd(data.history.map((r: any) => sanitizeRecord('history', r)));
      if (data.expenses) await db.expenses.bulkAdd(data.expenses.map((r: any) => sanitizeRecord('expenses', r)));
      if (data.productionInventory) await db.productionInventory.bulkAdd(data.productionInventory.map((r: any) => sanitizeRecord('productionInventory', r)));
      if (data.profiles) await db.profiles.bulkAdd(data.profiles.map((r: any) => sanitizeRecord('profiles', r)));
      if (data.cuppingSessions) await db.cuppingSessions.bulkAdd(data.cuppingSessions.map((r: any) => sanitizeRecord('cuppingSessions', r)));
      if (data.espressoSessions) await db.espressoSessions.bulkAdd(data.espressoSessions.map((r: any) => sanitizeRecord('espressoSessions', r)));
      if (data.filterSessions) await db.filterSessions.bulkAdd(data.filterSessions.map((r: any) => sanitizeRecord('filterSessions', r)));
      if (data.filterRecipes) await db.filterRecipes.bulkAdd(data.filterRecipes.map((r: any) => sanitizeRecord('filterRecipes', r)));
      if (data.teamMembers) await db.teamMembers.bulkAdd(data.teamMembers.map((r: any) => sanitizeRecord('teamMembers', r)));
      if (data.scheduleEntries) await db.scheduleEntries.bulkAdd(data.scheduleEntries.map((r: any) => sanitizeRecord('scheduleEntries', r)));
      if (data.salesProducts) await db.salesProducts.bulkAdd(data.salesProducts.map((r: any) => sanitizeRecord('salesProducts', r)));
      if (data.salesCategories) await db.salesCategories.bulkAdd(data.salesCategories.map((r: any) => sanitizeRecord('salesCategories', r)));
      if (data.salesOrders) await db.salesOrders.bulkAdd(data.salesOrders.map((r: any) => sanitizeRecord('salesOrders', r)));
      if (data.cashRegisters) await db.cashRegisters.bulkAdd(data.cashRegisters.map((r: any) => sanitizeRecord('cashRegisters', r)));
      if (data.salesCashSessions) await db.salesCashSessions.bulkAdd(data.salesCashSessions.map((r: any) => sanitizeRecord('salesCashSessions', r)));
      if (data.guiasRemision) await db.guiasRemision.bulkAdd(data.guiasRemision.map((r: any) => sanitizeRecord('guiasRemision', r)));
      if (data.clients) await db.clients.bulkAdd(data.clients.map((r: any) => sanitizeRecord('clients', r)));
    });
    return true;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}
