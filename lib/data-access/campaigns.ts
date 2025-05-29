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
 * Publish campaign (update status and set published_at)
 */
export async function publishCampaign(
  campaignId: string,
  publishedUrl?: string
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
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (publishedUrl) {
      updates.published_url = publishedUrl;
    }

    return await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();
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
    // Update each section's order_index
    const updatePromises = sectionOrders.map(({ id, order_index }) =>
      supabase
        .from('sections')
        .update({ 
          order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('campaign_id', campaignId) // Ensure section belongs to campaign
    );

    await Promise.all(updatePromises);

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