-- Migration: Fix leads table DELETE RLS policy
-- Description: The current DELETE policy is not working properly. This migration recreates it with a more explicit approach.
-- Author: AI Assistant
-- Date: 2025-01-17

-- Drop the existing DELETE policy
DROP POLICY IF EXISTS "Users can delete leads from own campaigns" ON leads;

-- Recreate the DELETE policy with more explicit conditions
CREATE POLICY "Users can delete leads from own campaigns" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
      AND auth.uid() IS NOT NULL
    )
  );

-- Also ensure the SELECT policy works correctly (needed for RLS to evaluate DELETE)
-- Drop and recreate the SELECT policy to be consistent
DROP POLICY IF EXISTS "Users can view leads from own campaigns" ON leads;

CREATE POLICY "Users can view leads from own campaigns" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
      AND auth.uid() IS NOT NULL
    )
  );

-- Add a comment explaining the fix
COMMENT ON POLICY "Users can delete leads from own campaigns" ON leads IS 
'Allows users to delete leads from campaigns they own. Fixed to include explicit auth.uid() IS NOT NULL check.';

COMMENT ON POLICY "Users can view leads from own campaigns" ON leads IS 
'Allows users to view leads from campaigns they own. Updated to match DELETE policy structure.';
