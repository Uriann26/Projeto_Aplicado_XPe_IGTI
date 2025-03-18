/*
  # Notification System Enhancement

  1. New Tables
    - `notification_settings`
      - User preferences for notification types
      - Email notification preferences
      - Deadline reminder preferences
    - `notification_schedules`
      - Scheduled notifications for deadlines
      - Tracks notification status and delivery

  2. Security
    - Enable RLS on new tables
    - Add policies for user access control

  3. Functions
    - Create functions for notification scheduling
    - Add deadline reminder function
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_notifications boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  reminder_days_before integer DEFAULT 3,
  daily_digest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Create notification_schedules table
CREATE TABLE IF NOT EXISTS notification_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for notification_settings
CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for notification_schedules
CREATE POLICY "Users can view their own notification schedules"
  ON notification_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_schedules.notification_id
      AND n.user_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_schedules_updated_at
  BEFORE UPDATE ON notification_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX notification_settings_user_id_idx ON notification_settings(user_id);
CREATE INDEX notification_schedules_notification_id_idx ON notification_schedules(notification_id);
CREATE INDEX notification_schedules_scheduled_for_idx ON notification_schedules(scheduled_for);

-- Function to schedule deadline reminders
CREATE OR REPLACE FUNCTION schedule_deadline_reminder()
RETURNS TRIGGER AS $$
DECLARE
  reminder_days integer;
  user_settings notification_settings;
BEGIN
  -- Get user notification settings
  SELECT * INTO user_settings
  FROM notification_settings
  WHERE user_id = NEW.user_id;

  -- If user has deadline reminders enabled
  IF user_settings.deadline_reminders THEN
    reminder_days := COALESCE(user_settings.reminder_days_before, 3);
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content
    ) VALUES (
      NEW.user_id,
      'deadline_reminder',
      'Prazo se Aproximando',
      'O prazo para o relatório está se aproximando. Data limite: ' || NEW.due_date::date
    )
    RETURNING id INTO NEW.notification_id;

    -- Schedule reminder
    INSERT INTO notification_schedules (
      notification_id,
      scheduled_for
    ) VALUES (
      NEW.notification_id,
      NEW.due_date - (reminder_days || ' days')::interval
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for deadline reminders
CREATE TRIGGER schedule_deadline_reminder_trigger
  AFTER INSERT ON deadlines
  FOR EACH ROW
  EXECUTE FUNCTION schedule_deadline_reminder();

-- Function to send daily digest
CREATE OR REPLACE FUNCTION send_daily_digest()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT DISTINCT ns.user_id
    FROM notification_settings ns
    WHERE ns.daily_digest = true
  LOOP
    -- Create digest notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content
    )
    SELECT
      user_record.user_id,
      'daily_digest',
      'Resumo Diário',
      'Você tem ' || 
      COUNT(DISTINCT d.id) || ' prazos pendentes e ' ||
      COUNT(DISTINCT r.id) || ' relatórios para revisar.'
    FROM deadlines d
    LEFT JOIN reports r ON r.user_id = user_record.user_id
    WHERE d.user_id = user_record.user_id
    AND d.due_date >= CURRENT_DATE
    GROUP BY user_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;