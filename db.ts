/**
 * db.ts — Backward-Compatible Re-export
 * 
 * This file exists solely for backward compatibility.
 * The actual implementation lives in the db/ directory:
 *   db/config.ts   — Schema, types, whitelist
 *   db/supabase.ts — Supabase client
 *   db/sync.ts     — Sync engine
 *   db/backup.ts   — Import/Export
 * 
 * All existing imports continue to work unchanged.
 */
export {
  db,
  sanitizeRecord,
  ALL_TABLES,
  tableColumnWhitelist
} from './db/config';

export type { VarietalDB } from './db/config';

export { initSupabase, getSupabase } from './db/supabase';

export {
  syncToCloud,
  deleteFromCloud,
  pullFromCloud,
  pushToCloud,
  subscribeToChanges,
  resetDatabase
} from './db/sync';

export { exportDatabaseToJson, importDatabaseFromJson } from './db/backup';
