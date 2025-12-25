/*
  # Add updated_at Column to Patient Visits Table

  ## Overview
  This migration adds the `updated_at` column to the `patient_visits` table
  to track when records are last modified.

  ## Changes

  1. Schema Changes
    - Add `updated_at` column to `patient_visits` table
    - Column type: timestamptz
    - Default value: now()

  2. Data Backfill
    - Set existing records' `updated_at` to their `created_at` value

  ## Notes
  - This column is required by the `update_patient_visit` RPC function
  - Provides audit trail for when patient visit records are edited
*/

-- Add updated_at column to patient_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_visits' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE patient_visits ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Backfill existing records to set updated_at equal to created_at
UPDATE patient_visits
SET updated_at = created_at
WHERE updated_at IS NULL;