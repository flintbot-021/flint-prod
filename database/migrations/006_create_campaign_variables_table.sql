-- Migration: Create campaign_variables table
-- Description: Stores variables defined for campaigns and their configurations
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create campaign_variables table
CREATE TABLE IF NOT EXISTS campaign_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'array', 'object')),
  default_value TEXT,
  description TEXT,
  source VARCHAR(100) CHECK (source IN ('user_input', 'calculation', 'external_api', 'static')),
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_variables_campaign_id ON campaign_variables(campaign_id);
CREATE INDEX IF NOT EXISTS idx_variables_name ON campaign_variables(campaign_id, name);
CREATE INDEX IF NOT EXISTS idx_variables_type ON campaign_variables(type);
CREATE INDEX IF NOT EXISTS idx_variables_source ON campaign_variables(source);

-- Add comments
COMMENT ON TABLE campaign_variables IS 'Stores variables defined for campaigns and their configurations';
COMMENT ON COLUMN campaign_variables.campaign_id IS 'References the campaign this variable belongs to';
COMMENT ON COLUMN campaign_variables.name IS 'Variable name for referencing in templates';
COMMENT ON COLUMN campaign_variables.type IS 'Variable data type: text, number, boolean, array, object';
COMMENT ON COLUMN campaign_variables.default_value IS 'Default value if no value is computed';
COMMENT ON COLUMN campaign_variables.source IS 'How the variable value is determined';
COMMENT ON COLUMN campaign_variables.configuration IS 'Variable-specific configuration as JSON'; 