-- Fix for Orders table schema
-- Run this in your Supabase SQL Editor

-- 1. Ensure quantityKg exists (fixing the specific error)
alter table "orders" add column if not exists "quantityKg" numeric;

-- 2. Add new columns required for the Roasting logic
alter table "orders" add column if not exists "roastType" text;
alter table "orders" add column if not exists "accumulatedRoastedKg" numeric default 0;

-- 3. Refresh the schema cache
notify pgrst, 'reload schema';
