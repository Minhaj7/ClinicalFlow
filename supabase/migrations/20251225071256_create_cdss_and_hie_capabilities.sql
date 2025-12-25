/*
  # Create Clinical Decision Support System (CDSS) and Health Information Exchange (HIE)

  ## Overview
  This migration implements clinical decision support for evidence-based care
  and health information exchange for interoperability with external systems.

  ## Changes Made

  ### 1. Clinical Decision Support Tables

  #### clinical_guidelines
  - `id` (uuid, primary key) - Unique guideline identifier
  - `guideline_name` (text, required) - Guideline name
  - `condition` (text, required) - Condition it applies to
  - `guideline_source` (text) - Source (CDC, WHO, etc.)
  - `recommendation` (text, required) - What to do
  - `evidence_level` (text) - Level A, B, C
  - `target_population` (text) - Who it applies to
  - `contraindications` (text) - When not to apply
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### clinical_alerts
  - `id` (uuid, primary key) - Unique alert identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `alert_type` (text, required) - Drug Interaction, Lab Critical, Allergy, etc.
  - `severity` (text, required) - Critical, High, Medium, Low
  - `alert_message` (text, required) - Alert message
  - `details` (jsonb) - Additional details
  - `triggered_by` (text) - What triggered it
  - `is_acknowledged` (boolean) - Whether acknowledged
  - `acknowledged_by` (uuid) - Who acknowledged
  - `acknowledged_at` (timestamptz) - When acknowledged
  - `created_at` (timestamptz) - Record creation timestamp

  #### quality_measures
  - `id` (uuid, primary key) - Unique measure identifier
  - `measure_name` (text, required) - Measure name
  - `measure_type` (text, required) - Process, Outcome, Structure
  - `description` (text) - Measure description
  - `numerator_definition` (text) - What counts as success
  - `denominator_definition` (text) - Eligible population
  - `target_percentage` (numeric) - Target rate
  - `reporting_period` (text) - Annual, Quarterly, etc.
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Health Information Exchange Tables

  #### external_systems
  - `id` (uuid, primary key) - Unique system identifier
  - `system_name` (text, required) - External system name
  - `system_type` (text, required) - EHR, Lab, HIE, Pharmacy, etc.
  - `oid` (text) - Organization OID
  - `endpoint_url` (text) - API endpoint
  - `supported_standards` (text[]) - HL7, FHIR, CCD, etc.
  - `authentication_type` (text) - OAuth, API Key, etc.
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### external_documents
  - `id` (uuid, primary key) - Unique document identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `external_system_id` (uuid) - Source system
  - `document_type` (text, required) - CCD, Lab Result, Imaging, etc.
  - `document_format` (text) - XML, JSON, PDF, etc.
  - `document_url` (text) - Where document is stored
  - `document_date` (date) - Document date
  - `author_organization` (text) - Who created it
  - `author_provider` (text) - Provider name
  - `imported_at` (timestamptz) - When imported
  - `created_at` (timestamptz) - Record creation timestamp

  #### data_exchange_logs
  - `id` (uuid, primary key) - Unique log identifier
  - `patient_id` (uuid) - Patient involved
  - `external_system_id` (uuid, required) - External system
  - `exchange_type` (text, required) - Send, Receive, Query
  - `data_type` (text) - Type of data exchanged
  - `status` (text, required) - Success, Failed, Pending
  - `request_payload` (jsonb) - Request data
  - `response_payload` (jsonb) - Response data
  - `error_message` (text) - Error if failed
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. Analytics Tables

  #### population_health_cohorts
  - `id` (uuid, primary key) - Unique cohort identifier
  - `cohort_name` (text, required) - Cohort name
  - `description` (text) - Cohort description
  - `inclusion_criteria` (jsonb) - Who's included
  - `exclusion_criteria` (jsonb) - Who's excluded
  - `patient_count` (integer) - Current patient count
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### report_templates
  - `id` (uuid, primary key) - Unique template identifier
  - `template_name` (text, required) - Template name
  - `report_type` (text, required) - Clinical, Financial, Quality, etc.
  - `description` (text) - Template description
  - `query_definition` (jsonb) - SQL or query structure
  - `parameters` (jsonb) - Report parameters
  - `output_format` (text) - PDF, Excel, etc.
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. Indexes and RLS
  - Patient lookups where applicable
  - Status and type fields for filtering
  - Date indexes for temporal queries
  - All tables have RLS enabled

  ## Important Notes
  - Clinical guidelines support evidence-based care
  - Alerts prevent medical errors
  - Quality measures track performance
  - External systems enable interoperability
  - Data exchange logs ensure auditability
  - Population health supports preventive care
*/

