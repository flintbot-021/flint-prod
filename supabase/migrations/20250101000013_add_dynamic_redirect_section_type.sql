-- Migration: Add dynamic_redirect section type
-- Description: Add the new dynamic_redirect type to the sections table check constraint
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Drop the existing check constraint
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_type_check;

-- Add the new check constraint with dynamic_redirect included
ALTER TABLE sections ADD CONSTRAINT sections_type_check 
  CHECK (type IN ('text_question', 'multiple_choice', 'slider', 'info', 'capture', 'logic', 'output', 'dynamic_redirect'));

-- Update the comment to reflect the new type
COMMENT ON COLUMN sections.type IS 'Section type: text_question, multiple_choice, slider, info, capture, logic, output, dynamic_redirect'; 