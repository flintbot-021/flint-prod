/**
 * Profiles Data Access Layer
 * 
 * This module provides CRUD operations for user profiles and preferences.
 */

import type {
  Profile,
  CreateProfile,
  UpdateProfile,
  ProfileWithUsage,
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
// PROFILE ANALYTICS AND UTILITIES
// =============================================================================

/**
 * Get profile with basic statistics
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

    const profileWithUsage: ProfileWithUsage = {
      ...profile,
      total_campaigns: totalCampaigns || 0,
      total_leads: totalLeads
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
 * Check if user can capture more leads (always returns true - no limits)
 */
export async function canCaptureLeads(count = 1): Promise<DatabaseResult<boolean>> {
  return withErrorHandling(async () => {
    // Always allow lead capture - no limits
    return { data: true, error: null };
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