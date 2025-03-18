/*
  # Add deadline management and user roles

  1. Changes
    - Add role enum type for user roles
    - Add role column to profiles table
    - Create deadlines table for report deadlines
    - Add security policies for role-based access

  2. New Tables
    - deadlines
      - id (uuid, primary key)
      - report_id (uuid, references reports)
      - due_date (timestamptz)
      - created_by (uuid, references profiles)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  3. Security
    - Enable RLS on deadlines table
    - Add policies for supervisors to manage deadlines
    - Add policies for users to view their deadlines
    - Add policies for supervisors to manage reports
*/

-- Create enum type for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('supervisor', 'engineer', 'technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles with temporary text type
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text;

-- Update existing rows to have a default role
UPDATE profiles 
SET role = 'engineer' 
WHERE role IS NULL;

-- Convert role column to use enum type
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set NOT NULL constraint and default value
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'engineer'::user_role;

-- Create deadlines table
CREATE TABLE IF NOT EXISTS deadlines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
    due_date timestamptz NOT NULL,
    created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS deadlines_report_id_idx ON deadlines(report_id);
CREATE INDEX IF NOT EXISTS deadlines_due_date_idx ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS deadlines_created_by_idx ON deadlines(created_by);

-- Enable RLS
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- Policies for deadlines
CREATE POLICY "Supervisors can manage deadlines"
ON deadlines
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
);

CREATE POLICY "Users can view own deadlines"
ON deadlines
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM reports
        WHERE reports.id = deadlines.report_id
        AND reports.user_id = auth.uid()
    )
);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update policies for reports table to consider roles
CREATE POLICY "Supervisors can view all reports"
ON reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
);

CREATE POLICY "Supervisors can update all reports"
ON reports
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
);