/*
  # Daily Reports Schema Update

  This migration adds daily reports functionality while safely handling existing objects.

  1. Tables
    - daily_reports: Store daily report records
    - daily_report_activities: Store activities for each report

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Safe policy creation with existence checks

  3. Indexes
    - Optimize queries with appropriate indexes
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

-- Safe policy creation with existence checks
DO $$ 
BEGIN
  -- Policies for daily_reports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_reports' 
    AND policyname = 'Users can create their own daily reports'
  ) THEN
    CREATE POLICY "Users can create their own daily reports"
      ON daily_reports
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_reports' 
    AND policyname = 'Users can view their own daily reports'
  ) THEN
    CREATE POLICY "Users can view their own daily reports"
      ON daily_reports
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_reports' 
    AND policyname = 'Users can update their own daily reports'
  ) THEN
    CREATE POLICY "Users can update their own daily reports"
      ON daily_reports
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_reports' 
    AND policyname = 'Users can delete their own daily reports'
  ) THEN
    CREATE POLICY "Users can delete their own daily reports"
      ON daily_reports
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Policy for daily_report_activities
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_report_activities' 
    AND policyname = 'Users can manage activities through daily reports'
  ) THEN
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
  END IF;
END $$;

-- Create updated_at triggers if they don't exist
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

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'daily_reports_user_id_idx'
  ) THEN
    CREATE INDEX daily_reports_user_id_idx ON daily_reports(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'daily_reports_date_idx'
  ) THEN
    CREATE INDEX daily_reports_date_idx ON daily_reports(date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'daily_report_activities_daily_report_id_idx'
  ) THEN
    CREATE INDEX daily_report_activities_daily_report_id_idx ON daily_report_activities(daily_report_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'daily_report_activities_road_id_idx'
  ) THEN
    CREATE INDEX daily_report_activities_road_id_idx ON daily_report_activities(road_id);
  END IF;
END $$;