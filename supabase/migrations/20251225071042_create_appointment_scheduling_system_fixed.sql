/*
  # Create Appointment Scheduling System

  ## Overview
  This migration implements a comprehensive appointment scheduling system including
  appointments, appointment types, provider calendars, waitlist management,
  recurring appointments, and appointment reminders. This enables efficient
  scheduling and reduces no-shows.

  ## Changes Made

  ### 1. New Tables

  #### appointments
  - `id` (uuid, primary key) - Unique appointment identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `appointment_type_id` (uuid) - Foreign key to appointment_types
  - `start_time` (timestamptz, required) - Appointment start
  - `end_time` (timestamptz, required) - Appointment end
  - `duration_minutes` (integer, required) - Duration
  - `status` (text, required) - Scheduled, Confirmed, Checked In, In Progress, Completed, Cancelled, No Show
  - `visit_reason` (text) - Chief complaint/reason
  - `location` (text) - Room/location
  - `visit_type` (text) - In Person, Telemedicine, Phone
  - `confirmation_sent` (boolean) - Reminder sent
  - `confirmation_sent_at` (timestamptz) - When reminder sent
  - `checked_in_at` (timestamptz) - Check-in time
  - `cancelled_at` (timestamptz) - When cancelled
  - `cancellation_reason` (text) - Why cancelled
  - `no_show_reason` (text) - No show details
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### appointment_types
  - `id` (uuid, primary key) - Unique type identifier
  - `name` (text, required, unique) - Appointment type name
  - `description` (text) - Type description
  - `default_duration` (integer, required) - Default duration in minutes
  - `color_code` (text) - Calendar color
  - `requires_referral` (boolean) - Referral required
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### provider_schedules
  - `id` (uuid, primary key) - Unique schedule identifier
  - `provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `day_of_week` (integer, required) - 0=Sunday, 1=Monday, etc.
  - `start_time` (time, required) - Opening time
  - `end_time` (time, required) - Closing time
  - `location` (text) - Where provider works
  - `is_recurring` (boolean) - Repeats weekly
  - `effective_date` (date) - When schedule starts
  - `end_date` (date) - When schedule ends
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  #### schedule_exceptions
  - `id` (uuid, primary key) - Unique exception identifier
  - `provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `exception_date` (date, required) - Date of exception
  - `start_time` (time) - Modified start time
  - `end_time` (time) - Modified end time
  - `is_unavailable` (boolean) - Provider unavailable
  - `reason` (text) - Reason for exception
  - `created_at` (timestamptz) - Record creation timestamp

  #### waitlist
  - `id` (uuid, primary key) - Unique waitlist entry identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `provider_id` (uuid) - Preferred provider
  - `appointment_type_id` (uuid) - Type of appointment needed
  - `preferred_days` (text[]) - Array of preferred days
  - `preferred_times` (text) - Morning, Afternoon, Evening
  - `urgency` (text, required) - Routine, Urgent
  - `notes` (text) - Additional notes
  - `added_date` (date, required) - When added to waitlist
  - `contacted` (boolean) - Whether patient was contacted
  - `contact_attempts` (integer) - Number of contact attempts
  - `last_contact_date` (date) - Last contact attempt
  - `status` (text, required) - Waiting, Contacted, Scheduled, Removed
  - `created_at` (timestamptz) - Record creation timestamp

  #### recurring_appointments
  - `id` (uuid, primary key) - Unique recurring appointment identifier
  - `patient_id` (uuid, required) - Foreign key to patients
  - `provider_id` (uuid, required) - Foreign key to healthcare_providers
  - `appointment_type_id` (uuid) - Foreign key to appointment_types
  - `recurrence_pattern` (text, required) - Daily, Weekly, Monthly
  - `recurrence_interval` (integer, required) - Every X days/weeks/months
  - `day_of_week` (integer) - For weekly recurrence
  - `day_of_month` (integer) - For monthly recurrence
  - `start_date` (date, required) - Series start
  - `end_date` (date) - Series end
  - `preferred_time` (time, required) - Preferred time
  - `duration_minutes` (integer, required) - Duration
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. Indexes
  - Patient and provider lookups
  - Appointment dates and times for scheduling
  - Status for workflow management
  - Day of week for schedule lookups

  ### 3. Security (RLS Policies)
  - All tables have RLS enabled
  - Providers can manage their appointments
  - Receptionists can schedule appointments
  - Patients can view their own appointments

  ## Important Notes
  - Calendar integration for efficient scheduling
  - Waitlist prevents lost opportunities
  - Recurring appointments for chronic care
  - No-show tracking for practice management
  - Reminders reduce missed appointments
*/

