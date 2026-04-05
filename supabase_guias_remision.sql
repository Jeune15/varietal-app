-- Create guiasRemision table for Guía de Remisión persistence
CREATE TABLE IF NOT EXISTS "guiasRemision" (
  id TEXT PRIMARY KEY,
  "createdAt" TEXT NOT NULL,
  "fechaEmision" TEXT,
  "fechaInicio" TEXT,
  "fechaFin" TEXT,
  emisor TEXT,
  "rucEmisor" TEXT,
  transportista TEXT,
  "ceDniTransportista" TEXT,
  placa TEXT,
  "puntoPartida" TEXT,
  destinatario TEXT,
  "rucDestinatario" TEXT,
  motivo TEXT,
  "direccionDestino" TEXT,
  descripcion TEXT,
  productos JSONB DEFAULT '[]'::jsonb,
  "numeroGuia" TEXT
);

-- Enable RLS
ALTER TABLE "guiasRemision" ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (same pattern as other tables)
CREATE POLICY "Allow anon select on guiasRemision" ON "guiasRemision" FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert on guiasRemision" ON "guiasRemision" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update on guiasRemision" ON "guiasRemision" FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete on guiasRemision" ON "guiasRemision" FOR DELETE TO anon USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "guiasRemision";
