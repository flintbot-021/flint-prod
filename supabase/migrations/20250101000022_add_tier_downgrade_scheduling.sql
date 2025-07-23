-- Migration: Add scheduled tier downgrade support
-- Description: Add fields to track scheduled tier changes (downgrades)
-- Author: AI Assistant  
-- Date: 2025-01-XX

-- Add tier downgrade scheduling fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS scheduled_tier_change VARCHAR(50),
ADD COLUMN IF NOT EXISTS scheduled_change_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_tier_change ON profiles(scheduled_tier_change) WHERE scheduled_tier_change IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_change_date ON profiles(scheduled_change_date) WHERE scheduled_change_date IS NOT NULL;

-- Add constraint to ensure scheduled_tier_change is a valid tier
ALTER TABLE profiles 
ADD CONSTRAINT chk_scheduled_tier_change_valid 
CHECK (scheduled_tier_change IS NULL OR scheduled_tier_change IN ('free', 'standard', 'premium'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.scheduled_tier_change IS 'The tier to change to at the scheduled date (for downgrades)';
COMMENT ON COLUMN profiles.scheduled_change_date IS 'When the tier change should take effect (typically end of billing period)'; 