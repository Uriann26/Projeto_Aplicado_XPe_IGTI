/*
  # Fix Task Query Relationships

  1. Changes
    - Add explicit relationship names for task references
    - Update task policies to avoid recursion
    - Add indexes for better query performance

  2. Security
    - Maintain RLS policies
    - Keep audit trails
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Universal task access" ON tasks;

-- Create optimized task policy with explicit relationship references
CREATE POLICY "Team members can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Add explicit relationship names for tasks
COMMENT ON COLUMN tasks.assigned_to IS E'@name assigned_user\nUser assigned to the task';
COMMENT ON COLUMN tasks.created_by IS E'@name creator\nUser who created the task';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_team_status ON tasks(team_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_team_assigned ON tasks(team_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);