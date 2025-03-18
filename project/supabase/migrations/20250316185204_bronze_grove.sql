/*
  # Update Schema and Security Policies

  1. Tables
    - Ensure reports table exists with proper structure
    - Add proper foreign key constraints and defaults

  2. Security
    - Enable RLS for reports table
    - Add comprehensive policies for report access
*/

-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    file_url text,
    status text DEFAULT 'pending',
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;

-- Create policies for reports
CREATE POLICY "Users can read own reports"
    ON public.reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
    ON public.reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
    ON public.reports
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
    ON public.reports
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);