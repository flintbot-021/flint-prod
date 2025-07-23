-- Migration: Simplify billing system to use Stripe Checkout with 3 tiers
-- Date: Current
-- Description: Add subscription_tier system and simplify billing fields

-- Add subscription tier enum and column
CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium');

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS max_published_campaigns INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Update existing users based on their credit balance
-- Users with credits get 'standard' tier, others stay 'free'
UPDATE profiles 
SET subscription_tier = CASE 
  WHEN credit_balance > 0 THEN 'standard'::subscription_tier
  ELSE 'free'::subscription_tier
END,
max_published_campaigns = CASE 
  WHEN credit_balance > 0 THEN 3
  ELSE 0
END,
subscription_status = CASE 
  WHEN credit_balance > 0 THEN 'active'
  ELSE 'inactive'
END;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);

-- Add comment explaining the tier system
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier: free (0 campaigns), standard ($99/month, 3 campaigns), premium ($249/month, unlimited campaigns)';
COMMENT ON COLUMN profiles.max_published_campaigns IS 'Maximum number of campaigns this user can publish based on their tier'; 