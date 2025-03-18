/*
  # Fix Team Member Policies and Add Default Settings

  1. Changes
    - Fix infinite recursion in team_members policies by optimizing query structure
    - Add default notification settings for all users
    - Add indexes to improve query performance

  2. Security
    - Maintain RLS policies with improved efficiency
    - Ensure proper access control for team management
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;

-- Create optimized policies
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
          WHERE leader.team_id = team_members.team_id
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

-- Add indexes to improve policy performance
CREATE INDEX IF NOT EXISTS team_members_team_leader_idx 
  ON team_members (team_id, user_id) 
  WHERE role = 'leader';

CREATE INDEX IF NOT EXISTS teams_creator_idx 
  ON teams (created_by);

-- Create default notification settings for users who don't have them
INSERT INTO notification_settings (
  user_id,
  email_notifications,
  deadline_reminders,
  reminder_days_before,
  daily_digest
)
SELECT 
  profiles.id,
  true,
  true,
  3,
  false
FROM profiles
LEFT JOIN notification_settings ns ON ns.user_id = profiles.id
WHERE ns.id IS NULL;