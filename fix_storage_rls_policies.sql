-- =============================================================================
-- FIX STORAGE RLS POLICIES - Missing UPDATE Policy
-- =============================================================================
-- This script fixes the missing UPDATE policy that's causing logo uploads to fail

-- 1. Check current storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd;

-- 2. Add missing UPDATE policy for storage objects
-- This is required for Supabase storage uploads to work properly
CREATE POLICY "Authenticated users can update files" ON storage.objects 
FOR UPDATE TO public 
USING ((bucket_id = 'campaign-uploads'::text) AND (auth.role() = 'authenticated'::text)) 
WITH CHECK ((bucket_id = 'campaign-uploads'::text) AND (auth.role() = 'authenticated'::text));

-- 3. Verify all policies are now in place
SELECT 
  cmd,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
GROUP BY cmd
ORDER BY cmd;

-- 4. Test that the bucket exists and is properly configured
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'campaign-uploads';

-- Expected result should show policies for: DELETE, INSERT, SELECT, UPDATE 