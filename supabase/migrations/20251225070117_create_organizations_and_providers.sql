/*
  # Create Organizations and Healthcare Providers System

  ## Overview
  This migration establishes the multi-organization infrastructure for the EHR system,
  allowing multiple healthcare facilities, provider management, care teams, and
  organizational hierarchies. This is essential for care coordination across different
  healthcare settings.

  ## Changes Made

  ### 1. New Tables

  #### organizations
  - `id` (uuid, primary key) - Unique organization identifier
  - `name` (text, required) - Organization name
  - `organization_type` (text, required) - Type: Hospital, Clinic, Laboratory, Pharmacy, etc.
  - `npi_number` (text, unique) - National Provider Identifier
  - `tax_id` (text) - Tax identification number
  - `address` (text) - Physical address
  - `city` (text) - City
  - `state` (text) - State/Province
  - `postal_code` (text) - ZIP/Postal code
  - `country` (text) - Country
  - `phone` (text) - Primary phone number
  - `fax` (text) - Fax number
  - `email` (text) - Contact email
  - `website` (text) - Organization website
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### healthcare_providers
  - `id` (uuid, primary key) - Unique provider identifier
  - `user_id` (uuid, required) - Foreign key to auth.users
  - `organization_id` (uuid, required) - Foreign key to organizations
  - `provider_type` (text, required) - Doctor, Nurse, Specialist, Therapist, etc.
  - `specialty` (text) - Medical specialty
  - `sub_specialty` (text) - Sub-specialty if applicable
  - `npi_number` (text, unique) - Individual NPI number
  - `license_number` (text) - Medical license number
  - `license_state` (text) - State of licensure
  - `dea_number` (text) - DEA number for prescribing
  - `education` (jsonb) - Array of education credentials
  - `certifications` (jsonb) - Array of board certifications
  - `languages_spoken` (text[]) - Array of languages
  - `accepting_new_patients` (boolean) - Availability status
  - `consultation_fee` (numeric) - Standard consultation fee
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### care_teams
  - `id` (uuid, primary key) - Unique care team identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `primary_provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `team_name` (text) - Optional team name
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### care_team_members
  - `id` (uuid, primary key) - Unique member identifier
  - `care_team_id` (uuid, required) - Foreign key to care_teams
  - `provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `role` (text, required) - Role in care team: Primary, Consulting, Specialist, etc.
  - `start_date` (date, required) - Date joined team
  - `end_date` (date) - Date left team
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### organization_relationships
  - `id` (uuid, primary key) - Unique relationship identifier
  - `parent_organization_id` (uuid, required) - Parent organization
  - `child_organization_id` (uuid, required) - Child organization
  - `relationship_type` (text) - Parent/Subsidiary, Affiliate, Partner, Network
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Indexes
  - Fast lookup by NPI numbers for organizations and providers
  - User and organization lookups for providers
  - Patient lookup for care teams
  - Care team lookup for members

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Authenticated users can view organizations and providers
  - Users can manage their own provider profiles
  - Care teams accessible to providers and the patient's receptionist
  - Organization relationships viewable by authenticated users

  ## Important Notes
  - NPI numbers are unique identifiers for organizations and providers
  - Care teams enable coordinated care across multiple providers
  - Organization hierarchies support health system structures
  - Provider credentials stored in JSONB for flexibility
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type text NOT NULL,
  npi_number text UNIQUE,
  tax_id text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'Pakistan',
  phone text,
  fax text,
  email text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create healthcare_providers table
CREATE TABLE IF NOT EXISTS healthcare_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type text NOT NULL,
  specialty text,
  sub_specialty text,
  npi_number text UNIQUE,
  license_number text,
  license_state text,
  dea_number text,
  education jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  languages_spoken text[] DEFAULT '{"English"}',
  accepting_new_patients boolean DEFAULT true,
  consultation_fee numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create care_teams table
CREATE TABLE IF NOT EXISTS care_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  primary_provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  team_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create care_team_members table
CREATE TABLE IF NOT EXISTS care_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_team_id uuid NOT NULL REFERENCES care_teams(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  role text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(care_team_id, provider_id)
);

-- Create organization_relationships table
CREATE TABLE IF NOT EXISTS organization_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (parent_organization_id != child_organization_id),
  UNIQUE(parent_organization_id, child_organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS organizations_npi_idx ON organizations(npi_number);
CREATE INDEX IF NOT EXISTS organizations_type_idx ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS organizations_active_idx ON organizations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS healthcare_providers_user_id_idx ON healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS healthcare_providers_org_id_idx ON healthcare_providers(organization_id);
CREATE INDEX IF NOT EXISTS healthcare_providers_npi_idx ON healthcare_providers(npi_number);
CREATE INDEX IF NOT EXISTS healthcare_providers_specialty_idx ON healthcare_providers(specialty);
CREATE INDEX IF NOT EXISTS healthcare_providers_active_idx ON healthcare_providers(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS care_teams_patient_id_idx ON care_teams(patient_id);
CREATE INDEX IF NOT EXISTS care_teams_primary_provider_idx ON care_teams(primary_provider_id);

CREATE INDEX IF NOT EXISTS care_team_members_team_id_idx ON care_team_members(care_team_id);
CREATE INDEX IF NOT EXISTS care_team_members_provider_id_idx ON care_team_members(provider_id);
CREATE INDEX IF NOT EXISTS care_team_members_active_idx ON care_team_members(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS org_relationships_parent_idx ON organization_relationships(parent_organization_id);
CREATE INDEX IF NOT EXISTS org_relationships_child_idx ON organization_relationships(child_organization_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for healthcare_providers
CREATE POLICY "Authenticated users can view providers"
  ON healthcare_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own provider profile"
  ON healthcare_providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own provider profile"
  ON healthcare_providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for care_teams
CREATE POLICY "Providers can view care teams they are part of"
  ON care_teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members ctm
      INNER JOIN healthcare_providers hp ON hp.id = ctm.provider_id
      WHERE ctm.care_team_id = care_teams.id
      AND hp.user_id = auth.uid()
      AND ctm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = care_teams.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can create care teams"
  ON care_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = primary_provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can update care teams"
  ON care_teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = primary_provider_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = primary_provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for care_team_members
CREATE POLICY "Team members can view their care team memberships"
  ON care_team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM care_teams ct
      INNER JOIN patients p ON p.id = ct.patient_id
      WHERE ct.id = care_team_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can add team members"
  ON care_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_teams ct
      INNER JOIN healthcare_providers hp ON hp.id = ct.primary_provider_id
      WHERE ct.id = care_team_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Primary providers can update team members"
  ON care_team_members FOR UPDATE
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

-- RLS Policies for organization_relationships
CREATE POLICY "Authenticated users can view organization relationships"
  ON organization_relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create organization relationships"
  ON organization_relationships FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organization relationships"
  ON organization_relationships FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);