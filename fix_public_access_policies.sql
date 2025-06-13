-- Fix public access to published campaigns and their sections
-- This allows anonymous users to view published lead magnet campaigns

-- 1. Add public access policy for published campaigns
CREATE POLICY IF NOT EXISTS "Public can view published campaigns"
ON campaigns FOR SELECT
USING (
  status = 'published' 
  AND is_active = true 
  AND published_url IS NOT NULL
);

-- 2. Add public access policy for sections of published campaigns
CREATE POLICY IF NOT EXISTS "Public can view sections of published campaigns"
ON sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = sections.campaign_id 
    AND campaigns.status = 'published' 
    AND campaigns.is_active = true
    AND campaigns.published_url IS NOT NULL
  )
);

-- 3. Optional: Add public access to leads table for session management
CREATE POLICY IF NOT EXISTS "Public can create leads for published campaigns"
ON leads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = leads.campaign_id 
    AND campaigns.status = 'published' 
    AND campaigns.is_active = true
  )
);

-- 4. Create campaign_sessions table if it doesn't exist (for public session tracking)
CREATE TABLE IF NOT EXISTS campaign_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id varchar NOT NULL UNIQUE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  current_section_index integer DEFAULT 0,
  completed_sections integer[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  responses jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  start_time timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Enable RLS on campaign_sessions
ALTER TABLE campaign_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Add public access policy for campaign sessions
CREATE POLICY IF NOT EXISTS "Public can manage sessions for published campaigns"
ON campaign_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_sessions.campaign_id 
    AND campaigns.status = 'published' 
    AND campaigns.is_active = true
  )
); 