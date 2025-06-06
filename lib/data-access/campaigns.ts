/**
 * Campaigns Data Access Layer
 * 
 * This module provides CRUD operations for campaigns and their sections.
 */

import type {
  Campaign,
  Section,
  SectionOption,
  CreateCampaign,
  CreateSection,
  CreateSectionOption,
  UpdateCampaign,
  UpdateSection,
  UpdateSectionOption,
  CampaignWithRelations,
  SectionWithOptions,
  DatabaseResult,
  PaginatedResponse
} from '@/lib/types/database';

import {
  getSupabaseClient,
  withErrorHandling,
  createApiResponse,
  validateRequiredFields,
  isValidUUID,
  requireAuth,
  applyPagination,
  type PaginationParams
} from './base';

// =============================================================================
// CAMPAIGN CRUD OPERATIONS
// =============================================================================

/**
 * Create a new campaign
 */
export async function createCampaign(
  campaignData: CreateCampaign
): Promise<DatabaseResult<Campaign>> {
  // Validate required fields
  const validationErrors = validateRequiredFields(campaignData, ['name']);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        user_id: userId
      })
      .select()
      .single();
  });
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(
  campaignId: string,
  includeRelations = false
): Promise<DatabaseResult<Campaign | CampaignWithRelations>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth(); // Ensure user is authenticated for RLS
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const query = supabase
      .from('campaigns')
      .select(includeRelations ? `
        *,
        sections (
          *,
          section_options (*)
        ),
        campaign_variables (*),
        campaign_analytics (*)
      ` : '*')
      .eq('id', campaignId);

    return await query.single();
  });
}

/**
 * Get campaigns for the authenticated user
 */
export async function getCampaigns(
  params: PaginationParams & { 
    status?: string;
    search?: string;
  } = {}
): Promise<DatabaseResult<PaginatedResponse<Campaign>>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();
  const { status, search, ...paginationParams } = params;

  return withErrorHandling(async () => {
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and sorting
    query = applyPagination(query, {
      sort_by: 'created_at',
      ...paginationParams
    });

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error };
    }

    const { page = 1, per_page = 20 } = paginationParams;
    const totalPages = Math.ceil((count || 0) / per_page);

    return {
      data: {
        data: data || [],
        meta: {
          total: count || 0,
          page,
          per_page,
          has_more: page < totalPages,
          total_pages: totalPages
        }
      },
      error: null
    };
  });
}

/**
 * Get campaigns with full relations for the authenticated user
 */
export async function getCampaignsWithRelations(
  params: PaginationParams & { 
    status?: string;
    search?: string;
  } = {}
): Promise<DatabaseResult<CampaignWithRelations[]>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();
  const { status, search, ...paginationParams } = params;

  return withErrorHandling(async () => {
    // First get campaigns
    let campaignQuery = supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      campaignQuery = campaignQuery.eq('status', status);
    }

    if (search) {
      campaignQuery = campaignQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    campaignQuery = applyPagination(campaignQuery, {
      sort_by: 'created_at',
      ...paginationParams
    });

    const { data: campaigns, error: campaignError } = await campaignQuery;

    if (campaignError || !campaigns) {
      return { data: null, error: campaignError };
    }

    // Get related data for each campaign
    const campaignsWithRelations: CampaignWithRelations[] = await Promise.all(
      campaigns.map(async (campaign): Promise<CampaignWithRelations> => {
        // Get sections with options
        const { data: sections } = await supabase
          .from('sections')
          .select(`
            *,
            section_options (*)
          `)
          .eq('campaign_id', campaign.id)
          .order('order_index');

        // Get variables
        const { data: variables } = await supabase
          .from('campaign_variables')
          .select('*')
          .eq('campaign_id', campaign.id);

        // Get analytics
        const { data: analytics } = await supabase
          .from('campaign_analytics')
          .select('*')
          .eq('campaign_id', campaign.id)
          .order('date', { ascending: false });

        return {
          ...campaign,
          sections: sections || [],
          variables: variables || [],
          analytics: analytics || []
        };
      })
    );

    return { data: campaignsWithRelations, error: null };
  });
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: string,
  updates: Partial<UpdateCampaign>
): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth(); // Ensure user is authenticated for RLS
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();
  });
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth(); // Ensure user is authenticated for RLS
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    return { data: !error, error };
  });
}