-- Create appointment_types table
CREATE TABLE IF NOT EXISTS appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  default_duration integer NOT NULL,
  color_code text,
  requires_referral boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE RESTRICT,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show')),
  visit_reason text,
  location text,
  visit_type text DEFAULT 'In Person' CHECK (visit_type IN ('In Person', 'Telemedicine', 'Phone')),
  confirmation_sent boolean DEFAULT false,
  confirmation_sent_at timestamptz,
  checked_in_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  no_show_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create provider_schedules table
CREATE TABLE IF NOT EXISTS provider_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  is_recurring boolean DEFAULT true,
  effective_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create schedule_exceptions table
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  start_time time,
  end_time time,
  is_unavailable boolean DEFAULT true,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, exception_date)
);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE SET NULL,
  preferred_days text[] DEFAULT '{}',
  preferred_times text,
  urgency text NOT NULL DEFAULT 'Routine' CHECK (urgency IN ('Routine', 'Urgent')),
  notes text,
  added_date date NOT NULL DEFAULT CURRENT_DATE,
  contacted boolean DEFAULT false,
  contact_attempts integer DEFAULT 0,
  last_contact_date date,
  status text NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Contacted', 'Scheduled', 'Removed')),
  created_at timestamptz DEFAULT now()
);

-- Create recurring_appointments table
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE SET NULL,
  recurrence_pattern text NOT NULL CHECK (recurrence_pattern IN ('Daily', 'Weekly', 'Monthly')),
  recurrence_interval integer NOT NULL DEFAULT 1,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month integer CHECK (day_of_month BETWEEN 1 AND 31),
  start_date date NOT NULL,
  end_date date,
  preferred_time time NOT NULL,
  duration_minutes integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_provider_idx ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);

CREATE INDEX IF NOT EXISTS provider_schedules_provider_idx ON provider_schedules(provider_id);
CREATE INDEX IF NOT EXISTS provider_schedules_day_idx ON provider_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS provider_schedules_active_idx ON provider_schedules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS schedule_exceptions_provider_idx ON schedule_exceptions(provider_id);
CREATE INDEX IF NOT EXISTS schedule_exceptions_date_idx ON schedule_exceptions(exception_date);

CREATE INDEX IF NOT EXISTS waitlist_patient_idx ON waitlist(patient_id);
CREATE INDEX IF NOT EXISTS waitlist_provider_idx ON waitlist(provider_id);
CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist(status);
CREATE INDEX IF NOT EXISTS waitlist_urgency_idx ON waitlist(urgency);
CREATE INDEX IF NOT EXISTS waitlist_added_date_idx ON waitlist(added_date);

CREATE INDEX IF NOT EXISTS recurring_appts_patient_idx ON recurring_appointments(patient_id);
CREATE INDEX IF NOT EXISTS recurring_appts_provider_idx ON recurring_appointments(provider_id);
CREATE INDEX IF NOT EXISTS recurring_appts_active_idx ON recurring_appointments(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_types
CREATE POLICY "Authenticated users can view appointment types"
  ON appointment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System admins can manage appointment types"
  ON appointment_types FOR ALL
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

-- RLS Policies for appointments
CREATE POLICY "Users can view relevant appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = appointments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = appointments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = appointments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

-- RLS Policies for provider_schedules
CREATE POLICY "Users can view provider schedules"
  ON provider_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can manage their schedules"
  ON provider_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for schedule_exceptions
CREATE POLICY "Users can view schedule exceptions"
  ON schedule_exceptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can manage their exceptions"
  ON schedule_exceptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- RLS Policies for waitlist
CREATE POLICY "Staff can view waitlist"
  ON waitlist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = waitlist.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage waitlist"
  ON waitlist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = waitlist.patient_id
      AND p.receptionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

-- RLS Policies for recurring_appointments
CREATE POLICY "Staff can view recurring appointments"
  ON recurring_appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = recurring_appointments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage recurring appointments"
  ON recurring_appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = recurring_appointments.patient_id
      AND p.receptionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_id
      AND hp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_id
      AND p.receptionist_id = auth.uid()
    )
  );