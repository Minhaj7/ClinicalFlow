/*
  # Fix RLS Performance Issues

  1. Performance Fixes
    - Wrap auth.<function>() calls with (select auth.<function>()) for better query planning
    - This prevents re-evaluation of auth functions for each row

  2. Policy Consolidation
    - Remove duplicate permissive policies where they exist
*/

-- Drop and recreate policies with optimized auth function calls
-- drug_formulary
DROP POLICY IF EXISTS "System admins can manage formulary" ON public.drug_formulary;
CREATE POLICY "System admins can manage formulary" ON public.drug_formulary
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- permissions
DROP POLICY IF EXISTS "System admins can manage permissions" ON public.permissions;
CREATE POLICY "System admins can manage permissions" ON public.permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- role_permissions
DROP POLICY IF EXISTS "System admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "System admins can manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- user_roles - drop duplicate and outdated policies
DROP POLICY IF EXISTS "System admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "System admins can update role assignments" ON public.user_roles;
DROP POLICY IF EXISTS "System admins can revoke roles" ON public.user_roles;
DROP POLICY IF EXISTS "System admins can manage user roles" ON public.user_roles;

CREATE POLICY "System admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- audit_logs
DROP POLICY IF EXISTS "System admins can view audit logs" ON public.audit_logs;
CREATE POLICY "System admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- data_access_logs
DROP POLICY IF EXISTS "System admins can view access logs" ON public.data_access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON public.data_access_logs;

CREATE POLICY "System admins can view access logs" ON public.data_access_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System can insert access logs" ON public.data_access_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- security_events
DROP POLICY IF EXISTS "System admins can view security events" ON public.security_events;
DROP POLICY IF EXISTS "System admins can update security events" ON public.security_events;

CREATE POLICY "System admins can view security events" ON public.security_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can update security events" ON public.security_events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- consent_logs
DROP POLICY IF EXISTS "Healthcare providers can view consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Healthcare providers can create consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Healthcare providers can update consent logs" ON public.consent_logs;

CREATE POLICY "Healthcare providers can view consent logs" ON public.consent_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can create consent logs" ON public.consent_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update consent logs" ON public.consent_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- treatment_plans
DROP POLICY IF EXISTS "Healthcare providers can create treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Healthcare providers can update treatment plans" ON public.treatment_plans;

CREATE POLICY "Healthcare providers can create treatment plans" ON public.treatment_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update treatment plans" ON public.treatment_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- care_transitions
DROP POLICY IF EXISTS "Providers can create care transitions" ON public.care_transitions;
DROP POLICY IF EXISTS "Providers can view care transitions for their facilities" ON public.care_transitions;
DROP POLICY IF EXISTS "Providers can update care transitions" ON public.care_transitions;
DROP POLICY IF EXISTS "authenticated_users_select_care_transitions" ON public.care_transitions;

CREATE POLICY "Providers can view care transitions" ON public.care_transitions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers hp
      WHERE hp.user_id = (select auth.uid()) AND hp.is_active = true
    )
  );

CREATE POLICY "Providers can create care transitions" ON public.care_transitions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers hp
      WHERE hp.user_id = (select auth.uid()) AND hp.is_active = true
    )
  );

CREATE POLICY "Providers can update care transitions" ON public.care_transitions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers hp
      WHERE hp.user_id = (select auth.uid()) AND hp.is_active = true
    )
  );

-- progress_notes
DROP POLICY IF EXISTS "Healthcare providers can create progress notes" ON public.progress_notes;
CREATE POLICY "Healthcare providers can create progress notes" ON public.progress_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- clinical_orders
DROP POLICY IF EXISTS "Healthcare providers can create clinical orders" ON public.clinical_orders;
DROP POLICY IF EXISTS "Healthcare providers can update clinical orders" ON public.clinical_orders;

CREATE POLICY "Healthcare providers can create clinical orders" ON public.clinical_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update clinical orders" ON public.clinical_orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- discharge_summaries
DROP POLICY IF EXISTS "Healthcare providers can create discharge summaries" ON public.discharge_summaries;
DROP POLICY IF EXISTS "Healthcare providers can update discharge summaries" ON public.discharge_summaries;

CREATE POLICY "Healthcare providers can create discharge summaries" ON public.discharge_summaries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update discharge summaries" ON public.discharge_summaries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- medication_reconciliation
DROP POLICY IF EXISTS "Providers can create reconciliation records" ON public.medication_reconciliation;
DROP POLICY IF EXISTS "Healthcare providers can view reconciliation records" ON public.medication_reconciliation;
DROP POLICY IF EXISTS "authenticated_users_select_medication_reconciliation" ON public.medication_reconciliation;

CREATE POLICY "Providers can create reconciliation records" ON public.medication_reconciliation
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can view reconciliation records" ON public.medication_reconciliation
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- care_coordination_notes
DROP POLICY IF EXISTS "Care team members can view coordination notes" ON public.care_coordination_notes;
DROP POLICY IF EXISTS "Care team members can create coordination notes" ON public.care_coordination_notes;

CREATE POLICY "Care team members can view coordination notes" ON public.care_coordination_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Care team members can create coordination notes" ON public.care_coordination_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- shared_care_plans
DROP POLICY IF EXISTS "Care team members can view shared care plans" ON public.shared_care_plans;
DROP POLICY IF EXISTS "Primary providers can create shared care plans" ON public.shared_care_plans;
DROP POLICY IF EXISTS "Primary providers can update shared care plans" ON public.shared_care_plans;

