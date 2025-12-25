/*
  # Extend Drug Formulary Schema for Comprehensive Medication Catalog

  ## Overview
  This migration extends the existing drug_formulary table to support:
  - Route of administration (multiple options per medication)
  - Default dosage forms and strengths for autocomplete
  - Combination medication tracking with component drugs
  - Full-text search capability using trigram matching

  ## Changes Made

  ### 1. New Columns Added to drug_formulary
  - `route_of_administration` (text[]) - Array of administration routes (Oral, IV, Topical, etc.)
  - `default_dosage_forms` (text[]) - Array of common dosage forms (Tablet, Capsule, etc.)
  - `default_strengths` (text[]) - Array of common strength options
  - `is_combination` (boolean) - Flag indicating if this is a combination drug
  - `component_medications` (text[]) - Array of component drug names for combinations
  - `is_active` (boolean) - Soft delete flag for deactivating medications

  ### 2. Indexes Added
  - GIN index on medication_name using pg_trgm for fuzzy text search
  - Index on is_active for filtering active medications

  ### 3. Search Function
  - search_formulary_medications() function for efficient autocomplete

  ## Important Notes
  - Enables pg_trgm extension for trigram-based text similarity
  - All new columns have sensible defaults
  - Backward compatible with existing data
*/

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to drug_formulary
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'route_of_administration'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN route_of_administration text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'default_dosage_forms'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN default_dosage_forms text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'default_strengths'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN default_strengths text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'is_combination'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN is_combination boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'component_medications'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN component_medications text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drug_formulary' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE drug_formulary ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create GIN index for trigram-based fuzzy search on medication_name
CREATE INDEX IF NOT EXISTS drug_formulary_medication_name_trgm_idx 
ON drug_formulary USING GIN (medication_name gin_trgm_ops);

-- Create index on generic_name for search
CREATE INDEX IF NOT EXISTS drug_formulary_generic_name_trgm_idx 
ON drug_formulary USING GIN (generic_name gin_trgm_ops);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS drug_formulary_is_active_idx 
ON drug_formulary(is_active) WHERE is_active = true;

-- Create index on is_combination for filtering combination drugs
CREATE INDEX IF NOT EXISTS drug_formulary_is_combination_idx 
ON drug_formulary(is_combination) WHERE is_combination = true;

-- Drop the unique constraint on rxnorm_code if it exists (to allow null values)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'drug_formulary_rxnorm_code_key'
  ) THEN
    ALTER TABLE drug_formulary DROP CONSTRAINT drug_formulary_rxnorm_code_key;
  END IF;
END $$;

-- Add unique constraint on medication_name instead
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'drug_formulary_medication_name_key'
  ) THEN
    ALTER TABLE drug_formulary ADD CONSTRAINT drug_formulary_medication_name_key UNIQUE (medication_name);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    NULL;
END $$;

-- Create or replace function for searching medications
CREATE OR REPLACE FUNCTION search_formulary_medications(
  search_term text,
  limit_count int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  medication_name text,
  generic_name text,
  therapeutic_class text,
  tier text,
  formulary_status text,
  route_of_administration text[],
  default_dosage_forms text[],
  default_strengths text[],
  is_combination boolean,
  component_medications text[],
  requires_prior_auth boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.id,
    df.medication_name,
    df.generic_name,
    df.therapeutic_class,
    df.tier,
    df.formulary_status,
    df.route_of_administration,
    df.default_dosage_forms,
    df.default_strengths,
    df.is_combination,
    df.component_medications,
    df.requires_prior_auth
  FROM drug_formulary df
  WHERE df.is_active = true
    AND (
      df.medication_name ILIKE '%' || search_term || '%'
      OR df.generic_name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE 
      WHEN df.medication_name ILIKE search_term || '%' THEN 0
      WHEN df.medication_name ILIKE '%' || search_term || '%' THEN 1
      ELSE 2
    END,
    df.medication_name
  LIMIT limit_count;
END;
$$;
