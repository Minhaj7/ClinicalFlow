/*
  # Drop Unused Indexes - Batch 4

  Removing indexes for patient portal, billing, clinical decision support, and other tables.

  1. Patient portal and messaging
  2. Insurance and billing
  3. Clinical guidelines and alerts
  4. External systems and documents
  5. Miscellaneous tables
*/

-- Patient portal users indexes
DROP INDEX IF EXISTS patient_portal_users_patient_idx;
DROP INDEX IF EXISTS patient_portal_users_active_idx;

-- Patient messages indexes
DROP INDEX IF EXISTS patient_messages_patient_idx;
DROP INDEX IF EXISTS patient_messages_provider_idx;
DROP INDEX IF EXISTS patient_messages_created_idx;
DROP INDEX IF EXISTS patient_messages_unread_idx;
DROP INDEX IF EXISTS idx_patient_messages_parent_message_id;

-- Patient insurance indexes
DROP INDEX IF EXISTS patient_insurance_patient_idx;
DROP INDEX IF EXISTS patient_insurance_provider_idx;
DROP INDEX IF EXISTS patient_insurance_active_idx;

-- Billing codes indexes
DROP INDEX IF EXISTS billing_codes_code_idx;
DROP INDEX IF EXISTS billing_codes_type_idx;

-- Patient encounters billing indexes
DROP INDEX IF EXISTS encounters_billing_patient_idx;
DROP INDEX IF EXISTS encounters_billing_visit_idx;
DROP INDEX IF EXISTS encounters_billing_provider_idx;
DROP INDEX IF EXISTS encounters_billing_status_idx;
DROP INDEX IF EXISTS encounters_billing_date_idx;

-- Insurance claims indexes
DROP INDEX IF EXISTS insurance_claims_encounter_idx;
DROP INDEX IF EXISTS insurance_claims_insurance_idx;
DROP INDEX IF EXISTS insurance_claims_status_idx;
DROP INDEX IF EXISTS insurance_claims_submission_idx;

-- Patient payments indexes
DROP INDEX IF EXISTS patient_payments_patient_idx;
DROP INDEX IF EXISTS patient_payments_encounter_idx;
DROP INDEX IF EXISTS patient_payments_date_idx;
DROP INDEX IF EXISTS idx_patient_payments_processed_by;

-- Clinical guidelines indexes
DROP INDEX IF EXISTS clinical_guidelines_condition_idx;
DROP INDEX IF EXISTS clinical_guidelines_active_idx;

-- Clinical alerts indexes
DROP INDEX IF EXISTS clinical_alerts_patient_idx;
DROP INDEX IF EXISTS clinical_alerts_severity_idx;
DROP INDEX IF EXISTS idx_clinical_alerts_acknowledged_by;

-- Quality measures indexes
DROP INDEX IF EXISTS quality_measures_type_idx;
DROP INDEX IF EXISTS quality_measures_active_idx;

-- External systems indexes
DROP INDEX IF EXISTS external_systems_type_idx;
DROP INDEX IF EXISTS external_systems_active_idx;

-- External documents indexes
DROP INDEX IF EXISTS external_documents_patient_idx;
DROP INDEX IF EXISTS external_documents_system_idx;
DROP INDEX IF EXISTS external_documents_type_idx;
DROP INDEX IF EXISTS external_documents_date_idx;

-- Data exchange logs indexes
DROP INDEX IF EXISTS data_exchange_logs_patient_idx;
DROP INDEX IF EXISTS data_exchange_logs_system_idx;
DROP INDEX IF EXISTS data_exchange_logs_status_idx;
DROP INDEX IF EXISTS data_exchange_logs_created_idx;

-- Population health cohorts indexes
DROP INDEX IF EXISTS cohorts_active_idx;

-- Report templates indexes
DROP INDEX IF EXISTS report_templates_type_idx;
DROP INDEX IF EXISTS report_templates_active_idx;

-- Patient visits and patients indexes
DROP INDEX IF EXISTS patient_visits_facility_name_idx;
DROP INDEX IF EXISTS patients_facility_name_idx;

-- Lab results indexes
DROP INDEX IF EXISTS idx_lab_results_patient_id;
DROP INDEX IF EXISTS idx_lab_results_test_category;
DROP INDEX IF EXISTS idx_lab_results_reviewed_by;

-- Medical tests indexes
DROP INDEX IF EXISTS idx_medical_tests_receptionist_id;
