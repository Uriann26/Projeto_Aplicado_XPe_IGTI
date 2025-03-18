/*
  # Grant Administrator Privileges

  1. Changes
    - Update all users to have supervisor role
    - Grant full access to all resources
    - Remove role-based restrictions from policies

  2. Security
    - Enable RLS but with universal access
    - Maintain audit trails and tracking
*/

-- Update all existing users to supervisor role
UPDATE profiles SET role = 'supervisor';

-- Create trigger to set new users as supervisors
CREATE OR REPLACE FUNCTION set_supervisor_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.role = 'supervisor';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_supervisor_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_supervisor_role();

-- Update team policies to allow full access
DROP POLICY IF EXISTS "Team leaders can manage teams" ON teams;
CREATE POLICY "Universal team access"
  ON teams
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update team members policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
CREATE POLICY "Universal team member access"
  ON team_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update task policies
DROP POLICY IF EXISTS "Team members can manage tasks" ON tasks;
CREATE POLICY "Universal task access"
  ON tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update report policies
DROP POLICY IF EXISTS "Users can manage own reports" ON reports;
CREATE POLICY "Universal report access"
  ON reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update notification policies
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON notification_settings;
CREATE POLICY "Universal notification settings access"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update service order policies
DROP POLICY IF EXISTS "Users can manage own service orders" ON service_orders;
CREATE POLICY "Universal service order access"
  ON service_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update road policies
DROP POLICY IF EXISTS "Users can manage roads through service orders" ON roads;
CREATE POLICY "Universal road access"
  ON roads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update pathology policies
DROP POLICY IF EXISTS "Users can manage pathologies through roads" ON pathologies;
CREATE POLICY "Universal pathology access"
  ON pathologies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update daily report policies
DROP POLICY IF EXISTS "Users can manage their own daily reports" ON daily_reports;
CREATE POLICY "Universal daily report access"
  ON daily_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update file policies
DROP POLICY IF EXISTS "Users can manage their own files" ON team_files;
CREATE POLICY "Universal file access"
  ON team_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update message policies
DROP POLICY IF EXISTS "Users can manage their own messages" ON team_messages;
CREATE POLICY "Universal message access"
  ON team_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_teams_all ON teams(id, created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_all ON tasks(id, team_id, created_by);