-- =============================================================================
-- DATABASE CLEANUP: Remove Unused Columns from Profiles Table
-- =============================================================================
-- This script removes columns that are no longer used in the business logic
-- Date: January 2025
-- Status: Safe to run - these columns have no active business logic

-- =============================================================================
-- BEFORE CLEANUP - Verify Current Data (Optional)
-- =============================================================================
-- Run these queries to see what data exists before deletion
-- Uncomment to review data before proceeding:

/*
-- Check credit_balance data
SELECT 
  id, email, credit_balance, subscription_tier
FROM profiles 
WHERE credit_balance IS NOT NULL AND credit_balance != 0
ORDER BY credit_balance DESC;

-- Check downgrade scheduling data  
SELECT 
  id, email, downgrade_scheduled_at, downgrade_to_credits
FROM profiles 
WHERE downgrade_scheduled_at IS NOT NULL OR downgrade_to_credits IS NOT NULL;

-- Check billing anchor date data
SELECT 
  id, email, billing_anchor_date
FROM profiles 
WHERE billing_anchor_date IS NOT NULL;
*/

-- =============================================================================
-- COLUMN CLEANUP
-- =============================================================================

-- 1. Remove abandoned downgrade scheduling columns (replaced by scheduled_tier_change system)
ALTER TABLE profiles DROP COLUMN IF EXISTS downgrade_scheduled_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS downgrade_to_credits;

-- 2. Remove unused billing anchor date column
ALTER TABLE profiles DROP COLUMN IF EXISTS billing_anchor_date;

-- 3. Remove credit_balance column (replaced by subscription_tier system)
ALTER TABLE profiles DROP COLUMN IF EXISTS credit_balance;

-- =============================================================================
-- INDEX CLEANUP
-- =============================================================================

-- Remove any indexes that were created for the deleted columns
DROP INDEX IF EXISTS idx_profiles_downgrade_scheduled;
DROP INDEX IF EXISTS idx_profiles_credit_balance;
DROP INDEX IF EXISTS idx_profiles_billing_anchor_date;

-- =============================================================================
-- CONSTRAINT CLEANUP  
-- =============================================================================

-- Remove any constraints that were created for the deleted columns
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_downgrade_to_credits_non_negative;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_credit_balance_non_negative;

-- =============================================================================
-- FUNCTION CLEANUP
-- =============================================================================

-- Remove any functions related to the old credit system
DROP FUNCTION IF EXISTS update_credit_balance() CASCADE;
DROP FUNCTION IF EXISTS get_user_credit_balance() CASCADE;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these after cleanup to verify columns are removed

-- Check that columns are gone
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify profiles table structure
\d profiles;

-- =============================================================================
-- SUMMARY OF REMOVED COLUMNS
-- =============================================================================
/*
REMOVED COLUMNS:
✅ downgrade_scheduled_at    - Old downgrade system (replaced by scheduled_tier_change)
✅ downgrade_to_credits      - Old credit refund system (never implemented)  
✅ billing_anchor_date       - Stripe billing anchor (never used)
✅ credit_balance           - Old credit system (replaced by subscription_tier)

KEPT COLUMNS (ACTIVE):
✅ scheduled_tier_change     - Current downgrade system
✅ scheduled_change_date     - Current downgrade system  
✅ subscription_tier         - Current billing system
✅ All other profile fields  - Still in use
*/ 