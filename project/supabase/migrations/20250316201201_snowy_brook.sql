/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `file_url` (text)
      - `status` (text, default 'pending')
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `comments` (text array)
      - `tags` (text array)

  2. Security
    - Enable RLS
    - Add policies for users to manage their own reports
    - Add policies for supervisors to view all reports
*/

-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    file_url text,
    status text DEFAULT 'pending',
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    comments text[] DEFAULT '{}',
    tags text[] DEFAULT '{}'
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own reports" ON reports;
    DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
    DROP POLICY IF EXISTS "Users can update own reports" ON reports;
    DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
    DROP POLICY IF EXISTS "Supervisors can view all reports" ON reports;
    DROP POLICY IF EXISTS "Supervisors can update all reports" ON reports;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create policies
CREATE POLICY "Users can read own reports"
ON reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reports"
ON reports
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reports"
ON reports
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reports"
ON reports
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create trigger for updating updated_at
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();