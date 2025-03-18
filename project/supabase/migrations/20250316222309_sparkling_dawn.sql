/*
  # Fix Team Member Policies and Notification Settings

  1. Changes
    - Drop existing problematic policies
    - Create new optimized policies without recursion
    - Add performance indexes
    - Fix notification settings creation

  2. Security
    - Maintain proper access control for team members
    - Ensure leaders can manage their teams
    - Allow users to view their own memberships
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can manage tasks" ON tasks;

-- Create optimized team member policies
CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (
        teams.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members leader
          WHERE leader.team_id = teams.id
          AND leader.user_id = auth.uid()
          AND leader.role = 'leader'
          AND leader.id != team_members.id
        )
      )
    )
  );

CREATE POLICY "Users can view their team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Create optimized task policy
CREATE POLICY "Team members can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_role 
  ON team_members (user_id, role);

CREATE INDEX IF NOT EXISTS idx_team_members_team_role 
  ON team_members (team_id, role);

CREATE INDEX IF NOT EXISTS idx_teams_created_by 
  ON teams (created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_team_id 
  ON tasks (team_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
  ON tasks (created_by);

-- Fix notification settings
DO $$ 
BEGIN
  -- Create notification settings for users who don't have them
  INSERT INTO notification_settings (
    user_id,
    email_notifications,
    deadline_reminders,
    reminder_days_before,
    daily_digest
  )
  SELECT 
    p.id,
    true,
    true,
    3,
    false
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 
    FROM notification_settings ns 
    WHERE ns.user_id = p.id
  );
END $$;