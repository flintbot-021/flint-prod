-- Migration: Add multiple slider section type
-- Description: Adds 'question-slider-multiple' to the section type enum
-- Author: AI Assistant  
-- Date: 2024-12-XX

-- Add the new section type to the CHECK constraint
-- First, we need to drop the existing constraint and recreate it with the new value
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_type_check;

-- Add the new constraint with the additional section type
ALTER TABLE sections ADD CONSTRAINT sections_type_check 
  CHECK (type IN (
    'text_question', 
    'multiple_choice', 
    'slider', 
    'question-slider-multiple',
    'info', 
    'capture', 
    'logic', 
    'output',
    'dynamic_redirect',
    'html_embed'
  ));

-- Update the comment to reflect the new section type
COMMENT ON COLUMN sections.type IS 'Section type: text_question, multiple_choice, slider, question-slider-multiple, info, capture, logic, output, dynamic_redirect, html_embed'; 