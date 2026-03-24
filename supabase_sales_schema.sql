-- Script to add Sales System tables and missing columns

-- 1. Create Sales Categories Table
CREATE TABLE IF NOT EXISTS "salesCategories" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- 2. Create Sales Products Table
CREATE TABLE IF NOT EXISTS "salesProducts" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  price NUMERIC NOT NULL,
  "isFavorite" BOOLEAN DEFAULT FALSE,
  "createdAt" TEXT NOT NULL
);

-- 3. Create Sales Orders Table
CREATE TABLE IF NOT EXISTS "salesOrders" (
  id TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "completedAt" TEXT,
  items JSONB NOT NULL,
  "orderName" TEXT,
  source TEXT
);

-- 4. Create Cash Registers Table
CREATE TABLE IF NOT EXISTS "cashRegisters" (
  id TEXT PRIMARY KEY,
  "monthStart" TEXT NOT NULL,
  "monthEnd" TEXT NOT NULL,
  "isOpen" BOOLEAN NOT NULL DEFAULT TRUE,
  "openingAmount" NUMERIC NOT NULL DEFAULT 0,
  "totalIncome" NUMERIC NOT NULL DEFAULT 0,
  "totalExpense" NUMERIC NOT NULL DEFAULT 0,
  "closedAt" TEXT,
  entries JSONB
);

-- 5. Fix Missing Columns in existing tables

-- Roasted Stocks
ALTER TABLE "roastedStocks" ADD COLUMN IF NOT EXISTS "roastDate" TEXT;
ALTER TABLE "roastedStocks" ADD COLUMN IF NOT EXISTS "roastType" TEXT;
ALTER TABLE "roastedStocks" ADD COLUMN IF NOT EXISTS "roastCode" TEXT;

-- Roasts
ALTER TABLE roasts ADD COLUMN IF NOT EXISTS "roastCode" TEXT;
ALTER TABLE roasts ADD COLUMN IF NOT EXISTS "greenCoffeeName" TEXT;

-- Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "serviceRoastedQtyKg" NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "fulfilledKg" NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "shippedKg" NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deliveryType" TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deliveryAddressDetail" TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "nextActivity" TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "completedActivities" JSONB;

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "paidBy" TEXT;

-- Retail Bags
ALTER TABLE "retailBags" ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE "retailBags" ADD COLUMN IF NOT EXISTS "roastDate" TEXT;
ALTER TABLE "retailBags" ADD COLUMN IF NOT EXISTS "roastId" TEXT;

-- Cupping Sessions
ALTER TABLE "cuppingSessions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "cuppingSessions" ADD COLUMN IF NOT EXISTS "sessionType" TEXT;
ALTER TABLE "cuppingSessions" ADD COLUMN IF NOT EXISTS "samples" JSONB;

-- Sales Orders (new columns for integration)
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "deliveredAt" TEXT;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "despachadoAt" TEXT;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "invoicedAt" TEXT;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "usedRoastedCoffee" JSONB;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "usedRetailBags" JSONB;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "usedUtilityBags" JSONB;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "shippingCost" NUMERIC;
ALTER TABLE "salesOrders" ADD COLUMN IF NOT EXISTS "shippingPaidBy" TEXT;

-- Fix Missing Columns in existing tables
ALTER TABLE "salesCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesProducts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cashRegisters" ENABLE ROW LEVEL SECURITY;

-- Allow public access to all tables (Anon Access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'salesCategories' AND policyname = 'Public Access for salesCategories'
    ) THEN
        CREATE POLICY "Public Access for salesCategories" ON "salesCategories" FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'salesProducts' AND policyname = 'Public Access for salesProducts'
    ) THEN
        CREATE POLICY "Public Access for salesProducts" ON "salesProducts" FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'salesOrders' AND policyname = 'Public Access for salesOrders'
    ) THEN
        CREATE POLICY "Public Access for salesOrders" ON "salesOrders" FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'cashRegisters' AND policyname = 'Public Access for cashRegisters'
    ) THEN
        CREATE POLICY "Public Access for cashRegisters" ON "cashRegisters" FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. Setup Realtime Replication for new tables
-- Safe addition to supabase_realtime publication using DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'salesCategories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "salesCategories";
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'salesProducts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "salesProducts";
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'salesOrders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "salesOrders";
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cashRegisters'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "cashRegisters";
    END IF;
END $$;
