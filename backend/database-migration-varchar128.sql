-- Migration: Widen courses.code from VARCHAR(50) to VARCHAR(128)
-- Run this on RDS to fix catalog import failures
-- This migration is idempotent (safe to run multiple times)

-- Check current column type and alter if needed
DO $$
BEGIN
  -- Alter column if it exists and is VARCHAR(50)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'code'
    AND data_type = 'character varying'
    AND character_maximum_length = 50
  ) THEN
    ALTER TABLE courses ALTER COLUMN code TYPE VARCHAR(128);
    RAISE NOTICE 'courses.code widened from VARCHAR(50) to VARCHAR(128)';
  ELSE
    RAISE NOTICE 'courses.code is already VARCHAR(128) or different type';
  END IF;
END $$;
