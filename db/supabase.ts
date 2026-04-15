/**
 * db/supabase.ts — Supabase Client Management
 * 
 * Handles initialization, singleton access, and auto-init from env vars.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

/** Initialize the Supabase client with the given URL and anon key. */
export const initSupabase = (url: string, key: string): SupabaseClient | null => {
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
};

/** Returns the current Supabase client instance, or null if not initialized. */
export const getSupabase = (): any => supabase;

// Auto-initialize from environment variables if available
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (envUrl && envKey) {
  initSupabase(envUrl, envKey);
}
