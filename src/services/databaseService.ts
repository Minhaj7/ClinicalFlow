import { supabase } from '../lib/supabase';
import { ExtractedPatientData, PatientVisit } from '../types';

export const savePatientVisit = async (
  transcript: string,
  aiJson: any
): Promise<PatientVisit> => {
  console.log("Vector Protocol: Attempting to save to Supabase...", {
    raw_transcript: transcript,
    patient_data: aiJson.patient_data,
    symptoms_data: aiJson.symptoms_data
  });

  const { data, error } = await supabase
    .from('patient_visits')
    .insert([
      {
        raw_transcript: transcript,
        patient_data: aiJson.patient_data,
        symptoms_data: aiJson.symptoms_data,
      }
    ])
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
