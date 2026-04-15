-- ==============================================================================
-- SCRIPT DE SEGURIDAD: Políticas RLS Restrictivas para VarietalApp
-- ==============================================================================
-- EJECUTAR EN EL EDITOR SQL DE SUPABASE
--
-- Este script reemplaza las políticas permisivas "USING (true)" por políticas
-- que requieren autenticación. Solo usuarios autenticados pueden acceder a los datos.
--
-- IMPORTANTE: Ejecutar esto DESPUÉS de que todos los usuarios estén registrados
-- y tengan roles asignados en la tabla profiles.
-- ==============================================================================

-- ============================================================
-- PASO 1: Eliminar TODAS las políticas permisivas existentes
-- ============================================================

-- Tabla: profiles
DROP POLICY IF EXISTS "Anon Access Profiles" ON "profiles";
DROP POLICY IF EXISTS "Enable all access for profiles" ON "profiles";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "profiles";
DROP POLICY IF EXISTS "Enable update for admins" ON "profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "profiles";

-- Tabla: greenCoffees
DROP POLICY IF EXISTS "Anon Access GreenCoffees" ON "greenCoffees";
DROP POLICY IF EXISTS "Read access for authenticated" ON "greenCoffees";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "greenCoffees";

-- Tabla: roasts
DROP POLICY IF EXISTS "Anon Access Roasts" ON "roasts";
DROP POLICY IF EXISTS "Read access for authenticated" ON "roasts";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "roasts";

-- Tabla: orders
DROP POLICY IF EXISTS "Anon Access Orders" ON "orders";
DROP POLICY IF EXISTS "Read access for authenticated" ON "orders";
DROP POLICY IF EXISTS "Insert/Update access for editors/admins" ON "orders";
DROP POLICY IF EXISTS "Update access for editors/admins" ON "orders";
DROP POLICY IF EXISTS "Delete access for admins only" ON "orders";

-- Tabla: expenses
DROP POLICY IF EXISTS "Anon Access Expenses" ON "expenses";
DROP POLICY IF EXISTS "Read access for authenticated" ON "expenses";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "expenses";

-- Tabla: roastedStocks
DROP POLICY IF EXISTS "Anon Access RoastedStocks" ON "roastedStocks";
DROP POLICY IF EXISTS "Read access for authenticated" ON "roastedStocks";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "roastedStocks";

-- Tabla: retailBags
DROP POLICY IF EXISTS "Anon Access RetailBags" ON "retailBags";
DROP POLICY IF EXISTS "Read access for authenticated" ON "retailBags";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "retailBags";

-- Tabla: history
DROP POLICY IF EXISTS "Anon Access History" ON "history";
DROP POLICY IF EXISTS "Read access for authenticated" ON "history";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "history";

-- Tabla: productionInventory
DROP POLICY IF EXISTS "Anon Access Inventory" ON "productionInventory";
DROP POLICY IF EXISTS "Read access for authenticated" ON "productionInventory";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "productionInventory";

-- Tabla: cuppingSessions
DROP POLICY IF EXISTS "Anon Access CuppingSessions" ON "cuppingSessions";
DROP POLICY IF EXISTS "Read access for authenticated" ON "cuppingSessions";
DROP POLICY IF EXISTS "Write access for editors/admins" ON "cuppingSessions";

-- Tablas de ventas
DROP POLICY IF EXISTS "Public Access for salesCategories" ON "salesCategories";
DROP POLICY IF EXISTS "Public Access for salesProducts" ON "salesProducts";
DROP POLICY IF EXISTS "Public Access for salesOrders" ON "salesOrders";
DROP POLICY IF EXISTS "Public Access for cashRegisters" ON "cashRegisters";
DROP POLICY IF EXISTS "Public Access for salesCashSessions" ON "salesCashSessions";
DROP POLICY IF EXISTS "Public Access for scheduleEntries" ON "scheduleEntries";

-- Tabla: clients
DROP POLICY IF EXISTS "Enable all access for clients" ON "clients";

-- Tablas adicionales
DROP POLICY IF EXISTS "Public Access for espressoSessions" ON "espressoSessions";
DROP POLICY IF EXISTS "Public Access for filterSessions" ON "filterSessions";
DROP POLICY IF EXISTS "Public Access for filterRecipes" ON "filterRecipes";
DROP POLICY IF EXISTS "Public Access for guiasRemision" ON "guiasRemision";

-- ============================================================
-- PASO 2: Asegurar que RLS está habilitado en TODAS las tablas
-- ============================================================

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "greenCoffees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roastedStocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retailBags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "productionInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cuppingSessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesProducts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cashRegisters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesCashSessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scheduleEntries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;

