/*
  # Add Foreign Key Indexes - Batch 7

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Security events table
  2. Shared care plans table
  3. Treatment plans table
  4. User roles table
  5. Waitlist table
  6. Wellness program enrollments table
*/

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_resolved_by ON public.security_events(resolved_by);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);

-- Shared care plans indexes
CREATE INDEX IF NOT EXISTS idx_shared_care_plans_care_team_id ON public.shared_care_plans(care_team_id);
CREATE INDEX IF NOT EXISTS idx_shared_care_plans_patient_id ON public.shared_care_plans(patient_id);

-- Treatment plans indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_problem_id ON public.treatment_plans(problem_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_provider_id ON public.treatment_plans(provider_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by ON public.user_roles(granted_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Waitlist indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_appointment_type_id ON public.waitlist(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_patient_id ON public.waitlist(patient_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_provider_id ON public.waitlist(provider_id);

-- Wellness program enrollments indexes
CREATE INDEX IF NOT EXISTS idx_wellness_program_enrollments_enrolled_by ON public.wellness_program_enrollments(enrolled_by);
CREATE INDEX IF NOT EXISTS idx_wellness_program_enrollments_program_id ON public.wellness_program_enrollments(program_id);
