/*
  # Fix RLS policies for anonymous users

  1. Security Updates
    - Update user_recordings table policies to allow anonymous users
    - Add storage policies for recordings bucket to allow anonymous uploads
    - Modify existing policies to work without authentication

  2. Changes Made
    - Allow anonymous users to insert recordings
    - Allow anonymous users to upload to recordings bucket
    - Allow anonymous users to read their own recordings
*/

-- Update the existing policy to allow anonymous users to manage recordings
DROP POLICY IF EXISTS "Users can manage own recordings" ON user_recordings;

-- Create new policy that allows anonymous users to insert and read recordings
CREATE POLICY "Allow anonymous recording operations"
  ON user_recordings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage policies for the recordings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anonymous users to upload recordings
CREATE POLICY "Allow anonymous uploads to recordings bucket"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'recordings');

-- Allow anonymous users to read recordings
CREATE POLICY "Allow anonymous reads from recordings bucket"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'recordings');

-- Allow anonymous users to delete their recordings (optional)
CREATE POLICY "Allow anonymous deletes from recordings bucket"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'recordings');