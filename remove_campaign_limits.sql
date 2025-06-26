-- =============================================================================
-- REMOVE CAMPAIGN LIMITS - Database Cleanup Script
-- =============================================================================
-- This script removes the campaign limit system from the database
-- Run this on your production database to allow unlimited campaigns

-- 1. Update all existing users to have unlimited campaigns (-1)
UPDATE profiles 
SET 
  monthly_campaign_limit = -1,
  updated_at = NOW()
WHERE monthly_campaign_limit IS NOT NULL;

-- 2. Set default value for new users to unlimited campaigns
ALTER TABLE profiles 
ALTER COLUMN monthly_campaign_limit SET DEFAULT -1;

-- 3. Optional: Reset all monthly usage counters to 0 for a fresh start
-- Uncomment the next line if you want to reset usage tracking
-- UPDATE profiles SET monthly_campaigns_used = 0, updated_at = NOW();

-- 4. Update any existing RLS policies that might reference campaign limits
-- (Your app doesn't seem to have any, but this is here for completeness)

-- 5. Add a comment to document the change
COMMENT ON COLUMN profiles.monthly_campaign_limit IS 'Campaign limit per month - set to -1 for unlimited (legacy column, no longer enforced)';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these queries to verify the changes were applied correctly

-- Check all users now have unlimited campaigns
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN monthly_campaign_limit = -1 THEN 1 END) as unlimited_users,
  COUNT(CASE WHEN monthly_campaign_limit > 0 THEN 1 END) as limited_users
FROM profiles;

-- Show current campaign usage distribution
SELECT 
  monthly_campaigns_used,
  COUNT(*) as user_count
FROM profiles 
GROUP BY monthly_campaigns_used 
ORDER BY monthly_campaigns_used;

-- Show subscription plan distribution
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  AVG(monthly_campaigns_used) as avg_campaigns_used
FROM profiles 
GROUP BY subscription_plan; 