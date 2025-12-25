/*
  # Drop Unused Indexes - Batch 2

  Removing indexes for clinical and medical tables.

  1. Problem list and encounter notes
  2. Treatment plans and progress notes
  3. Clinical orders and discharge summaries
  4. Referrals and care coordination
*/

-- Problem list indexes
DROP INDEX IF EXISTS problem_list_provider_id_idx;
DROP INDEX IF EXISTS problem_list_status_idx;
DROP INDEX IF EXISTS problem_list_icd10_idx;

-- Encounter notes indexes
DROP INDEX IF EXISTS encounter_notes_patient_id_idx;
DROP INDEX IF EXISTS encounter_notes_provider_id_idx;
DROP INDEX IF EXISTS encounter_notes_visit_id_idx;
DROP INDEX IF EXISTS encounter_notes_signed_idx;

-- Treatment plans indexes
DROP INDEX IF EXISTS treatment_plans_patient_id_idx;
DROP INDEX IF EXISTS treatment_plans_problem_id_idx;
DROP INDEX IF EXISTS treatment_plans_provider_id_idx;
DROP INDEX IF EXISTS treatment_plans_status_idx;

-- Progress notes indexes
DROP INDEX IF EXISTS progress_notes_patient_id_idx;
DROP INDEX IF EXISTS progress_notes_problem_id_idx;
DROP INDEX IF EXISTS progress_notes_date_idx;
DROP INDEX IF EXISTS idx_progress_notes_provider_id;
DROP INDEX IF EXISTS idx_progress_notes_treatment_plan_id;

-- Clinical orders indexes
DROP INDEX IF EXISTS clinical_orders_patient_id_idx;
DROP INDEX IF EXISTS clinical_orders_provider_id_idx;
DROP INDEX IF EXISTS clinical_orders_status_idx;
DROP INDEX IF EXISTS clinical_orders_type_idx;
DROP INDEX IF EXISTS clinical_orders_ordered_at_idx;
DROP INDEX IF EXISTS idx_clinical_orders_performed_by;
DROP INDEX IF EXISTS idx_clinical_orders_visit_id;

-- Discharge summaries indexes
DROP INDEX IF EXISTS discharge_summaries_patient_id_idx;
DROP INDEX IF EXISTS discharge_summaries_visit_id_idx;
DROP INDEX IF EXISTS discharge_summaries_discharge_date_idx;
DROP INDEX IF EXISTS idx_discharge_summaries_provider_id;

-- Referrals indexes
DROP INDEX IF EXISTS referrals_patient_id_idx;
DROP INDEX IF EXISTS referrals_referring_provider_idx;
DROP INDEX IF EXISTS referrals_referred_to_provider_idx;
DROP INDEX IF EXISTS referrals_priority_idx;
DROP INDEX IF EXISTS idx_referrals_referred_to_organization_id;

-- Care coordination indexes
DROP INDEX IF EXISTS care_coordination_notes_patient_id_idx;
DROP INDEX IF EXISTS care_coordination_notes_team_id_idx;
DROP INDEX IF EXISTS care_coordination_notes_author_idx;
DROP INDEX IF EXISTS care_coordination_notes_created_idx;

-- Shared care plans indexes
DROP INDEX IF EXISTS shared_care_plans_patient_id_idx;
DROP INDEX IF EXISTS shared_care_plans_team_id_idx;
DROP INDEX IF EXISTS shared_care_plans_active_idx;
