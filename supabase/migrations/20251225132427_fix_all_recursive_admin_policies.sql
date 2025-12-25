/*
  # Fix All Recursive Admin Policies

  1. Problem
    - Multiple tables have policies that check for System Admin role
      by joining user_roles to roles, which can cause recursion issues

  2. Solution
    - Update all such policies to use the is_system_admin() function
    - This function uses SECURITY DEFINER to bypass RLS when checking

  3. Tables affected
    - drug_formulary
    - Any other tables with similar patterns
*/

-- Fix drug_formulary policy
DROP POLICY IF EXISTS "System admins can manage formulary" ON drug_formulary;

CREATE POLICY "System admins can manage formulary"
  ON drug_formulary
  FOR ALL
  TO authenticated
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));