CREATE POLICY "Care team members can view shared care plans" ON public.shared_care_plans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Primary providers can create shared care plans" ON public.shared_care_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Primary providers can update shared care plans" ON public.shared_care_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- medication_administration_record
DROP POLICY IF EXISTS "Healthcare providers can view administration records" ON public.medication_administration_record;
DROP POLICY IF EXISTS "Nurses can create administration records" ON public.medication_administration_record;
DROP POLICY IF EXISTS "authenticated_users_select_mar" ON public.medication_administration_record;

CREATE POLICY "Healthcare providers can view administration records" ON public.medication_administration_record
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Nurses can create administration records" ON public.medication_administration_record
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- drug_interactions
DROP POLICY IF EXISTS "System admins can manage drug interactions" ON public.drug_interactions;
CREATE POLICY "System admins can manage drug interactions" ON public.drug_interactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- preventive_screenings
DROP POLICY IF EXISTS "Healthcare providers can view screenings" ON public.preventive_screenings;
DROP POLICY IF EXISTS "Healthcare providers can create screening records" ON public.preventive_screenings;
DROP POLICY IF EXISTS "Healthcare providers can update screening records" ON public.preventive_screenings;

CREATE POLICY "Healthcare providers can view screenings" ON public.preventive_screenings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can create screening records" ON public.preventive_screenings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update screening records" ON public.preventive_screenings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- health_maintenance_reminders
DROP POLICY IF EXISTS "Healthcare providers can view reminders" ON public.health_maintenance_reminders;
DROP POLICY IF EXISTS "Healthcare providers can create reminders" ON public.health_maintenance_reminders;
DROP POLICY IF EXISTS "Healthcare providers can update reminders" ON public.health_maintenance_reminders;

CREATE POLICY "Healthcare providers can view reminders" ON public.health_maintenance_reminders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can create reminders" ON public.health_maintenance_reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update reminders" ON public.health_maintenance_reminders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- wellness_programs
DROP POLICY IF EXISTS "System admins can manage wellness programs" ON public.wellness_programs;
CREATE POLICY "System admins can manage wellness programs" ON public.wellness_programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- wellness_program_enrollments
DROP POLICY IF EXISTS "Healthcare providers can view enrollments" ON public.wellness_program_enrollments;
DROP POLICY IF EXISTS "Healthcare providers can enroll patients" ON public.wellness_program_enrollments;
DROP POLICY IF EXISTS "Healthcare providers can update enrollments" ON public.wellness_program_enrollments;

CREATE POLICY "Healthcare providers can view enrollments" ON public.wellness_program_enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can enroll patients" ON public.wellness_program_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Healthcare providers can update enrollments" ON public.wellness_program_enrollments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- appointment_types
DROP POLICY IF EXISTS "System admins can manage appointment types" ON public.appointment_types;
CREATE POLICY "System admins can manage appointment types" ON public.appointment_types
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- provider_schedules
DROP POLICY IF EXISTS "Providers can manage their schedules" ON public.provider_schedules;
CREATE POLICY "Providers can manage their schedules" ON public.provider_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid())
      AND id = provider_schedules.provider_id
      AND is_active = true
    )
  );

-- schedule_exceptions
DROP POLICY IF EXISTS "Providers can manage their exceptions" ON public.schedule_exceptions;
CREATE POLICY "Providers can manage their exceptions" ON public.schedule_exceptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid())
      AND id = schedule_exceptions.provider_id
      AND is_active = true
    )
  );

-- waitlist
DROP POLICY IF EXISTS "Staff can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Staff can manage waitlist" ON public.waitlist;

CREATE POLICY "Staff can manage waitlist" ON public.waitlist
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- recurring_appointments
DROP POLICY IF EXISTS "Staff can view recurring appointments" ON public.recurring_appointments;
DROP POLICY IF EXISTS "Staff can manage recurring appointments" ON public.recurring_appointments;

CREATE POLICY "Staff can manage recurring appointments" ON public.recurring_appointments
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- patient_portal_users
DROP POLICY IF EXISTS "Patients can view their own portal access" ON public.patient_portal_users;
CREATE POLICY "Patients can view their own portal access" ON public.patient_portal_users
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- patient_messages
DROP POLICY IF EXISTS "Patients can view their messages" ON public.patient_messages;
CREATE POLICY "Patients can view their messages" ON public.patient_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_portal_users ppu
      WHERE ppu.user_id = (select auth.uid())
      AND ppu.patient_id = patient_messages.patient_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid())
      AND id = patient_messages.provider_id
    )
  );

-- insurance_claims
DROP POLICY IF EXISTS "Staff can view insurance claims" ON public.insurance_claims;
CREATE POLICY "Staff can view insurance claims" ON public.insurance_claims
  FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- external_documents
DROP POLICY IF EXISTS "Healthcare providers can view external documents" ON public.external_documents;
CREATE POLICY "Healthcare providers can view external documents" ON public.external_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- data_exchange_logs
DROP POLICY IF EXISTS "System admins can view exchange logs" ON public.data_exchange_logs;
CREATE POLICY "System admins can view exchange logs" ON public.data_exchange_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- population_health_cohorts
DROP POLICY IF EXISTS "Healthcare providers can view cohorts" ON public.population_health_cohorts;
CREATE POLICY "Healthcare providers can view cohorts" ON public.population_health_cohorts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- report_templates
DROP POLICY IF EXISTS "Healthcare providers can view report templates" ON public.report_templates;
CREATE POLICY "Healthcare providers can view report templates" ON public.report_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.healthcare_providers
      WHERE user_id = (select auth.uid()) AND is_active = true
    )
  );

-- roles
DROP POLICY IF EXISTS "System admins can manage roles" ON public.roles;
CREATE POLICY "System admins can manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );
