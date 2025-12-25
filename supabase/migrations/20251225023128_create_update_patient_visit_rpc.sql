/*
  # Create RPC Function for Patient Visit Updates

  1. Purpose
    - Create a secure RPC function to update patient visit records
    - Bypass RLS policies with SECURITY DEFINER for administrative updates
    - Validate user authentication and ownership before allowing updates

  2. Function Details
    - Name: `update_patient_visit`
    - Parameters:
      - `row_id` (uuid): The ID of the patient visit to update
      - `new_transcript` (text): Updated raw transcript
      - `new_patient_data` (jsonb): Updated patient information
      - `new_symptoms_data` (jsonb): Updated symptoms data
    - Returns: void
    - Security: DEFINER (runs with creator's privileges)

  3. Security
    - Checks if user is authenticated
    - Verifies the receptionist_id matches the authenticated user
    - Only allows updates to records owned by the calling user
*/

CREATE OR REPLACE FUNCTION update_patient_visit(
  row_id uuid,
  new_transcript text,
  new_patient_data jsonb,
  new_symptoms_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update the record only if it belongs to the authenticated user
  UPDATE patient_visits
  SET 
    raw_transcript = new_transcript,
    patient_data = new_patient_data,
    symptoms_data = new_symptoms_data,
    updated_at = now()
  WHERE 
    id = row_id 
    AND receptionist_id = auth.uid();

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record not found or access denied';
  END IF;
END;
$$;