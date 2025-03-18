/*
  # Fix Profiles RLS and Policies

  1. Changes
    - Drop existing RLS policies for profiles
    - Create new INSERT policy for profiles
    - Add policy for authenticated users to insert their own profile
    - Ensure trigger handles profile creation properly

  2. Security
    - Enable RLS on profiles table
    - Add policies for SELECT, INSERT, and UPDATE operations
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to handle conflicts better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (
        new.id,
        COALESCE(
            (new.raw_user_meta_data->>'name'),
            new.email
        )
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name
    WHERE profiles.name IS NULL;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;