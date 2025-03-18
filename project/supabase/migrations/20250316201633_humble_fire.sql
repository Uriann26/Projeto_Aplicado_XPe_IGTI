/*
  # Update role management permissions

  1. Changes
    - Add policy for supervisors to view and manage all profiles
    - Add policy for users to view their own profile
    - Add policy for supervisors to update roles

  2. Security
    - Enable RLS on profiles table
    - Add policies for role-based access control
*/

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Supervisors can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Supervisors can update all profiles" ON profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create policies for profile management
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Supervisors can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'supervisor'
    )
);

CREATE POLICY "Supervisors can update all profiles"
ON profiles
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