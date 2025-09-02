-- Add RLS policy to allow service role (webhooks) to update profiles
-- This is needed for Stripe webhooks to update subscription information

CREATE POLICY "Service role can update profiles" ON profiles
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Also add a policy for service role to insert profiles if needed
CREATE POLICY "Service role can insert profiles" ON profiles
FOR INSERT 
TO service_role
WITH CHECK (true);
