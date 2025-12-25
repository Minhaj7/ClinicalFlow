/*
  # Create Comprehensive Medication Management System

  ## Overview
  This migration implements a comprehensive medication management system including
  prescriptions, medication administration records, e-prescribing, medication
  reconciliation, drug interactions, and formulary management. This is critical
  for patient safety and regulatory compliance.

  ## Changes Made

  ### 1. New Tables

  #### medications_prescribed
  - `id` (uuid, primary key) - Unique prescription identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `visit_id` (uuid) - Foreign key to patient_visits
  - `prescriber_id` (uuid, required) - Provider who prescribed
  - `medication_name` (text, required) - Generic or brand name
  - `generic_name` (text) - Generic name if brand prescribed
  - `ndc_code` (text) - National Drug Code
  - `rxnorm_code` (text) - RxNorm concept code
  - `strength` (text, required) - Drug strength (e.g., "500mg")
  - `dosage_form` (text, required) - Tablet, Capsule, Liquid, etc.
  - `route` (text, required) - Oral, IV, Topical, etc.
  - `dosage_instructions` (text, required) - How to take
  - `frequency` (text, required) - Daily, BID, TID, QID, PRN, etc.
  - `quantity` (numeric, required) - Number of units
  - `refills` (integer, required) - Number of refills allowed
  - `days_supply` (integer) - Days supply
  - `indication` (text) - Reason for prescription
  - `start_date` (date, required) - When to start taking
  - `end_date` (date) - When to stop (if applicable)
  - `status` (text, required) - Active, Completed, Discontinued, On Hold
  - `discontinuation_reason` (text) - Why discontinued
  - `pharmacy_id` (uuid) - Preferred pharmacy
  - `prescription_number` (text) - Pharmacy prescription number
  - `e_prescribed` (boolean) - Whether sent electronically
  - `e_prescription_id` (text) - E-prescribing system ID
  - `is_controlled_substance` (boolean) - DEA scheduled drug
  - `dea_schedule` (text) - Schedule II, III, IV, V
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### medication_administration_record
  - `id` (uuid, primary key) - Unique administration record
  - `patient_id` (uuid, required) - Foreign key to patients
  - `prescription_id` (uuid, required) - Foreign key to medications_prescribed
  - `administered_by` (uuid, required) - Provider/nurse who administered
  - `scheduled_time` (timestamptz, required) - When medication was due
  - `actual_time` (timestamptz) - When actually administered
  - `dose_given` (text, required) - Dose administered
  - `route_used` (text, required) - Route of administration
  - `site` (text) - Site of administration (for injections)
  - `status` (text, required) - Given, Refused, Held, Missed
  - `refusal_reason` (text) - Why patient refused
  - `hold_reason` (text) - Why medication was held
  - `patient_response` (text) - How patient responded
  - `adverse_reaction` (boolean) - Any adverse reaction
  - `reaction_details` (text) - Details of reaction
  - `created_at` (timestamptz) - Record creation timestamp

  #### medication_reconciliation
  - `id` (uuid, primary key) - Unique reconciliation identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `visit_id` (uuid) - Foreign key to patient_visits
  - `transition_id` (uuid) - Foreign key to care_transitions
  - `reconciled_by` (uuid, required) - Provider who reconciled
  - `reconciliation_date` (timestamptz, required) - When reconciled
  - `reconciliation_type` (text, required) - Admission, Transfer, Discharge
  - `home_medications` (jsonb, required) - Medications patient was taking
  - `hospital_medications` (jsonb) - Medications given in hospital
  - `discharge_medications` (jsonb) - Medications to continue
  - `discontinued_medications` (jsonb) - Medications stopped
  - `new_medications` (jsonb) - New medications started
  - `changed_medications` (jsonb) - Medications with dose changes
  - `discrepancies_found` (jsonb) - Any discrepancies identified
  - `patient_counseled` (boolean) - Whether patient was counseled
  - `counseling_notes` (text) - Counseling documentation
  - `created_at` (timestamptz) - Record creation timestamp

  #### drug_formulary
  - `id` (uuid, primary key) - Unique formulary entry
  - `medication_name` (text, required) - Medication name
  - `generic_name` (text, required) - Generic name
  - `ndc_code` (text) - National Drug Code
  - `rxnorm_code` (text) - RxNorm concept code
  - `tier` (text, required) - Tier 1, 2, 3, 4 (cost levels)
  - `formulary_status` (text, required) - Preferred, Non-Preferred, Not Covered
  - `requires_prior_auth` (boolean) - Prior authorization required
  - `quantity_limit` (integer) - Quantity limits per fill
  - `step_therapy_required` (boolean) - Must try other drugs first
  - `generic_equivalent` (text) - Generic alternative
  - `therapeutic_class` (text) - Drug classification
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### drug_interactions
  - `id` (uuid, primary key) - Unique interaction identifier
  - `drug1_rxnorm_code` (text, required) - First drug RxNorm code
  - `drug1_name` (text, required) - First drug name
  - `drug2_rxnorm_code` (text, required) - Second drug RxNorm code
  - `drug2_name` (text, required) - Second drug name
  - `interaction_severity` (text, required) - Mild, Moderate, Severe, Contraindicated
  - `interaction_type` (text) - Pharmacokinetic, Pharmacodynamic, etc.
  - `description` (text, required) - Interaction description
  - `clinical_effects` (text) - What happens
  - `management` (text) - How to manage
  - `documentation_level` (text) - Established, Probable, Suspected, Theoretical
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Indexes
  - Patient and provider lookups for all tables
  - Medication codes for drug lookup
  - Status fields for workflow management
  - Scheduled times for administration tracking

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Prescribers can manage prescriptions
  - Nurses can document administration
  - Pharmacists can view prescriptions
  - Audit logging for controlled substances

  ## Important Notes
  - E-prescribing integration reduces errors
  - Medication reconciliation prevents adverse events
  - Drug interaction checking enhances patient safety
  - Controlled substance tracking for DEA compliance
  - Formulary management optimizes costs
*/

