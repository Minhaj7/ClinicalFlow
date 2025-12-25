/*
  # Add Facility Type to Profiles

  1. Changes
    - Add `facility_type` column to `profiles` table
      - Accepts values: 'Hospital', 'Clinic', 'RHC' (Rural Health Center)
      - NOT NULL constraint with default value
    
  2. Notes
    - Users will select their facility type during registration
    - This helps categorize healthcare providers by facility type
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'facility_type'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN facility_type text NOT NULL DEFAULT 'Clinic'
    CHECK (facility_type IN ('Hospital', 'Clinic', 'RHC'));
  END IF;
END $$;
