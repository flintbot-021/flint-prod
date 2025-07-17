-- Migration: Add Stripe payment fields to profiles table
-- Description: Adds Stripe customer ID and payment method fields for billing
-- Author: AI Assistant
-- Date: 2025-01-XX

-- Add Stripe-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_payment_method BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method_last_four VARCHAR(4);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(20);

-- Create index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Add comments for new fields
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.stripe_payment_method_id IS 'Default Stripe payment method ID';
COMMENT ON COLUMN profiles.has_payment_method IS 'Whether user has a valid payment method on file';
COMMENT ON COLUMN profiles.payment_method_last_four IS 'Last 4 digits of payment method for display';
COMMENT ON COLUMN profiles.payment_method_brand IS 'Payment method brand (visa, mastercard, etc.)'; 