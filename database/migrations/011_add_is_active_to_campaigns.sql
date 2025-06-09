-- Migration: Add is_active column to campaigns table
-- Description: Add is_active field to control whether published campaigns are publicly accessible
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Add is_active column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the purpose
COMMENT ON COLUMN campaigns.is_active IS 'Controls whether published campaigns are publicly accessible via their URLs';

-- Create index for performance on published + active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_published_active ON campaigns (status, is_active) 
WHERE status = 'published';

-- Update existing published campaigns to be active by default
UPDATE campaigns 
SET is_active = true 
WHERE status = 'published' AND is_active IS NULL; 