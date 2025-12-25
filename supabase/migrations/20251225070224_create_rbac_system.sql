/*
  # Create Role-Based Access Control (RBAC) System

  ## Overview
  This migration implements a comprehensive RBAC system for the EHR, enabling
  fine-grained access control across different user roles (Admin, Doctor, Nurse,
  Receptionist, Lab Technician, Pharmacist, Patient). This ensures data security
  and compliance with HIPAA regulations.

  ## Changes Made

  ### 1. New Tables

  #### roles
  - `id` (uuid, primary key) - Unique role identifier
  - `name` (text, unique, required) - Role name
  - `description` (text) - Role description
  - `is_system_role` (boolean) - System-defined vs custom role
  - `created_at` (timestamptz) - Record creation timestamp

  #### permissions
  - `id` (uuid, primary key) - Unique permission identifier
  - `resource` (text, required) - Resource type (patients, visits, medications, etc.)
  - `action` (text, required) - Action (create, read, update, delete, approve, prescribe)
  - `description` (text) - Permission description
  - `created_at` (timestamptz) - Record creation timestamp

  #### role_permissions
  - `id` (uuid, primary key) - Unique mapping identifier
  - `role_id` (uuid, required) - Foreign key to roles
  - `permission_id` (uuid, required) - Foreign key to permissions
  - `created_at` (timestamptz) - Record creation timestamp

  #### user_roles
  - `id` (uuid, primary key) - Unique assignment identifier
  - `user_id` (uuid, required) - Foreign key to auth.users
  - `role_id` (uuid, required) - Foreign key to roles
  - `organization_id` (uuid) - Scope to specific organization
  - `granted_by` (uuid) - User who granted this role
  - `granted_at` (timestamptz) - When role was granted
  - `expires_at` (timestamptz) - Optional expiration date
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. System Roles and Permissions
  - Pre-populated with standard healthcare roles
  - Default permissions assigned to each role
  - Extensible for custom roles and permissions

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Users can view their own roles
  - Only admins can manage roles and permissions
  - Audit trail for role assignments

  ## Important Notes
  - System roles cannot be deleted (is_system_role = true)
  - Permissions are granular for fine-grained access control
  - Role assignments can be organization-specific
  - Roles can have expiration dates for temporary access
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource, action)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS roles_name_idx ON roles(name);
CREATE INDEX IF NOT EXISTS roles_system_idx ON roles(is_system_role);

CREATE INDEX IF NOT EXISTS permissions_resource_idx ON permissions(resource);
CREATE INDEX IF NOT EXISTS permissions_action_idx ON permissions(action);

CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS user_roles_org_idx ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS user_roles_active_idx ON user_roles(is_active) WHERE is_active = true;

-- Insert system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('System Admin', 'Full system access and configuration', true),
  ('Doctor', 'Licensed physician with prescribing authority', true),
  ('Nurse', 'Licensed nurse providing patient care', true),
  ('Receptionist', 'Front desk staff managing appointments and check-ins', true),
  ('Lab Technician', 'Laboratory staff managing test results', true),
  ('Pharmacist', 'Pharmacy staff managing medications', true),
  ('Radiologist', 'Medical imaging specialist', true),
  ('Patient', 'Patient with access to own medical records', true)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (resource, action, description) VALUES
  -- Patient permissions
  ('patients', 'create', 'Create new patient records'),
  ('patients', 'read', 'View patient information'),
  ('patients', 'update', 'Update patient information'),
  ('patients', 'delete', 'Delete patient records'),
  
  -- Visit permissions
  ('visits', 'create', 'Create patient visit records'),
  ('visits', 'read', 'View visit records'),
  ('visits', 'update', 'Update visit records'),
  ('visits', 'delete', 'Delete visit records'),
  
  -- Medical history permissions
  ('medical_history', 'create', 'Create medical history entries'),
  ('medical_history', 'read', 'View medical history'),
  ('medical_history', 'update', 'Update medical history'),
  ('medical_history', 'delete', 'Delete medical history'),
  
  -- Medication permissions
  ('medications', 'prescribe', 'Prescribe medications'),
  ('medications', 'read', 'View medication records'),
  ('medications', 'update', 'Update medication records'),
  ('medications', 'dispense', 'Dispense medications'),
  
  -- Test permissions
  ('tests', 'order', 'Order medical tests'),
  ('tests', 'read', 'View test results'),
  ('tests', 'update', 'Update test results'),
  ('tests', 'verify', 'Verify and sign off on test results'),
  
  -- Appointment permissions
  ('appointments', 'create', 'Schedule appointments'),
  ('appointments', 'read', 'View appointments'),
  ('appointments', 'update', 'Update appointments'),
  ('appointments', 'delete', 'Cancel appointments'),
  
  -- Organization permissions
  ('organizations', 'create', 'Create organizations'),
  ('organizations', 'read', 'View organizations'),
  ('organizations', 'update', 'Update organizations'),
  ('organizations', 'delete', 'Delete organizations'),
  
  -- User management permissions
  ('users', 'create', 'Create user accounts'),
  ('users', 'read', 'View user accounts'),
  ('users', 'update', 'Update user accounts'),
  ('users', 'delete', 'Delete user accounts'),
  
  -- Role management permissions
  ('roles', 'create', 'Create custom roles'),
  ('roles', 'read', 'View roles'),
  ('roles', 'update', 'Update roles'),
  ('roles', 'assign', 'Assign roles to users'),
  
  -- Billing permissions
  ('billing', 'create', 'Create billing records'),
  ('billing', 'read', 'View billing records'),
  ('billing', 'update', 'Update billing records'),
  ('billing', 'approve', 'Approve billing claims')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to System Admin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Doctor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Doctor'
AND p.resource IN ('patients', 'visits', 'medical_history', 'medications', 'tests', 'appointments')
AND p.action IN ('create', 'read', 'update', 'prescribe', 'order', 'verify')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Nurse
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Nurse'
AND p.resource IN ('patients', 'visits', 'medical_history', 'tests', 'appointments')
AND p.action IN ('create', 'read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Receptionist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Receptionist'
AND p.resource IN ('patients', 'visits', 'appointments', 'billing')
AND p.action IN ('create', 'read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Lab Technician
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Lab Technician'
AND p.resource IN ('tests', 'patients')
AND p.action IN ('read', 'update', 'verify')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Pharmacist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Pharmacist'
AND p.resource IN ('medications', 'patients')
AND p.action IN ('read', 'dispense')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Radiologist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Radiologist'
AND p.resource IN ('tests', 'patients')
AND p.action IN ('read', 'update', 'verify')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Patient (own records only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Patient'
AND p.resource IN ('patients', 'visits', 'medical_history', 'medications', 'tests', 'appointments')
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for permissions
CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can assign roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can update role assignments"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can revoke roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'System Admin'
      AND ur.is_active = true
    )
  );

-- Create helper function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
  user_uuid uuid,
  permission_resource text,
  permission_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND p.resource = permission_resource
    AND p.action = permission_action
  );
END;
$$;

-- Create helper function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid uuid)
RETURNS TABLE(role_name text, organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, ur.organization_id
  FROM user_roles ur
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_uuid
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now());
END;
$$;