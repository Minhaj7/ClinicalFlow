/*
  # Fix Infinite Recursion in Roles Table Policy

  1. Problem
    - The "System admins can manage roles" policy on the roles table
      references the roles table within its own policy check, causing
      infinite recursion when PostgreSQL evaluates the policy

  2. Solution
    - Drop the problematic policy
    - Create a simpler policy that checks user_roles directly without
      joining back to the roles table
    - Use the role_id directly instead of joining to get role name

  3. Changes
    - Drop "System admins can manage roles" policy on roles table
    - Create new policy using role_id lookup instead of name lookup
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "System admins can manage roles" ON roles;

-- Get the System Admin role ID and create a policy that references it directly
-- First, we need to create a function to check if user is system admin without recursion
CREATE OR REPLACE FUNCTION is_system_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = user_uuid 
      AND ur.is_active = true
      AND ur.role_id IN (SELECT id FROM roles WHERE name = 'System Admin')
  );
$$;

-- Create new policy using the function
CREATE POLICY "System admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- Also fix the same issue on user_roles table if it exists
DROP POLICY IF EXISTS "System admins can manage user roles" ON user_roles;

CREATE POLICY "System admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));