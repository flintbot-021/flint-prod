-- Migration: Create campaign_analytics table
-- Description: Stores daily campaign performance metrics
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create campaign_analytics table
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  average_completion_time INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(campaign_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON campaign_analytics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_date ON campaign_analytics(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_conversion_rate ON campaign_analytics(conversion_rate);

-- Add comments
COMMENT ON TABLE campaign_analytics IS 'Stores daily campaign performance metrics';
COMMENT ON COLUMN campaign_analytics.campaign_id IS 'References the campaign being measured';
COMMENT ON COLUMN campaign_analytics.date IS 'Date for these analytics (one record per day)';
COMMENT ON COLUMN campaign_analytics.views IS 'Number of campaign views on this date';
COMMENT ON COLUMN campaign_analytics.starts IS 'Number of users who started the campaign';
COMMENT ON COLUMN campaign_analytics.completions IS 'Number of users who completed the campaign';
COMMENT ON COLUMN campaign_analytics.conversion_rate IS 'Completion rate as decimal (completions/starts)';
COMMENT ON COLUMN campaign_analytics.average_completion_time IS 'Average time to complete campaign in seconds';
COMMENT ON COLUMN campaign_analytics.metadata IS 'Additional analytics data as JSON'; 