/**
 * Leads Data Access Layer
 * 
 * This module provides CRUD operations for leads, responses, and lead management.
 */

import type {
  Lead,
  CreateLead,
  UpdateLead,
  LeadWithRelations,
  DatabaseResult,
  PaginatedResponse
} from '@/lib/types/database';

import {
  getSupabaseClient,
  withErrorHandling,
  validateRequiredFields,
  isValidUUID,
  isValidEmail,
  requireAuth,
  applyPagination,
  type PaginationParams
} from './base';

// =============================================================================
// LEAD CRUD OPERATIONS
// =============================================================================

/**
 * Create a new lead
 */
export async function createLead(
  leadData: CreateLead
): Promise<DatabaseResult<Lead>> {
  // Validate required fields
  const validationErrors = validateRequiredFields(leadData, [
    'campaign_id',
    'email'
  ]);
  
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  // Validate UUID format
  if (!isValidUUID(leadData.campaign_id)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  // Validate email format
  if (!isValidEmail(leadData.email)) {
    return {
      success: false,
      error: 'Invalid email format',
      validation_errors: [{
        field: 'email',
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL',
        value: leadData.email
      }]
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
  });
}

/**
 * Get lead by ID
 */
export async function getLeadById(
  leadId: string,
  includeRelations = false
): Promise<DatabaseResult<Lead | LeadWithRelations>> {
  if (!isValidUUID(leadId)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  await requireAuth(); // Ensure authenticated for RLS
  const supabase = await getSupabaseClient();

  if (!includeRelations) {
    return withErrorHandling(async () => {
      return await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
    });
  }

  return withErrorHandling(async () => {
    // Get lead with all relations
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { data: null, error: leadError };
    }

    // Get responses
    const { data: responses } = await supabase
      .from('lead_responses')
      .select(`
        *,
        sections (*)
      `)
      .eq('lead_id', leadId)
      .order('created_at');

    // Get variable values
    const { data: variableValues } = await supabase
      .from('lead_variable_values')
      .select(`
        *,
        campaign_variables (*)
      `)
      .eq('lead_id', leadId);

    // Get campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', lead.campaign_id)
      .single();

    const leadWithRelations: LeadWithRelations = {
      ...lead,
      responses: responses || [],
      variable_values: variableValues || [],
      campaign: campaign || undefined
    };

    return { data: leadWithRelations, error: null };
  });
}

/**
 * Get leads for a campaign
 */
export async function getCampaignLeads(
  campaignId: string,
  params: PaginationParams & {
    completed?: boolean;
    search?: string;
  } = {}
): Promise<DatabaseResult<PaginatedResponse<Lead>>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();
  const { completed, search, ...paginationParams } = params;

  return withErrorHandling(async () => {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId);

    // Apply filters
    if (completed !== undefined) {
      if (completed) {
        query = query.not('completed_at', 'is', null);
      } else {
        query = query.is('completed_at', null);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
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
 * Update lead
 */
export async function updateLead(
  leadId: string,
  updates: Partial<UpdateLead>
): Promise<DatabaseResult<Lead>> {
  if (!isValidUUID(leadId)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  // Validate email if provided
  if (updates.email && !isValidEmail(updates.email)) {
    return {
      success: false,
      error: 'Invalid email format',
      validation_errors: [{
        field: 'email',
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL',
        value: updates.email
      }]
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();
  });
}

/**
 * Mark lead as completed
 */
export async function completeLead(leadId: string): Promise<DatabaseResult<Lead>> {
  if (!isValidUUID(leadId)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('leads')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();
  });
}

/**
 * Delete lead
 */
export async function deleteLead(leadId: string): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(leadId)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    return { data: !error, error };
  });
}

// =============================================================================
// LEAD RESPONSE CRUD OPERATIONS
// =============================================================================

/**
 * Create a lead response
 */
export async function createLeadResponse(
  responseData: any // Assuming CreateLeadResponse is not defined in types, using 'any' for now
): Promise<DatabaseResult<any>> { // Assuming LeadResponse is not defined in types, using 'any' for now
  // Validate required fields
  const validationErrors = validateRequiredFields(responseData, [
    'lead_id',
    'section_id',
    'response_type',
    'response_value'
  ]);

  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  // Validate UUIDs
  if (!isValidUUID(responseData.lead_id)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  if (!isValidUUID(responseData.section_id)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('lead_responses')
      .insert(responseData)
      .select()
      .single();
  });
}

/**
 * Update or create lead response (upsert)
 */
export async function upsertLeadResponse(
  responseData: any // Assuming CreateLeadResponse is not defined in types, using 'any' for now
): Promise<DatabaseResult<any>> { // Assuming LeadResponse is not defined in types, using 'any' for now
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('lead_responses')
      .upsert(responseData, {
        onConflict: 'lead_id,section_id'
      })
      .select()
      .single();
  });
}

/**
 * Get responses for a lead
 */
