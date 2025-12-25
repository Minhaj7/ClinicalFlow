/*
  # Add Foreign Key Indexes - Batch 4

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Medical tests table
  2. Medication administration record table
  3. Medication reconciliation table
  4. Medications prescribed table
  5. Organization relationships table
*/

-- Medical tests indexes
CREATE INDEX IF NOT EXISTS idx_medical_tests_receptionist_id ON public.medical_tests(receptionist_id);

-- Medication administration record indexes
CREATE INDEX IF NOT EXISTS idx_mar_administered_by ON public.medication_administration_record(administered_by);
CREATE INDEX IF NOT EXISTS idx_mar_patient_id ON public.medication_administration_record(patient_id);
CREATE INDEX IF NOT EXISTS idx_mar_prescription_id ON public.medication_administration_record(prescription_id);

-- Medication reconciliation indexes
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_patient_id ON public.medication_reconciliation(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_reconciled_by ON public.medication_reconciliation(reconciled_by);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_transition_id ON public.medication_reconciliation(transition_id);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_visit_id ON public.medication_reconciliation(visit_id);

-- Medications prescribed indexes
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_pharmacy_id ON public.medications_prescribed(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_prescriber_id ON public.medications_prescribed(prescriber_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_visit_id ON public.medications_prescribed(visit_id);

-- Organization relationships indexes
CREATE INDEX IF NOT EXISTS idx_org_relationships_child_org_id ON public.organization_relationships(child_organization_id);
