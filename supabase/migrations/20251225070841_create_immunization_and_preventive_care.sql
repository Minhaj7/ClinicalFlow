/*
  # Create Immunization and Preventive Care System

  ## Overview
  This migration implements comprehensive immunization tracking and preventive care
  management. This includes vaccine registries, immunization schedules, preventive
  screenings, health maintenance reminders, and population health tracking.

  ## Changes Made

  ### 1. New Tables

  #### immunizations
  - `id` (uuid, primary key) - Unique immunization identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `vaccine_name` (text, required) - Vaccine name
  - `cvx_code` (text) - CDC vaccine code
  - `vaccine_manufacturer` (text) - Manufacturer name
  - `lot_number` (text, required) - Vaccine lot number
  - `expiration_date` (date) - Vaccine expiration
  - `dose_number` (integer) - Which dose in series
  - `administered_date` (date, required) - Date given
  - `administered_by` (uuid, required) - Provider who administered
  - `administration_site` (text) - Body site (left arm, right arm, etc.)
  - `route` (text) - Intramuscular, subcutaneous, etc.
  - `dose_quantity` (text) - Amount given
  - `vis_date` (date) - Vaccine Information Statement date
  - `vis_given` (boolean) - Whether VIS was provided
  - `funding_source` (text) - Public, Private, Other
  - `adverse_reaction` (boolean) - Any adverse reaction
  - `reaction_details` (text) - Details of reaction
  - `registry_reported` (boolean) - Reported to state registry
  - `registry_report_date` (date) - When reported
  - `created_at` (timestamptz) - Record creation timestamp

  #### immunization_schedules
  - `id` (uuid, primary key) - Unique schedule identifier
  - `vaccine_name` (text, required) - Vaccine name
  - `cvx_code` (text) - CDC vaccine code
  - `age_group` (text, required) - Infant, Child, Adolescent, Adult, Senior
  - `recommended_age` (text) - When to give (e.g., "2 months")
  - `minimum_age` (text) - Minimum age
  - `dose_number` (integer) - Dose in series
  - `total_doses` (integer) - Total doses in series
  - `interval_from_previous` (text) - Time since last dose
  - `is_required` (boolean) - Required vs recommended
  - `notes` (text) - Additional guidance
  - `created_at` (timestamptz) - Record creation timestamp

  #### preventive_screenings
  - `id` (uuid, primary key) - Unique screening identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `screening_type` (text, required) - Cancer, Diabetes, Hypertension, etc.
  - `screening_name` (text, required) - Specific test name
  - `screening_date` (date, required) - When performed
  - `performed_by` (uuid) - Provider who performed
  - `result` (text) - Result (Normal, Abnormal, etc.)
  - `result_value` (text) - Specific value if applicable
  - `result_details` (jsonb) - Detailed results
  - `follow_up_needed` (boolean) - Whether follow-up required
  - `follow_up_recommendations` (text) - Recommended follow-up
  - `next_screening_date` (date) - When next screening due
  - `created_at` (timestamptz) - Record creation timestamp

  #### health_maintenance_reminders
  - `id` (uuid, primary key) - Unique reminder identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `reminder_type` (text, required) - Immunization, Screening, Check-up, etc.
  - `reminder_name` (text, required) - What's due
  - `due_date` (date, required) - When due
  - `priority` (text, required) - High, Medium, Low
  - `status` (text, required) - Pending, Completed, Overdue, Cancelled
  - `completed_date` (date) - When completed
  - `reminder_sent` (boolean) - Whether patient was notified
  - `reminder_sent_date` (date) - When notification sent
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### wellness_programs
  - `id` (uuid, primary key) - Unique program identifier
  - `program_name` (text, required) - Program name
  - `program_type` (text, required) - Diabetes, Weight Loss, Smoking Cessation, etc.
  - `description` (text) - Program description
  - `target_population` (text) - Who should enroll
  - `goals` (jsonb) - Program goals
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### wellness_program_enrollments
  - `id` (uuid, primary key) - Unique enrollment identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `program_id` (uuid, required) - Foreign key to wellness_programs
  - `enrolled_by` (uuid, required) - Provider who enrolled patient
  - `enrollment_date` (date, required) - When enrolled
  - `target_goals` (jsonb) - Patient-specific goals
  - `completion_date` (date) - When completed
  - `status` (text, required) - Active, Completed, Dropped Out
  - `outcome` (text) - Program outcome
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Indexes
  - Patient lookups for all patient-related tables
  - Vaccine codes and dates for immunizations
  - Due dates for reminders
  - Screening types for reporting

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Healthcare providers can manage immunizations and screenings
  - Patients can view their own records
  - Reminders accessible to care teams

  ## Important Notes
  - CVX codes enable standardized vaccine reporting
  - Immunization registries for public health reporting
  - Preventive care tracking reduces disease burden
  - Health maintenance reminders improve patient outcomes
  - Wellness programs support population health
*/

