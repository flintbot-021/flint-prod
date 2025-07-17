/**
 * Profiles Data Access Layer
 * 
 * This module provides CRUD operations for user profiles, subscription management,
 * and usage tracking.
 */

import type {
  Profile,
  CreateProfile,
  UpdateProfile,
  ProfileWithUsage,
  SubscriptionPlan,
  SubscriptionStatus,
  UserPreferences,
  DatabaseResult
} from '@/lib/types/database';

import {
  getSupabaseClient,
  withErrorHandling,
  validateRequiredFields,
  isValidUUID,
  isValidEmail,
  requireAuth,
  getCurrentUserId
} from './base';

// =============================================================================
// PROFILE CRUD OPERATIONS
// =============================================================================

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  });
}



/**
 * Get profile by ID (admin only or current user)
 */
export async function getProfileById(profileId: string): Promise<DatabaseResult<Profile>> {
  if (!isValidUUID(profileId)) {
    return {
      success: false,
      error: 'Invalid profile ID format'
    };
  }

  const currentUserId = await requireAuth();
  
  // Only allow access to own profile for now (can be extended for admin access)
  if (profileId !== currentUserId) {
    return {
      success: false,
      error: 'Access denied: can only access your own profile'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
  });
}

/**
 * Create a new profile (typically called during user registration)
 */
export async function createProfile(
  profileData: CreateProfile
): Promise<DatabaseResult<Profile>> {
  // Validate required fields
  const validationErrors = validateRequiredFields(profileData, ['id', 'email']);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validation_errors: validationErrors
    };
  }

  // Validate UUID format
  if (!isValidUUID(profileData.id)) {
    return {
      success: false,
      error: 'Invalid profile ID format'
    };
  }

  // Validate email format
  if (!isValidEmail(profileData.email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
  });
}

/**
 * Update current user's profile
 */
export async function updateCurrentProfile(
  updates: Partial<Omit<UpdateProfile, 'id'>>
): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();

  // Validate email if provided
  if (updates.email && !isValidEmail(updates.email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
}

/**
 * Update profile by ID (admin only or current user)
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<Omit<UpdateProfile, 'id'>>
): Promise<DatabaseResult<Profile>> {
  if (!isValidUUID(profileId)) {
    return {
      success: false,
      error: 'Invalid profile ID format'
    };
  }

  const currentUserId = await requireAuth();
  
  // Only allow access to own profile for now
  if (profileId !== currentUserId) {
    return {
      success: false,
      error: 'Access denied: can only update your own profile'
    };
  }

  // Validate email if provided
  if (updates.email && !isValidEmail(updates.email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();
  });
}

// =============================================================================
// USER PREFERENCES MANAGEMENT
// =============================================================================

/**
 * Get current user's preferences
 */
export async function getUserPreferences(): Promise<DatabaseResult<UserPreferences>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data.preferences || {}, error: null };
  });
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<DatabaseResult<UserPreferences>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // First get current preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    // Merge with existing preferences
    const currentPrefs = currentProfile.preferences || {};
    const updatedPrefs = { ...currentPrefs, ...preferences };

    // Update profile with merged preferences
    const { data, error } = await supabase
      .from('profiles')
      .update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('preferences')
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data.preferences, error: null };
  });
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Update user subscription
 */
export async function updateSubscription(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  trialEndsAt?: string,
  subscriptionEndsAt?: string
): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  // Set limits based on plan - campaigns are now unlimited for all plans
  const planLimits = {
    free: { campaigns: -1, leads: 100 }, // -1 means unlimited
    starter: { campaigns: -1, leads: 1000 },
    pro: { campaigns: -1, leads: 10000 },
    enterprise: { campaigns: -1, leads: -1 } // -1 means unlimited
  };

  const limits = planLimits[plan];

  const updates: any = {
    subscription_plan: plan,
    subscription_status: status,
    monthly_campaign_limit: limits.campaigns,
    monthly_leads_limit: limits.leads,
    updated_at: new Date().toISOString()
  };

  if (trialEndsAt) {
    updates.trial_ends_at = trialEndsAt;
  }

  if (subscriptionEndsAt) {
    updates.subscription_ends_at = subscriptionEndsAt;
  }

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  });
}

