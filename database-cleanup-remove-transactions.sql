-- Database Cleanup: Remove old credit/billing transaction system
-- This removes tables that are no longer needed with the new tier-based system

-- Drop old transaction tables (Stripe maintains billing history now)
DROP TABLE IF EXISTS billing_transactions CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;

-- Drop billing_history table if it exists (replaced by Stripe)
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Remove credit_balance from profiles (replaced by subscription_tier limits)
-- Note: Keep this commented out initially in case you want to migrate existing credit balances
-- ALTER TABLE profiles DROP COLUMN IF EXISTS credit_balance;

-- Clean up any unused columns related to old billing system
-- ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_payment_method_id;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS payment_method_last_four;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS payment_method_brand;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS has_payment_method;

-- Remove campaign credit-related columns (replaced by tier-based publishing)
-- Note: Keep slot_status for now as it tracks published status
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS slot_created_at;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS slot_cancelled_at;

-- Clean up any functions or triggers related to old billing system
DROP FUNCTION IF EXISTS update_credit_balance() CASCADE;
DROP FUNCTION IF EXISTS process_billing_transaction() CASCADE;

-- Remove any RLS policies for the deleted tables
-- (These will be automatically dropped when tables are dropped)

COMMENT ON TABLE profiles IS 'Updated to use subscription_tier system instead of credit_balance'; 