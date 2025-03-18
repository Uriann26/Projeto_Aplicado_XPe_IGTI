/*
  # Daily Reports Schema

  1. New Tables
    - `daily_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `daily_report_activities`
      - `id` (uuid, primary key)
      - `daily_report_id` (uuid, references daily_reports)
      - `road_id` (uuid, references roads)
      - `activity_description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
*/

-- Create daily_reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Create daily_report_activities table
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

-- Policies for daily_reports
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

-- Policies for daily_report_activities
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
CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_report_activities_updated_at
  BEFORE UPDATE ON daily_report_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX daily_reports_user_id_idx ON daily_reports(user_id);
CREATE INDEX daily_reports_date_idx ON daily_reports(date);
CREATE INDEX daily_report_activities_daily_report_id_idx ON daily_report_activities(daily_report_id);
CREATE INDEX daily_report_activities_road_id_idx ON daily_report_activities(road_id);