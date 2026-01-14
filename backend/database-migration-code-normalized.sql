-- Migration: Add code_normalized column to courses table
-- Run this on RDS to enable normalized course code matching
-- This migration is idempotent (safe to run multiple times)

-- Add code_normalized column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'code_normalized'
  ) THEN
    ALTER TABLE courses ADD COLUMN code_normalized VARCHAR(128);
    RAISE NOTICE 'Added code_normalized column to courses table';
  ELSE
    RAISE NOTICE 'code_normalized column already exists';
  END IF;
END $$;

-- Backfill code_normalized for existing rows
UPDATE courses 
SET code_normalized = UPPER(TRIM(REPLACE(REPLACE(code, '.', ' '), '-', ' ')))
WHERE code_normalized IS NULL;

-- Collapse multiple spaces to single space in code_normalized
UPDATE courses 
SET code_normalized = REGEXP_REPLACE(code_normalized, '\s+', ' ', 'g')
WHERE code_normalized IS NOT NULL;

-- Create index on code_normalized for fast lookups
CREATE INDEX IF NOT EXISTS idx_courses_code_normalized ON courses(code_normalized);

-- Make code_normalized NOT NULL for new rows (but keep existing NULLs for now)
-- We'll update this constraint after backfill is complete
-- ALTER TABLE courses ALTER COLUMN code_normalized SET NOT NULL;
