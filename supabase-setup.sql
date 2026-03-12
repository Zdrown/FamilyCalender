-- Supabase Setup SQL
-- Run these in the Supabase SQL Editor if not already applied.

-- 1. Add notification_email to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- 2. Add carrier to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 3. Create photos storage bucket (done via JS client, but for reference):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('photos', 'photos', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
-- ON CONFLICT (id) DO NOTHING;

-- 4. Storage policy: allow public read access to photos bucket
CREATE POLICY IF NOT EXISTS "Public read access for photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- 5. Storage policy: allow authenticated inserts to photos bucket
CREATE POLICY IF NOT EXISTS "Allow uploads to photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

-- 6. Storage policy: allow authenticated deletes from photos bucket
CREATE POLICY IF NOT EXISTS "Allow deletes from photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');
