-- Run this in your Supabase SQL Editor to setup the database schema and fix sync errors

-- 1. Green Coffees
create table if not exists "greenCoffees" (
  "id" text primary key,
  "clientName" text,
  "variety" text,
  "origin" text,
  "entryDate" text,
  "quantityKg" numeric
);
alter table "greenCoffees" enable row level security;
create policy "Enable all access for greenCoffees" on "greenCoffees" for all using (true) with check (true);

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
alter table "roasts" enable row level security;
create policy "Enable all access for roasts" on "roasts" for all using (true) with check (true);

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
  "relatedRoastIds" jsonb,
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
alter table "orders" enable row level security;
create policy "Enable all access for orders" on "orders" for all using (true) with check (true);

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
alter table "roastedStocks" enable row level security;
create policy "Enable all access for roastedStocks" on "roastedStocks" for all using (true) with check (true);

-- 5. Retail Bags
create table if not exists "retailBags" (
  "id" text primary key,
  "coffeeName" text,
  "type" text,
  "quantity" numeric
);
alter table "retailBags" enable row level security;
create policy "Enable all access for retailBags" on "retailBags" for all using (true) with check (true);

-- 6. History (Production Activity)
create table if not exists "history" (
  "id" text primary key,
  "type" text,
  "date" text,
  "details" jsonb
);
alter table "history" enable row level security;
create policy "Enable all access for history" on "history" for all using (true) with check (true);

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
alter table "expenses" enable row level security;
create policy "Enable all access for expenses" on "expenses" for all using (true) with check (true);

-- 8. Production Inventory
create table if not exists "productionInventory" (
  "id" text primary key,
  "name" text,
  "type" text,
  "quantity" numeric,
  "minThreshold" numeric,
  "format" text
);
alter table "productionInventory" enable row level security;
create policy "Enable all access for productionInventory" on "productionInventory" for all using (true) with check (true);

-- 9. Profiles
create table if not exists "profiles" (
  "id" text primary key,
  "email" text,
  "role" text,
  "isActive" boolean
);
alter table "profiles" enable row level security;
create policy "Enable all access for profiles" on "profiles" for all using (true) with check (true);
