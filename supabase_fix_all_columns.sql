-- FIX MISSING COLUMNS IN SUPABASE
-- Run this entire script in the SQL Editor of your Supabase dashboard

-- 1. Fix 'orders' table
alter table "orders" add column if not exists "variety" text;
alter table "orders" add column if not exists "quantityKg" numeric;
alter table "orders" add column if not exists "roastType" text;
alter table "orders" add column if not exists "accumulatedRoastedKg" numeric default 0;

-- 2. Fix 'roasts' table
alter table "roasts" add column if not exists "greenQtyKg" numeric;
alter table "roasts" add column if not exists "roastedQtyKg" numeric;
alter table "roasts" add column if not exists "weightLossPercentage" numeric;

-- 3. Fix 'roastedStocks' table
alter table "roastedStocks" add column if not exists "totalQtyKg" numeric;
alter table "roastedStocks" add column if not exists "remainingQtyKg" numeric;
alter table "roastedStocks" add column if not exists "mermaGrams" numeric;

-- 4. Reload Schema Cache (Critical for PostgREST to see changes)
NOTIFY pgrst, 'reload schema';
