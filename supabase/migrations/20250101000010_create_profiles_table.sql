-- Migration: Create profiles table
-- Description: Extends Supabase auth.users with additional user profile information
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL, -- Denormalized from auth.users for easier access
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  website VARCHAR(500),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'UTC',
  
  -- Subscription and billing
  subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  monthly_campaign_limit INTEGER DEFAULT 3,
  monthly_campaigns_used INTEGER DEFAULT 0,
  monthly_leads_limit INTEGER DEFAULT 100,
  monthly_leads_captured INTEGER DEFAULT 0,
  
  -- User preferences
  preferences JSONB DEFAULT '{}',
  
  -- Onboarding and state
  onboarding_completed BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);

-- Add updated_at trigger
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Add comments
COMMENT ON TABLE profiles IS 'Extended user profile information beyond Supabase auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id) - same UUID as authentication user';
COMMENT ON COLUMN profiles.email IS 'Denormalized email from auth.users for easier queries';
COMMENT ON COLUMN profiles.subscription_plan IS 'Current subscription tier: free, starter, pro, enterprise';
COMMENT ON COLUMN profiles.monthly_campaign_limit IS 'Maximum campaigns allowed per month based on plan';
COMMENT ON COLUMN profiles.monthly_leads_limit IS 'Maximum leads allowed per month based on plan';
COMMENT ON COLUMN profiles.preferences IS 'User preferences and settings as JSON';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed initial setup';

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 