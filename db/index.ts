/**
 * db/index.ts — Barrel Re-export
 * 
 * This file re-exports everything from the sub-modules so that
 * existing imports like `import { db, syncToCloud } from './db'`
 * continue to work without modification across the entire codebase.
 *
 * Architecture:
 *   db/config.ts   — Dexie schema, types, whitelist, sanitizer
 *   db/supabase.ts — Supabase client lifecycle
 *   db/sync.ts     — Push/Pull/Realtime/Reset operations
 *   db/backup.ts   — JSON import/export with validation
 */

// Core database instance and utilities
export { db, sanitizeRecord, ALL_TABLES, tableColumnWhitelist } from './config';
export type { VarietalDB } from './config';

// Supabase client
export { initSupabase, getSupabase } from './supabase';

// Sync operations
export {
  syncToCloud,
  deleteFromCloud,
  pullFromCloud,
  pushToCloud,
  subscribeToChanges,
  resetDatabase
} from './sync';

// Backup operations
export { exportDatabaseToJson, importDatabaseFromJson } from './backup';
