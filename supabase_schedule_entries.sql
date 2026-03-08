-- Create scheduleEntries table (quoted to preserve camelCase to match Dexie/codebase)
CREATE TABLE IF NOT EXISTS "scheduleEntries" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE "scheduleEntries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON "scheduleEntries" FOR ALL USING (true) WITH CHECK (true);

-- Realtime
alter publication supabase_realtime add table "scheduleEntries";