-- Tablas opcionales (pueden no existir aún)
DO $$ BEGIN
  ALTER TABLE "espressoSessions" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "filterSessions" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "filterRecipes" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guiasRemision" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- PASO 3: Funciones auxiliares de verificación de roles
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "profiles"
    WHERE id = auth.uid() AND role = 'admin' AND "isActive" = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_editor_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "profiles"
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor') AND "isActive" = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_active_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "profiles"
    WHERE id = auth.uid() AND "isActive" = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- PASO 4: Crear políticas restrictivas por tabla
-- ============================================================

-- ---- PROFILES ----
-- Todos los usuarios autenticados activos pueden leer perfiles
CREATE POLICY "auth_read_profiles" ON "profiles"
  FOR SELECT TO authenticated USING (is_active_user());

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "auth_insert_own_profile" ON "profiles"
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Solo admins pueden actualizar perfiles (cambiar roles, activar/desactivar)
CREATE POLICY "admin_update_profiles" ON "profiles"
  FOR UPDATE TO authenticated USING (is_admin());

-- ---- DATOS OPERATIVOS (Lectura: usuarios activos / Escritura: editores+admins) ----

-- Macro para tablas con patrón estándar: lectura autenticada, escritura editor/admin
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'greenCoffees', 'roasts', 'roastedStocks', 'retailBags',
    'history', 'productionInventory', 'cuppingSessions',
    'salesCategories', 'salesProducts', 'salesOrders',
    'cashRegisters', 'salesCashSessions', 'scheduleEntries', 'clients'
  ]) LOOP
    EXECUTE format('CREATE POLICY "auth_read_%1$s" ON %I FOR SELECT TO authenticated USING (is_active_user())', tbl, tbl);
    EXECUTE format('CREATE POLICY "editor_write_%1$s" ON %I FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "editor_update_%1$s" ON %I FOR UPDATE TO authenticated USING (is_editor_or_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "editor_delete_%1$s" ON %I FOR DELETE TO authenticated USING (is_editor_or_admin())', tbl, tbl);
  END LOOP;
END $$;

-- ---- ORDERS (regla especial: solo admins borran) ----
CREATE POLICY "auth_read_orders" ON "orders"
  FOR SELECT TO authenticated USING (is_active_user());
  
CREATE POLICY "editor_insert_orders" ON "orders"
  FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin());

CREATE POLICY "editor_update_orders" ON "orders"
  FOR UPDATE TO authenticated USING (is_editor_or_admin());

CREATE POLICY "admin_delete_orders" ON "orders"
  FOR DELETE TO authenticated USING (is_admin());

-- ---- EXPENSES (regla especial: solo admins borran) ----
CREATE POLICY "auth_read_expenses" ON "expenses"
  FOR SELECT TO authenticated USING (is_active_user());
  
CREATE POLICY "editor_insert_expenses" ON "expenses"
  FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin());

CREATE POLICY "editor_update_expenses" ON "expenses"
  FOR UPDATE TO authenticated USING (is_editor_or_admin());

CREATE POLICY "admin_delete_expenses" ON "expenses"
  FOR DELETE TO authenticated USING (is_admin());

-- ---- TABLAS OPCIONALES (espressoSessions, filterSessions, filterRecipes, guiasRemision) ----
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'espressoSessions', 'filterSessions', 'filterRecipes', 'guiasRemision'
  ]) LOOP
    BEGIN
      EXECUTE format('CREATE POLICY "auth_read_%1$s" ON %I FOR SELECT TO authenticated USING (is_active_user())', tbl, tbl);
      EXECUTE format('CREATE POLICY "editor_write_%1$s" ON %I FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin())', tbl, tbl);
      EXECUTE format('CREATE POLICY "editor_update_%1$s" ON %I FOR UPDATE TO authenticated USING (is_editor_or_admin())', tbl, tbl);
      EXECUTE format('CREATE POLICY "editor_delete_%1$s" ON %I FOR DELETE TO authenticated USING (is_editor_or_admin())', tbl, tbl);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Tabla % no existe, saltando...', tbl;
    END;
  END LOOP;
END $$;

-- ============================================================
-- PASO 5: Revocar acceso anónimo explícitamente
-- ============================================================
-- La clave anon_key ya no debería poder leer/escribir datos operativos
-- Las políticas creadas arriba solo permiten acceso al rol 'authenticated'

-- NOTA: NO ejecutar REVOKE ALL si planeas usar funciones de Supabase que
-- dependen del acceso anónimo (como public signup). Los RLS policies
-- ya restringen el acceso correctamente.

-- ============================================================
-- PASO 6: Verificación
-- ============================================================
-- Ejecuta estas queries después del script para verificar:
--
-- 1. Ver todas las políticas activas:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--    FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
--
-- 2. Verificar que no quedan políticas "USING (true)":
--    SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname = 'public' AND qual = 'true';
--    (Resultado esperado: 0 filas)
--
-- 3. Test de acceso anónimo (debería fallar):
--    -- Desde la app sin login, intenta: supabase.from('clients').select('*')
--    -- Resultado esperado: Error 401 o rows vacías
