/*
  # Create storage bucket for reports

  1. New Storage
    - Create 'reports' bucket for storing report files
  2. Security
    - Enable authenticated users to upload and read their own files
*/

-- Create the storage bucket for reports
INSERT INTO storage.buckets (id, name)
VALUES ('reports', 'reports')
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);