-- Create medications_prescribed table
CREATE TABLE IF NOT EXISTS medications_prescribed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES patient_visits(id) ON DELETE SET NULL,
  prescriber_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  medication_name text NOT NULL,
  generic_name text,
  ndc_code text,
  rxnorm_code text,
  strength text NOT NULL,
  dosage_form text NOT NULL,
  route text NOT NULL,
  dosage_instructions text NOT NULL,
  frequency text NOT NULL,
  quantity numeric NOT NULL,
  refills integer NOT NULL DEFAULT 0,
  days_supply integer,
  indication text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Discontinued', 'On Hold')),
  discontinuation_reason text,
  pharmacy_id uuid REFERENCES organizations(id),
  prescription_number text,
  e_prescribed boolean DEFAULT false,
  e_prescription_id text,
  is_controlled_substance boolean DEFAULT false,
  dea_schedule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication_administration_record table
CREATE TABLE IF NOT EXISTS medication_administration_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id uuid NOT NULL REFERENCES medications_prescribed(id) ON DELETE CASCADE,
  administered_by uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  scheduled_time timestamptz NOT NULL,
  actual_time timestamptz,
  dose_given text NOT NULL,
  route_used text NOT NULL,
  site text,
  status text NOT NULL CHECK (status IN ('Given', 'Refused', 'Held', 'Missed')),
  refusal_reason text,
  hold_reason text,
  patient_response text,
  adverse_reaction boolean DEFAULT false,
  reaction_details text,
  created_at timestamptz DEFAULT now()
);

-- Create medication_reconciliation table
CREATE TABLE IF NOT EXISTS medication_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES patient_visits(id) ON DELETE SET NULL,
  transition_id uuid REFERENCES care_transitions(id) ON DELETE SET NULL,
  reconciled_by uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  reconciliation_date timestamptz NOT NULL DEFAULT now(),
  reconciliation_type text NOT NULL CHECK (reconciliation_type IN ('Admission', 'Transfer', 'Discharge')),
  home_medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  hospital_medications jsonb DEFAULT '[]'::jsonb,
  discharge_medications jsonb DEFAULT '[]'::jsonb,
  discontinued_medications jsonb DEFAULT '[]'::jsonb,
  new_medications jsonb DEFAULT '[]'::jsonb,
  changed_medications jsonb DEFAULT '[]'::jsonb,
  discrepancies_found jsonb DEFAULT '[]'::jsonb,
  patient_counseled boolean DEFAULT false,
  counseling_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create drug_formulary table
CREATE TABLE IF NOT EXISTS drug_formulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name text NOT NULL,
  generic_name text NOT NULL,
  ndc_code text,
  rxnorm_code text,
  tier text NOT NULL CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4')),
  formulary_status text NOT NULL CHECK (formulary_status IN ('Preferred', 'Non-Preferred', 'Not Covered')),
  requires_prior_auth boolean DEFAULT false,
  quantity_limit integer,
  step_therapy_required boolean DEFAULT false,
  generic_equivalent text,
  therapeutic_class text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(rxnorm_code)
);

