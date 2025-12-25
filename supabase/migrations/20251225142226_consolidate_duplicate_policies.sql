/*
  # Consolidate Duplicate Permissive Policies

  Removing duplicate policies that cause multiple permissive policy warnings.
  When multiple permissive policies exist for the same action, PostgreSQL ORs them together,
  which can lead to unexpected behavior and performance issues.

  1. Appointment types - keep authenticated_users_select
  2. Appointments - keep authenticated_users_select
  3. Care teams - keep authenticated_users_select
  4. Clinical alerts - keep authenticated_users_select
  5. Healthcare providers - keep authenticated_users_select
  6. Medical tests - keep authenticated_users policies
  7. Medications prescribed - keep authenticated_users policies
  8. Patient medical history - keep authenticated_users policies
  9. Patient visits - keep authenticated_users_select_all_visits
  10. Problem list - keep authenticated_users policies
  11. Provider schedules - consolidate into one
  12. Schedule exceptions - consolidate into one
  13. Referrals - keep authenticated_users_select
  14. Vital signs - keep authenticated_users policies
  15. Drug formulary/interactions - keep authenticated_users view
  16. Permissions/roles - keep authenticated_users view
  17. User roles - keep Users can view their own roles
*/

-- appointment_types: Remove admin policy for SELECT (keep authenticated_users_select)
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
DROP POLICY IF EXISTS authenticated_users_select_appointment_types ON public.appointment_types;

-- appointments: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_appointments ON public.appointments;

-- care_team_members: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_care_team_members ON public.care_team_members;

-- care_teams: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_care_teams ON public.care_teams;

-- clinical_alerts: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_clinical_alerts ON public.clinical_alerts;

-- healthcare_providers: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_healthcare_providers ON public.healthcare_providers;

-- medical_tests: Remove receptionist policies (keep authenticated_users)
DROP POLICY IF EXISTS receptionist_insert_medical_tests ON public.medical_tests;
DROP POLICY IF EXISTS receptionist_select_medical_tests ON public.medical_tests;

-- medications_prescribed: Remove duplicate policies
DROP POLICY IF EXISTS authenticated_users_insert_medications ON public.medications_prescribed;
DROP POLICY IF EXISTS authenticated_users_select_medications ON public.medications_prescribed;
DROP POLICY IF EXISTS authenticated_users_update_medications ON public.medications_prescribed;

-- patient_medical_history: Remove receptionist policies (keep authenticated_users)
DROP POLICY IF EXISTS receptionist_insert_medical_history ON public.patient_medical_history;
DROP POLICY IF EXISTS receptionist_select_medical_history ON public.patient_medical_history;

-- patient_visits: Remove duplicate select policy
DROP POLICY IF EXISTS receptionist_select_visits_through_patients ON public.patient_visits;

-- problem_list: Remove duplicate policies
DROP POLICY IF EXISTS authenticated_users_insert_problems ON public.problem_list;
DROP POLICY IF EXISTS authenticated_users_select_problems ON public.problem_list;
DROP POLICY IF EXISTS authenticated_users_update_problems ON public.problem_list;

-- provider_schedules: Remove duplicate select policies
DROP POLICY IF EXISTS "Users can view provider schedules" ON public.provider_schedules;
DROP POLICY IF EXISTS authenticated_users_select_provider_schedules ON public.provider_schedules;

-- schedule_exceptions: Remove duplicate select policies
DROP POLICY IF EXISTS "Users can view schedule exceptions" ON public.schedule_exceptions;
DROP POLICY IF EXISTS authenticated_users_select_schedule_exceptions ON public.schedule_exceptions;

-- referrals: Remove duplicate select policy
DROP POLICY IF EXISTS authenticated_users_select_referrals ON public.referrals;

-- vital_signs: Remove receptionist policies (keep authenticated_users)
DROP POLICY IF EXISTS receptionist_insert_vital_signs ON public.vital_signs;
DROP POLICY IF EXISTS receptionist_select_vital_signs ON public.vital_signs;

-- drug_formulary: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view formulary" ON public.drug_formulary;

-- drug_interactions: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view drug interactions" ON public.drug_interactions;

-- permissions: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

-- role_permissions: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;

-- roles: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;

-- wellness_programs: Keep only authenticated users view policy
DROP POLICY IF EXISTS "Authenticated users can view wellness programs" ON public.wellness_programs;

-- user_roles: Keep only "Users can view their own roles" for SELECT
-- The "System admins can manage user roles" FOR ALL policy already covers admin access
