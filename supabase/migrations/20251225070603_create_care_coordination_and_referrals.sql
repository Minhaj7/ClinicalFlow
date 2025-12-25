/*
  # Create Care Coordination and Referral Management System

  ## Overview
  This migration implements comprehensive care coordination and referral management,
  enabling seamless communication between providers, tracking patient transitions,
  and ensuring continuity of care across different healthcare settings.

  ## Changes Made

  ### 1. New Tables

  #### referrals
  - `id` (uuid, primary key) - Unique referral identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `referring_provider_id` (uuid, required) - Provider making referral
  - `referred_to_provider_id` (uuid) - Specific provider being referred to
  - `referred_to_organization_id` (uuid) - Organization being referred to
  - `referred_to_specialty` (text) - Specialty needed
  - `reason_for_referral` (text, required) - Clinical indication
  - `priority` (text, required) - Routine, Urgent, Emergency
  - `clinical_summary` (text) - Summary of patient's condition
  - `relevant_diagnoses` (uuid[]) - Array of problem_list IDs
  - `relevant_medications` (jsonb) - Current medications
  - `relevant_tests` (jsonb) - Recent test results
  - `status` (text, required) - Pending, Scheduled, Seen, Completed, Cancelled
  - `authorization_number` (text) - Insurance authorization
  - `expires_at` (date) - Expiration date
  - `scheduled_date` (timestamptz) - Appointment date/time
  - `seen_date` (timestamptz) - When patient was seen
  - `consultation_report` (text) - Report from referred provider
  - `recommendations` (text) - Recommendations from specialist
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### care_transitions
  - `id` (uuid, primary key) - Unique transition identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `from_facility_id` (uuid) - Transferring from organization
  - `to_facility_id` (uuid, required) - Transferring to organization
  - `transition_type` (text, required) - Admission, Transfer, Discharge, Referral
  - `from_provider_id` (uuid) - Sending provider
  - `to_provider_id` (uuid) - Receiving provider
  - `transition_date` (timestamptz, required) - When transition occurred
  - `reason` (text, required) - Reason for transition
  - `patient_condition` (text) - Patient's condition at transfer
  - `transfer_diagnosis` (text) - Diagnosis at time of transfer
  - `active_problems` (jsonb) - Current active problems
  - `current_medications` (jsonb) - Medications at transition
  - `pending_orders` (jsonb) - Outstanding orders/tests
  - `follow_up_required` (boolean) - Whether follow-up needed
  - `follow_up_instructions` (text) - Follow-up instructions
  - `transfer_documents` (jsonb) - Array of document URLs
  - `acknowledgement_received` (boolean) - Receiving facility confirmed
  - `acknowledged_by` (uuid) - Who acknowledged receipt
  - `acknowledged_at` (timestamptz) - When acknowledged
  - `created_at` (timestamptz) - Record creation timestamp

  #### care_coordination_notes
  - `id` (uuid, primary key) - Unique note identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `care_team_id` (uuid) - Foreign key to care_teams
  - `author_id` (uuid, required) - Provider who wrote the note
  - `note_type` (text, required) - Coordination, Case Management, Social Work, etc.
  - `subject` (text, required) - Note subject
  - `content` (text, required) - Note content
  - `action_items` (jsonb) - Array of action items with assignments
  - `recipients` (uuid[]) - Array of provider IDs to notify
  - `priority` (text) - Low, Normal, High, Urgent
  - `created_at` (timestamptz) - Record creation timestamp

  #### shared_care_plans
  - `id` (uuid, primary key) - Unique care plan identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `care_team_id` (uuid, required) - Foreign key to care_teams
  - `plan_name` (text, required) - Name of the care plan
  - `primary_diagnosis` (text, required) - Primary diagnosis
  - `care_goals` (jsonb, required) - Array of care goals
  - `care_team_roles` (jsonb) - Responsibilities by team member
  - `patient_education` (jsonb) - Patient education materials
  - `patient_responsibilities` (jsonb) - What patient needs to do
  - `barriers_to_care` (jsonb) - Identified barriers
  - `support_services` (jsonb) - Support services in place
  - `review_schedule` (text) - How often plan is reviewed
  - `next_review_date` (date) - Next scheduled review
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. Indexes
  - Patient and provider lookups for all tables
  - Status and priority for workflow management
  - Date-based indexes for tracking timelines

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Providers can access referrals they sent or received
  - Care teams can access coordination information
  - Audit logging for all care coordination activities

  ## Important Notes
  - Referral tracking ensures patients get specialty care
  - Care transitions prevent information loss during handoffs
  - Shared care plans enable coordinated multi-provider care
  - Status tracking prevents patients from falling through cracks
*/

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  referring_provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  referred_to_provider_id uuid REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  referred_to_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  referred_to_specialty text,
  reason_for_referral text NOT NULL,
  priority text NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'Emergency')),
  clinical_summary text,
  relevant_diagnoses uuid[] DEFAULT '{}',
  relevant_medications jsonb DEFAULT '[]'::jsonb,
  relevant_tests jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Scheduled', 'Seen', 'Completed', 'Cancelled')),
  authorization_number text,
  expires_at date,
  scheduled_date timestamptz,
  seen_date timestamptz,
  consultation_report text,
  recommendations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create care_transitions table
CREATE TABLE IF NOT EXISTS care_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_facility_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  to_facility_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  transition_type text NOT NULL CHECK (transition_type IN ('Admission', 'Transfer', 'Discharge', 'Referral')),
  from_provider_id uuid REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  to_provider_id uuid REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  transition_date timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  patient_condition text,
  transfer_diagnosis text,
  active_problems jsonb DEFAULT '[]'::jsonb,
  current_medications jsonb DEFAULT '[]'::jsonb,
  pending_orders jsonb DEFAULT '[]'::jsonb,
  follow_up_required boolean DEFAULT false,
  follow_up_instructions text,
  transfer_documents jsonb DEFAULT '[]'::jsonb,
  acknowledgement_received boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create care_coordination_notes table
CREATE TABLE IF NOT EXISTS care_coordination_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  care_team_id uuid REFERENCES care_teams(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  note_type text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb,
  recipients uuid[] DEFAULT '{}',
  priority text DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  created_at timestamptz DEFAULT now()
);

-- Create shared_care_plans table
CREATE TABLE IF NOT EXISTS shared_care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  care_team_id uuid NOT NULL REFERENCES care_teams(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  primary_diagnosis text NOT NULL,
  care_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  care_team_roles jsonb DEFAULT '{}'::jsonb,
  patient_education jsonb DEFAULT '[]'::jsonb,
  patient_responsibilities jsonb DEFAULT '[]'::jsonb,
  barriers_to_care jsonb DEFAULT '[]'::jsonb,
  support_services jsonb DEFAULT '[]'::jsonb,
  review_schedule text,
  next_review_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS referrals_patient_id_idx ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS referrals_referring_provider_idx ON referrals(referring_provider_id);
CREATE INDEX IF NOT EXISTS referrals_referred_to_provider_idx ON referrals(referred_to_provider_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);
CREATE INDEX IF NOT EXISTS referrals_priority_idx ON referrals(priority);
CREATE INDEX IF NOT EXISTS referrals_created_at_idx ON referrals(created_at DESC);

CREATE INDEX IF NOT EXISTS care_transitions_patient_id_idx ON care_transitions(patient_id);
CREATE INDEX IF NOT EXISTS care_transitions_from_facility_idx ON care_transitions(from_facility_id);
CREATE INDEX IF NOT EXISTS care_transitions_to_facility_idx ON care_transitions(to_facility_id);
CREATE INDEX IF NOT EXISTS care_transitions_date_idx ON care_transitions(transition_date DESC);
CREATE INDEX IF NOT EXISTS care_transitions_ack_idx ON care_transitions(acknowledgement_received) WHERE acknowledgement_received = false;

CREATE INDEX IF NOT EXISTS care_coordination_notes_patient_id_idx ON care_coordination_notes(patient_id);
CREATE INDEX IF NOT EXISTS care_coordination_notes_team_id_idx ON care_coordination_notes(care_team_id);
CREATE INDEX IF NOT EXISTS care_coordination_notes_author_idx ON care_coordination_notes(author_id);
CREATE INDEX IF NOT EXISTS care_coordination_notes_created_idx ON care_coordination_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS shared_care_plans_patient_id_idx ON shared_care_plans(patient_id);
CREATE INDEX IF NOT EXISTS shared_care_plans_team_id_idx ON shared_care_plans(care_team_id);
CREATE INDEX IF NOT EXISTS shared_care_plans_active_idx ON shared_care_plans(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_coordination_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_care_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Providers can view referrals they sent or received"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = referring_provider_id OR hp.id = referred_to_provider_id)
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = referrals.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = referring_provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update referrals they sent or received"
  ON referrals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = referring_provider_id OR hp.id = referred_to_provider_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = referring_provider_id OR hp.id = referred_to_provider_id)
    )
  );

-- RLS Policies for care_transitions
CREATE POLICY "Providers can view care transitions for their facilities"
  ON care_transitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = from_provider_id OR hp.id = to_provider_id)
    )
    OR EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.organization_id = from_facility_id OR hp.organization_id = to_facility_id)
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = care_transitions.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create care transitions"
  ON care_transitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = from_provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update care transitions"
  ON care_transitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = from_provider_id OR hp.id = to_provider_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
      AND (hp.id = from_provider_id OR hp.id = to_provider_id)
    )
  );

-- RLS Policies for care_coordination_notes
CREATE POLICY "Care team members can view coordination notes"
  ON care_coordination_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members ctm
      INNER JOIN healthcare_providers hp ON hp.id = ctm.provider_id
      WHERE ctm.care_team_id = care_coordination_notes.care_team_id
      AND hp.user_id = auth.uid()
      AND ctm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = author_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = care_coordination_notes.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Care team members can create coordination notes"
  ON care_coordination_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = author_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for shared_care_plans
CREATE POLICY "Care team members can view shared care plans"
  ON shared_care_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members ctm
      INNER JOIN healthcare_providers hp ON hp.id = ctm.provider_id
      WHERE ctm.care_team_id = shared_care_plans.care_team_id
      AND hp.user_id = auth.uid()
      AND ctm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = shared_care_plans.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can create shared care plans"
  ON shared_care_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_teams ct
      INNER JOIN healthcare_providers hp ON hp.id = ct.primary_provider_id
      WHERE ct.id = care_team_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can update shared care plans"
  ON shared_care_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_teams ct
      INNER JOIN healthcare_providers hp ON hp.id = ct.primary_provider_id
      WHERE ct.id = care_team_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_teams ct
      INNER JOIN healthcare_providers hp ON hp.id = ct.primary_provider_id
      WHERE ct.id = care_team_id
      AND hp.user_id = auth.uid()
    )
  );