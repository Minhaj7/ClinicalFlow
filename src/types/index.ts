export interface ExtractedPatientData {
  patient_name: string | null;
  age: string | null;
  symptoms: string[] | null;
  duration: string | null;
}

export interface Symptom {
  name: string;
  duration?: string | null;
  severity?: string;
}

export interface PatientVisit {
  id: string;
  created_at: string;
  updated_at?: string;
  raw_transcript: string;
  transcript?: string;
  patient_data: {
    name?: string | null;
    patient_name?: string | null;
    age?: string | null;
    gender?: string | null;
  };
  symptoms_data: Symptom[];
  vitals_data?: any;
  tests_data?: any[];
  medicines_data?: any[];
  diagnosis_summary?: string;
  patient_id?: string;
  visit_type?: string;
  doctor_name?: string;
  consultation_fee?: number;
  follow_up_date?: string;
  next_visit?: string;
  visit_notes?: string;
  receptionist_id?: string;
  facility_name?: string;
}

export interface RecordingState {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
}

export interface Patient {
  id: string;
  cnic: string | null;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  marital_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  photo_url: string | null;
  receptionist_id: string;
  facility_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Allergy {
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction: string;
}

export interface ChronicCondition {
  name: string;
  diagnosisDate: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
}

export interface Surgery {
  name: string;
  date: string;
  hospital: string;
}

export interface PatientMedicalHistory {
  id: string;
  patient_id: string;
  known_allergies: Allergy[];
  chronic_conditions: ChronicCondition[];
  current_medications: Medication[];
  past_surgeries: Surgery[];
  family_medical_history: string;
  smoking_status: string;
  alcohol_consumption: string;
  created_at: string;
  updated_at: string;
}

export interface TestValue {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface MedicalTest {
  id: string;
  patient_id: string;
  test_type: string;
  test_date: string;
  lab_name: string;
  test_values: TestValue[];
  doctor_notes: string;
  file_attachments: FileAttachment[];
  receptionist_id: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  visit_id: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  temperature: number | null;
  temperature_unit: string;
  pulse_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  notes: string;
  measured_by: string;
  measured_at: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  npi_number?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface HealthcareProvider {
  id: string;
  user_id: string;
  organization_id: string;
  provider_type: string;
  specialty?: string;
  npi_number?: string;
  license_number?: string;
  accepting_new_patients: boolean;
  consultation_fee?: number;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  organization_id?: string;
  is_active: boolean;
  expires_at?: string;
}

export interface Problem {
  id: string;
  patient_id: string;
  provider_id: string;
  problem_name: string;
  icd10_code?: string;
  status: 'Active' | 'Resolved' | 'Chronic' | 'Inactive';
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  onset_date?: string;
  resolved_date?: string;
  notes?: string;
  created_at: string;
}

export interface EncounterNote {
  id: string;
  patient_id: string;
  provider_id: string;
  encounter_type: string;
  encounter_date: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  review_of_systems?: string;
  subjective?: string;
  objective?: string;
  physical_exam?: Record<string, string>;
  assessment?: string;
  plan?: string;
  diagnoses?: { code: string; description: string }[];
  orders?: string[];
  follow_up_instructions?: string;
  status: 'Draft' | 'Signed' | 'Addendum';
  signed_at?: string;
  signed_by?: string;
  is_signed: boolean;
  created_at: string;
  updated_at?: string;
  patient?: Patient;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'Scheduled' | 'Confirmed' | 'Checked In' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  visit_reason?: string;
  visit_type: 'In Person' | 'Telemedicine' | 'Phone';
  created_at: string;
}

export interface MedicationPrescribed {
  id: string;
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  strength: string;
  dosage_form: string;
  dosage_instructions: string;
  frequency: string;
  quantity: number;
  refills: number;
  start_date: string;
  status: 'Active' | 'Completed' | 'Discontinued' | 'On Hold';
  is_controlled_substance: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  referring_provider_id: string;
  referral_type: 'Consultation' | 'Procedure' | 'Second Opinion' | 'Transfer of Care';
  referred_to_specialty?: string;
  referred_to_facility?: string;
  referred_to_provider?: string;
  reason_for_referral: string;
  clinical_information?: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Sent' | 'Scheduled' | 'Seen' | 'Report Received' | 'Completed' | 'Cancelled';
  requested_timeframe?: string;
  appointment_date?: string;
  notes?: string;
  status_history?: { status: string; date: string; notes?: string }[];
  created_at: string;
  updated_at?: string;
  patient?: Patient;
}

export interface Immunization {
  id: string;
  patient_id: string;
  vaccine_name: string;
  cvx_code?: string;
  manufacturer?: string;
  lot_number: string;
  expiration_date?: string;
  dose_number?: number;
  dose_series?: number;
  administration_site?: 'Left Deltoid' | 'Right Deltoid' | 'Left Thigh' | 'Right Thigh' | 'Left Gluteal' | 'Right Gluteal' | 'Other';
  route?: 'Intramuscular' | 'Subcutaneous' | 'Intradermal' | 'Oral' | 'Nasal' | 'Other';
  administered_date: string;
  administered_by: string;
  administered_by_name?: string;
  adverse_reaction?: boolean;
  adverse_reaction_details?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  patient?: Patient;
}

export interface LabResult {
  id: string;
  patient_id: string;
  test_category: 'Chemistry' | 'Hematology' | 'Urinalysis' | 'Microbiology' | 'Immunology' | 'Coagulation' | 'Endocrine' | 'Other';
  test_name: string;
  test_code?: string;
  result_value: string;
  result_unit?: string;
  reference_range_low?: string;
  reference_range_high?: string;
  interpretation: 'Normal' | 'Abnormal Low' | 'Abnormal High' | 'Critical Low' | 'Critical High' | 'Pending';
  collection_date: string;
  result_date: string;
  ordering_provider?: string;
  performing_lab?: string;
  notes?: string;
  is_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  patient?: Patient;
}

export interface ClinicalAlert {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  alert_message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  payer_id?: string;
  phone?: string;
  is_active: boolean;
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  insurance_provider_id: string;
  policy_number: string;
  policy_holder_name: string;
  coverage_type: 'Primary' | 'Secondary' | 'Tertiary';
  effective_date: string;
  is_active: boolean;
}

export interface BillingEncounter {
  id: string;
  visit_id: string;
  patient_id: string;
  provider_id: string;
  encounter_date: string;
  total_charges: number;
  balance: number;
  billing_status: 'Draft' | 'Submitted' | 'Paid' | 'Denied' | 'Appealed';
  created_at: string;
}

export interface DrugFormulary {
  id: string;
  medication_name: string;
  generic_name: string | null;
  brand_names: string[] | null;
  therapeutic_class: string | null;
  drug_class: string | null;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  formulary_status: 'Preferred' | 'Non-Preferred' | 'Not Covered';
  requires_prior_auth: boolean;
  quantity_limits: string | null;
  step_therapy_required: boolean;
  route_of_administration: string[] | null;
  default_dosage_forms: string[] | null;
  default_strengths: string[] | null;
  is_combination: boolean;
  component_medications: string[] | null;
  is_controlled: boolean;
  dea_schedule: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
