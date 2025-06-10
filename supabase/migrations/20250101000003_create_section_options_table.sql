-- Migration: Create section_options table
-- Description: Stores options for multiple choice sections and other configurable sections
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Create section_options table
CREATE TABLE IF NOT EXISTS section_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label VARCHAR(500) NOT NULL,
  value VARCHAR(500) NOT NULL,
  order_index INTEGER NOT NULL,
  configuration JSONB DEFAULT '{}',
  
  UNIQUE(section_id, order_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_section_options_section_id ON section_options(section_id);
CREATE INDEX IF NOT EXISTS idx_section_options_order ON section_options(section_id, order_index);

-- Add comments
COMMENT ON TABLE section_options IS 'Stores options for multiple choice sections and other configurable sections';
COMMENT ON COLUMN section_options.label IS 'Display text shown to users';
COMMENT ON COLUMN section_options.value IS 'Internal value stored when this option is selected';
COMMENT ON COLUMN section_options.order_index IS 'Order of the option within the section';
COMMENT ON COLUMN section_options.configuration IS 'Option-specific configuration as JSON'; 