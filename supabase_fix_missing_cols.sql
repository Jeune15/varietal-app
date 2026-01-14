-- Add missing 'profile' column to roasts table
alter table "roasts" add column if not exists "profile" text;

-- Add missing 'variety' column to roastedStocks table
alter table "roastedStocks" add column if not exists "variety" text;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