export async function getLeadResponses(
  leadId: string
): Promise<DatabaseResult<any[]>> { // Assuming LeadResponseWithRelations is not defined in types, using 'any' for now
  if (!isValidUUID(leadId)) {
    return {
      success: false,
      error: 'Invalid lead ID format'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('lead_responses')
      .select(`
        *,
        sections (*),
        leads (*)
      `)
      .eq('lead_id', leadId)
      .order('created_at');
  });
}

/**
 * Get responses for a section across all leads
 */
export async function getSectionResponses(
  sectionId: string,
  params: PaginationParams = {}
): Promise<DatabaseResult<PaginatedResponse<any>>> {
  if (!isValidUUID(sectionId)) {
    return {
      success: false,
      error: 'Invalid section ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    let query = supabase
      .from('lead_responses')
      .select(`
        *,
        sections (*),
        leads (*)
      `, { count: 'exact' })
      .eq('section_id', sectionId);

    // Apply pagination and sorting
    query = applyPagination(query, {
      sort_by: 'created_at',
      ...params
    });

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error };
    }

    const { page = 1, per_page = 20 } = params;
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
 * Delete lead response
 */
export async function deleteLeadResponse(
  responseId: string
): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(responseId)) {
    return {
      success: false,
      error: 'Invalid response ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('lead_responses')
      .delete()
      .eq('id', responseId);

    return { data: !error, error };
  });
}

// =============================================================================
// LEAD ANALYTICS AND UTILITIES
// =============================================================================

/**
 * Get lead statistics for a campaign (optimized single query)
 */
export async function getCampaignLeadStats(
  campaignId: string
): Promise<DatabaseResult<{
  total: number;
  converted: number;
  conversion_rate: number;
  recent_leads: Lead[];
}>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get all leads for the campaign in a single query
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const allLeads = leads || [];
    const total = allLeads.length;
    const converted = allLeads.filter(lead => lead.converted_at !== null).length;
    const conversion_rate = total > 0 ? (converted / total) * 100 : 0;
    const recent_leads = allLeads.slice(0, 10);

    return {
      data: {
        total,
        converted,
        conversion_rate: Math.round(conversion_rate * 100) / 100,
        recent_leads
      },
      error: null
    };
  });
}

/**
 * Get lead statistics for multiple campaigns in a single optimized query
 */
export async function getBatchCampaignLeadStats(
  campaignIds: string[]
): Promise<DatabaseResult<Record<string, {
  total: number;
  converted: number;
  conversion_rate: number;
  recent_leads: Lead[];
}>>> {
  if (!campaignIds.length) {
    return {
      success: true,
      data: {}
    };
  }

  // Validate all campaign IDs
  const invalidIds = campaignIds.filter(id => !isValidUUID(id));
  if (invalidIds.length > 0) {
    return {
      success: false,
      error: `Invalid campaign ID format: ${invalidIds.join(', ')}`
    };
  }

  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get all leads for all campaigns in a single query
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const allLeads = leads || [];
    const statsByAccount: Record<string, {
      total: number;
      converted: number;
      conversion_rate: number;
      recent_leads: Lead[];
    }> = {};

    // Group leads by campaign and calculate stats
    for (const campaignId of campaignIds) {
      const campaignLeads = allLeads.filter(lead => lead.campaign_id === campaignId);
      const total = campaignLeads.length;
      const converted = campaignLeads.filter(lead => lead.converted_at !== null).length;
      const conversion_rate = total > 0 ? (converted / total) * 100 : 0;
      const recent_leads = campaignLeads.slice(0, 10);

      statsByAccount[campaignId] = {
        total,
        converted,
        conversion_rate: Math.round(conversion_rate * 100) / 100,
        recent_leads
      };
    }

    return {
      data: statsByAccount,
      error: null
    };
  });
}

/**
 * Search leads across campaigns for a user
 */
export async function searchLeads(
  searchTerm: string,
  params: PaginationParams = {}
): Promise<DatabaseResult<PaginatedResponse<LeadWithRelations>>> {
  await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    let query = supabase
      .from('leads')
      .select(`
        *,
        campaigns!inner (*)
      `, { count: 'exact' })
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

    // Apply pagination and sorting
    query = applyPagination(query, {
      sort_by: 'created_at',
      ...params
    });

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error };
    }

    const { page = 1, per_page = 20 } = params;
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
 * Get all leads for the authenticated user across their campaigns
 */
export async function getLeads(
  params: PaginationParams & {
    campaign_id?: string;
    completed?: boolean;
    search?: string;
  } = {}
): Promise<DatabaseResult<PaginatedResponse<Lead>>> {
  await requireAuth();
  const supabase = await getSupabaseClient();
  const { campaign_id, completed, search, ...paginationParams } = params;

  return withErrorHandling(async () => {
    let query = supabase
      .from('leads')
      .select(`
        *,
        campaigns!inner (*)
      `, { count: 'exact' });

    // Apply filters
    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    if (completed !== undefined) {
      if (completed) {
        query = query.not('converted_at', 'is', null);
      } else {
        query = query.is('converted_at', null);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination and sorting
    query = applyPagination(query, {
      sort_by: 'created_at',
      sort_order: 'desc',
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