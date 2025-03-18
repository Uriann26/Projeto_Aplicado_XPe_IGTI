/*
  # Team Chat and File Sharing

  1. New Tables
    - `team_messages`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `attachments` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `team_files`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `file_url` (text)
      - `size` (bigint)
      - `type` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for team members
*/

-- Create team_messages table
CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_files table
CREATE TABLE IF NOT EXISTS team_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can manage messages"
  ON team_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage files"
  ON team_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_files.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX team_messages_team_id_idx ON team_messages(team_id);
CREATE INDEX team_messages_user_id_idx ON team_messages(user_id);
CREATE INDEX team_messages_created_at_idx ON team_messages(created_at);
CREATE INDEX team_files_team_id_idx ON team_files(team_id);
CREATE INDEX team_files_user_id_idx ON team_files(user_id);
CREATE INDEX team_files_created_at_idx ON team_files(created_at);

-- Create triggers
CREATE TRIGGER update_team_messages_updated_at
  BEFORE UPDATE ON team_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_files_updated_at
  BEFORE UPDATE ON team_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();