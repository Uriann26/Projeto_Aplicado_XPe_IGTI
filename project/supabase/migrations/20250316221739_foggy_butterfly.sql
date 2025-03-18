/*
  # Fix infinite recursion in team_members policy

  This migration updates the team_members policies to prevent infinite recursion
  by using a more efficient query structure.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;

-- Create new policies with optimized queries
CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members leader
      WHERE leader.team_id = team_members.team_id
      AND leader.user_id = auth.uid()
      AND leader.role = 'leader'
    )
  );

CREATE POLICY "Users can view their team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create default notification settings for existing users
INSERT INTO notification_settings (user_id, email_notifications, deadline_reminders, reminder_days_before, daily_digest)
SELECT 
  id as user_id,
  true as email_notifications,
  true as deadline_reminders,
  3 as reminder_days_before,
  false as daily_digest
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM notification_settings
  WHERE notification_settings.user_id = profiles.id
);