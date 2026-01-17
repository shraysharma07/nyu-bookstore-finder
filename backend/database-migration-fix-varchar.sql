-- Migration: Fix VARCHAR(100) columns that are too small for catalog data
-- This widens columns that might contain long course/subject names
-- Run this on RDS to fix catalog import failures
-- This migration is idempotent (safe to run multiple times)

DO $$
BEGIN
  -- Widen subjects.name from VARCHAR(100) to VARCHAR(255)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subjects' 
    AND column_name = 'name'
    AND data_type = 'character varying'
    AND character_maximum_length = 100
  ) THEN
    ALTER TABLE subjects ALTER COLUMN name TYPE VARCHAR(255);
    RAISE NOTICE 'subjects.name widened from VARCHAR(100) to VARCHAR(255)';
  ELSE
    RAISE NOTICE 'subjects.name is already VARCHAR(255) or different type';
  END IF;

  -- Widen dorms.name from VARCHAR(100) to VARCHAR(255) (if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dorms' 
    AND column_name = 'name'
    AND data_type = 'character varying'
    AND character_maximum_length = 100
  ) THEN
    ALTER TABLE dorms ALTER COLUMN name TYPE VARCHAR(255);
    RAISE NOTICE 'dorms.name widened from VARCHAR(100) to VARCHAR(255)';
  ELSE
    RAISE NOTICE 'dorms.name is already VARCHAR(255) or different type';
  END IF;

  -- Ensure courses.code is VARCHAR(128) (from previous migration)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'code'
    AND data_type = 'character varying'
    AND character_maximum_length < 128
  ) THEN
    ALTER TABLE courses ALTER COLUMN code TYPE VARCHAR(128);
    RAISE NOTICE 'courses.code widened to VARCHAR(128)';
  ELSE
    RAISE NOTICE 'courses.code is already VARCHAR(128) or larger';
  END IF;

  -- Ensure courses.name is VARCHAR(255) or larger
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'name'
    AND data_type = 'character varying'
    AND character_maximum_length < 255
  ) THEN
    ALTER TABLE courses ALTER COLUMN name TYPE VARCHAR(500);
    RAISE NOTICE 'courses.name widened to VARCHAR(500)';
  ELSE
    RAISE NOTICE 'courses.name is already VARCHAR(255) or larger';
  END IF;
END $$;
