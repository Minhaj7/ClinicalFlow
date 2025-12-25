/*
  # Add Foreign Key Indexes - Batch 5

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Patient encounters billing table
  2. Patient insurance table
  3. Patient messages table
  4. Patient payments table
  5. Preventive screenings table
  6. Problem list table
*/

-- Patient encounters billing indexes
CREATE INDEX IF NOT EXISTS idx_patient_encounters_billing_patient_id ON public.patient_encounters_billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_encounters_billing_provider_id ON public.patient_encounters_billing(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_encounters_billing_visit_id ON public.patient_encounters_billing(visit_id);

-- Patient insurance indexes
CREATE INDEX IF NOT EXISTS idx_patient_insurance_insurance_provider_id ON public.patient_insurance(insurance_provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON public.patient_insurance(patient_id);

-- Patient messages indexes
CREATE INDEX IF NOT EXISTS idx_patient_messages_parent_message_id ON public.patient_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_patient_id ON public.patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_provider_id ON public.patient_messages(provider_id);

-- Patient payments indexes
CREATE INDEX IF NOT EXISTS idx_patient_payments_encounter_billing_id ON public.patient_payments(encounter_billing_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_patient_id ON public.patient_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_processed_by ON public.patient_payments(processed_by);

-- Preventive screenings indexes
CREATE INDEX IF NOT EXISTS idx_preventive_screenings_patient_id ON public.preventive_screenings(patient_id);
CREATE INDEX IF NOT EXISTS idx_preventive_screenings_performed_by ON public.preventive_screenings(performed_by);

-- Problem list indexes
CREATE INDEX IF NOT EXISTS idx_problem_list_provider_id ON public.problem_list(provider_id);
