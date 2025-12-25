/*
  # Fix Function Search Paths

  Setting search_path = '' on functions to prevent search path attacks.
  This ensures functions explicitly reference schemas, improving security.

  1. audit_trigger_function
  2. is_system_admin
  3. log_data_access (5-param version)
  4. log_security_event (4-param version)
  5. parse_combination_components
  6. search_formulary_medications
*/

-- Fix audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      timestamp
    ) VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      now()
    );
    RETURN OLD;
  END IF;
END;
$function$;

-- Fix is_system_admin
CREATE OR REPLACE FUNCTION public.is_system_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    AND ur.role_id IN (SELECT id FROM public.roles WHERE name = 'System Admin')
  );
$function$;

-- Fix log_data_access (5-param version without search_path)
CREATE OR REPLACE FUNCTION public.log_data_access(
  p_patient_id uuid, 
  p_access_type text, 
  p_resource_type text, 
  p_resource_id uuid DEFAULT NULL::uuid, 
  p_purpose text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.data_access_logs (
    user_id,
    patient_id,
    access_type,
    resource_type,
    resource_id,
    purpose,
    timestamp
  ) VALUES (
    auth.uid(),
    p_patient_id,
    p_access_type,
    p_resource_type,
    p_resource_id,
    p_purpose,
    now()
  );
END;
$function$;

-- Fix log_security_event (4-param version without search_path)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text, 
  p_severity text, 
  p_description text, 
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    description,
    details,
    timestamp
  ) VALUES (
    p_event_type,
    p_severity,
    auth.uid(),
    p_description,
    p_details,
    now()
  );

  IF p_severity IN ('Critical', 'High') THEN
    RAISE NOTICE 'Critical security event: %', p_description;
  END IF;
END;
$function$;

-- Fix parse_combination_components
CREATE OR REPLACE FUNCTION public.parse_combination_components(med_name text)
RETURNS text[]
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  components text[];
  cleaned_name text;
BEGIN
  cleaned_name := regexp_replace(med_name, '^\s+|\s+$', '', 'g');

  IF med_name ~* '\|\|' THEN
    SELECT array_agg(trim(part))
    INTO components
    FROM unnest(regexp_split_to_array(med_name, '\s*\|\|\s*')) AS part
    WHERE trim(part) != '';
  ELSIF med_name ~* ';\s*' AND med_name !~* 'IN PLASTIC CONTAINER' THEN
    SELECT array_agg(trim(part))
    INTO components
    FROM unnest(regexp_split_to_array(med_name, '\s*;\s*')) AS part
    WHERE trim(part) != '';
  ELSIF med_name ~* '\sAND\s' AND med_name !~* 'SINUS|COLD|FLU|ALLERGY|CONGESTION|HEADACHE|RELIEF' THEN
    SELECT array_agg(trim(part))
    INTO components
    FROM unnest(regexp_split_to_array(med_name, '\s+AND\s+')) AS part
    WHERE trim(part) != '';
  ELSE
    components := '{}';
  END IF;

  RETURN COALESCE(components, '{}');
END;
$function$;

-- Fix search_formulary_medications
CREATE OR REPLACE FUNCTION public.search_formulary_medications(search_term text, limit_count integer DEFAULT 20)
RETURNS TABLE(
  id uuid, 
  medication_name text, 
  generic_name text, 
  therapeutic_class text, 
  tier text, 
  formulary_status text, 
  route_of_administration text[], 
  default_dosage_forms text[], 
  default_strengths text[], 
  is_combination boolean, 
  component_medications text[], 
  requires_prior_auth boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    df.id,
    df.medication_name,
    df.generic_name,
    df.therapeutic_class,
    df.tier,
    df.formulary_status,
    df.route_of_administration,
    df.default_dosage_forms,
    df.default_strengths,
    df.is_combination,
    df.component_medications,
    df.requires_prior_auth
  FROM public.drug_formulary df
  WHERE df.is_active = true
  AND (
    df.medication_name ILIKE '%' || search_term || '%'
    OR df.generic_name ILIKE '%' || search_term || '%'
  )
  ORDER BY 
    CASE 
      WHEN df.medication_name ILIKE search_term || '%' THEN 0
      WHEN df.medication_name ILIKE '%' || search_term || '%' THEN 1
      ELSE 2
    END,
    df.medication_name
  LIMIT limit_count;
END;
$function$;
