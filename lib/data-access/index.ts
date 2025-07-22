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
  getCampaignSections,
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

// =============================================================================
// LEAD ANALYTICS & EXTENDED OPERATIONS
// =============================================================================
export {
  // Lead Analytics (the missing function)
  getCampaignLeadStats,
  getBatchCampaignLeadStats,
  
  // Additional lead operations not covered by sessions
  searchLeads,
  getLeads,
  getCampaignLeads,
  getLeadById,
  updateLead,
  completeLead,
  deleteLead,
  
  // Lead Responses
  createLeadResponse,
  upsertLeadResponse,
  getLeadResponses,
  getSectionResponses,
  deleteLeadResponse
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

  // Profile Analytics
  getCurrentProfileWithUsage,
  canCreateCampaign,
  canCaptureLeads,
  completeOnboarding
} from './profiles';

// =============================================================================
// BILLING AND CREDIT MANAGEMENT
// =============================================================================
export {
  // Credit Operations
  createCreditTransaction,
  getCreditTransactions,
  getCreditBalance,
  updateCreditBalance,

  // Billing History
  createBillingHistory,
  getBillingHistory,
  updateBillingHistoryStatus,

  // Subscription Management
  upsertUserSubscription,
  getUserSubscription,
  updateSubscriptionSlots,

  // Publishing Operations
  publishCampaign as publishCampaignWithCredits,
  unpublishCampaign as unpublishCampaignWithCredits,
  canPublishCampaign,

  // Analytics
  getBillingSummary
} from './billing';

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

  // Billing Types
  TransactionType,
  BillingType,
  BillingStatus,
  SubscriptionStatus,
  CreditTransaction,
  BillingHistory,
  UserSubscription,
  CreateCreditTransaction,
  CreateBillingHistory,
  CreateUserSubscription,
  UpdateCreditTransaction,
  UpdateBillingHistory,
  UpdateUserSubscription,
  ProfileWithBilling,
  CreditPurchaseRequest,
  BillingSummary
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

  // Create the campaign
  const campaignResult = await createCampaign(campaignData);
  if (!campaignResult.success) {
    return campaignResult;
  }

  // Track campaign creation in PostHog (client-side only)
  if (typeof window !== 'undefined' && (window as any).posthog) {
    try {
      (window as any).posthog.capture('campaign_created', {
        campaign_id: campaignResult.data?.id,
        campaign_name: campaignData.name,
        campaign_status: campaignData.status,
        has_description: !!campaignData.description,
        theme_primary_color: campaignData.settings?.theme?.primary_color,
        theme_secondary_color: campaignData.settings?.theme?.secondary_color,
        branding_show_powered_by: campaignData.settings?.branding?.show_powered_by,
        email_notifications_enabled: campaignData.settings?.completion?.email_notifications
      });
    } catch (error) {
      console.error('Failed to track campaign creation:', error);
    }
  }

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
    marketingConsent?: boolean;
    flintTermsConsent?: boolean;
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
      marketing_consent: captureData.marketingConsent || false,
      flint_terms_consent: captureData.flintTermsConsent || false,
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

  // Create the lead
  const leadResult = await createLead(leadData);
  if (!leadResult.success) {
    return leadResult;
  }

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