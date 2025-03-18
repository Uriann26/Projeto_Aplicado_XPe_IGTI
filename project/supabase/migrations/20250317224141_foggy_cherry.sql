/*
  # Add Team Creation Function

  1. Changes
    - Add stored procedure for atomic team creation
    - Ensures team and leader are created in a single transaction
    - Returns complete team data
*/

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
  -- Create the team
  INSERT INTO teams (name, description, created_by)
  VALUES (team_name, team_description, user_id)
  RETURNING * INTO new_team;

  -- Add the creator as team leader
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (new_team.id, user_id, 'leader');

  RETURN new_team;
END;
$$;