/**
 * Generate a unique slug for campaign URL
 */
export async function generateCampaignSlug(
  campaignName: string,
  campaignId?: string
): Promise<DatabaseResult<string>> {
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Create base slug from campaign name
    let baseSlug = campaignName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 50); // Limit length
    
    // Remove leading/trailing hyphens
    baseSlug = baseSlug.replace(/^-+|-+$/g, '');
    
    if (!baseSlug) {
      baseSlug = 'campaign';
    }

    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 100;

    // Check for uniqueness and add suffix if needed
    while (attempts < maxAttempts) {
      let query = supabase
        .from('campaigns')
        .select('id')
        .eq('published_url', slug);

      // Exclude current campaign if updating
      if (campaignId) {
        query = query.neq('id', campaignId);
      }

      const { data: existingCampaigns, error } = await query;

      if (error) {
        throw error;
      }

      // If no conflicts, we found our unique slug
      if (!existingCampaigns || existingCampaigns.length === 0) {
        return { data: slug, error: null };
      }

      // Generate new slug with suffix
      attempts++;
      slug = `${baseSlug}-${attempts}`;
    }

    throw new Error('Failed to generate unique URL after multiple attempts');
  });
}

/**
 * Validate campaign before publishing
 */
export async function validateCampaignForPublishing(
  campaignId: string
): Promise<DatabaseResult<{ isValid: boolean; errors: string[] }>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const errors: string[] = [];

    // Get campaign with sections
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        sections (
          id,
          type,
          title,
          settings
        )
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw campaignError || new Error('Campaign not found');
    }

    // Validate campaign has sections
    if (!campaign.sections || campaign.sections.length === 0) {
      errors.push('Campaign must have at least one section');
    }

    // Validate campaign has a name
    if (!campaign.name || campaign.name.trim().length === 0) {
      errors.push('Campaign must have a name');
    }

    // Validate sections have required fields
    if (campaign.sections) {
      campaign.sections.forEach((section: any, index: number) => {
        if (!section.title || section.title.trim().length === 0) {
          errors.push(`Section ${index + 1} must have a title`);
        }
      });
    }

    return {
      data: {
        isValid: errors.length === 0,
        errors
      },
      error: null
    };
  });
}

/**
 * Publish campaign with unique URL generation
 */
export async function publishCampaign(
  campaignId: string,
  customSlug?: string
): Promise<DatabaseResult<Campaign & { published_url: string }>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // First validate the campaign
    const validationResult = await validateCampaignForPublishing(campaignId);
    if (!validationResult.success || !validationResult.data?.isValid) {
      const errors = validationResult.data?.errors || ['Campaign validation failed'];
      throw new Error(`Cannot publish campaign: ${errors.join(', ')}`);
    }

    // Get campaign details for URL generation
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('name, published_url')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw campaignError || new Error('Campaign not found');
    }

    let publishedUrl: string;

    if (customSlug) {
      // Validate custom slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(customSlug) || customSlug.length < 3 || customSlug.length > 50) {
        throw new Error('Custom URL must be 3-50 characters long and contain only lowercase letters, numbers, and hyphens');
      }

      // Check if custom slug is available
      const { data: existingCampaigns, error: slugError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('published_url', customSlug)
        .neq('id', campaignId);

      if (slugError) {
        throw slugError;
      }

      if (existingCampaigns && existingCampaigns.length > 0) {
        throw new Error('This custom URL is already taken. Please choose a different one.');
      }

      publishedUrl = customSlug;
    } else {
      // Generate unique slug from campaign name
      const slugResult = await generateCampaignSlug(campaign.name, campaignId);
      if (!slugResult.success || !slugResult.data) {
        throw new Error(slugResult.error || 'Failed to generate unique URL');
      }
      publishedUrl = slugResult.data;
    }

    // Update campaign with published status and URL
    const updates = {
      status: 'published' as const,
      published_at: new Date().toISOString(),
      published_url: publishedUrl,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      data: updatedCampaign as Campaign & { published_url: string },
      error: null
    };
  });
}

