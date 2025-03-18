/*
  # Fix role management policies

  1. Changes
    - Drop existing policies to clean up
    - Create new policies for role management
    - Fix role update logic without using OLD reference
    - Ensure proper role-based access control
  
  2. Security
    - Enable RLS
    - Add proper role-based access control
    - Ensure supervisors can manage roles
    - Allow users to view and update their own profiles
*/

-- Drop existing policies to clean up
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Supervisors can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create new policies with proper role management
CREATE POLICY "Enable read access for all authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role != 'supervisor'
    )
);

CREATE POLICY "Supervisors can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'supervisor'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'supervisor'::user_role
    )
);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);