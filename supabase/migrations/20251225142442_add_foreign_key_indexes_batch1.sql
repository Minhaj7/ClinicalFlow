/*
  # Add Foreign Key Indexes - Batch 1

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Appointments table
  2. Audit logs table
  3. Care coordination notes table
  4. Care team members table
  5. Care teams table
  6. Care transitions table
*/

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type_id ON public.appointments(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Care coordination notes indexes
CREATE INDEX IF NOT EXISTS idx_care_coordination_notes_author_id ON public.care_coordination_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_care_coordination_notes_care_team_id ON public.care_coordination_notes(care_team_id);
CREATE INDEX IF NOT EXISTS idx_care_coordination_notes_patient_id ON public.care_coordination_notes(patient_id);

-- Care team members indexes
CREATE INDEX IF NOT EXISTS idx_care_team_members_provider_id ON public.care_team_members(provider_id);

-- Care teams indexes
CREATE INDEX IF NOT EXISTS idx_care_teams_patient_id ON public.care_teams(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_teams_primary_provider_id ON public.care_teams(primary_provider_id);

-- Care transitions indexes
CREATE INDEX IF NOT EXISTS idx_care_transitions_acknowledged_by ON public.care_transitions(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_care_transitions_from_facility_id ON public.care_transitions(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_care_transitions_from_provider_id ON public.care_transitions(from_provider_id);
CREATE INDEX IF NOT EXISTS idx_care_transitions_patient_id ON public.care_transitions(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_transitions_to_facility_id ON public.care_transitions(to_facility_id);
CREATE INDEX IF NOT EXISTS idx_care_transitions_to_provider_id ON public.care_transitions(to_provider_id);
