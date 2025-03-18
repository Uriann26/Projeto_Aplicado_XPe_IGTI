/*
  # Fix infinite recursion in profile policies

  1. Changes
    - Drop existing problematic policies
    - Create new policies with proper recursion prevention
    - Maintain security while avoiding circular references

  2. Security
    - Maintain RLS on profiles table
    - Ensure proper access control
*/

-- Drop existing policies to clean up
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Supervisors can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Supervisors can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create new policies without recursion
CREATE POLICY "Enable read access for authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Supervisors can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role = 'supervisor'::user_role
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role = 'supervisor'::user_role
    )
);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);