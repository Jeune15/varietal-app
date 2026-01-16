
-- Run this in your Supabase SQL Editor to fix the sync error
alter table "history" add column if not exists "details" jsonb;
