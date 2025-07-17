-- Migration: Fix profile creation to only happen after email confirmation
-- Description: Uses Supabase auth hooks approach instead of direct triggers
-- Author: AI Assistant
-- Date: 2024-12-XX

-- First, let's drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a function that will be called by our application logic
CREATE OR REPLACE FUNCTION public.create_profile_on_confirmation(user_id uuid, user_email text, user_metadata jsonb)
RETURNS void AS $$
BEGIN
  -- Insert profile only if it doesn't already exist
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_metadata->>'full_name', user_metadata->>'name', split_part(user_email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_profile_on_confirmation(uuid, text, jsonb) TO authenticated;

-- Create an RPC function that can be called from the application
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  current_user_metadata jsonb;
  result json;
BEGIN
  -- Get the current user's information
  SELECT auth.uid() INTO current_user_id;
  
  -- Get user details from auth.users
  SELECT email, raw_user_meta_data 
  INTO current_user_email, current_user_metadata
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Check if user is confirmed
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = current_user_id 
    AND email_confirmed_at IS NOT NULL
  ) THEN
    RETURN json_build_object('error', 'Email not confirmed');
  END IF;
  
  -- Create profile if it doesn't exist
  PERFORM public.create_profile_on_confirmation(current_user_id, current_user_email, current_user_metadata);
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated; 