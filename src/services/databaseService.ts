import { supabase } from '../lib/supabase';
import {
  ExtractedPatientData,
  PatientVisit,
  Patient,
  PatientMedicalHistory,
  MedicalTest,
  VitalSigns
} from '../types';

export const savePatientVisit = async (
  transcript: string,
  aiJson: any,
  receptionistId: string,
  patientId?: string,
  visitType?: string,
  doctorName?: string,
  nextVisit?: string
): Promise<PatientVisit> => {
  const patientData = aiJson.patient_data || {};
  const symptomsData = aiJson.symptoms_data || [];

  console.log("Vector Protocol: Attempting to save to Supabase...", {
    raw_transcript: transcript,
    patient_data: patientData,
    symptoms_data: symptomsData,
    receptionist_id: receptionistId,
    patient_id: patientId
  });

  const visitData: any = {
    raw_transcript: transcript,
    patient_data: patientData,
    symptoms_data: symptomsData,
    receptionist_id: receptionistId,
  };

  if (patientId) {
    visitData.patient_id = patientId;
  }

  if (visitType) {
    visitData.visit_type = visitType;
  }

  if (doctorName) {
    visitData.doctor_name = doctorName;
  }

  if (nextVisit) {
    visitData.next_visit = nextVisit;
  }

  const { data, error } = await supabase
    .from('patient_visits')
    .insert([visitData])
    .select();

  if (error) {
    console.error("CRITICAL DATABASE FAILURE:", error.message, error.details);
    throw new Error(`Database Error: ${error.message}`);
  }

  console.log("SUCCESS: Data secured in Vault.", data);

  if (!data || data.length === 0) {
    throw new Error('No data returned after saving patient visit');
  }

  return data[0] as PatientVisit;
};

export const getRecentVisits = async (limit: number = 10): Promise<PatientVisit[]> => {
  const { data, error } = await supabase
    .from('patient_visits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent visits: ${error.message}`);
  }

  return (data as PatientVisit[]) || [];
};

export const updatePatientVisit = async (
  visitId: string,
  transcript: string,
  patientData: any,
  symptomsData: any[]
): Promise<void> => {
  if (!Array.isArray(symptomsData)) {
    throw new Error('Symptoms data must be an array');
  }

  if (typeof patientData !== 'object' || patientData === null) {
    throw new Error('Patient data must be an object');
  }

  const { error } = await supabase.rpc('update_patient_visit', {
    row_id: visitId,
    new_transcript: transcript,
    new_patient_data: patientData,
    new_symptoms_data: symptomsData,
  });

  if (error) {
    console.error('Update failed:', error);
    if (error.message.includes('Not authenticated')) {
      throw new Error('You must be logged in to update patient visits');
    } else if (error.message.includes('not found or access denied')) {
      throw new Error('Unable to update: record not found or access denied');
    } else {
      throw new Error(`Failed to update visit: ${error.message}`);
    }
  }
};

export const deletePatientVisit = async (visitId: string): Promise<void> => {
  const { error } = await supabase
    .from('patient_visits')
    .delete()
    .eq('id', visitId);

  if (error) {
    throw new Error(`Failed to delete visit: ${error.message}`);
  }
};

export const createPatient = async (
  patientData: Partial<Patient>,
  receptionistId: string
): Promise<Patient> => {
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...patientData, receptionist_id: receptionistId }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create patient: ${error.message}`);
  }

  return data as Patient;
};

export const searchPatients = async (
  searchTerm: string,
  receptionistId?: string
): Promise<Patient[]> => {
  let query = supabase
    .from('patients')
    .select('*');

  if (searchTerm) {
    query = query.or(
      `full_name.ilike.%${searchTerm}%,cnic.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search patients: ${error.message}`);
  }

  return (data as Patient[]) || [];
};

export const getPatientByCNIC = async (cnic: string): Promise<Patient | null> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('cnic', cnic)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch patient by CNIC: ${error.message}`);
  }

  return data as Patient | null;
};

export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch patient: ${error.message}`);
  }

  return data as Patient | null;
};

export const updatePatient = async (
  patientId: string,
  patientData: Partial<Patient>
): Promise<void> => {
  const { error } = await supabase
    .from('patients')
    .update({ ...patientData, updated_at: new Date().toISOString() })
    .eq('id', patientId);

  if (error) {
    throw new Error(`Failed to update patient: ${error.message}`);
  }
};

export const deletePatient = async (patientId: string): Promise<void> => {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId);

  if (error) {
    throw new Error(`Failed to delete patient: ${error.message}`);
  }
};

export const getRecentPatients = async (
  receptionistId: string,
  limit: number = 10
): Promise<Patient[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('receptionist_id', receptionistId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent patients: ${error.message}`);
  }

  return (data as Patient[]) || [];
};

export const createOrUpdateMedicalHistory = async (
  patientId: string,
  historyData: Partial<PatientMedicalHistory>
): Promise<PatientMedicalHistory> => {
  const { data: existing } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('patient_medical_history')
      .update({ ...historyData, updated_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update medical history: ${error.message}`);
    }

    return data as PatientMedicalHistory;
  } else {
    const { data, error } = await supabase
      .from('patient_medical_history')
      .insert([{ patient_id: patientId, ...historyData }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create medical history: ${error.message}`);
    }

    return data as PatientMedicalHistory;
  }
};

export const getMedicalHistory = async (
  patientId: string
): Promise<PatientMedicalHistory | null> => {
  const { data, error } = await supabase
    .from('patient_medical_history')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch medical history: ${error.message}`);
  }

  return data as PatientMedicalHistory | null;
};

export const createMedicalTest = async (
  testData: Partial<MedicalTest>,
  receptionistId: string
): Promise<MedicalTest> => {
  const { data, error } = await supabase
    .from('medical_tests')
    .insert([{ ...testData, receptionist_id: receptionistId }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create medical test: ${error.message}`);
  }

  return data as MedicalTest;
};

export const getMedicalTests = async (patientId: string): Promise<MedicalTest[]> => {
  const { data, error } = await supabase
    .from('medical_tests')
    .select('*')
    .eq('patient_id', patientId)
    .order('test_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch medical tests: ${error.message}`);
  }

  return (data as MedicalTest[]) || [];
};

export const updateMedicalTest = async (
  testId: string,
  testData: Partial<MedicalTest>
): Promise<void> => {
  const { error } = await supabase
    .from('medical_tests')
    .update({ ...testData, updated_at: new Date().toISOString() })
    .eq('id', testId);

  if (error) {
    throw new Error(`Failed to update medical test: ${error.message}`);
  }
};

export const deleteMedicalTest = async (testId: string): Promise<void> => {
  const { error } = await supabase
    .from('medical_tests')
    .delete()
    .eq('id', testId);

  if (error) {
    throw new Error(`Failed to delete medical test: ${error.message}`);
  }
};

export const createVitalSigns = async (
  vitalSignsData: Partial<VitalSigns>,
  measuredBy: string
): Promise<VitalSigns> => {
  const { data, error } = await supabase
    .from('vital_signs')
    .insert([{ ...vitalSignsData, measured_by: measuredBy }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create vital signs: ${error.message}`);
  }

  return data as VitalSigns;
};

export const getVitalSigns = async (patientId: string): Promise<VitalSigns[]> => {
  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch vital signs: ${error.message}`);
  }

  return (data as VitalSigns[]) || [];
};

export const getPatientVisits = async (patientId: string): Promise<PatientVisit[]> => {
  const { data, error } = await supabase
    .from('patient_visits')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch patient visits: ${error.message}`);
  }

  return (data as PatientVisit[]) || [];
};
