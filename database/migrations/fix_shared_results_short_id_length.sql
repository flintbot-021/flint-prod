-- Fix shared_results.short_id column length for security improvements
-- This migration increases the short_id column from 12 to 20 characters
-- to accommodate the new cryptographically secure 16-character IDs

ALTER TABLE shared_results 
ALTER COLUMN short_id TYPE varchar(20);

-- Add a comment to document the change
COMMENT ON COLUMN shared_results.short_id IS 'Cryptographically secure short identifier (up to 20 characters)';
