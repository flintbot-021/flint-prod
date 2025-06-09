-- Migration: Create campaign_sessions table
-- Description: Track user sessions and progress through campaigns
-- Author: AI Assistant  
-- Date: 2024-12-XX

-- Create campaign_sessions table
CREATE TABLE IF NOT EXISTS campaign_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_section_index INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  total_sections INTEGER DEFAULT 0,
  completed_sections INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  device_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, campaign_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON campaign_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON campaign_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sessions_lead_id ON campaign_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON campaign_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_completion ON campaign_sessions(is_completed);

-- Add updated_at trigger
CREATE TRIGGER update_campaign_sessions_updated_at 
    BEFORE UPDATE ON campaign_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE campaign_sessions IS 'Tracks user sessions and progress through campaigns';
COMMENT ON COLUMN campaign_sessions.session_id IS 'Unique session identifier for tracking users';
COMMENT ON COLUMN campaign_sessions.campaign_id IS 'References the campaign being completed';
COMMENT ON COLUMN campaign_sessions.lead_id IS 'References the lead if captured';
COMMENT ON COLUMN campaign_sessions.last_section_index IS 'Index of the last section user was on';
COMMENT ON COLUMN campaign_sessions.completion_percentage IS 'Percentage of campaign completed';
COMMENT ON COLUMN campaign_sessions.device_info IS 'Device and browser information as JSON';
COMMENT ON COLUMN campaign_sessions.metadata IS 'Additional session metadata as JSON'; 