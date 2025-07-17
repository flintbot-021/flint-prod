-- Migration: Add Stripe payment fields to profiles table
-- Description: Adds Stripe customer ID and payment method fields for billing
-- Author: AI Assistant
-- Date: 2025-01-XX

-- Add Stripe-related fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_payment_method BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_method_last_four VARCHAR(4);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(20);

-- Create index for Stripe customer ID lookups (matching existing index naming pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add comments for new fields
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.profiles.stripe_payment_method_id IS 'Default Stripe payment method ID';
COMMENT ON COLUMN public.profiles.has_payment_method IS 'Whether user has a valid payment method on file';
COMMENT ON COLUMN public.profiles.payment_method_last_four IS 'Last 4 digits of payment method for display';
COMMENT ON COLUMN public.profiles.payment_method_brand IS 'Payment method brand (visa, mastercard, etc.)';

-- Update the updated_at column to current timestamp for any future updates
-- This ensures the updated_at field works properly with the new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 