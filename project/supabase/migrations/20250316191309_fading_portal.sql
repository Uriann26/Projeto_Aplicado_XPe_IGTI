/*
  # Add notifications system

  1. New Tables
    - notifications
      - id (uuid, primary key)
      - user_id (uuid, references profiles)
      - type (notification_type enum)
      - title (text)
      - content (text)
      - read (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on notifications table
    - Add policies for users to manage their notifications
*/

-- Create notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'deadline_reminder',
        'report_status_change',
        'report_comment',
        'deadline_assigned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indices
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to create deadline reminder notifications
CREATE OR REPLACE FUNCTION create_deadline_reminder()
RETURNS trigger AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, content)
    SELECT 
        r.user_id,
        'deadline_reminder'::notification_type,
        'Prazo se aproximando',
        'O relatório "' || r.title || '" precisa ser entregue até ' || 
        to_char(NEW.due_date, 'DD/MM/YYYY HH24:MI')
    FROM reports r
    WHERE r.id = NEW.report_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for deadline reminders
CREATE TRIGGER deadline_reminder_trigger
    AFTER INSERT ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION create_deadline_reminder();

-- Function to create status change notifications
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS trigger AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
            NEW.user_id,
            'report_status_change'::notification_type,
            'Status do relatório alterado',
            'O relatório "' || NEW.title || '" foi marcado como ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status change notifications
CREATE TRIGGER status_change_notification_trigger
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION create_status_change_notification();

-- Trigger for updating updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();