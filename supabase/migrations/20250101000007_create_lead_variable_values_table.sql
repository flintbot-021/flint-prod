-- Migration: Create lead_variable_values table
-- Description: Stores computed/resolved variable values for each lead
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create lead_variable_values table
CREATE TABLE IF NOT EXISTS lead_variable_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  variable_id UUID NOT NULL REFERENCES campaign_variables(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, variable_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_variable_values_lead_id ON lead_variable_values(lead_id);
CREATE INDEX IF NOT EXISTS idx_variable_values_variable_id ON lead_variable_values(variable_id);
CREATE INDEX IF NOT EXISTS idx_variable_values_computed_at ON lead_variable_values(computed_at);

-- Add comments
COMMENT ON TABLE lead_variable_values IS 'Stores computed/resolved variable values for each lead';
COMMENT ON COLUMN lead_variable_values.lead_id IS 'References the lead this variable value belongs to';
COMMENT ON COLUMN lead_variable_values.variable_id IS 'References the campaign variable definition';
COMMENT ON COLUMN lead_variable_values.value IS 'Computed value for this variable and lead combination';
COMMENT ON COLUMN lead_variable_values.computed_at IS 'Timestamp when the value was computed'; 