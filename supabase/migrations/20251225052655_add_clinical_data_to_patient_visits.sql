/*
  # Add Clinical Data Fields to Patient Visits

  ## Overview
  This migration adds new JSONB fields to the patient_visits table to store
  comprehensive clinical data including vitals, tests, and prescribed medicines.

  ## Changes Made

  ### 1. Schema Updates
  - Add `vitals_data` (jsonb) - Stores vital signs data (BP, temp, pulse, etc.)
  - Add `tests_data` (jsonb) - Stores tests and investigation results
  - Add `medicines_data` (jsonb) - Stores prescribed medicines information

  ### 2. Default Values
  - All new fields default to '{}' (empty JSON object) for vitals
  - All new fields default to '[]' (empty JSON array) for tests and medicines

  ## Important Notes
  - vitals_data structure: { bloodPressureSystolic, bloodPressureDiastolic, temperature, pulseRate, etc. }
  - tests_data structure: [{ testName, result, notes }]
  - medicines_data structure: [{ name, dosage, frequency, duration }]
  - Existing visits will have empty values for these fields
*/

-- Add vitals_data column to patient_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_visits' AND column_name = 'vitals_data'
  ) THEN
    ALTER TABLE patient_visits ADD COLUMN vitals_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add tests_data column to patient_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_visits' AND column_name = 'tests_data'
  ) THEN
    ALTER TABLE patient_visits ADD COLUMN tests_data jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add medicines_data column to patient_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_visits' AND column_name = 'medicines_data'
  ) THEN
    ALTER TABLE patient_visits ADD COLUMN medicines_data jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
