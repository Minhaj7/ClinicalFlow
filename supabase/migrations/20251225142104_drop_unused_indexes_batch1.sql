/*
  # Drop Unused Indexes - Batch 1

  Removing indexes that are not being used to reduce database overhead and improve write performance.
  These indexes were created but never utilized by any queries.

  1. Audit and logging tables
  2. Organization tables
  3. Healthcare provider tables
  4. Care team tables
*/

-- Audit logs indexes
DROP INDEX IF EXISTS audit_logs_record_id_idx;
DROP INDEX IF EXISTS audit_logs_action_idx;
DROP INDEX IF EXISTS audit_logs_user_id_idx;
DROP INDEX IF EXISTS audit_logs_timestamp_idx;
DROP INDEX IF EXISTS audit_logs_table_name_idx;
DROP INDEX IF EXISTS idx_audit_logs_organization_id;

-- Data access logs indexes
DROP INDEX IF EXISTS data_access_logs_user_id_idx;
DROP INDEX IF EXISTS data_access_logs_patient_id_idx;
DROP INDEX IF EXISTS data_access_logs_timestamp_idx;
DROP INDEX IF EXISTS data_access_logs_resource_type_idx;

-- Organizations indexes
DROP INDEX IF EXISTS organizations_npi_idx;
DROP INDEX IF EXISTS organizations_type_idx;
DROP INDEX IF EXISTS organizations_active_idx;

-- Healthcare providers indexes
DROP INDEX IF EXISTS healthcare_providers_org_id_idx;
DROP INDEX IF EXISTS healthcare_providers_npi_idx;
DROP INDEX IF EXISTS healthcare_providers_specialty_idx;
DROP INDEX IF EXISTS healthcare_providers_active_idx;

-- Care teams indexes
DROP INDEX IF EXISTS care_teams_patient_id_idx;
DROP INDEX IF EXISTS care_teams_primary_provider_idx;
DROP INDEX IF EXISTS care_team_members_team_id_idx;
DROP INDEX IF EXISTS care_team_members_provider_id_idx;
DROP INDEX IF EXISTS care_team_members_active_idx;

-- Organization relationships indexes
DROP INDEX IF EXISTS org_relationships_parent_idx;
DROP INDEX IF EXISTS org_relationships_child_idx;

-- Security events indexes
DROP INDEX IF EXISTS security_events_timestamp_idx;
DROP INDEX IF EXISTS security_events_severity_idx;
DROP INDEX IF EXISTS security_events_resolved_idx;
DROP INDEX IF EXISTS security_events_user_id_idx;
DROP INDEX IF EXISTS idx_security_events_resolved_by;

-- Consent logs indexes
DROP INDEX IF EXISTS consent_logs_patient_id_idx;
DROP INDEX IF EXISTS consent_logs_status_idx;
DROP INDEX IF EXISTS consent_logs_expires_idx;
DROP INDEX IF EXISTS idx_consent_logs_witnessed_by;

-- Care transitions indexes
DROP INDEX IF EXISTS care_transitions_patient_id_idx;
DROP INDEX IF EXISTS care_transitions_from_facility_idx;
DROP INDEX IF EXISTS care_transitions_to_facility_idx;
DROP INDEX IF EXISTS care_transitions_date_idx;
DROP INDEX IF EXISTS care_transitions_ack_idx;
DROP INDEX IF EXISTS idx_care_transitions_acknowledged_by;
DROP INDEX IF EXISTS idx_care_transitions_from_provider_id;
DROP INDEX IF EXISTS idx_care_transitions_to_provider_id;

-- Roles and permissions indexes
DROP INDEX IF EXISTS roles_system_idx;
DROP INDEX IF EXISTS permissions_resource_idx;
DROP INDEX IF EXISTS permissions_action_idx;
DROP INDEX IF EXISTS role_permissions_role_idx;
DROP INDEX IF EXISTS role_permissions_permission_idx;
DROP INDEX IF EXISTS user_roles_role_idx;
DROP INDEX IF EXISTS user_roles_org_idx;
DROP INDEX IF EXISTS user_roles_active_idx;
DROP INDEX IF EXISTS idx_user_roles_granted_by;
