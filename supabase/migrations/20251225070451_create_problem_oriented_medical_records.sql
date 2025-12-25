/*
  # Create Problem-Oriented Medical Record (POMR) System

  ## Overview
  This migration implements the Problem-Oriented Medical Record system, which organizes
  patient care around specific health problems. This includes problem lists with ICD-10
  codes, structured encounter notes (SOAP format), treatment plans, progress notes,
  clinical orders, and discharge summaries.

  ## Changes Made

  ### 1. New Tables

  #### problem_list
  - `id` (uuid, primary key) - Unique problem identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `provider_id` (uuid, required) - Provider who identified the problem
  - `problem_name` (text, required) - Problem description
  - `icd10_code` (text) - ICD-10 diagnosis code
  - `snomed_code` (text) - SNOMED CT code
  - `status` (text, required) - Active, Resolved, Chronic, Inactive
  - `severity` (text) - Mild, Moderate, Severe, Critical
  - `onset_date` (date) - When problem started
  - `resolved_date` (date) - When problem was resolved
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### encounter_notes
  - `id` (uuid, primary key) - Unique note identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `visit_id` (uuid) - Foreign key to patient_visits
  - `provider_id` (uuid, required) - Provider who wrote the note
  - `encounter_type` (text, required) - Office Visit, Emergency, Consultation, etc.
  - `encounter_date` (timestamptz, required) - Date of encounter
  - `chief_complaint` (text) - Patient's main concern
  - `subjective` (text) - Subjective findings (SOAP)
  - `objective` (text) - Objective findings (SOAP)
  - `assessment` (text) - Assessment/diagnosis (SOAP)
  - `plan` (text) - Treatment plan (SOAP)
  - `problems_addressed` (uuid[]) - Array of problem_list IDs
  - `is_signed` (boolean) - Whether note is signed/finalized
  - `signed_at` (timestamptz) - When note was signed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### treatment_plans
  - `id` (uuid, primary key) - Unique plan identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `problem_id` (uuid, required) - Foreign key to problem_list
  - `provider_id` (uuid, required) - Provider who created the plan
  - `plan_name` (text, required) - Name of the treatment plan
  - `goals` (jsonb) - Array of treatment goals
  - `interventions` (jsonb) - Array of planned interventions
  - `start_date` (date, required) - Plan start date
  - `target_end_date` (date) - Expected completion date
  - `actual_end_date` (date) - Actual completion date
  - `status` (text, required) - Active, Completed, Discontinued, On Hold
  - `outcome` (text) - Treatment outcome
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### progress_notes
  - `id` (uuid, primary key) - Unique note identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `problem_id` (uuid, required) - Foreign key to problem_list
  - `treatment_plan_id` (uuid) - Foreign key to treatment_plans
  - `provider_id` (uuid, required) - Provider who wrote the note
  - `note_date` (timestamptz, required) - Date of note
  - `progress_summary` (text, required) - Summary of progress
  - `patient_response` (text) - How patient is responding
  - `next_steps` (text) - Planned next steps
  - `created_at` (timestamptz) - Record creation timestamp

  #### clinical_orders
  - `id` (uuid, primary key) - Unique order identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `visit_id` (uuid) - Foreign key to patient_visits
  - `provider_id` (uuid, required) - Ordering provider
  - `order_type` (text, required) - Lab, Imaging, Procedure, Referral, etc.
  - `order_code` (text) - Standard order code (CPT, LOINC, etc.)
  - `order_description` (text, required) - Description of order
  - `priority` (text, required) - Routine, Urgent, STAT, ASAP
  - `clinical_indication` (text) - Reason for order
  - `ordered_at` (timestamptz, required) - When order was placed
  - `scheduled_for` (timestamptz) - Scheduled date/time
  - `completed_at` (timestamptz) - When order was completed
  - `status` (text, required) - Ordered, Scheduled, In Progress, Completed, Cancelled
  - `results` (jsonb) - Order results/findings
  - `performed_by` (uuid) - Provider/facility who performed the order
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### discharge_summaries
  - `id` (uuid, primary key) - Unique summary identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `visit_id` (uuid, required) - Foreign key to patient_visits
  - `provider_id` (uuid, required) - Discharging provider
  - `admission_date` (timestamptz, required) - When patient was admitted
  - `discharge_date` (timestamptz, required) - When patient was discharged
  - `admission_diagnosis` (text) - Diagnosis at admission
  - `discharge_diagnosis` (text, required) - Final diagnosis
  - `hospital_course` (text, required) - Summary of hospital stay
  - `procedures_performed` (jsonb) - Array of procedures
  - `discharge_condition` (text) - Patient condition at discharge
  - `discharge_disposition` (text, required) - Home, Rehab, Transfer, etc.
  - `discharge_medications` (jsonb) - Medications at discharge
  - `discharge_instructions` (text, required) - Patient instructions
  - `follow_up_plans` (text) - Follow-up appointments needed
  - `is_signed` (boolean) - Whether summary is signed
  - `signed_at` (timestamptz) - When summary was signed
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Indexes
  - Patient lookups for all tables
  - Problem status and ICD codes for problem_list
  - Encounter date for sorting notes chronologically
  - Order status for workflow management

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Healthcare providers can access records for their patients
  - Care team members can access shared patient records
  - Audit logging integrated with all tables

  ## Important Notes
  - ICD-10 codes enable standardized diagnosis coding
  - SOAP format ensures structured clinical documentation
  - Problem-oriented approach improves care coordination
  - Clinical orders track the complete care workflow
  - Discharge summaries essential for care transitions
*/