/**
 * Unpublish campaign (set back to draft)
 */
export async function unpublishCampaign(
  campaignId: string,
  keepUrl: boolean = false
): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const updates: any = {
      status: 'draft',
      published_at: null,
      is_active: false,
      updated_at: new Date().toISOString()
    };

    // Optionally clear the published URL
    if (!keepUrl) {
      updates.published_url = null;
    }

    return await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();
  });
}

/**
 * Check if URL slug is available
 */
export async function checkUrlAvailability(
  slug: string,
  excludeCampaignId?: string
): Promise<DatabaseResult<{ available: boolean; suggestions?: string[] }>> {
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
      return {
        data: {
          available: false,
          suggestions: undefined
        },
        error: null
      };
    }

    let query = supabase
      .from('campaigns')
      .select('published_url')
      .eq('published_url', slug);

    if (excludeCampaignId) {
      query = query.neq('id', excludeCampaignId);
    }

    const { data: existingCampaigns, error } = await query;

    if (error) {
      throw error;
    }

    const isAvailable = !existingCampaigns || existingCampaigns.length === 0;

    let suggestions: string[] = [];
    if (!isAvailable) {
      // Generate suggestions
      for (let i = 1; i <= 5; i++) {
        const suggestion = `${slug}-${i}`;
        const { data: suggestionCheck } = await supabase
          .from('campaigns')
          .select('published_url')
          .eq('published_url', suggestion)
          .limit(1);

        if (!suggestionCheck || suggestionCheck.length === 0) {
          suggestions.push(suggestion);
        }
      }
    }

    return {
      data: {
        available: isAvailable,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      },
      error: null
    };
  });
}

/**
 * Activate a published campaign (make it publicly accessible)
 */
export async function activateCampaign(
  campaignId: string
): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // First check if campaign is published
    const { data: campaign, error: checkError } = await supabase
      .from('campaigns')
      .select('status, published_at')
      .eq('id', campaignId)
      .single();

    if (checkError || !campaign) {
      throw checkError || new Error('Campaign not found');
    }

    if (campaign.status !== 'published' || !campaign.published_at) {
      throw new Error('Only published campaigns can be activated');
    }

    return await supabase
      .from('campaigns')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();
  });
}

/**
 * Deactivate a published campaign (make it inaccessible while preserving URL)
 */
export async function deactivateCampaign(
  campaignId: string
): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // First check if campaign is published
    const { data: campaign, error: checkError } = await supabase
      .from('campaigns')
      .select('status, published_at')
      .eq('id', campaignId)
      .single();

    if (checkError || !campaign) {
      throw checkError || new Error('Campaign not found');
    }

    if (campaign.status !== 'published' || !campaign.published_at) {
      throw new Error('Only published campaigns can be deactivated');
    }

    return await supabase
      .from('campaigns')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();
  });
}

/**
 * Get campaign activation status
 */
export async function getCampaignActivationStatus(
  campaignId: string
): Promise<DatabaseResult<{ isPublished: boolean; isActive: boolean; canActivate: boolean }>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('status, published_at, is_active')
      .eq('id', campaignId)
      .single();

    if (error || !campaign) {
      throw error || new Error('Campaign not found');
    }

    const isPublished = campaign.status === 'published' && !!campaign.published_at;
    const isActive = campaign.is_active;
    const canActivate = isPublished;

    return {
      data: {
        isPublished,
        isActive,
        canActivate
      },
      error: null
    };
  });
}