-- Create drug_interactions table
CREATE TABLE IF NOT EXISTS drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug1_rxnorm_code text NOT NULL,
  drug1_name text NOT NULL,
  drug2_rxnorm_code text NOT NULL,
  drug2_name text NOT NULL,
  interaction_severity text NOT NULL CHECK (interaction_severity IN ('Mild', 'Moderate', 'Severe', 'Contraindicated')),
  interaction_type text,
  description text NOT NULL,
  clinical_effects text,
  management text,
  documentation_level text CHECK (documentation_level IN ('Established', 'Probable', 'Suspected', 'Theoretical')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(drug1_rxnorm_code, drug2_rxnorm_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS medications_prescribed_patient_idx ON medications_prescribed(patient_id);
CREATE INDEX IF NOT EXISTS medications_prescribed_prescriber_idx ON medications_prescribed(prescriber_id);
CREATE INDEX IF NOT EXISTS medications_prescribed_visit_idx ON medications_prescribed(visit_id);
CREATE INDEX IF NOT EXISTS medications_prescribed_status_idx ON medications_prescribed(status);
CREATE INDEX IF NOT EXISTS medications_prescribed_rxnorm_idx ON medications_prescribed(rxnorm_code);
CREATE INDEX IF NOT EXISTS medications_prescribed_controlled_idx ON medications_prescribed(is_controlled_substance) WHERE is_controlled_substance = true;

CREATE INDEX IF NOT EXISTS mar_patient_idx ON medication_administration_record(patient_id);
CREATE INDEX IF NOT EXISTS mar_prescription_idx ON medication_administration_record(prescription_id);
CREATE INDEX IF NOT EXISTS mar_scheduled_time_idx ON medication_administration_record(scheduled_time);
CREATE INDEX IF NOT EXISTS mar_status_idx ON medication_administration_record(status);

CREATE INDEX IF NOT EXISTS med_recon_patient_idx ON medication_reconciliation(patient_id);
CREATE INDEX IF NOT EXISTS med_recon_visit_idx ON medication_reconciliation(visit_id);
CREATE INDEX IF NOT EXISTS med_recon_date_idx ON medication_reconciliation(reconciliation_date DESC);

CREATE INDEX IF NOT EXISTS formulary_generic_idx ON drug_formulary(generic_name);
CREATE INDEX IF NOT EXISTS formulary_rxnorm_idx ON drug_formulary(rxnorm_code);
CREATE INDEX IF NOT EXISTS formulary_tier_idx ON drug_formulary(tier);

CREATE INDEX IF NOT EXISTS drug_interactions_drug1_idx ON drug_interactions(drug1_rxnorm_code);
CREATE INDEX IF NOT EXISTS drug_interactions_drug2_idx ON drug_interactions(drug2_rxnorm_code);
CREATE INDEX IF NOT EXISTS drug_interactions_severity_idx ON drug_interactions(interaction_severity);

-- Enable RLS
ALTER TABLE medications_prescribed ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administration_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications_prescribed
CREATE POLICY "Healthcare providers can view prescriptions"
  ON medications_prescribed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medications_prescribed.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Prescribers can create prescriptions"
  ON medications_prescribed FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = prescriber_id
      AND hp.user_id = auth.uid()
      AND hp.provider_type IN ('Doctor', 'Nurse Practitioner', 'Physician Assistant')
    )
  );

CREATE POLICY "Prescribers can update their prescriptions"
  ON medications_prescribed FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = prescriber_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = prescriber_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for medication_administration_record
CREATE POLICY "Healthcare providers can view administration records"
  ON medication_administration_record FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medication_administration_record.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Nurses can create administration records"
  ON medication_administration_record FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = administered_by
      AND hp.user_id = auth.uid()
      AND hp.provider_type IN ('Nurse', 'Doctor')
    )
  );

-- RLS Policies for medication_reconciliation
CREATE POLICY "Healthcare providers can view reconciliation records"
  ON medication_reconciliation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medication_reconciliation.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create reconciliation records"
  ON medication_reconciliation FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = reconciled_by
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for drug_formulary (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view formulary"
  ON drug_formulary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage formulary"
  ON drug_formulary FOR ALL
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

-- RLS Policies for drug_interactions (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view drug interactions"
  ON drug_interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage drug interactions"
  ON drug_interactions FOR ALL
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

-- Create function to check drug interactions
CREATE OR REPLACE FUNCTION check_drug_interactions(patient_uuid uuid, new_rxnorm_code text)
RETURNS TABLE(
  interaction_id uuid,
  interacting_drug text,
  severity text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    di.id,
    di.drug2_name,
    di.interaction_severity,
    di.description
  FROM medications_prescribed mp
  INNER JOIN drug_interactions di ON di.drug1_rxnorm_code = mp.rxnorm_code
  WHERE mp.patient_id = patient_uuid
    AND mp.status = 'Active'
    AND di.drug2_rxnorm_code = new_rxnorm_code
  UNION
  SELECT 
    di.id,
    di.drug1_name,
    di.interaction_severity,
    di.description
  FROM medications_prescribed mp
  INNER JOIN drug_interactions di ON di.drug2_rxnorm_code = mp.rxnorm_code
  WHERE mp.patient_id = patient_uuid
    AND mp.status = 'Active'
    AND di.drug1_rxnorm_code = new_rxnorm_code;
END;
$$;