/*
  # Add team management and task assignment

  1. New Tables
    - `teams`
      - Team management and organization
    - `team_members`
      - Team membership and roles
    - `tasks`
      - Task assignments and tracking
    - `task_comments`
      - Communication on tasks
    - `data_exports`
      - Export history tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for team-based access
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('leader', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_exports table
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('csv', 'excel', 'pdf')),
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'leader'
    )
  );

CREATE POLICY "Users can view their team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Team members can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage task comments"
  ON task_comments
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tasks
      JOIN team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their exports"
  ON data_exports
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX teams_created_by_idx ON teams(created_by);
CREATE INDEX team_members_team_id_idx ON team_members(team_id);
CREATE INDEX team_members_user_id_idx ON team_members(user_id);
CREATE INDEX tasks_team_id_idx ON tasks(team_id);
CREATE INDEX tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
CREATE INDEX task_comments_task_id_idx ON task_comments(task_id);
CREATE INDEX task_comments_user_id_idx ON task_comments(user_id);
CREATE INDEX data_exports_user_id_idx ON data_exports(user_id);
CREATE INDEX data_exports_type_idx ON data_exports(type);
CREATE INDEX data_exports_status_idx ON data_exports(status);

-- Create triggers
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_exports_updated_at
  BEFORE UPDATE ON data_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();