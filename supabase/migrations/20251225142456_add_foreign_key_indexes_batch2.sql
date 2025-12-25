/*
  # Add Foreign Key Indexes - Batch 2

  Adding indexes for foreign keys to improve JOIN performance.
  
  1. Clinical alerts table
  2. Clinical orders table
  3. Consent logs table
  4. Data access logs table
  5. Data exchange logs table
  6. Discharge summaries table
*/

-- Clinical alerts indexes
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_acknowledged_by ON public.clinical_alerts(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient_id ON public.clinical_alerts(patient_id);

-- Clinical orders indexes
CREATE INDEX IF NOT EXISTS idx_clinical_orders_patient_id ON public.clinical_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_performed_by ON public.clinical_orders(performed_by);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_provider_id ON public.clinical_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_visit_id ON public.clinical_orders(visit_id);

-- Consent logs indexes
CREATE INDEX IF NOT EXISTS idx_consent_logs_patient_id ON public.consent_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_witnessed_by ON public.consent_logs(witnessed_by);

-- Data access logs indexes
CREATE INDEX IF NOT EXISTS idx_data_access_logs_patient_id ON public.data_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON public.data_access_logs(user_id);

-- Data exchange logs indexes
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_external_system_id ON public.data_exchange_logs(external_system_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_logs_patient_id ON public.data_exchange_logs(patient_id);

-- Discharge summaries indexes
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON public.discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_provider_id ON public.discharge_summaries(provider_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_visit_id ON public.discharge_summaries(visit_id);