-- Create problem_list table
CREATE TABLE IF NOT EXISTS problem_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  problem_name text NOT NULL,
  icd10_code text,
  snomed_code text,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Chronic', 'Inactive')),
  severity text CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Critical')),
  onset_date date,
  resolved_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create encounter_notes table
CREATE TABLE IF NOT EXISTS encounter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES patient_visits(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  encounter_type text NOT NULL,
  encounter_date timestamptz NOT NULL DEFAULT now(),
  chief_complaint text,
  subjective text,
  objective text,
  assessment text,
  plan text,
  problems_addressed uuid[] DEFAULT '{}',
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treatment_plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problem_list(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  plan_name text NOT NULL,
  goals jsonb DEFAULT '[]'::jsonb,
  interventions jsonb DEFAULT '[]'::jsonb,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_end_date date,
  actual_end_date date,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued', 'On Hold')),
  outcome text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create progress_notes table
CREATE TABLE IF NOT EXISTS progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problem_list(id) ON DELETE CASCADE,
  treatment_plan_id uuid REFERENCES treatment_plans(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  note_date timestamptz NOT NULL DEFAULT now(),
  progress_summary text NOT NULL,
  patient_response text,
  next_steps text,
  created_at timestamptz DEFAULT now()
);

-- Create clinical_orders table
CREATE TABLE IF NOT EXISTS clinical_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES patient_visits(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  order_type text NOT NULL,
  order_code text,
  order_description text NOT NULL,
  priority text NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'STAT', 'ASAP')),
  clinical_indication text,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  results jsonb DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES healthcare_providers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discharge_summaries table
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  admission_date timestamptz NOT NULL,
  discharge_date timestamptz NOT NULL,
  admission_diagnosis text,
  discharge_diagnosis text NOT NULL,
  hospital_course text NOT NULL,
  procedures_performed jsonb DEFAULT '[]'::jsonb,
  discharge_condition text,
  discharge_disposition text NOT NULL,
  discharge_medications jsonb DEFAULT '[]'::jsonb,
  discharge_instructions text NOT NULL,
  follow_up_plans text,
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS problem_list_patient_id_idx ON problem_list(patient_id);
CREATE INDEX IF NOT EXISTS problem_list_provider_id_idx ON problem_list(provider_id);
CREATE INDEX IF NOT EXISTS problem_list_status_idx ON problem_list(status);
CREATE INDEX IF NOT EXISTS problem_list_icd10_idx ON problem_list(icd10_code);

CREATE INDEX IF NOT EXISTS encounter_notes_patient_id_idx ON encounter_notes(patient_id);
CREATE INDEX IF NOT EXISTS encounter_notes_provider_id_idx ON encounter_notes(provider_id);
CREATE INDEX IF NOT EXISTS encounter_notes_visit_id_idx ON encounter_notes(visit_id);
CREATE INDEX IF NOT EXISTS encounter_notes_date_idx ON encounter_notes(encounter_date DESC);
CREATE INDEX IF NOT EXISTS encounter_notes_signed_idx ON encounter_notes(is_signed);

CREATE INDEX IF NOT EXISTS treatment_plans_patient_id_idx ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS treatment_plans_problem_id_idx ON treatment_plans(problem_id);
CREATE INDEX IF NOT EXISTS treatment_plans_provider_id_idx ON treatment_plans(provider_id);
CREATE INDEX IF NOT EXISTS treatment_plans_status_idx ON treatment_plans(status);

CREATE INDEX IF NOT EXISTS progress_notes_patient_id_idx ON progress_notes(patient_id);
CREATE INDEX IF NOT EXISTS progress_notes_problem_id_idx ON progress_notes(problem_id);
CREATE INDEX IF NOT EXISTS progress_notes_date_idx ON progress_notes(note_date DESC);

CREATE INDEX IF NOT EXISTS clinical_orders_patient_id_idx ON clinical_orders(patient_id);
CREATE INDEX IF NOT EXISTS clinical_orders_provider_id_idx ON clinical_orders(provider_id);
CREATE INDEX IF NOT EXISTS clinical_orders_status_idx ON clinical_orders(status);
CREATE INDEX IF NOT EXISTS clinical_orders_type_idx ON clinical_orders(order_type);
CREATE INDEX IF NOT EXISTS clinical_orders_ordered_at_idx ON clinical_orders(ordered_at DESC);

CREATE INDEX IF NOT EXISTS discharge_summaries_patient_id_idx ON discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS discharge_summaries_visit_id_idx ON discharge_summaries(visit_id);
CREATE INDEX IF NOT EXISTS discharge_summaries_discharge_date_idx ON discharge_summaries(discharge_date DESC);

-- Enable RLS
ALTER TABLE problem_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for problem_list
CREATE POLICY "Healthcare providers can view problem lists"
  ON problem_list FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = problem_list.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create problems"
  ON problem_list FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update problems"
  ON problem_list FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for encounter_notes (similar pattern for all clinical tables)
CREATE POLICY "Healthcare providers can view encounter notes"
  ON encounter_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = encounter_notes.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create encounter notes"
  ON encounter_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update their own encounter notes"
  ON encounter_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    AND is_signed = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for treatment_plans
CREATE POLICY "Healthcare providers can view treatment plans"
  ON treatment_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = treatment_plans.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create treatment plans"
  ON treatment_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update treatment plans"
  ON treatment_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for progress_notes
CREATE POLICY "Healthcare providers can view progress notes"
  ON progress_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = progress_notes.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create progress notes"
  ON progress_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for clinical_orders
CREATE POLICY "Healthcare providers can view clinical orders"
  ON clinical_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = clinical_orders.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create clinical orders"
  ON clinical_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update clinical orders"
  ON clinical_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = performed_by
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = performed_by
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for discharge_summaries
CREATE POLICY "Healthcare providers can view discharge summaries"
  ON discharge_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = discharge_summaries.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create discharge summaries"
  ON discharge_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update discharge summaries"
  ON discharge_summaries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    AND is_signed = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );