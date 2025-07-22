-- Migration: Add scheduled downgrade support
-- Description: Add fields to track scheduled downgrades similar to cancellations
-- Author: AI Assistant
-- Date: 2025-01-XX

-- Add downgrade scheduling fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS downgrade_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS downgrade_to_credits INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_downgrade_scheduled ON profiles(downgrade_scheduled_at) WHERE downgrade_scheduled_at IS NOT NULL;

-- Add constraint to ensure downgrade_to_credits is non-negative when set
ALTER TABLE profiles 
ADD CONSTRAINT chk_downgrade_to_credits_non_negative 
CHECK (downgrade_to_credits IS NULL OR downgrade_to_credits >= 0);

-- Update trigger to handle updated_at
-- (The existing trigger should handle this automatically, but adding note for clarity) 