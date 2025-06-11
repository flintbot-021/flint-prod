-- =============================================================================
-- CLEAN 2-TABLE SCHEMA MIGRATION
-- =============================================================================
-- This script drops the existing complex 3-table setup and creates a clean
-- 2-table schema for lead magnet data collection.
--
-- ⚠️  WARNING: This will delete all existing lead data!
-- Run this in Supabase SQL Editor to apply the new schema.
-- =============================================================================

-- Step 1: Drop existing tables (order matters due to foreign keys)
-- Drop in correct order to avoid foreign key constraint violations

-- First: Drop tables that reference leads
DROP TABLE IF EXISTS lead_responses CASCADE;
DROP TABLE IF EXISTS lead_variable_values CASCADE;

-- Then: Drop the main tables
DROP TABLE IF EXISTS campaign_sessions CASCADE; 
DROP TABLE IF EXISTS leads CASCADE;

-- Optional: Clean up any orphaned indexes or constraints
-- (CASCADE should handle this, but being explicit)

-- Step 2: Create new campaign_sessions table (primary data store)
CREATE TABLE campaign_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_section_index INTEGER DEFAULT 0,
  completed_sections INTEGER[] DEFAULT '{}',
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- All responses stored in JSONB (flexible & performant)
  responses JSONB DEFAULT '{}',
  
  -- Session metadata (device info, referrer, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create new leads table (only real conversions)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES campaign_sessions(session_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Lead data (only real data, no fake emails)
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  
  -- Conversion tracking
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversion_section_id UUID REFERENCES sections(id), -- which section captured them
  
  -- Lead metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(campaign_id, email)
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_campaign_sessions_session_id ON campaign_sessions(session_id);
CREATE INDEX idx_campaign_sessions_campaign_id ON campaign_sessions(campaign_id);
CREATE INDEX idx_campaign_sessions_last_activity ON campaign_sessions(last_activity);
CREATE INDEX idx_campaign_sessions_responses ON campaign_sessions USING GIN (responses);

CREATE INDEX idx_leads_session_id ON leads(session_id);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_converted_at ON leads(converted_at);

-- Step 5: Enable RLS (Row Level Security)
ALTER TABLE campaign_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies

-- Campaign sessions: Allow all operations (public campaigns)
CREATE POLICY "Allow public access to campaign sessions" ON campaign_sessions
FOR ALL USING (true) WITH CHECK (true);

-- Leads: Allow public insert/select for campaign interactions
CREATE POLICY "Allow public access to leads" ON leads
FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Grant permissions
GRANT ALL ON campaign_sessions TO anon, authenticated;
GRANT ALL ON leads TO anon, authenticated;

-- Step 8: Create updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_campaign_sessions_updated_at 
    BEFORE UPDATE ON campaign_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Verification queries (optional - run these after migration)
-- Uncomment these to verify the migration worked:

-- SELECT 'campaign_sessions created' as status, count(*) as records FROM campaign_sessions;
-- SELECT 'leads created' as status, count(*) as records FROM leads;
-- SELECT 'Old tables removed' as status WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_responses');

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================
-- 
-- New data flow:
-- 1. User starts campaign → Create campaign_sessions record
-- 2. User answers questions → Update sessions.responses JSONB
-- 3. User moves through sections → Update progress fields  
-- 4. User provides email/phone → Create leads record linked to session
-- 5. Recovery → Load session by session_id, check if converted
--
-- Benefits:
-- ✅ No fake emails
-- ✅ Single source for responses
-- ✅ Simple recovery
-- ✅ Clear conversion tracking
-- ✅ Flexible responses (JSONB)
-- ✅ Better performance
--
-- Tables cleaned up:
-- ❌ lead_responses (individual response records)
-- ❌ lead_variable_values (computed variable values)
-- ❌ old leads table (with fake emails)
-- ❌ old campaign_sessions table (if existed)
--
-- Tables preserved:
-- ✅ campaigns (unchanged)
-- ✅ sections (unchanged) 
-- ✅ campaign_variables (still needed for variable definitions)
-- ✅ profiles (unchanged)
-- ============================================================================= 