// =============================================================================
// SECTION CRUD OPERATIONS
// =============================================================================

/**
 * Create a new section for a campaign
 */
export async function createSection(
  sectionData: CreateSection
): Promise<DatabaseResult<Section>> {
  // Validate required fields
  const validationErrors = validateRequiredFields(sectionData, [
    'campaign_id',
    'type',
    'order_index'
  ]);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  if (!isValidUUID(sectionData.campaign_id)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('sections')
      .insert(sectionData)
      .select()
      .single();
  });
}

/**
 * Get section by ID with options
 */
export async function getSectionById(
  sectionId: string
): Promise<DatabaseResult<SectionWithOptions>> {
  if (!isValidUUID(sectionId)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('sections')
      .select(`
        *,
        section_options (*)
      `)
      .eq('id', sectionId)
      .single();
  });
}

/**
 * Get sections for a campaign
 */
export async function getCampaignSections(
  campaignId: string
): Promise<DatabaseResult<SectionWithOptions[]>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('sections')
      .select(`
        *,
        section_options (*)
      `)
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true });
  });
}

/**
 * Update section
 */
export async function updateSection(
  sectionId: string,
  updates: Partial<UpdateSection>
): Promise<DatabaseResult<Section>> {
  if (!isValidUUID(sectionId)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('sections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)
      .select()
      .single();
  });
}

/**
 * Delete section
 */
export async function deleteSection(sectionId: string): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(sectionId)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);

    return { data: !error, error };
  });
}

/**
 * Reorder sections within a campaign
 */
export async function reorderSections(
  campaignId: string,
  sectionOrders: { id: string; order_index: number }[]
): Promise<DatabaseResult<Section[]>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  // Validate all section IDs
  for (const { id } of sectionOrders) {
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: `Invalid section ID format: ${id}`
      };
    }
  }

  return withErrorHandling(async () => {
    // Use a transaction to avoid constraint violations
    // First, set all order_index values to negative numbers to avoid conflicts
    const tempUpdatePromises = sectionOrders.map(({ id }, index) =>
      supabase
        .from('sections')
        .update({ 
          order_index: -(index + 1000), // Use negative numbers to avoid conflicts
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('campaign_id', campaignId)
    );

    // Execute temporary updates
    await Promise.all(tempUpdatePromises);

    // Now update with the actual order values
    const finalUpdatePromises = sectionOrders.map(({ id, order_index }) =>
      supabase
        .from('sections')
        .update({ 
          order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('campaign_id', campaignId)
    );

    // Execute final updates
    await Promise.all(finalUpdatePromises);

    // Return updated sections
    return await supabase
      .from('sections')
      .select()
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true });
  });
}

// =============================================================================
// SECTION OPTIONS CRUD OPERATIONS
// =============================================================================

/**
 * Create section option
 */
export async function createSectionOption(
  optionData: CreateSectionOption
): Promise<DatabaseResult<SectionOption>> {
  const validationErrors = validateRequiredFields(optionData, [
    'section_id',
    'label',
    'value',
    'order_index'
  ]);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  if (!isValidUUID(optionData.section_id)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('section_options')
      .insert(optionData)
      .select()
      .single();
  });
}

/**
 * Update section option
 */
export async function updateSectionOption(
  optionId: string,
  updates: Partial<UpdateSectionOption>
): Promise<DatabaseResult<SectionOption>> {
  if (!isValidUUID(optionId)) {
    return {
      success: false,
      error: 'Invalid option ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('section_options')
      .update(updates)
      .eq('id', optionId)
      .select()
      .single();
  });
}

/**
 * Delete section option
 */
export async function deleteSectionOption(optionId: string): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(optionId)) {
    return {
      success: false,
      error: 'Invalid option ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('section_options')
      .delete()
      .eq('id', optionId);

    return { data: !error, error };
  });
} 