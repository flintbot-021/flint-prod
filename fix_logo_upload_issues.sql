-- =============================================================================
-- FIX LOGO UPLOAD ISSUES - Database Debugging & Fixes
-- =============================================================================
-- This script helps debug and fix logo upload issues in the campaign creation

-- 1. Check storage bucket configuration
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'campaign-uploads';

-- 2. Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Check recent campaigns and their settings
SELECT 
  id,
  name,
  settings->'branding'->>'logo_url' as logo_url,
  settings->'branding' as branding_settings,
  created_at
FROM campaigns 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check uploaded files for campaigns (if any exist)
SELECT 
  f.id,
  f.file_name,
  f.public_url,
  f.storage_path,
  f.campaign_id,
  c.name as campaign_name,
  f.created_at
FROM uploaded_files f
LEFT JOIN campaigns c ON f.campaign_id = c.id
WHERE f.storage_path LIKE '%branding%'
ORDER BY f.created_at DESC
LIMIT 10;

-- 5. Check for any storage objects in the branding folder
-- Note: This query might not work if you don't have direct access to storage.objects
-- SELECT name, bucket_id, created_at 
-- FROM storage.objects 
-- WHERE name LIKE '%branding%' 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- 6. If you need to clean up test uploads, uncomment and run:
-- DELETE FROM storage.objects WHERE name LIKE 'campaigns/%/branding/%' AND created_at > NOW() - INTERVAL '1 hour';

-- 7. If you need to update a campaign's logo URL manually:
-- UPDATE campaigns 
-- SET settings = jsonb_set(
--   COALESCE(settings, '{}'::jsonb), 
--   '{branding,logo_url}', 
--   '"https://your-logo-url-here"'
-- )
-- WHERE id = 'your-campaign-id-here';

-- 8. Check if there are any campaigns with logo URLs already set
SELECT 
  id,
  name,
  settings->'branding'->>'logo_url' as current_logo_url,
  created_at
FROM campaigns 
WHERE settings->'branding'->>'logo_url' IS NOT NULL
ORDER BY created_at DESC;

-- =============================================================================
-- FIX LOGO UPLOAD ISSUES - RLS Policy Fix
-- =============================================================================
-- Run these commands in your Supabase SQL Editor to fix logo upload issues

-- 1. First, check what policies currently exist
SELECT 
  cmd,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
GROUP BY cmd
ORDER BY cmd;

-- 2. Add the missing UPDATE policy (this is the main fix)
CREATE POLICY "Authenticated users can update files" 
ON storage.objects 
FOR UPDATE 
TO public 
USING (bucket_id = 'campaign-uploads' AND auth.role() = 'authenticated') 
WITH CHECK (bucket_id = 'campaign-uploads' AND auth.role() = 'authenticated');

-- 3. Verify the policy was created successfully
SELECT 
  cmd,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
GROUP BY cmd
ORDER BY cmd;

-- Expected result after running: You should see 4 policies (DELETE, INSERT, SELECT, UPDATE)

-- 4. Optional: If you want to also ensure the bucket allows the right file types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
WHERE name = 'campaign-uploads';

-- 5. Check bucket configuration
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'campaign-uploads'; 