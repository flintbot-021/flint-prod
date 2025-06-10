-- Migration: Create leads table
-- Description: Stores captured lead information with campaign attribution
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_completed ON leads(completed_at);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);

-- Add comments
COMMENT ON TABLE leads IS 'Stores captured lead information from campaigns';
COMMENT ON COLUMN leads.campaign_id IS 'References the campaign that captured this lead';
COMMENT ON COLUMN leads.email IS 'Primary identifier for the lead';
COMMENT ON COLUMN leads.ip_address IS 'IP address of the lead for analytics';
COMMENT ON COLUMN leads.user_agent IS 'Browser user agent for device tracking';
COMMENT ON COLUMN leads.utm_source IS 'UTM tracking for campaign attribution';
COMMENT ON COLUMN leads.metadata IS 'Additional lead data as JSON';
COMMENT ON COLUMN leads.completed_at IS 'Timestamp when lead completed the campaign'; 