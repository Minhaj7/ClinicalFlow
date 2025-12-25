/*
  # Enable Cross-Facility Patient Data Access by CNIC

  ## Overview
  This migration enables healthcare providers across all facilities (hospitals, clinics, RHCs) 
  to access patient data by CNIC number. Any authenticated provider can view complete patient 
  records including visits, medical history, problems, medications, and tests.

  ## Changes Made

  ### 1. Patients Table
  - Drop restrictive "own patients only" SELECT policy
  - Add policy: All authenticated users can view ANY patient record

  ### 2. Patient Visits Table
  - Add policy: All authenticated users can view ANY patient visit
  - Update policy: All authenticated users can update visits

  ### 3. Patient Medical History
  - Add policy: All authenticated users can view and add medical history

  ### 4. Medical Tests
  - Add policy: All authenticated users can view and add medical tests

  ### 5. Vital Signs
  - Add policy: All authenticated users can view and record vital signs

  ### 6. Problem List
  - Add policy: All authenticated users can view and manage problems

  ### 7. Medications Prescribed
  - Add policy: All authenticated users can view and prescribe medications

  ## Security Notes
  - All policies require authentication
  - Enables legitimate cross-facility care coordination
  - Patient data remains protected from unauthenticated access
  - Audit trails preserved via created_by fields

  ## Important Notes
  - CNIC serves as the universal patient identifier
  - Supports continuity of care across facilities
*/

-- ============================================================================
-- PATIENTS TABLE - Cross-Facility Access
-- ============================================================================

DROP POLICY IF EXISTS "receptionist_select_own_patients" ON patients;

CREATE POLICY "authenticated_users_select_all_patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- PATIENT VISITS TABLE - Cross-Facility Access
-- ============================================================================

DROP POLICY IF EXISTS "receptionist_select_own_visits" ON patient_visits;

CREATE POLICY "authenticated_users_select_all_visits"
  ON patient_visits
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "receptionist_update_own_visits" ON patient_visits;

CREATE POLICY "authenticated_users_update_visits"
  ON patient_visits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- PATIENT MEDICAL HISTORY - Cross-Facility Access
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_medical_history' 
    AND policyname = 'authenticated_users_select_medical_history'
  ) THEN
    CREATE POLICY "authenticated_users_select_medical_history"
      ON patient_medical_history
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_medical_history' 
    AND policyname = 'authenticated_users_insert_medical_history'
  ) THEN
    CREATE POLICY "authenticated_users_insert_medical_history"
      ON patient_medical_history
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- MEDICAL TESTS - Cross-Facility Access
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_tests' 
    AND policyname = 'authenticated_users_select_tests'
  ) THEN
    CREATE POLICY "authenticated_users_select_tests"
      ON medical_tests
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_tests' 
    AND policyname = 'authenticated_users_insert_tests'
  ) THEN
    CREATE POLICY "authenticated_users_insert_tests"
      ON medical_tests
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- VITAL SIGNS - Cross-Facility Access
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vital_signs' 
    AND policyname = 'authenticated_users_select_vitals'
  ) THEN
    CREATE POLICY "authenticated_users_select_vitals"
      ON vital_signs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vital_signs' 
    AND policyname = 'authenticated_users_insert_vitals'
  ) THEN
    CREATE POLICY "authenticated_users_insert_vitals"
      ON vital_signs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- PROBLEM LIST - Cross-Facility Access
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'problem_list' 
    AND policyname = 'authenticated_users_select_problems'
  ) THEN
    CREATE POLICY "authenticated_users_select_problems"
      ON problem_list
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'problem_list' 
    AND policyname = 'authenticated_users_insert_problems'
  ) THEN
    CREATE POLICY "authenticated_users_insert_problems"
      ON problem_list
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'problem_list' 
    AND policyname = 'authenticated_users_update_problems'
  ) THEN
    CREATE POLICY "authenticated_users_update_problems"
      ON problem_list
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- MEDICATIONS PRESCRIBED - Cross-Facility Access
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications_prescribed' 
    AND policyname = 'authenticated_users_select_medications'
  ) THEN
    CREATE POLICY "authenticated_users_select_medications"
      ON medications_prescribed
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications_prescribed' 
    AND policyname = 'authenticated_users_insert_medications'
  ) THEN
    CREATE POLICY "authenticated_users_insert_medications"
      ON medications_prescribed
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications_prescribed' 
    AND policyname = 'authenticated_users_update_medications'
  ) THEN
    CREATE POLICY "authenticated_users_update_medications"
      ON medications_prescribed
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;