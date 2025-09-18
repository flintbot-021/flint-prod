-- Migration: Create asset library table
-- Description: Create table for storing marketing asset screenshots and images
-- Author: AI Assistant
-- Date: 2025-01-XX

-- Create asset_library table
CREATE TABLE IF NOT EXISTS asset_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Asset metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[], -- Array of tags for categorization
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10),
  
  -- Storage information
  storage_path TEXT NOT NULL UNIQUE,
  storage_bucket VARCHAR(100) NOT NULL DEFAULT 'campaign-uploads',
  public_url TEXT NOT NULL,
  
  -- Asset dimensions (for images)
  width INTEGER,
  height INTEGER,
  
  -- Source information (optional - if screenshot was taken from a campaign)
  source_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  source_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  source_type VARCHAR(50) DEFAULT 'manual' CHECK (source_type IN ('manual', 'screenshot', 'upload')),
  
  -- Asset metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_library_user_id ON asset_library(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_library_source_campaign ON asset_library(source_campaign_id);
CREATE INDEX IF NOT EXISTS idx_asset_library_source_type ON asset_library(source_type);
CREATE INDEX IF NOT EXISTS idx_asset_library_tags ON asset_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_asset_library_created_at ON asset_library(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_asset_library_updated_at 
    BEFORE UPDATE ON asset_library 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assets" ON asset_library
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON asset_library
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON asset_library
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON asset_library
    FOR DELETE USING (auth.uid() = user_id);

-- Create asset_mockups table for storing mockup configurations
CREATE TABLE IF NOT EXISTS asset_mockups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Asset reference
  asset_id UUID NOT NULL REFERENCES asset_library(id) ON DELETE CASCADE,
  
  -- Mockup configuration
  name VARCHAR(255) NOT NULL,
  mockup_type VARCHAR(50) NOT NULL CHECK (mockup_type IN ('phone-1', 'desktop-1', 'tablet-1')),
  background_type VARCHAR(50) NOT NULL,
  background_value TEXT NOT NULL,
  
  -- Asset positioning within mockup
  asset_scale DECIMAL(3,2) DEFAULT 1.0,
  asset_position_x INTEGER DEFAULT 0,
  asset_position_y INTEGER DEFAULT 0,
  
  -- Generated mockup file
  mockup_file_path TEXT,
  mockup_public_url TEXT,
  
  -- Configuration metadata
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for asset_mockups
CREATE INDEX IF NOT EXISTS idx_asset_mockups_user_id ON asset_mockups(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_mockups_asset_id ON asset_mockups(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_mockups_mockup_type ON asset_mockups(mockup_type);

-- Add updated_at trigger for asset_mockups
CREATE TRIGGER update_asset_mockups_updated_at 
    BEFORE UPDATE ON asset_mockups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for asset_mockups
ALTER TABLE asset_mockups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mockups" ON asset_mockups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mockups" ON asset_mockups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mockups" ON asset_mockups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mockups" ON asset_mockups
    FOR DELETE USING (auth.uid() = user_id);
