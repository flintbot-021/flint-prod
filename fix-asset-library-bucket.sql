-- Fix asset library storage bucket default value
-- Run this in your Supabase SQL editor

ALTER TABLE asset_library ALTER COLUMN storage_bucket SET DEFAULT 'campaign-uploads';

-- Verify the change
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'asset_library' AND column_name = 'storage_bucket';