-- Clinical Decision Support Tables

CREATE TABLE IF NOT EXISTS clinical_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_name text NOT NULL,
  condition text NOT NULL,
  guideline_source text,
  recommendation text NOT NULL,
  evidence_level text CHECK (evidence_level IN ('Level A', 'Level B', 'Level C', 'Expert Opinion')),
  target_population text,
  contraindications text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  alert_message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  triggered_by text,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_measures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_name text NOT NULL UNIQUE,
  measure_type text NOT NULL CHECK (measure_type IN ('Process', 'Outcome', 'Structure', 'Balancing')),
  description text,
  numerator_definition text,
  denominator_definition text,
  target_percentage numeric(5,2),
  reporting_period text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Health Information Exchange Tables

CREATE TABLE IF NOT EXISTS external_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name text NOT NULL UNIQUE,
  system_type text NOT NULL CHECK (system_type IN ('EHR', 'Lab', 'HIE', 'Pharmacy', 'Imaging', 'Other')),
  oid text,
  endpoint_url text,
  supported_standards text[] DEFAULT '{}',
  authentication_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  external_system_id uuid REFERENCES external_systems(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  document_format text,
  document_url text,
  document_date date,
  author_organization text,
  author_provider text,
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_exchange_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  external_system_id uuid NOT NULL REFERENCES external_systems(id) ON DELETE CASCADE,
  exchange_type text NOT NULL CHECK (exchange_type IN ('Send', 'Receive', 'Query')),
  data_type text,
  status text NOT NULL CHECK (status IN ('Success', 'Failed', 'Pending')),
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Analytics Tables

CREATE TABLE IF NOT EXISTS population_health_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name text NOT NULL UNIQUE,
  description text,
  inclusion_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  exclusion_criteria jsonb DEFAULT '{}'::jsonb,
  patient_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  report_type text NOT NULL,
  description text,
  query_definition jsonb,
  parameters jsonb DEFAULT '{}'::jsonb,
  output_format text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS clinical_guidelines_condition_idx ON clinical_guidelines(condition);
CREATE INDEX IF NOT EXISTS clinical_guidelines_active_idx ON clinical_guidelines(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS clinical_alerts_patient_idx ON clinical_alerts(patient_id);
CREATE INDEX IF NOT EXISTS clinical_alerts_severity_idx ON clinical_alerts(severity);
CREATE INDEX IF NOT EXISTS clinical_alerts_ack_idx ON clinical_alerts(is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX IF NOT EXISTS clinical_alerts_created_idx ON clinical_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS quality_measures_type_idx ON quality_measures(measure_type);
CREATE INDEX IF NOT EXISTS quality_measures_active_idx ON quality_measures(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS external_systems_type_idx ON external_systems(system_type);
CREATE INDEX IF NOT EXISTS external_systems_active_idx ON external_systems(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS external_documents_patient_idx ON external_documents(patient_id);
CREATE INDEX IF NOT EXISTS external_documents_system_idx ON external_documents(external_system_id);
CREATE INDEX IF NOT EXISTS external_documents_type_idx ON external_documents(document_type);
CREATE INDEX IF NOT EXISTS external_documents_date_idx ON external_documents(document_date DESC);

CREATE INDEX IF NOT EXISTS data_exchange_logs_patient_idx ON data_exchange_logs(patient_id);
CREATE INDEX IF NOT EXISTS data_exchange_logs_system_idx ON data_exchange_logs(external_system_id);
CREATE INDEX IF NOT EXISTS data_exchange_logs_status_idx ON data_exchange_logs(status);
CREATE INDEX IF NOT EXISTS data_exchange_logs_created_idx ON data_exchange_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS cohorts_active_idx ON population_health_cohorts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS report_templates_type_idx ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS report_templates_active_idx ON report_templates(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE clinical_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exchange_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_health_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view clinical guidelines"
  ON clinical_guidelines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Healthcare providers can view clinical alerts"
  ON clinical_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = clinical_alerts.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can acknowledge alerts"
  ON clinical_alerts FOR UPDATE
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

CREATE POLICY "Authenticated users can view quality measures"
  ON quality_measures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view external systems"
  ON external_systems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Healthcare providers can view external documents"
  ON external_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = external_documents.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "System admins can view exchange logs"
  ON data_exchange_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Healthcare providers can view cohorts"
  ON population_health_cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can view report templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
  );