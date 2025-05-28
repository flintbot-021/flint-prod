-- Migration: Create lead_responses table
-- Description: Stores individual responses from leads to campaign sections
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create lead_responses table
CREATE TABLE IF NOT EXISTS lead_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL CHECK (response_type IN ('text', 'choice', 'number', 'boolean', 'multiple_choice')),
  response_value TEXT NOT NULL,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, section_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_responses_lead_id ON lead_responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_responses_section_id ON lead_responses(section_id);
CREATE INDEX IF NOT EXISTS idx_responses_type ON lead_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON lead_responses(created_at);

-- Add comments
COMMENT ON TABLE lead_responses IS 'Stores individual responses from leads to campaign sections';
COMMENT ON COLUMN lead_responses.lead_id IS 'References the lead who provided this response';
COMMENT ON COLUMN lead_responses.section_id IS 'References the section this response belongs to';
COMMENT ON COLUMN lead_responses.response_type IS 'Type of response: text, choice, number, boolean, multiple_choice';
COMMENT ON COLUMN lead_responses.response_value IS 'Primary response value as text';
COMMENT ON COLUMN lead_responses.response_data IS 'Additional response metadata as JSON'; 