import { supabase } from '../lib/supabase';
import {
  HealthcareProvider,
  Organization,
  Appointment,
  Problem,
  MedicationPrescribed,
  Referral,
  Immunization,
  ClinicalAlert,
  EncounterNote,
  PatientInsurance,
  BillingEncounter,
  LabResult,
  DrugFormulary
} from '../types';

export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      role:roles(name, description)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
};

export const getHealthcareProvider = async (userId: string) => {
  const { data, error } = await supabase
    .from('healthcare_providers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
};

export const getOrganizationPatients = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAppointments = async (providerId?: string, patientId?: string) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(full_name, phone_number),
      provider:healthcare_providers(id, provider_type, specialty)
    `)
    .order('start_time', { ascending: true });

  if (providerId) {
    query = query.eq('provider_id', providerId);
  }

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createAppointment = async (appointment: Partial<Appointment>) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPatientProblems = async (patientId: string) => {
  const { data, error } = await supabase
    .from('problem_list')
    .select(`
      *,
      provider:healthcare_providers(id, provider_type, specialty)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createProblem = async (problem: Partial<Problem>) => {
  const { data, error } = await supabase
    .from('problem_list')
    .insert(problem)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProblem = async (id: string, updates: Partial<Problem>) => {
  const { data, error } = await supabase
    .from('problem_list')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEncounterNotes = async (patientId: string) => {
  const { data, error } = await supabase
    .from('encounter_notes')
    .select(`
      *,
      provider:healthcare_providers(id, provider_type, specialty)
    `)
    .eq('patient_id', patientId)
    .order('encounter_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const createEncounterNote = async (note: Partial<EncounterNote>) => {
  const { data, error } = await supabase
    .from('encounter_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPatientMedications = async (patientId: string) => {
  const { data, error } = await supabase
    .from('medications_prescribed')
    .select(`
      *,
      prescriber:healthcare_providers(id, provider_type, specialty)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createMedication = async (medication: Partial<MedicationPrescribed>) => {
  const { data, error } = await supabase
    .from('medications_prescribed')
    .insert(medication)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMedication = async (id: string, updates: Partial<MedicationPrescribed>) => {
  const { data, error } = await supabase
    .from('medications_prescribed')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getReferrals = async (patientId?: string, providerId?: string) => {
  let query = supabase
    .from('referrals')
    .select(`
      *,
      patient:patients(full_name, phone_number),
      referring_provider:healthcare_providers!referrals_referring_provider_id_fkey(id, provider_type, specialty)
    `)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  if (providerId) {
    query = query.eq('referring_provider_id', providerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createReferral = async (referral: Partial<Referral>) => {
  const { data, error } = await supabase
    .from('referrals')
    .insert(referral)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getImmunizations = async (patientId: string) => {
  const { data, error } = await supabase
    .from('immunizations')
    .select('*')
    .eq('patient_id', patientId)
    .order('administered_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const createImmunization = async (immunization: Partial<Immunization>) => {
  const { data, error } = await supabase
    .from('immunizations')
    .insert(immunization)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getClinicalAlerts = async (patientId?: string) => {
  let query = supabase
    .from('clinical_alerts')
    .select('*')
    .eq('is_acknowledged', false)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const acknowledgeClinicalAlert = async (alertId: string, userId: string) => {
  const { data, error } = await supabase
    .from('clinical_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPatientInsurance = async (patientId: string) => {
  const { data, error } = await supabase
    .from('patient_insurance')
    .select(`
      *,
      insurance_provider:insurance_providers(name, payer_id, phone)
    `)
    .eq('patient_id', patientId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

export const createPatientInsurance = async (insurance: Partial<PatientInsurance>) => {
  const { data, error } = await supabase
    .from('patient_insurance')
    .insert(insurance)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBillingEncounters = async (patientId?: string) => {
  let query = supabase
    .from('patient_encounters_billing')
    .select(`
      *,
      patient:patients(full_name, phone_number),
      provider:healthcare_providers(id, provider_type)
    `)
    .order('encounter_date', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createBillingEncounter = async (encounter: Partial<BillingEncounter>) => {
  const { data, error } = await supabase
    .from('patient_encounters_billing')
    .insert(encounter)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getDashboardStats = async (userId: string) => {
  const provider = await getHealthcareProvider(userId);

  const stats: any = {
    todayAppointments: 0,
    pendingAlerts: 0,
    activePatients: 0,
    recentActivity: []
  };

  if (provider) {
    const today = new Date().toISOString().split('T')[0];
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('provider_id', provider.id)
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`);

    stats.todayAppointments = appointments?.length || 0;
  }

  const { data: alerts } = await supabase
    .from('clinical_alerts')
    .select('*', { count: 'exact' })
    .eq('is_acknowledged', false);

  stats.pendingAlerts = alerts?.length || 0;

  const { data: patients } = await supabase
    .from('patients')
    .select('*', { count: 'exact' });

  stats.activePatients = patients?.length || 0;

  return stats;
};

export const updateReferral = async (id: string, updates: Partial<Referral>) => {
  const { data, error } = await supabase
    .from('referrals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllReferrals = async () => {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      patient:patients(id, full_name, phone_number, cnic)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateImmunization = async (id: string, updates: Partial<Immunization>) => {
  const { data, error } = await supabase
    .from('immunizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllImmunizations = async () => {
  const { data, error } = await supabase
    .from('immunizations')
    .select(`
      *,
      patient:patients(id, full_name, phone_number, date_of_birth)
    `)
    .order('administered_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateEncounterNote = async (id: string, updates: Partial<EncounterNote>) => {
  const { data, error } = await supabase
    .from('encounter_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const signEncounterNote = async (id: string, signedBy: string) => {
  const { data, error } = await supabase
    .from('encounter_notes')
    .update({
      is_signed: true,
      status: 'Signed',
      signed_by: signedBy,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllEncounterNotes = async () => {
  const { data, error } = await supabase
    .from('encounter_notes')
    .select(`
      *,
      patient:patients(id, full_name, phone_number, cnic)
    `)
    .order('encounter_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getLabResults = async (patientId?: string) => {
  let query = supabase
    .from('lab_results')
    .select(`
      *,
      patient:patients(id, full_name, phone_number, cnic)
    `)
    .order('result_date', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createLabResult = async (labResult: Partial<LabResult>) => {
  const { data, error } = await supabase
    .from('lab_results')
    .insert(labResult)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLabResult = async (id: string, updates: Partial<LabResult>) => {
  const { data, error } = await supabase
    .from('lab_results')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const reviewLabResult = async (id: string, reviewedBy: string) => {
  const { data, error } = await supabase
    .from('lab_results')
    .update({
      is_reviewed: true,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLabResultTrends = async (patientId: string, testName: string) => {
  const { data, error } = await supabase
    .from('lab_results')
    .select('result_value, result_date, interpretation')
    .eq('patient_id', patientId)
    .eq('test_name', testName)
    .order('result_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const getAbnormalLabResults = async () => {
  const { data, error } = await supabase
    .from('lab_results')
    .select(`
      *,
      patient:patients(id, full_name, phone_number)
    `)
    .in('interpretation', ['Abnormal Low', 'Abnormal High', 'Critical Low', 'Critical High'])
    .eq('is_reviewed', false)
    .order('result_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getEnhancedDashboardStats = async (userId: string) => {
  const baseStats = await getDashboardStats(userId);

  const { data: pendingReferrals } = await supabase
    .from('referrals')
    .select('id', { count: 'exact' })
    .in('status', ['Pending', 'Sent']);

  const { data: unsignedNotes } = await supabase
    .from('encounter_notes')
    .select('id', { count: 'exact' })
    .eq('is_signed', false);

  const { data: abnormalLabs } = await supabase
    .from('lab_results')
    .select('id', { count: 'exact' })
    .in('interpretation', ['Abnormal Low', 'Abnormal High', 'Critical Low', 'Critical High'])
    .eq('is_reviewed', false);

  return {
    ...baseStats,
    pendingReferrals: pendingReferrals?.length || 0,
    unsignedNotes: unsignedNotes?.length || 0,
    abnormalLabResults: abnormalLabs?.length || 0
  };
};

export const searchFormularyMedications = async (
  searchTerm: string,
  limit: number = 20
): Promise<DrugFormulary[]> => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('drug_formulary')
    .select('*')
    .eq('is_active', true)
    .or(`medication_name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,therapeutic_class.ilike.%${searchTerm}%`)
    .order('medication_name', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getFormularyMedicationById = async (id: string): Promise<DrugFormulary | null> => {
  const { data, error } = await supabase
    .from('drug_formulary')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFormularyByTherapeuticClass = async (therapeuticClass: string): Promise<DrugFormulary[]> => {
  const { data, error } = await supabase
    .from('drug_formulary')
    .select('*')
    .eq('is_active', true)
    .ilike('therapeutic_class', `%${therapeuticClass}%`)
    .order('medication_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

const specialtyToTherapeuticClasses: Record<string, string[]> = {
  'cardiology': ['Cardiovascular', 'Antihypertensive', 'Anticoagulant', 'Antiarrhythmic', 'Diuretic', 'Beta Blocker', 'ACE Inhibitor', 'Calcium Channel Blocker', 'Statin'],
  'pulmonology': ['Respiratory', 'Bronchodilator', 'Corticosteroid', 'Antihistamine', 'Mucolytic', 'Antitussive'],
  'gastroenterology': ['Gastrointestinal', 'Antacid', 'Proton Pump Inhibitor', 'H2 Blocker', 'Antiemetic', 'Laxative', 'Antidiarrheal'],
  'neurology': ['Neurological', 'CNS', 'Anticonvulsant', 'Antimigraine', 'Antiparkinsonian', 'Muscle Relaxant'],
  'psychiatry': ['Psychotropic', 'Antidepressant', 'Anxiolytic', 'Antipsychotic', 'Mood Stabilizer', 'Sedative', 'Hypnotic'],
  'dermatology': ['Dermatological', 'Topical', 'Antifungal', 'Corticosteroid', 'Antibiotic', 'Retinoid'],
  'orthopedics': ['NSAID', 'Analgesic', 'Muscle Relaxant', 'Calcium', 'Vitamin D', 'Bisphosphonate', 'Anti-inflammatory'],
  'pediatrics': ['Pediatric', 'Antibiotic', 'Antipyretic', 'Analgesic', 'Vitamin', 'Antihistamine', 'Respiratory'],
  'ent': ['ENT', 'Antibiotic', 'Antihistamine', 'Decongestant', 'Corticosteroid', 'Antitussive'],
  'ophthalmology': ['Ophthalmic', 'Eye', 'Antiglaucoma', 'Antibiotic', 'Anti-inflammatory', 'Lubricant'],
  'endocrinology': ['Endocrine', 'Antidiabetic', 'Thyroid', 'Hormone', 'Insulin', 'Corticosteroid'],
  'general medicine': ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antihistamine', 'Antacid', 'Vitamin', 'NSAID', 'Antimicrobial'],
  'internal medicine': ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antihistamine', 'Antacid', 'Vitamin', 'NSAID', 'Antimicrobial', 'Cardiovascular'],
  'family medicine': ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antihistamine', 'Antacid', 'Vitamin', 'NSAID', 'Antimicrobial'],
  'gynecology': ['Hormone', 'Contraceptive', 'Antibiotic', 'Antifungal', 'NSAID', 'Iron', 'Vitamin'],
  'urology': ['Urological', 'Antibiotic', 'Alpha Blocker', 'Antimuscarinic', 'Hormone', 'Analgesic'],
  'nephrology': ['Renal', 'Diuretic', 'Antihypertensive', 'Phosphate Binder', 'Erythropoietin', 'Vitamin D'],
  'oncology': ['Antineoplastic', 'Chemotherapy', 'Antiemetic', 'Analgesic', 'Immunomodulator', 'Supportive Care'],
  'rheumatology': ['Rheumatological', 'NSAID', 'DMARD', 'Corticosteroid', 'Immunosuppressant', 'Biologic', 'Analgesic'],
  'infectious disease': ['Antibiotic', 'Antiviral', 'Antifungal', 'Antiparasitic', 'Antimicrobial', 'Vaccine'],
};

export const getQuickSelectMedicationsBySpecialty = async (specialty: string | null): Promise<DrugFormulary[]> => {
  const normalizedSpecialty = specialty?.toLowerCase().trim() || 'general medicine';

  let therapeuticClasses = specialtyToTherapeuticClasses[normalizedSpecialty];

  if (!therapeuticClasses) {
    for (const [key, classes] of Object.entries(specialtyToTherapeuticClasses)) {
      if (normalizedSpecialty.includes(key) || key.includes(normalizedSpecialty)) {
        therapeuticClasses = classes;
        break;
      }
    }
  }

  if (!therapeuticClasses) {
    therapeuticClasses = specialtyToTherapeuticClasses['general medicine'];
  }

  const orConditions = therapeuticClasses
    .map(tc => `therapeutic_class.ilike.%${tc}%`)
    .join(',');

  const { data, error } = await supabase
    .from('drug_formulary')
    .select('*')
    .eq('is_active', true)
    .or(orConditions)
    .order('medication_name', { ascending: true })
    .limit(15);

  if (error) throw error;
  return data || [];
};

export const ensureHealthcareProvider = async (userId: string): Promise<HealthcareProvider | null> => {
  const existingProvider = await getHealthcareProvider(userId);
  if (existingProvider) {
    return existingProvider;
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select(`
      *,
      role:roles(name)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!userRole) return null;

  const roleName = userRole.role?.name;
  const canPrescribe = ['Doctor', 'Physician', 'Nurse Practitioner', 'Pharmacist'].some(
    r => roleName?.toLowerCase().includes(r.toLowerCase())
  );

  if (!canPrescribe) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  let organizationId = userRole.organization_id;

  if (!organizationId && profile) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', profile.clinic_name)
      .maybeSingle();

    organizationId = org?.id;
  }

  if (!organizationId) return null;

  const { data: newProvider, error } = await supabase
    .from('healthcare_providers')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      provider_type: roleName || 'Doctor',
      specialty: null,
      accepting_new_patients: true,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating healthcare provider:', error);
    return null;
  }

  return newProvider;
};

export const getProviderWithSpecialty = async (userId: string): Promise<{ provider: HealthcareProvider | null; specialty: string | null }> => {
  const provider = await getHealthcareProvider(userId);
  return {
    provider,
    specialty: provider?.specialty || null
  };
};
