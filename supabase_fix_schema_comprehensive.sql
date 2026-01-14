
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Green Coffees
create table if not exists "greenCoffees" (
  "id" text primary key,
  "clientName" text,
  "variety" text,
  "origin" text,
  "entryDate" text,
  "quantityKg" numeric
);

-- 2. Roasts
create table if not exists "roasts" (
  "id" text primary key,
  "greenCoffeeId" text,
  "orderId" text,
  "clientName" text,
  "greenQtyKg" numeric,
  "roastedQtyKg" numeric,
  "weightLossPercentage" numeric,
  "profile" text,
  "roastDate" text
);

-- 3. Orders
create table if not exists "orders" (
  "id" text primary key,
  "clientName" text,
  "variety" text,
  "type" text,
  "quantityKg" numeric,
  "entryDate" text,
  "dueDate" text,
  "status" text,
  "progress" numeric,
  "relatedRoastIds" text[], -- Array of strings
  "requiresRoasting" boolean,
  "roastType" text,
  "accumulatedRoastedKg" numeric,
  "accumulatedGreenUsedKg" numeric,
  "packagingType" text,
  "bagsUsed" numeric,
  "sortingLossKg" numeric,
  "fulfilledFromStockId" text,
  "shippedDate" text,
  "shippingCost" numeric,
  "invoicedDate" text
);

-- 4. Roasted Stocks
create table if not exists "roastedStocks" (
  "id" text primary key,
  "roastId" text,
  "variety" text,
  "clientName" text,
  "totalQtyKg" numeric,
  "remainingQtyKg" numeric,
  "isSelected" boolean,
  "mermaGrams" numeric
);

-- 5. Retail Bags
create table if not exists "retailBags" (
  "id" text primary key,
  "coffeeName" text,
  "type" text,
  "quantity" numeric
);

-- 6. History (Production Activity)
create table if not exists "history" (
  "id" text primary key,
  "type" text,
  "date" text,
  "details" jsonb
);

-- 7. Expenses
create table if not exists "expenses" (
  "id" text primary key,
  "reason" text,
  "amount" numeric,
  "documentType" text,
  "documentId" text,
  "date" text,
  "status" text,
  "relatedOrderId" text
);

-- 8. Production Inventory
create table if not exists "productionInventory" (
  "id" text primary key,
  "name" text,
  "type" text,
  "quantity" numeric,
  "minThreshold" numeric,
  "format" text
);

-- 9. Profiles
create table if not exists "profiles" (
  "id" uuid primary key references auth.users(id),
  "email" text,
  "role" text,
  "isActive" boolean default true
);

-- Add missing columns safely (if table exists but column doesn't)

-- Orders
alter table "orders" add column if not exists "accumulatedGreenUsedKg" numeric default 0;
alter table "orders" add column if not exists "relatedRoastIds" text[];
alter table "orders" add column if not exists "sortingLossKg" numeric;
alter table "orders" add column if not exists "fulfilledFromStockId" text;

-- Roasts
alter table "roasts" add column if not exists "orderId" text;

-- Roasted Stocks
alter table "roastedStocks" add column if not exists "mermaGrams" numeric default 0;

-- Expenses
alter table "expenses" add column if not exists "relatedOrderId" text;

-- Enable RLS (Row Level Security) on all tables
alter table "greenCoffees" enable row level security;
alter table "roasts" enable row level security;
alter table "orders" enable row level security;
alter table "roastedStocks" enable row level security;
alter table "retailBags" enable row level security;
alter table "history" enable row level security;
alter table "expenses" enable row level security;
alter table "productionInventory" enable row level security;
alter table "profiles" enable row level security;

-- Create Policies (Public Access for now, or authenticated)
-- For simplicity in this dev phase, allowing anon access if not already present

drop policy if exists "Public Access GreenCoffees" on "greenCoffees";
create policy "Public Access GreenCoffees" on "greenCoffees" for all using (true);

drop policy if exists "Public Access Roasts" on "roasts";
create policy "Public Access Roasts" on "roasts" for all using (true);

drop policy if exists "Public Access Orders" on "orders";
create policy "Public Access Orders" on "orders" for all using (true);

drop policy if exists "Public Access RoastedStocks" on "roastedStocks";
create policy "Public Access RoastedStocks" on "roastedStocks" for all using (true);

drop policy if exists "Public Access RetailBags" on "retailBags";
create policy "Public Access RetailBags" on "retailBags" for all using (true);

drop policy if exists "Public Access History" on "history";
create policy "Public Access History" on "history" for all using (true);

drop policy if exists "Public Access Expenses" on "expenses";
create policy "Public Access Expenses" on "expenses" for all using (true);

drop policy if exists "Public Access ProductionInventory" on "productionInventory";
create policy "Public Access ProductionInventory" on "productionInventory" for all using (true);

drop policy if exists "Public Access Profiles" on "profiles";
create policy "Public Access Profiles" on "profiles" for all using (true);

-- Notify Schema Reload
NOTIFY pgrst, 'reload schema';
