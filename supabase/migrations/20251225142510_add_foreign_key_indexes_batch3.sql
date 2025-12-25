/*
  # Add Foreign Key Indexes - Batch 3

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Encounter notes table
  2. External documents table
  3. Health maintenance reminders table
  4. Healthcare providers table
  5. Immunizations table
  6. Insurance claims table
  7. Lab results table
*/

-- Encounter notes indexes
CREATE INDEX IF NOT EXISTS idx_encounter_notes_patient_id ON public.encounter_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounter_notes_provider_id ON public.encounter_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_encounter_notes_visit_id ON public.encounter_notes(visit_id);

-- External documents indexes
CREATE INDEX IF NOT EXISTS idx_external_documents_external_system_id ON public.external_documents(external_system_id);
CREATE INDEX IF NOT EXISTS idx_external_documents_patient_id ON public.external_documents(patient_id);

-- Health maintenance reminders indexes
CREATE INDEX IF NOT EXISTS idx_health_maintenance_reminders_patient_id ON public.health_maintenance_reminders(patient_id);

-- Healthcare providers indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_organization_id ON public.healthcare_providers(organization_id);

-- Immunizations indexes
CREATE INDEX IF NOT EXISTS idx_immunizations_administered_by ON public.immunizations(administered_by);

-- Insurance claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_encounter_billing_id ON public.insurance_claims(encounter_billing_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurance_id ON public.insurance_claims(insurance_id);

-- Lab results indexes
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_reviewed_by ON public.lab_results(reviewed_by);
