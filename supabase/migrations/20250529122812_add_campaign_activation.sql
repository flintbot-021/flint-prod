-- Add campaign activation controls
-- This migration adds the is_active field to campaigns table to control public accessibility

-- Add is_active column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the purpose
COMMENT ON COLUMN campaigns.is_active IS 'Controls whether published campaigns are publicly accessible via their URLs';

-- Create index for performance on published + active campaigns
CREATE INDEX idx_campaigns_published_active ON campaigns (status, is_active) 
WHERE status = 'published';

-- Update existing published campaigns to be active by default
UPDATE campaigns 
SET is_active = true 
WHERE status = 'published';