/**
 * Reset monthly usage counters (typically called at the start of each month)
 */
export async function resetMonthlyUsage(profileId?: string): Promise<DatabaseResult<Profile>> {
  const userId = profileId || await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        monthly_campaigns_used: 0,
        monthly_leads_captured: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
}

/**
 * Increment campaign usage
 */
export async function incrementCampaignUsage(): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  // First get current usage
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('monthly_campaigns_used')
    .eq('id', userId)
    .single();

  if (fetchError) {
    return {
      success: false,
      error: fetchError.message || 'Failed to fetch profile'
    };
  }

  // Increment usage without limit checking
  const currentUsage = profile.monthly_campaigns_used || 0;

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        monthly_campaigns_used: currentUsage + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
}

/**
 * Increment leads usage
 */
export async function incrementLeadsUsage(count = 1): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  // First get current usage
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('monthly_leads_captured, monthly_leads_limit')
    .eq('id', userId)
    .single();

  if (fetchError) {
    return {
      success: false,
      error: fetchError.message || 'Failed to fetch profile'
    };
  }

  // Check if limit would be exceeded
  const currentUsage = profile.monthly_leads_captured || 0;
  const limit = profile.monthly_leads_limit || 0;

  if (limit > 0 && (currentUsage + count) > limit) {
    return {
      success: false,
      error: 'Monthly leads limit exceeded',
      validation_errors: [{
        field: 'monthly_leads_captured',
        message: `Adding ${count} lead(s) would exceed your monthly limit of ${limit} leads`,
        code: 'LIMIT_EXCEEDED',
        value: currentUsage
      }]
    };
  }

  // Increment usage
  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        monthly_leads_captured: currentUsage + count,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
}

// =============================================================================
// PROFILE ANALYTICS AND UTILITIES
// =============================================================================

/**
 * Get profile with usage statistics
 */
export async function getCurrentProfileWithUsage(): Promise<DatabaseResult<ProfileWithUsage>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: profileError };
    }

    // Get total campaigns count
    const { count: totalCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get user's campaign IDs first
    const { data: userCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId);

    // Get total leads count for user's campaigns
    let totalLeads = 0;
    if (userCampaigns && userCampaigns.length > 0) {
      const campaignIds = userCampaigns.map(c => c.id);
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds);
      totalLeads = leadsCount || 0;
    }

    // Calculate usage percentages - campaigns are unlimited now
    const campaignUsagePercentage = 0; // No campaign limits

    const leadsUsagePercentage = profile.monthly_leads_limit > 0 
      ? Math.round((profile.monthly_leads_captured / profile.monthly_leads_limit) * 100)
      : 0;

    const profileWithUsage: ProfileWithUsage = {
      ...profile,
      total_campaigns: totalCampaigns || 0,
      total_leads: totalLeads,
      current_month_campaigns: profile.monthly_campaigns_used,
      current_month_leads: profile.monthly_leads_captured,
      usage_percentage: {
        campaigns: campaignUsagePercentage,
        leads: leadsUsagePercentage
      }
    };

    return { data: profileWithUsage, error: null };
  });
}

/**
 * Check if user can create a new campaign - always returns true (no limits)
 */
export async function canCreateCampaign(): Promise<DatabaseResult<boolean>> {
  const userId = await requireAuth();
  
  return withErrorHandling(async () => {
    // Always allow campaign creation - no limits
    return { data: true, error: null };
  });
}

/**
 * Check if user can capture more leads
 */
export async function canCaptureLeads(count = 1): Promise<DatabaseResult<boolean>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('monthly_leads_captured, monthly_leads_limit')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    const canCapture = profile.monthly_leads_limit <= 0 || 
      (profile.monthly_leads_captured + count) <= profile.monthly_leads_limit;

    return { data: canCapture, error: null };
  });
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
} 