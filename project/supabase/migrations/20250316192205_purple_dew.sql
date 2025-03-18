/*
  # Fix notifications RLS policies

  1. Changes
    - Add INSERT policy for notifications table to allow system functions to create notifications
    - Update existing policies to be more permissive for system functions

  2. Security
    - Maintain user data isolation
    - Allow system functions to create notifications
    - Users can still only view and update their own notifications
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create more permissive policies that allow system functions to work
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

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;