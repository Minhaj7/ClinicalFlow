/*
  # Add Foreign Key Indexes - Batch 6

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Progress notes table
  2. Provider schedules table
  3. Recurring appointments table
  4. Referrals table
  5. Role permissions table
*/

-- Progress notes indexes
CREATE INDEX IF NOT EXISTS idx_progress_notes_patient_id ON public.progress_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_problem_id ON public.progress_notes(problem_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_provider_id ON public.progress_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_treatment_plan_id ON public.progress_notes(treatment_plan_id);

-- Provider schedules indexes
CREATE INDEX IF NOT EXISTS idx_provider_schedules_provider_id ON public.provider_schedules(provider_id);

-- Recurring appointments indexes
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_appointment_type_id ON public.recurring_appointments(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_patient_id ON public.recurring_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_provider_id ON public.recurring_appointments(provider_id);

-- Referrals indexes
CREATE INDEX IF NOT EXISTS idx_referrals_patient_id ON public.referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_to_organization_id ON public.referrals(referred_to_organization_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_to_provider_id ON public.referrals(referred_to_provider_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referring_provider_id ON public.referrals(referring_provider_id);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
