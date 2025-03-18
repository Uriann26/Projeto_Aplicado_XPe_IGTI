/*
  # Fix Daily Reports RLS Policies

  1. Changes
    - Fix RLS policy for daily reports creation to properly handle user_id
    - Add WITH CHECK clause to ensure proper user_id validation
    - Ensure all policies are properly scoped to authenticated users

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    - Ensure proper user isolation
*/

-- Create daily_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Create daily_report_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_report_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid REFERENCES daily_reports(id) ON DELETE CASCADE NOT NULL,
  road_id uuid REFERENCES roads(id) ON DELETE CASCADE NOT NULL,
  activity_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can view their own daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update their own daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete their own daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can manage activities through daily reports" ON daily_report_activities;

-- Create new policies with proper user_id handling
CREATE POLICY "Users can create their own daily reports"
  ON daily_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily reports"
  ON daily_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily reports"
  ON daily_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily reports"
  ON daily_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage activities through daily reports"
  ON daily_report_activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_reports
      WHERE daily_reports.id = daily_report_activities.daily_report_id
      AND daily_reports.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_daily_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_daily_reports_updated_at
      BEFORE UPDATE ON daily_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_daily_report_activities_updated_at'
  ) THEN
    CREATE TRIGGER update_daily_report_activities_updated_at
      BEFORE UPDATE ON daily_report_activities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS daily_reports_user_id_idx ON daily_reports(user_id);
CREATE INDEX IF NOT EXISTS daily_reports_date_idx ON daily_reports(date);
CREATE INDEX IF NOT EXISTS daily_report_activities_daily_report_id_idx ON daily_report_activities(daily_report_id);
CREATE INDEX IF NOT EXISTS daily_report_activities_road_id_idx ON daily_report_activities(road_id);