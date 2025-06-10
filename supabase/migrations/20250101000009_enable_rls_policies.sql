-- Migration: Enable Row Level Security policies
-- Description: Enable RLS and create policies for all tables to ensure proper data access control
-- Author: AI Assistant
-- Date: 2024-12-XX

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_variable_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CAMPAIGNS TABLE POLICIES
-- =============================================================================

-- Allow users to select their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own campaigns
CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own campaigns
CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own campaigns
CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- SECTIONS TABLE POLICIES
-- =============================================================================

-- Allow users to view sections of their own campaigns
CREATE POLICY "Users can view sections of own campaigns" ON sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = sections.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to insert sections to their own campaigns
CREATE POLICY "Users can insert sections to own campaigns" ON sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = sections.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to update sections of their own campaigns
CREATE POLICY "Users can update sections of own campaigns" ON sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = sections.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete sections of their own campaigns
CREATE POLICY "Users can delete sections of own campaigns" ON sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = sections.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- SECTION_OPTIONS TABLE POLICIES
-- =============================================================================

-- Allow users to view section options of their own campaigns
CREATE POLICY "Users can view section options of own campaigns" ON section_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections 
      JOIN campaigns ON campaigns.id = sections.campaign_id
      WHERE sections.id = section_options.section_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to insert section options to their own campaigns
CREATE POLICY "Users can insert section options to own campaigns" ON section_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections 
      JOIN campaigns ON campaigns.id = sections.campaign_id
      WHERE sections.id = section_options.section_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to update section options of their own campaigns
CREATE POLICY "Users can update section options of own campaigns" ON section_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sections 
      JOIN campaigns ON campaigns.id = sections.campaign_id
      WHERE sections.id = section_options.section_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete section options of their own campaigns
CREATE POLICY "Users can delete section options of own campaigns" ON section_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sections 
      JOIN campaigns ON campaigns.id = sections.campaign_id
      WHERE sections.id = section_options.section_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- LEADS TABLE POLICIES
-- =============================================================================

-- Allow users to view leads from their own campaigns
CREATE POLICY "Users can view leads from own campaigns" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow anyone to insert leads (for public campaign forms)
-- But they can only insert to published campaigns
CREATE POLICY "Anyone can insert leads to published campaigns" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.status = 'published'
    )
  );

-- Allow users to update leads from their own campaigns
CREATE POLICY "Users can update leads from own campaigns" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete leads from their own campaigns
CREATE POLICY "Users can delete leads from own campaigns" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- LEAD_RESPONSES TABLE POLICIES
-- =============================================================================

-- Allow users to view responses from leads in their own campaigns
CREATE POLICY "Users can view responses from own campaign leads" ON lead_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_responses.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow anyone to insert responses (for public campaign forms)
-- But they can only insert to leads in published campaigns
CREATE POLICY "Anyone can insert responses to published campaign leads" ON lead_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_responses.lead_id 
      AND campaigns.status = 'published'
    )
  );

-- Allow users to update responses from their own campaigns
CREATE POLICY "Users can update responses from own campaigns" ON lead_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_responses.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete responses from their own campaigns
CREATE POLICY "Users can delete responses from own campaigns" ON lead_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_responses.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- CAMPAIGN_VARIABLES TABLE POLICIES
-- =============================================================================

-- Allow users to view variables from their own campaigns
CREATE POLICY "Users can view variables from own campaigns" ON campaign_variables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_variables.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to insert variables to their own campaigns
CREATE POLICY "Users can insert variables to own campaigns" ON campaign_variables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_variables.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to update variables from their own campaigns
CREATE POLICY "Users can update variables from own campaigns" ON campaign_variables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_variables.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete variables from their own campaigns
CREATE POLICY "Users can delete variables from own campaigns" ON campaign_variables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_variables.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- LEAD_VARIABLE_VALUES TABLE POLICIES
-- =============================================================================

-- Allow users to view variable values from their own campaigns
CREATE POLICY "Users can view variable values from own campaigns" ON lead_variable_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_variable_values.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow anyone to insert variable values (for public campaign processing)
-- But they can only insert to leads in published campaigns
CREATE POLICY "Anyone can insert variable values for published campaigns" ON lead_variable_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_variable_values.lead_id 
      AND campaigns.status = 'published'
    )
  );

-- Allow users to update variable values from their own campaigns
CREATE POLICY "Users can update variable values from own campaigns" ON lead_variable_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_variable_values.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete variable values from their own campaigns
CREATE POLICY "Users can delete variable values from own campaigns" ON lead_variable_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM leads 
      JOIN campaigns ON campaigns.id = leads.campaign_id
      WHERE leads.id = lead_variable_values.lead_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- CAMPAIGN_ANALYTICS TABLE POLICIES
-- =============================================================================

-- Allow users to view analytics from their own campaigns
CREATE POLICY "Users can view analytics from own campaigns" ON campaign_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_analytics.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow system to insert analytics (typically done via background jobs)
-- But also allow users to insert analytics for their own campaigns
CREATE POLICY "Users can insert analytics for own campaigns" ON campaign_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_analytics.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to update analytics from their own campaigns
CREATE POLICY "Users can update analytics from own campaigns" ON campaign_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_analytics.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Allow users to delete analytics from their own campaigns
CREATE POLICY "Users can delete analytics from own campaigns" ON campaign_analytics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_analytics.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  ); 