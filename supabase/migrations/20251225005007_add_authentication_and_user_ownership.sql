/*
  # Add Authentication and User Ownership to Patient Visits

  ## Overview
  This migration adds user authentication and ownership to the patient_visits table,
  ensuring that receptionists can only see and manage their own patient records.

  ## Changes Made

  ### 1. Schema Changes
  - Add `receptionist_id` column to `patient_visits` table
    - Type: uuid (references auth.users)
    - Required: NOT NULL for new records (existing records can be null during migration)
    - Purpose: Links each patient visit to the receptionist who created it

  ### 2. Security Updates (RLS Policies)
  - **Removed** old public policies that allowed unrestricted access
  - **Added** new secure policies:
    - `receptionist_insert_own`: Authenticated users can insert visits with their own ID
    - `receptionist_select_own`: Authenticated users can only view their own visits
    - `receptionist_delete_own`: Authenticated users can only delete their own visits

  ## Important Notes
  - All new patient visits MUST include a valid receptionist_id
  - Users can ONLY access their own patient records
  - No public access is allowed - authentication is required for all operations
*/

-- Add receptionist_id column to patient_visits table
ALTER TABLE patient_visits 
ADD COLUMN IF NOT EXISTS receptionist_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on receptionist_id for efficient filtering
CREATE INDEX IF NOT EXISTS patient_visits_receptionist_id_idx ON patient_visits(receptionist_id);

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public insert for patient visits" ON patient_visits;
DROP POLICY IF EXISTS "Allow public select for patient visits" ON patient_visits;

-- Create new secure policies for authenticated users

-- Policy: Authenticated users can insert visits with their own receptionist_id
CREATE POLICY "receptionist_insert_own"
  ON patient_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = receptionist_id);

-- Policy: Authenticated users can only view their own visits
CREATE POLICY "receptionist_select_own"
  ON patient_visits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receptionist_id);

-- Policy: Authenticated users can only delete their own visits
CREATE POLICY "receptionist_delete_own"
  ON patient_visits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = receptionist_id);