-- Fix Synchronization Issues for Sessions (Espresso, Filter, Cupping)

-- 1. Create tables if they don't exist (with proper columns)
create table if not exists "espressoSessions" (
  "id" text primary key,
  "date" text,
  "baristaName" text,
  "coffeeName" text,
  "shots" jsonb,
  "notes" text,
  "coffeeOrigin" text,
  "coffeeProcess" text,
  "roastDate" text,
  "deleted" boolean default false
);

create table if not exists "filterSessions" (
  "id" text primary key,
  "date" text,
  "brewerName" text,
  "coffeeName" text,
  "method" text,
  "pours" jsonb,
  "notes" text,
  "deleted" boolean default false
);

create table if not exists "cuppingSessions" (
  "id" text primary key,
  "roastStockId" text,
  "roastId" text,
  "coffeeName" text,
  "clientName" text,
  "tasterName" text,
  "date" text,
  "objective" text,
  "form" jsonb,
  "notes" text,
  "sessionType" text,
  "samples" jsonb,
  "deleted" boolean default false
);

-- 2. Add 'deleted' column if it's missing (safe migration)
alter table "espressoSessions" add column if not exists "deleted" boolean default false;
alter table "filterSessions" add column if not exists "deleted" boolean default false;
alter table "cuppingSessions" add column if not exists "deleted" boolean default false;

-- 3. Add missing data columns to espressoSessions
alter table "espressoSessions" add column if not exists "coffeeOrigin" text;
alter table "espressoSessions" add column if not exists "coffeeProcess" text;
alter table "espressoSessions" add column if not exists "roastDate" text;

-- 4. Enable Row Level Security (RLS)
alter table "espressoSessions" enable row level security;
alter table "filterSessions" enable row level security;
alter table "cuppingSessions" enable row level security;

-- 5. Create Policies (Allow public access for simplicity, or authenticated)
-- Adjust 'true' to 'auth.role() = "authenticated"' for stricter security
drop policy if exists "Public Access EspressoSessions" on "espressoSessions";
create policy "Public Access EspressoSessions" on "espressoSessions" for all using (true);

drop policy if exists "Public Access FilterSessions" on "filterSessions";
create policy "Public Access FilterSessions" on "filterSessions" for all using (true);

drop policy if exists "Public Access CuppingSessions" on "cuppingSessions";
create policy "Public Access CuppingSessions" on "cuppingSessions" for all using (true);

-- 6. DIAGNOSTIC & CLEANUP QUERIES

-- Identify potential ghost records (active locally but maybe should be deleted)
-- (You can run this SELECT to see what's there)
-- select * from "espressoSessions" where "deleted" is false;

-- FIX "Prueba 1" Persistence
-- Mark all sessions with 'prueba 1' in the name as deleted
update "espressoSessions" 
set "deleted" = true 
where "coffeeName" ilike '%prueba 1%';

-- CLEANUP HISTORY TABLE (Generic Log)
-- Remove entries related to 'prueba 1' from the history table
delete from "history" 
where "details"->>'title' ilike '%prueba 1%' 
   or "details"->>'subtitle' ilike '%prueba 1%';

-- Optional: Hard delete garbage data if you are sure
-- delete from "espressoSessions" where "coffeeName" ilike '%prueba 1%';

-- 7. Fix Filter Recipes table if needed
alter table "filterRecipes" add column if not exists "deleted" boolean default false;
drop policy if exists "Public Access FilterRecipes" on "filterRecipes";
create policy "Public Access FilterRecipes" on "filterRecipes" for all using (true);
