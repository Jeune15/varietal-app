-- Add new columns to cuppingSessions table to support free cupping sessions
ALTER TABLE "cuppingSessions" 
ADD COLUMN IF NOT EXISTS "notes" text,
ADD COLUMN IF NOT EXISTS "sessionType" text DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS "samples" jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies if necessary (assuming public access or existing policies cover update)
-- Ensure the columns are accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "cuppingSessions" TO anon, authenticated, service_role;
