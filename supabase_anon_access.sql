-- ==============================================================================
-- SCRIPT PARA HABILITAR ACCESO ANÓNIMO (SIN LOGIN)
-- ==============================================================================
-- Ejecuta este script en el Editor SQL de Supabase para permitir que la aplicación
-- funcione completamente sin necesidad de iniciar sesión (modo "local" sincronizado).
-- ==============================================================================

-- 1. Habilitar RLS (si no lo está ya) - Es buena práctica mantenerlo habilitado
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "greenCoffees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roastedStocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retailBags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "productionInventory" ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para 'anon' si las hubiera (para evitar duplicados)
DROP POLICY IF EXISTS "Anon Access Profiles" ON "profiles";
DROP POLICY IF EXISTS "Anon Access GreenCoffees" ON "greenCoffees";
DROP POLICY IF EXISTS "Anon Access Roasts" ON "roasts";
DROP POLICY IF EXISTS "Anon Access Orders" ON "orders";
DROP POLICY IF EXISTS "Anon Access Expenses" ON "expenses";
DROP POLICY IF EXISTS "Anon Access RoastedStocks" ON "roastedStocks";
DROP POLICY IF EXISTS "Anon Access RetailBags" ON "retailBags";
DROP POLICY IF EXISTS "Anon Access History" ON "history";
DROP POLICY IF EXISTS "Anon Access Inventory" ON "productionInventory";

-- 3. Crear políticas permisivas para el rol 'anon' (usuario no logueado)
-- Esto permite SELECT, INSERT, UPDATE, DELETE a cualquier usuario que tenga la ANON KEY

-- Profiles
CREATE POLICY "Anon Access Profiles" ON "profiles"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- GreenCoffees
CREATE POLICY "Anon Access GreenCoffees" ON "greenCoffees"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Roasts
CREATE POLICY "Anon Access Roasts" ON "roasts"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Orders
CREATE POLICY "Anon Access Orders" ON "orders"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Expenses
CREATE POLICY "Anon Access Expenses" ON "expenses"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- RoastedStocks
CREATE POLICY "Anon Access RoastedStocks" ON "roastedStocks"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- RetailBags
CREATE POLICY "Anon Access RetailBags" ON "retailBags"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- History
CREATE POLICY "Anon Access History" ON "history"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- ProductionInventory
CREATE POLICY "Anon Access Inventory" ON "productionInventory"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- 4. (Opcional) Si también quieres permitir acceso total a usuarios autenticados sin restricciones de rol
-- Puedes repetir estas políticas para el rol 'authenticated' si fuera necesario, 
-- pero las políticas existentes basadas en roles deberían funcionar bien para usuarios logueados.
