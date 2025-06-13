/**
 * Public Campaign Data Access Layer
 * 
 * This module provides public access to published campaigns without authentication.
 * Used by the public campaign pages (/c/[slug]) for anonymous users.
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  Campaign, 
  Section, 
  SectionWithOptions, 
  DatabaseResult 
} from '@/lib/types/database';

/**
 * Get a published campaign by its public URL slug
 * This function is designed for public access without authentication
 */
export async function getPublishedCampaign(slug: string): Promise<DatabaseResult<Campaign>> {
  if (!slug || typeof slug !== 'string') {
    return {
      success: false,
      error: 'Invalid campaign slug'
    };
  }

  try {
    const supabase = createClient();
    
    // Query published campaigns without auth context
    // This will work once RLS policies are updated
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('published_url', slug)
      .eq('status', 'published')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ [GET_PUBLISHED_CAMPAIGN] Database error:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Campaign not found or not published'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }

    if (!campaign) {
      return {
        success: false,
        error: 'Campaign not found'
      };
    }

    return {
      success: true,
      data: campaign
    };
  } catch (error) {
    console.error('💥 [GET_PUBLISHED_CAMPAIGN] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to load campaign'
    };
  }
}

/**
 * Get sections for a published campaign
 * This function is designed for public access without authentication
 */
export async function getPublishedCampaignSections(campaignId: string): Promise<DatabaseResult<SectionWithOptions[]>> {
  if (!campaignId) {
    return {
      success: false,
      error: 'Campaign ID is required'
    };
  }

  try {
    const supabase = createClient();
    
    // First verify the campaign is published (this ensures security)
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, status, is_active')
      .eq('id', campaignId)
      .eq('status', 'published')
      .eq('is_active', true)
      .single();

    if (!campaign) {
      return {
        success: false,
        error: 'Campaign not found or not published'
      };
    }

    // Get sections for the published campaign
    const { data: sections, error } = await supabase
      .from('sections')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [GET_PUBLISHED_SECTIONS] Database error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: sections || []
    };
  } catch (error) {
    console.error('💥 [GET_PUBLISHED_SECTIONS] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to load campaign sections'
    };
  }
}

/**
 * Get both campaign and sections in one call for public access
 */
export async function getPublishedCampaignWithSections(slug: string): Promise<DatabaseResult<{
  campaign: Campaign;
  sections: SectionWithOptions[];
}>> {
  try {
    // Get campaign first
    const campaignResult = await getPublishedCampaign(slug);
    if (!campaignResult.success || !campaignResult.data) {
      return {
        success: false,
        error: campaignResult.error
      };
    }

    // Get sections
    const sectionsResult = await getPublishedCampaignSections(campaignResult.data.id);
    if (!sectionsResult.success) {
      return {
        success: false,
        error: sectionsResult.error
      };
    }

    return {
      success: true,
      data: {
        campaign: campaignResult.data,
        sections: sectionsResult.data || []
      }
    };
  } catch (error) {
    console.error('💥 [GET_PUBLISHED_CAMPAIGN_WITH_SECTIONS] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to load campaign data'
    };
  }
}

/**
 * Check if a campaign exists and is published (for validation)
 */
export async function validatePublishedCampaign(slug: string): Promise<boolean> {
  try {
    const result = await getPublishedCampaign(slug);
    return result.success && !!result.data;
  } catch {
    return false;
  }
} 