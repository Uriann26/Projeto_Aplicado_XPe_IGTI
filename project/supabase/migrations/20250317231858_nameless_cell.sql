/*
  # Team Creation Function

  1. Changes
    - Add function to create team and leader in a single transaction
    - Add proper error handling
    - Add validation checks
    - Add proper return type

  2. Security
    - Enable RLS
    - Add security policies
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_team_with_leader;

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('leader', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create function to handle team creation with leader
CREATE OR REPLACE FUNCTION create_team_with_leader(
  team_name text,
  team_description text,
  user_id uuid
)
RETURNS teams
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_team teams;
BEGIN
  -- Validate inputs
  IF team_name IS NULL OR team_name = '' THEN
    RAISE EXCEPTION 'Team name is required';
  END IF;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  -- Create the team
  INSERT INTO teams (name, description, created_by)
  VALUES (team_name, team_description, user_id)
  RETURNING * INTO new_team;

  -- Add the creator as team leader
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (new_team.id, user_id, 'leader');

  RETURN new_team;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Team name already exists';
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'Invalid user ID';
  WHEN others THEN
    RAISE EXCEPTION 'Error creating team: %', SQLERRM;
END;
$$;

-- Create policies for teams
CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'leader'
    )
  );

-- Create policies for team_members
CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (
        teams.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM team_members leader
          WHERE leader.team_id = team_members.team_id
          AND leader.user_id = auth.uid()
          AND leader.role = 'leader'
        )
      )
    )
  );

CREATE POLICY "Users can view team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();