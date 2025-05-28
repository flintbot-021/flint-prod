-- Migration: Create sections table
-- Description: Stores campaign sections with their configurations
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('text_question', 'multiple_choice', 'slider', 'info', 'capture', 'logic', 'output')),
  title VARCHAR(500),
  description TEXT,
  order_index INTEGER NOT NULL,
  configuration JSONB DEFAULT '{}',
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, order_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_campaign_id ON sections(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sections_type ON sections(type);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(campaign_id, order_index);

-- Add updated_at trigger
CREATE TRIGGER update_sections_updated_at 
    BEFORE UPDATE ON sections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE sections IS 'Stores individual sections within campaigns';
COMMENT ON COLUMN sections.type IS 'Section type: text_question, multiple_choice, slider, info, capture, logic, output';
COMMENT ON COLUMN sections.order_index IS 'Order of the section within the campaign';
COMMENT ON COLUMN sections.configuration IS 'Section-specific configuration as JSON';
COMMENT ON COLUMN sections.required IS 'Whether this section must be completed to proceed'; 