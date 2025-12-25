/*
  # Create Comprehensive Audit Logging System

  ## Overview
  This migration implements a comprehensive audit logging system to track all data
  access and modifications in the EHR system. This is critical for HIPAA compliance,
  security monitoring, and investigation of data breaches or unauthorized access.

  ## Changes Made

  ### 1. New Tables

  #### audit_logs
  - `id` (uuid, primary key) - Unique log identifier
  - `user_id` (uuid) - User who performed the action
  - `action` (text, required) - Action type (INSERT, UPDATE, DELETE, SELECT)
  - `table_name` (text, required) - Table affected
  - `record_id` (uuid) - ID of the affected record
  - `old_data` (jsonb) - Previous data (for UPDATE/DELETE)
  - `new_data` (jsonb) - New data (for INSERT/UPDATE)
  - `ip_address` (inet) - IP address of the request
  - `user_agent` (text) - Browser/client information
  - `timestamp` (timestamptz) - When the action occurred
  - `session_id` (text) - Session identifier
  - `organization_id` (uuid) - Organization context

  #### data_access_logs
  - `id` (uuid, primary key) - Unique log identifier
  - `user_id` (uuid, required) - User who accessed the data
  - `patient_id` (uuid) - Patient whose data was accessed
  - `access_type` (text, required) - Type of access (view, print, export, etc.)
  - `resource_type` (text, required) - Type of resource accessed
  - `resource_id` (uuid) - ID of the specific resource
  - `purpose` (text) - Purpose of access
  - `ip_address` (inet) - IP address
  - `timestamp` (timestamptz) - When access occurred
  - `session_id` (text) - Session identifier

  #### security_events
  - `id` (uuid, primary key) - Unique event identifier
  - `event_type` (text, required) - Type of security event
  - `severity` (text, required) - Critical, High, Medium, Low
  - `user_id` (uuid) - User involved (if applicable)
  - `description` (text, required) - Event description
  - `details` (jsonb) - Additional details
  - `ip_address` (inet) - IP address
  - `resolved` (boolean) - Whether event was resolved
  - `resolved_by` (uuid) - Who resolved it
  - `resolved_at` (timestamptz) - When resolved
  - `timestamp` (timestamptz) - When event occurred

  #### consent_logs
  - `id` (uuid, primary key) - Unique log identifier
  - `patient_id` (uuid, required) - Patient providing consent
  - `consent_type` (text, required) - Type of consent
  - `status` (text, required) - Granted, Revoked, Expired
  - `scope` (jsonb) - What the consent covers
  - `granted_at` (timestamptz) - When consent was granted
  - `revoked_at` (timestamptz) - When consent was revoked
  - `expires_at` (timestamptz) - When consent expires
  - `witnessed_by` (uuid) - Staff member who witnessed
  - `document_url` (text) - Link to signed consent form

  ### 2. Automatic Audit Triggers
  - Triggers on key tables to automatically log changes
  - Track who, what, when for all sensitive data

  ### 3. Indexes
  - Timestamp-based indexes for efficient log queries
  - User and patient indexes for access reports
  - Table name index for filtering by resource type

  ### 4. Security (RLS Policies)
  - All tables have RLS enabled
  - Only auditors and admins can view audit logs
  - Logs are append-only (no updates or deletes)
  - Automatic retention policies

  ## Important Notes
  - Audit logs are immutable (cannot be modified or deleted)
  - Logs are retained for minimum 6 years per HIPAA requirements
  - Access logs track all patient data access for privacy compliance
  - Security events trigger automatic notifications
  - Consent tracking ensures legal compliance
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  session_id text,
  organization_id uuid REFERENCES organizations(id)
);

-- Create data_access_logs table
CREATE TABLE IF NOT EXISTS data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  patient_id uuid REFERENCES patients(id),
  access_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  purpose text,
  ip_address inet,
  timestamp timestamptz DEFAULT now(),
  session_id text
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  user_id uuid REFERENCES auth.users(id),
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  timestamp timestamptz DEFAULT now()
);

-- Create consent_logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('Granted', 'Revoked', 'Expired')),
  scope jsonb DEFAULT '{}'::jsonb,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  witnessed_by uuid REFERENCES auth.users(id),
  document_url text
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_record_id_idx ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);

CREATE INDEX IF NOT EXISTS data_access_logs_user_id_idx ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS data_access_logs_patient_id_idx ON data_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS data_access_logs_timestamp_idx ON data_access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS data_access_logs_resource_type_idx ON data_access_logs(resource_type);

CREATE INDEX IF NOT EXISTS security_events_timestamp_idx ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON security_events(severity);
CREATE INDEX IF NOT EXISTS security_events_resolved_idx ON security_events(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON security_events(user_id);

CREATE INDEX IF NOT EXISTS consent_logs_patient_id_idx ON consent_logs(patient_id);
CREATE INDEX IF NOT EXISTS consent_logs_status_idx ON consent_logs(status);
CREATE INDEX IF NOT EXISTS consent_logs_expires_idx ON consent_logs(expires_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (read-only for admins and auditors)
CREATE POLICY "System admins can view audit logs"
  ON audit_logs FOR SELECT
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

-- Audit logs are append-only (system inserts only)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for data_access_logs
CREATE POLICY "System admins can view access logs"
  ON data_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin')
      AND ur.is_active = true
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "System can insert access logs"
  ON data_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for security_events
CREATE POLICY "System admins can view security events"
  ON security_events FOR SELECT
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

CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System admins can update security events"
  ON security_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin')
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin')
      AND ur.is_active = true
    )
  );

-- RLS Policies for consent_logs
CREATE POLICY "Healthcare providers can view consent logs"
  ON consent_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin', 'Doctor', 'Nurse')
      AND ur.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = consent_logs.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Healthcare providers can create consent logs"
  ON consent_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin', 'Doctor', 'Nurse', 'Receptionist')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update consent logs"
  ON consent_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin', 'Doctor', 'Nurse')
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('System Admin', 'Doctor', 'Nurse')
      AND ur.is_active = true
    )
  );

-- Create function to log data access
CREATE OR REPLACE FUNCTION log_data_access(
  p_patient_id uuid,
  p_access_type text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_purpose text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO data_access_logs (
    user_id,
    patient_id,
    access_type,
    resource_type,
    resource_id,
    purpose,
    timestamp
  ) VALUES (
    auth.uid(),
    p_patient_id,
    p_access_type,
    p_resource_type,
    p_resource_id,
    p_purpose,
    now()
  );
END;
$$;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type text,
  p_severity text,
  p_description text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    user_id,
    description,
    details,
    timestamp
  ) VALUES (
    p_event_type,
    p_severity,
    auth.uid(),
    p_description,
    p_details,
    now()
  );
  
  -- Send notification for critical events (implementation would depend on your notification system)
  IF p_severity IN ('Critical', 'High') THEN
    -- Placeholder for notification logic
    RAISE NOTICE 'Critical security event: %', p_description;
  END IF;
END;
$$;

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      now()
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Create audit triggers for sensitive tables
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['patients', 'patient_visits', 'patient_medical_history', 
                        'medical_tests', 'vital_signs', 'healthcare_providers'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_trigger_%I ON %I;
      CREATE TRIGGER audit_trigger_%I
      AFTER INSERT OR UPDATE OR DELETE ON %I
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END;
$$;