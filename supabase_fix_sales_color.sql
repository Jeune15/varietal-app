-- Fix: Add missing 'color' column to salesCategories table
-- This column is required for category colors to sync between devices

ALTER TABLE "salesCategories" ADD COLUMN IF NOT EXISTS color TEXT;
