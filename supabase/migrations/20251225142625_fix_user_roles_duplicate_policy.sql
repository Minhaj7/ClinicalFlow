/*
  # Fix User Roles Duplicate Permissive Policy

  Consolidating duplicate SELECT policies on user_roles table.
  The "System admins can manage user roles" policy uses FOR ALL which covers SELECT.
  Removing it and keeping only "Users can view their own roles" for SELECT,
  then creating separate admin policies for INSERT, UPDATE, DELETE.
*/

-- Drop the existing admin policy that uses FOR ALL
DROP POLICY IF EXISTS "System admins can manage user roles" ON public.user_roles;

-- Create separate admin policies for each action (not SELECT to avoid duplicate)
CREATE POLICY "System admins can insert user roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can update user roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "System admins can delete user roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );

-- Update the existing "Users can view their own roles" to also allow admins to see all
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles or admins view all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = 'system_admin'
      AND ur.is_active = true
    )
  );
