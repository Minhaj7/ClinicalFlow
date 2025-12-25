/*
  # Drop Unused Indexes - Batch 3

  Removing indexes for medication, immunization, and scheduling tables.

  1. Medications and prescriptions
  2. Drug formulary and interactions
  3. Immunizations and screenings
  4. Appointments and scheduling
*/

-- Medications prescribed indexes
DROP INDEX IF EXISTS medications_prescribed_prescriber_idx;
DROP INDEX IF EXISTS medications_prescribed_visit_idx;
DROP INDEX IF EXISTS medications_prescribed_status_idx;
DROP INDEX IF EXISTS medications_prescribed_rxnorm_idx;
DROP INDEX IF EXISTS medications_prescribed_controlled_idx;
DROP INDEX IF EXISTS idx_medications_prescribed_pharmacy_id;

-- Medication administration record indexes
DROP INDEX IF EXISTS mar_patient_idx;
DROP INDEX IF EXISTS mar_prescription_idx;
DROP INDEX IF EXISTS mar_scheduled_time_idx;
DROP INDEX IF EXISTS mar_status_idx;
DROP INDEX IF EXISTS idx_mar_administered_by;

-- Medication reconciliation indexes
DROP INDEX IF EXISTS med_recon_patient_idx;
DROP INDEX IF EXISTS med_recon_visit_idx;
DROP INDEX IF EXISTS med_recon_date_idx;
DROP INDEX IF EXISTS idx_medication_reconciliation_reconciled_by;
DROP INDEX IF EXISTS idx_medication_reconciliation_transition_id;

-- Drug formulary indexes
DROP INDEX IF EXISTS formulary_generic_idx;
DROP INDEX IF EXISTS formulary_rxnorm_idx;
DROP INDEX IF EXISTS formulary_tier_idx;
DROP INDEX IF EXISTS drug_formulary_is_combination_idx;

-- Drug interactions indexes
DROP INDEX IF EXISTS drug_interactions_drug1_idx;
DROP INDEX IF EXISTS drug_interactions_drug2_idx;
DROP INDEX IF EXISTS drug_interactions_severity_idx;

-- Immunizations indexes
DROP INDEX IF EXISTS immunizations_vaccine_idx;
DROP INDEX IF EXISTS immunizations_cvx_idx;
DROP INDEX IF EXISTS idx_immunizations_administered_by;

-- Immunization schedules indexes
DROP INDEX IF EXISTS imm_schedules_vaccine_idx;
DROP INDEX IF EXISTS imm_schedules_age_group_idx;

-- Preventive screenings indexes
DROP INDEX IF EXISTS prev_screenings_patient_idx;
DROP INDEX IF EXISTS prev_screenings_type_idx;
DROP INDEX IF EXISTS prev_screenings_date_idx;
DROP INDEX IF EXISTS idx_preventive_screenings_performed_by;

-- Health maintenance reminders indexes
DROP INDEX IF EXISTS health_reminders_patient_idx;
DROP INDEX IF EXISTS health_reminders_due_date_idx;
DROP INDEX IF EXISTS health_reminders_status_idx;

-- Wellness programs indexes
DROP INDEX IF EXISTS wellness_programs_active_idx;
DROP INDEX IF EXISTS wellness_enrollments_patient_idx;
DROP INDEX IF EXISTS wellness_enrollments_program_idx;
DROP INDEX IF EXISTS wellness_enrollments_status_idx;
DROP INDEX IF EXISTS idx_wellness_program_enrollments_enrolled_by;

-- Appointments indexes
DROP INDEX IF EXISTS appointments_patient_idx;
DROP INDEX IF EXISTS appointments_provider_idx;
DROP INDEX IF EXISTS appointments_status_idx;
DROP INDEX IF EXISTS idx_appointments_appointment_type_id;

-- Provider schedules indexes
DROP INDEX IF EXISTS provider_schedules_provider_idx;
DROP INDEX IF EXISTS provider_schedules_day_idx;
DROP INDEX IF EXISTS provider_schedules_active_idx;

-- Schedule exceptions indexes
DROP INDEX IF EXISTS schedule_exceptions_provider_idx;
DROP INDEX IF EXISTS schedule_exceptions_date_idx;

-- Waitlist indexes
DROP INDEX IF EXISTS waitlist_patient_idx;
DROP INDEX IF EXISTS waitlist_provider_idx;
DROP INDEX IF EXISTS waitlist_status_idx;
DROP INDEX IF EXISTS waitlist_urgency_idx;
DROP INDEX IF EXISTS waitlist_added_date_idx;
DROP INDEX IF EXISTS idx_waitlist_appointment_type_id;

-- Recurring appointments indexes
DROP INDEX IF EXISTS recurring_appts_patient_idx;
DROP INDEX IF EXISTS recurring_appts_provider_idx;
DROP INDEX IF EXISTS recurring_appts_active_idx;
DROP INDEX IF EXISTS idx_recurring_appointments_appointment_type_id;
