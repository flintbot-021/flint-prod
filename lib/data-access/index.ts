/**
 * Data Access Layer - Main Export
 * 
 * This module serves as the main entry point for all data access operations
 * in the Flint Lead Magnet tool. It re-exports functions from individual modules
 * for easy importing throughout the application.
 */

import type {
  Campaign,
  Lead,
  CreateCampaign,
  CreateLead,
  DatabaseResult
} from '@/lib/types/database';

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

} from './base';

// =============================================================================
// CAMPAIGN OPERATIONS
// =============================================================================
export {
  // Campaign CRUD
  createCampaign,
  getCampaignById,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  publishCampaign,
  unpublishCampaign,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,

  // Campaign Activation Controls
  activateCampaign,
  deactivateCampaign,
  getCampaignActivationStatus,

  // Section CRUD
  reorderSections,

  // Section options removed - now stored in section.configuration JSONB field
} from './campaigns';

// OLD LEAD OPERATIONS REMOVED - Now using simplified session-based approach
// See ./sessions.ts for new lead management functions

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
  // Core entities
  Profile,
  Campaign,
  Section,
  Lead,
  CampaignSession,
  CampaignVariable,
  LeadVariableValue,

  // Configuration types
  UserPreferences,
  CampaignSettings,
  SectionConfiguration,
  VariableConfiguration,

  // Create types (for inserts)
  CreateProfile,
  CreateCampaign,
  CreateSection,
  CreateLead,
  CreateCampaignSession,
  CreateCampaignVariable,
  CreateLeadVariableValue,

  // Update types (for updates)
  UpdateProfile,
  UpdateCampaign,
  UpdateSection,
  UpdateLead,
  UpdateCampaignSession,
  UpdateCampaignVariable,
  UpdateLeadVariableValue,

  // Extended types with relationships
  CampaignWithRelations,
  SectionWithOptions,
  LeadWithRelations,
  ProfileWithUsage,

  // Utility types
  ApiResponse,
  PaginatedResponse,
  DatabaseResult,
  ValidationError,

  // Enums
  CampaignStatus,
  SectionType,
  ResponseType,
  VariableType,
  VariableSource,
  SubscriptionPlan,
  SubscriptionStatus
} from '@/lib/types/database';

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

// createLeadWithUsageTracking removed - functionality moved to createLeadFromCapture

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

/**
 * Create a lead from capture form data (updated for new schema)
 */
export async function createLeadFromCapture(
  sessionId: string,
  campaignId: string,
  captureData: {
    name?: string;
    email?: string;
    phone?: string;
    gdprConsent?: boolean;
    marketingConsent?: boolean;
  },
  conversionSectionId?: string,
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<DatabaseResult<Lead>> {
  // Validate required fields
  if (!captureData.email) {
    return {
      success: false,
      error: 'Email is required',
      validation_errors: [{
        field: 'email',
        message: 'Email address is required',
        code: 'REQUIRED_FIELD',
        value: captureData.email
      }]
    };
  }

  // Prepare lead data for new schema
  const leadData: CreateLead = {
    session_id: sessionId,
    campaign_id: campaignId,
    name: captureData.name || null,
    email: captureData.email,
    phone: captureData.phone || null,
    converted_at: new Date().toISOString(),
    conversion_section_id: conversionSectionId || null,
    metadata: {
      capture_form: true,
      gdpr_consent: captureData.gdprConsent || false,
      marketing_consent: captureData.marketingConsent || false,
      capture_timestamp: new Date().toISOString(),
      // Store tracking metadata in the metadata field
      tracking: {
        ip_address: metadata?.ip_address || null,
        user_agent: metadata?.user_agent || null,
        referrer: metadata?.referrer || null,
        utm_source: metadata?.utm_source || null,
        utm_medium: metadata?.utm_medium || null,
        utm_campaign: metadata?.utm_campaign || null,
        utm_term: metadata?.utm_term || null,
        utm_content: metadata?.utm_content || null
      }
    }
  };

  // Use the new createLead from sessions.ts (not the old one)
  const { createLead } = await import('./sessions');
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

// Session & Lead Management (new simplified approach)
export {
  createSession,
  getSession,
  updateSession,
  addResponse,
  createLead,
  getLeadBySession,
  getSessionWithLead,
  getResponseForSection,
  isSectionCompleted,
  generateSessionId
} from './sessions'; 