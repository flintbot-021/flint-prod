-- Migration: Fix profile creation using webhook approach
-- Description: Creates a reliable system for profile creation after email confirmation
-- Author: AI Assistant
-- Date: 2025-01-17

-- Drop the old unused function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more reliable function that can be called from server-side
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS json AS $$
DECLARE
  profile_exists boolean;
  user_confirmed boolean;
BEGIN
  -- Check if user is confirmed
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  ) INTO user_confirmed;
  
  IF NOT user_confirmed THEN
    RETURN json_build_object('error', 'User email not confirmed');
  END IF;
  
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id
  ) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN json_build_object('success', true, 'message', 'Profile already exists');
  END IF;
  
  -- Create the profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    user_id,
    user_email,
    COALESCE(
      user_metadata->>'full_name', 
      user_metadata->>'name', 
      split_part(user_email, '@', 1)
    )
  );
  
  RETURN json_build_object('success', true, 'message', 'Profile created');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, jsonb) TO authenticated;

-- Update the existing RPC function to use the new approach
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  current_user_metadata jsonb;
BEGIN
  -- Get the current user's information from auth context
  SELECT auth.uid() INTO current_user_id;
  
  -- If no auth context, return error
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'No authenticated user');
  END IF;
  
  -- Get user details from auth.users
  SELECT email, raw_user_meta_data 
  INTO current_user_email, current_user_metadata
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Use the new function to create profile
  RETURN public.create_profile_for_user(current_user_id, current_user_email, current_user_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for the RPC function
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated;

-- Clean up the old function that's no longer needed
DROP FUNCTION IF EXISTS public.create_profile_on_confirmation(uuid, text, jsonb);

-- Add a comment explaining the approach
COMMENT ON FUNCTION public.create_profile_for_user(uuid, text, jsonb) IS 
'Creates a user profile after email confirmation. Can be called from server-side code with explicit user data.';

COMMENT ON FUNCTION public.handle_email_confirmation() IS 
'RPC function to create profile for the currently authenticated user after email confirmation.'; 