-- Tabla de Clientes para VarietalApp
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de clientes
CREATE TABLE IF NOT EXISTS "clients" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "district" TEXT,
  "address" TEXT,
  "reference" TEXT,
  "phone" TEXT,
  "clientType" TEXT DEFAULT 'natural',
  "observations" TEXT,
  "createdAt" TEXT
);

-- 2. Habilitar Row Level Security
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for clients" ON "clients"
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "clients";

-- 4. Agregar campo clientId a salesOrders (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesOrders' AND column_name = 'clientId'
  ) THEN
    ALTER TABLE "salesOrders" ADD COLUMN "clientId" TEXT;
  END IF;
END $$;