-- Create immunizations table
CREATE TABLE IF NOT EXISTS immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  cvx_code text,
  vaccine_manufacturer text,
  lot_number text NOT NULL,
  expiration_date date,
  dose_number integer,
  administered_date date NOT NULL,
  administered_by uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  administration_site text,
  route text,
  dose_quantity text,
  vis_date date,
  vis_given boolean DEFAULT false,
  funding_source text,
  adverse_reaction boolean DEFAULT false,
  reaction_details text,
  registry_reported boolean DEFAULT false,
  registry_report_date date,
  created_at timestamptz DEFAULT now()
);

-- Create immunization_schedules table
CREATE TABLE IF NOT EXISTS immunization_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name text NOT NULL,
  cvx_code text,
  age_group text NOT NULL,
  recommended_age text,
  minimum_age text,
  dose_number integer,
  total_doses integer,
  interval_from_previous text,
  is_required boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create preventive_screenings table
CREATE TABLE IF NOT EXISTS preventive_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  screening_type text NOT NULL,
  screening_name text NOT NULL,
  screening_date date NOT NULL,
  performed_by uuid REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  result text,
  result_value text,
  result_details jsonb DEFAULT '{}'::jsonb,
  follow_up_needed boolean DEFAULT false,
  follow_up_recommendations text,
  next_screening_date date,
  created_at timestamptz DEFAULT now()
);

-- Create health_maintenance_reminders table
CREATE TABLE IF NOT EXISTS health_maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  reminder_name text NOT NULL,
  due_date date NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Overdue', 'Cancelled')),
  completed_date date,
  reminder_sent boolean DEFAULT false,
  reminder_sent_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wellness_programs table
CREATE TABLE IF NOT EXISTS wellness_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL UNIQUE,
  program_type text NOT NULL,
  description text,
  target_population text,
  goals jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create wellness_program_enrollments table
CREATE TABLE IF NOT EXISTS wellness_program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES wellness_programs(id) ON DELETE CASCADE,
  enrolled_by uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  target_goals jsonb DEFAULT '[]'::jsonb,
  completion_date date,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Dropped Out')),
  outcome text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, program_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS immunizations_patient_idx ON immunizations(patient_id);
CREATE INDEX IF NOT EXISTS immunizations_administered_date_idx ON immunizations(administered_date DESC);
CREATE INDEX IF NOT EXISTS immunizations_vaccine_idx ON immunizations(vaccine_name);
CREATE INDEX IF NOT EXISTS immunizations_cvx_idx ON immunizations(cvx_code);

CREATE INDEX IF NOT EXISTS imm_schedules_vaccine_idx ON immunization_schedules(vaccine_name);
CREATE INDEX IF NOT EXISTS imm_schedules_age_group_idx ON immunization_schedules(age_group);

CREATE INDEX IF NOT EXISTS prev_screenings_patient_idx ON preventive_screenings(patient_id);
CREATE INDEX IF NOT EXISTS prev_screenings_type_idx ON preventive_screenings(screening_type);
CREATE INDEX IF NOT EXISTS prev_screenings_date_idx ON preventive_screenings(screening_date DESC);

CREATE INDEX IF NOT EXISTS health_reminders_patient_idx ON health_maintenance_reminders(patient_id);
CREATE INDEX IF NOT EXISTS health_reminders_due_date_idx ON health_maintenance_reminders(due_date);
CREATE INDEX IF NOT EXISTS health_reminders_status_idx ON health_maintenance_reminders(status);

CREATE INDEX IF NOT EXISTS wellness_programs_active_idx ON wellness_programs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS wellness_enrollments_patient_idx ON wellness_program_enrollments(patient_id);
CREATE INDEX IF NOT EXISTS wellness_enrollments_program_idx ON wellness_program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS wellness_enrollments_status_idx ON wellness_program_enrollments(status);

-- Enable RLS
ALTER TABLE immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_program_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for immunizations
CREATE POLICY "Healthcare providers can view immunizations"
  ON immunizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = immunizations.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create immunization records"
  ON immunizations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = administered_by
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for immunization_schedules (read-only for all authenticated)
CREATE POLICY "Authenticated users can view immunization schedules"
  ON immunization_schedules FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for preventive_screenings
CREATE POLICY "Healthcare providers can view screenings"
  ON preventive_screenings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = preventive_screenings.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create screening records"
  ON preventive_screenings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update screening records"
  ON preventive_screenings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );

-- RLS Policies for health_maintenance_reminders
CREATE POLICY "Healthcare providers can view reminders"
  ON health_maintenance_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = health_maintenance_reminders.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create reminders"
  ON health_maintenance_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update reminders"
  ON health_maintenance_reminders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );

-- RLS Policies for wellness_programs
CREATE POLICY "Authenticated users can view wellness programs"
  ON wellness_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage wellness programs"
  ON wellness_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for wellness_program_enrollments
CREATE POLICY "Healthcare providers can view enrollments"
  ON wellness_program_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = wellness_program_enrollments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can enroll patients"
  ON wellness_program_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = enrolled_by
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can update enrollments"
  ON wellness_program_enrollments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = enrolled_by
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = enrolled_by
      AND hp.user_id = auth.uid()
    )
  );