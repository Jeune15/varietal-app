-- Enable RLS (Row Level Security) for all tables is recommended, 
-- but we must first create the tables.

-- Helper to ensure we use the same types as the frontend
-- We use quoted identifiers to preserve camelCase which matches the TypeScript interfaces

-- 1. PROFILES (Users)
create table if not exists "profiles" (
  "id" uuid references auth.users on delete cascade primary key,
  "email" text,
  "role" text default 'viewer', -- 'admin', 'editor', 'viewer'
  "isActive" boolean default true
);
alter table "profiles" enable row level security;

-- 2. GREEN COFFEES
create table if not exists "greenCoffees" (
  "id" text primary key,
  "clientName" text,
  "variety" text,
  "origin" text,
  "entryDate" text,
  "quantityKg" numeric
);
alter table "greenCoffees" enable row level security;

-- 3. ROASTS
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

-- 4. ORDERS
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
  "packagingType" text,
  "bagsUsed" numeric,
  "sortingLossKg" numeric,
  "fulfilledFromStockId" text,
  "shippedDate" text,
  "shippingCost" numeric,
  "invoicedDate" text
);
alter table "orders" enable row level security;

-- 5. EXPENSES
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

-- 6. ROASTED STOCKS
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

-- 7. RETAIL BAGS
create table if not exists "retailBags" (
  "id" text primary key,
  "coffeeName" text,
  "type" text,
  "quantity" numeric
);
alter table "retailBags" enable row level security;

-- 8. HISTORY (Production Activity)
create table if not exists "history" (
  "id" text primary key,
  "type" text,
  "date" text,
  "details" jsonb -- Store complex object as JSON
);
alter table "history" enable row level security;

-- 9. PRODUCTION INVENTORY
create table if not exists "productionInventory" (
  "id" text primary key,
  "name" text,
  "type" text,
  "quantity" numeric,
  "minThreshold" numeric,
  "format" text
);
alter table "productionInventory" enable row level security;


-- POLICIES

-- Helper function to check role
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

create or replace function is_editor_or_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and (role = 'admin' or role = 'editor')
  );
$$ language sql security definer;

-- PROFILES Policies
-- Everyone can read profiles (needed for admin UI, or self check)
drop policy if exists "Enable read access for authenticated users" on "profiles";
create policy "Enable read access for authenticated users" on "profiles"
  for select using (auth.role() = 'authenticated');

-- Only admins can update profiles (promote/demote/deactivate)
drop policy if exists "Enable update for admins" on "profiles";
create policy "Enable update for admins" on "profiles"
  for update using (is_admin());

-- Users can insert their own profile (or handled by trigger)
drop policy if exists "Enable insert for authenticated users" on "profiles";
create policy "Enable insert for authenticated users" on "profiles"
  for insert with check (auth.uid() = id);

-- OTHER TABLES Policies
-- READ: All authenticated users (Viewers included)
drop policy if exists "Read access for authenticated" on "greenCoffees";
create policy "Read access for authenticated" on "greenCoffees" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "roasts";
create policy "Read access for authenticated" on "roasts" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "orders";
create policy "Read access for authenticated" on "orders" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "expenses";
create policy "Read access for authenticated" on "expenses" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "roastedStocks";
create policy "Read access for authenticated" on "roastedStocks" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "retailBags";
create policy "Read access for authenticated" on "retailBags" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "history";
create policy "Read access for authenticated" on "history" for select using (auth.role() = 'authenticated');

drop policy if exists "Read access for authenticated" on "productionInventory";
create policy "Read access for authenticated" on "productionInventory" for select using (auth.role() = 'authenticated');

-- WRITE (Insert/Update): Admins and Editors
drop policy if exists "Write access for editors/admins" on "greenCoffees";
create policy "Write access for editors/admins" on "greenCoffees" for all using (is_editor_or_admin());

drop policy if exists "Write access for editors/admins" on "roasts";
create policy "Write access for editors/admins" on "roasts" for all using (is_editor_or_admin());

-- Special case for Orders: Delete is Admin only, but Insert/Update is Editor/Admin
drop policy if exists "Insert/Update access for editors/admins" on "orders";
create policy "Insert/Update access for editors/admins" on "orders" for insert with check (is_editor_or_admin());

drop policy if exists "Update access for editors/admins" on "orders";
create policy "Update access for editors/admins" on "orders" for update using (is_editor_or_admin());

drop policy if exists "Delete access for admins only" on "orders";
create policy "Delete access for admins only" on "orders" for delete using (is_admin());

drop policy if exists "Write access for editors/admins" on "expenses";
create policy "Write access for editors/admins" on "expenses" for all using (is_editor_or_admin());

drop policy if exists "Write access for editors/admins" on "roastedStocks";
create policy "Write access for editors/admins" on "roastedStocks" for all using (is_editor_or_admin());

drop policy if exists "Write access for editors/admins" on "retailBags";
create policy "Write access for editors/admins" on "retailBags" for all using (is_editor_or_admin());

drop policy if exists "Write access for editors/admins" on "history";
create policy "Write access for editors/admins" on "history" for all using (is_editor_or_admin());

drop policy if exists "Write access for editors/admins" on "productionInventory";
create policy "Write access for editors/admins" on "productionInventory" for all using (is_editor_or_admin());

-- TRIGGER for new users
-- Automatically create a profile entry when a new user signs up via Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles ("id", "email", "role", "isActive")
  values (new.id, new.email, 'viewer', true);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on rerun
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- BACKFILL EXISTING USERS
-- This is critical if users signed up before the tables were created
insert into public.profiles ("id", "email", "role", "isActive")
select id, email, 'viewer', true
from auth.users
where id not in (select id from public.profiles);
