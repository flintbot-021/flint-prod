/**
 * Data Access Layer - Main Export
 * 
 * This module serves as the main entry point for all data access operations
 * in the Flint Lead Magnet tool. It re-exports functions from individual modules
 * for easy importing throughout the application.
 */

// =============================================================================
// BASE UTILITIES
// =============================================================================
export {
  getSupabaseClient,
  withErrorHandling,
  createApiResponse,
  validateRequiredFields,
  isValidUUID,
  isValidEmail,
  requireAuth,
  getCurrentUserId,
  applyPagination,
  DataAccessError,
  type PaginationParams,
  type ApiResponse,
  type DatabaseResult,
  type ValidationError
} from './base';

// =============================================================================
// CAMPAIGN OPERATIONS
// =============================================================================
export {
  // Campaign CRUD
  createCampaign,
  getCampaignById,
  getCampaigns,
  getCampaignsWithRelations,
  updateCampaign,
  deleteCampaign,
  publishCampaign,

  // Section CRUD
  createSection,
  getSectionById,
  getCampaignSections,
  updateSection,
  deleteSection,
  reorderSections,

  // Section Options CRUD
  createSectionOption,
  updateSectionOption,
  deleteSectionOption
} from './campaigns';

// =============================================================================
// LEAD OPERATIONS
// =============================================================================
export {
  // Lead CRUD
  createLead,
  getLeadById,
  getCampaignLeads,
  updateLead,
  completeLead,
  deleteLead,

  // Lead Response CRUD
  createLeadResponse,
  upsertLeadResponse,
  getLeadResponses,
  getSectionResponses,
  deleteLeadResponse,

  // Lead Analytics
  getCampaignLeadStats,
  searchLeads
} from './leads';

// =============================================================================
// PROFILE OPERATIONS
// =============================================================================
export {
  // Profile CRUD
  getCurrentProfile,
  getProfileById,
  createProfile,
  updateCurrentProfile,
  updateProfile,

  // User Preferences
  getUserPreferences,
  updateUserPreferences,

  // Subscription Management
  updateSubscription,
  resetMonthlyUsage,
  incrementCampaignUsage,
  incrementLeadsUsage,

  // Profile Analytics
  getCurrentProfileWithUsage,
  canCreateCampaign,
  canCaptureLeads,
  completeOnboarding
} from './profiles';

// =============================================================================
// TYPE RE-EXPORTS
// =============================================================================
export type {
  // Database Types
  Campaign,
  Section,
  SectionOption,
  Lead,
  LeadResponse,
  Profile,
  CampaignVariable,
  LeadVariableValue,
  CampaignAnalytics,

  // Create Types
  CreateCampaign,
  CreateSection,
  CreateSectionOption,
  CreateLead,
  CreateLeadResponse,
  CreateProfile,
  CreateCampaignVariable,
  CreateLeadVariableValue,
  CreateCampaignAnalytics,

  // Update Types
  UpdateCampaign,
  UpdateSection,
  UpdateSectionOption,
  UpdateLead,
  UpdateLeadResponse,
  UpdateProfile,
  UpdateCampaignVariable,
  UpdateLeadVariableValue,
  UpdateCampaignAnalytics,

  // Extended Types
  CampaignWithRelations,
  SectionWithOptions,
  LeadWithRelations,
  LeadResponseWithRelations,
  ProfileWithUsage,

  // Configuration Types
  SectionConfiguration,
  TextQuestionConfiguration,
  MultipleChoiceConfiguration,
  SliderConfiguration,
  InfoConfiguration,
  CaptureConfiguration,
  LogicConfiguration,
  OutputConfiguration,
  VariableConfiguration,
  CampaignSettings,
  UserPreferences,

  // Response Types
  PaginatedResponse,

  // Enum Types
  CampaignStatus,
  SectionType,
  ResponseType,
  VariableType,
  VariableSource,
  SubscriptionPlan,
  SubscriptionStatus,

  // Utility Types
  UUID,
  Timestamp,
  JSONValue
} from '../types/database';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a new campaign with initial setup
 */
export async function createCampaignWithDefaults(
  name: string,
  description?: string
): Promise<DatabaseResult<Campaign>> {
  const { createCampaign } = await import('./campaigns');
  
  // Cast the data to CreateCampaign since we know createCampaign will handle user_id
  const campaignData = {
    name,
    description: description || '',
    status: 'draft' as const,
    settings: {
      theme: {
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        background_color: '#FFFFFF',
        font_family: 'Inter, sans-serif'
      },
      branding: {
        show_powered_by: true
      },
      completion: {
        email_notifications: true
      }
    },
    published_at: null,
    published_url: null
  } as CreateCampaign;
  
  return createCampaign(campaignData);
}

/**
 * Create a lead and increment usage counter
 */
export async function createLeadWithUsageTracking(
  leadData: CreateLead
): Promise<DatabaseResult<Lead>> {
  const { createLead } = await import('./leads');
  const { incrementLeadsUsage, canCaptureLeads } = await import('./profiles');

  // Check if user can capture more leads
  const canCapture = await canCaptureLeads(1);
  if (!canCapture.success) {
    return canCapture as any;
  }

  if (!canCapture.data) {
    return {
      success: false,
      error: 'Monthly leads limit reached'
    };
  }

  // Create the lead
  const leadResult = await createLead(leadData);
  if (!leadResult.success) {
    return leadResult;
  }

  // Increment usage counter
  await incrementLeadsUsage(1);

  return leadResult;
}

/**
 * Publish a campaign and increment usage counter
 */
export async function publishCampaignWithUsageTracking(
  campaignId: string,
  publishedUrl?: string
): Promise<DatabaseResult<Campaign>> {
  const { publishCampaign } = await import('./campaigns');

  // Note: For publishing, we don't check campaign limits since the campaign already exists
  // We only check limits during campaign creation

  // Publish the campaign
  const publishResult = await publishCampaign(campaignId, publishedUrl);
  if (!publishResult.success) {
    return publishResult;
  }

  return publishResult;
}

/**
 * Create a campaign and increment usage counter
 */
export async function createCampaignWithUsageTracking(
  campaignData: CreateCampaign
): Promise<DatabaseResult<Campaign>> {
  const { createCampaign } = await import('./campaigns');
  const { incrementCampaignUsage, canCreateCampaign } = await import('./profiles');

  // Check if user can create more campaigns
  const canCreate = await canCreateCampaign();
  if (!canCreate.success) {
    return canCreate as any;
  }

  if (!canCreate.data) {
    return {
      success: false,
      error: 'Monthly campaign limit reached'
    };
  }

  // Create the campaign
  const campaignResult = await createCampaign(campaignData);
  if (!campaignResult.success) {
    return campaignResult;
  }

  // Increment usage counter
  await incrementCampaignUsage();

  return campaignResult;
} 