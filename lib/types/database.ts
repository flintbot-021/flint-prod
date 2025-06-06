/**
 * Database Types for Flint Lead Magnet Tool
 * 
 * This file contains TypeScript type definitions for all database tables,
 * configurations, and enums used throughout the application.
 */

// =============================================================================
// BASE TYPES AND ENUMS
// =============================================================================

export type UUID = string;
export type Timestamp = string;
export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

export type CampaignStatus = 'draft' | 'published' | 'archived';

export type SectionType = 
  | 'text_question'
  | 'multiple_choice' 
  | 'slider'
  | 'info'
  | 'capture'
  | 'logic'
  | 'output';

export type ResponseType = 
  | 'text'
  | 'choice'
  | 'number'
  | 'boolean'
  | 'multiple_choice';

export type VariableType = 
  | 'text'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object';

export type VariableSource = 
  | 'user_input'
  | 'calculation'
  | 'external_api'
  | 'static';

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

// =============================================================================
// DATABASE TABLE TYPES
// =============================================================================

/**
 * Profiles table - Extended user information beyond Supabase auth.users
 */
export interface Profile {
  id: UUID; // Same as auth.users.id
  email: string;
  full_name: string | null;
  company_name: string | null;
  website: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: Timestamp | null;
  subscription_ends_at: Timestamp | null;
  monthly_campaign_limit: number;
  monthly_campaigns_used: number;
  monthly_leads_limit: number;
  monthly_leads_captured: number;
  preferences: UserPreferences;
  onboarding_completed: boolean;
  email_notifications: boolean;
  marketing_emails: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Campaigns table - Main campaign management
 */
export interface Campaign {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string | null;
  status: CampaignStatus;
  settings: CampaignSettings;
  created_at: Timestamp;
  updated_at: Timestamp;
  published_at: Timestamp | null;
  published_url: string | null;
  is_active: boolean; // Controls whether published campaigns are publicly accessible
}

/**
 * Sections table - Campaign sections with configurations
 */
export interface Section {
  id: UUID;
  campaign_id: UUID;
  type: SectionType;
  title: string | null;
  description: string | null;
  order_index: number;
  configuration: SectionConfiguration;
  required: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Section options table - Options for multiple choice and configurable sections
 */
export interface SectionOption {
  id: UUID;
  section_id: UUID;
  label: string;
  value: string;
  order_index: number;
  configuration: Record<string, JSONValue>;
}

/**
 * Leads table - Captured lead information
 */
export interface Lead {
  id: UUID;
  campaign_id: UUID;
  name: string | null;
  email: string;
  phone: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  metadata: Record<string, JSONValue>;
  completed_at: Timestamp | null;
  created_at: Timestamp;
}

/**
 * Lead responses table - Individual responses from leads
 */
export interface LeadResponse {
  id: UUID;
  lead_id: UUID;
  section_id: UUID;
  response_type: ResponseType;
  response_value: string;
  response_data: Record<string, JSONValue>;
  created_at: Timestamp;
}

/**
 * Campaign variables table - Variables for logic and output sections
 */
export interface CampaignVariable {
  id: UUID;
  campaign_id: UUID;
  name: string;
  type: VariableType;
  default_value: string | null;
  description: string | null;
  source: VariableSource | null;
  configuration: VariableConfiguration;
  created_at: Timestamp;
}

/**
 * Lead variable values table - Computed variable values per lead
 */
export interface LeadVariableValue {
  id: UUID;
  lead_id: UUID;
  variable_id: UUID;
  value: string;
  computed_at: Timestamp;
}

/**
 * Campaign analytics table - Daily performance metrics
 */
export interface CampaignAnalytics {
  id: UUID;
  campaign_id: UUID;
  date: string; // YYYY-MM-DD format
  views: number;
  starts: number;
  completions: number;
  conversion_rate: number;
  average_completion_time: number | null;
  metadata: Record<string, JSONValue>;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * User preferences stored in profiles.preferences JSONB field
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  dashboard?: {
    default_view?: 'grid' | 'list';
    campaigns_per_page?: number;
    show_archived?: boolean;
  };
  notifications?: {
    email_campaign_published?: boolean;
    email_new_lead?: boolean;
    email_weekly_summary?: boolean;
    browser_notifications?: boolean;
  };
  editor?: {
    auto_save?: boolean;
    show_grid?: boolean;
    snap_to_grid?: boolean;
  };
  billing?: {
    currency?: string;
    timezone?: string;
  };
}

/**
 * Campaign-wide settings and configuration
 */
export interface CampaignSettings {
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    font_family?: string;
  };
  branding?: {
    logo_url?: string;
    company_name?: string;
    show_powered_by?: boolean;
  };
  completion?: {
    redirect_url?: string;
    show_download_button?: boolean;
    email_notifications?: boolean;
  };
  tracking?: {
    google_analytics_id?: string;
    facebook_pixel_id?: string;
    custom_scripts?: string[];
  };
}

/**
 * Base configuration for all section types
 */
export interface BaseSectionConfiguration {
  title?: string;
  description?: string;
  required?: boolean;
  show_progress?: boolean;
}

/**
 * Text question section configuration
 */
export interface TextQuestionConfiguration extends BaseSectionConfiguration {
  input_type: 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'number';
  placeholder?: string;
  max_length?: number;
  min_length?: number;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

/**
 * Multiple choice section configuration
 */
export interface MultipleChoiceConfiguration extends BaseSectionConfiguration {
  allow_multiple: boolean;
  randomize_options: boolean;
  min_selections: number;
  max_selections: number;
  display_type: 'radio' | 'checkbox' | 'dropdown' | 'buttons';
  show_other_option?: boolean;
}

/**
 * Slider section configuration
 */
export interface SliderConfiguration extends BaseSectionConfiguration {
  min_value: number;
  max_value: number;
  step: number;
  default_value?: number;
  labels: {
    min: string;
    max: string;
    current?: string;
  };
  show_values?: boolean;
}

/**
 * Info section configuration
 */
export interface InfoConfiguration extends BaseSectionConfiguration {
  content: string; // HTML content
  show_continue_button: boolean;
  auto_advance: boolean;
  auto_advance_delay?: number; // milliseconds
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt_text?: string;
  };
}

/**
 * Capture section configuration (lead form)
 */
export interface CaptureConfiguration extends BaseSectionConfiguration {
  fields: CaptureField[];
  gdpr_consent?: {
    required: boolean;
    text: string;
  };
  marketing_consent?: {
    text: string;
    default_checked: boolean;
  };
}

export interface CaptureField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
  validation?: {
    pattern?: string;
    message?: string;
  };
}

/**
 * Logic section configuration (AI processing)
 */
export interface LogicConfiguration extends BaseSectionConfiguration {
  variable_access: string[]; // Variable names this section can access
  prompt_template: string; // Template with {{variable}} placeholders
  output_variable: string; // Name of variable to store result
  ai_provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
}

/**
 * Output section configuration (results display)
 */
export interface OutputConfiguration extends BaseSectionConfiguration {
  template: string; // HTML template with {{variable}} placeholders
  variables: string[]; // Variables available in this section
  format: 'html' | 'text' | 'pdf' | 'json';
  download_enabled: boolean;
  email_enabled?: boolean;
  sharing?: {
    enabled: boolean;
    platforms: ('twitter' | 'facebook' | 'linkedin' | 'email')[];
  };
}

/**
 * Union type for all section configurations
 */
export type SectionConfiguration = 
  | TextQuestionConfiguration
  | MultipleChoiceConfiguration
  | SliderConfiguration
  | InfoConfiguration
  | CaptureConfiguration
  | LogicConfiguration
  | OutputConfiguration;

/**
 * Variable configuration for different variable types
 */
export interface VariableConfiguration {
  calculation?: {
    formula: string; // JavaScript expression
    dependencies: string[]; // Other variable names
  };
  external_api?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body_template?: string;
    response_path?: string; // JSONPath to extract value
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowed_values?: string[];
  };
}

// =============================================================================
// UTILITY TYPES FOR API OPERATIONS
// =============================================================================

/**
 * Types for creating new records (without generated fields)
 */
export type CreateProfile = Omit<Profile, 'created_at' | 'updated_at'>;
export type CreateCampaign = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
export type CreateSection = Omit<Section, 'id' | 'created_at' | 'updated_at'>;
export type CreateSectionOption = Omit<SectionOption, 'id'>;
export type CreateLead = Omit<Lead, 'id' | 'created_at'>;
export type CreateLeadResponse = Omit<LeadResponse, 'id' | 'created_at'>;
export type CreateCampaignVariable = Omit<CampaignVariable, 'id' | 'created_at'>;
export type CreateLeadVariableValue = Omit<LeadVariableValue, 'id' | 'computed_at'>;
export type CreateCampaignAnalytics = Omit<CampaignAnalytics, 'id'>;

/**
 * Types for updating records (all fields optional except id)
 */
export type UpdateProfile = Partial<Omit<Profile, 'id' | 'created_at'>> & { id: UUID };
export type UpdateCampaign = Partial<Omit<Campaign, 'id' | 'user_id' | 'created_at'>> & { id: UUID };
export type UpdateSection = Partial<Omit<Section, 'id' | 'campaign_id' | 'created_at'>> & { id: UUID };
export type UpdateSectionOption = Partial<Omit<SectionOption, 'id' | 'section_id'>> & { id: UUID };
export type UpdateLead = Partial<Omit<Lead, 'id' | 'campaign_id' | 'created_at'>> & { id: UUID };
export type UpdateLeadResponse = Partial<Omit<LeadResponse, 'id' | 'lead_id' | 'section_id' | 'created_at'>> & { id: UUID };
export type UpdateCampaignVariable = Partial<Omit<CampaignVariable, 'id' | 'campaign_id' | 'created_at'>> & { id: UUID };
export type UpdateLeadVariableValue = Partial<Omit<LeadVariableValue, 'id' | 'lead_id' | 'variable_id'>> & { id: UUID };
export type UpdateCampaignAnalytics = Partial<Omit<CampaignAnalytics, 'id' | 'campaign_id' | 'date'>> & { id: UUID };

// =============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// =============================================================================

/**
 * Campaign with related data for full context
 */
export interface CampaignWithRelations extends Campaign {
  sections?: SectionWithOptions[];
  variables?: CampaignVariable[];
  analytics?: CampaignAnalytics[];
  lead_count?: number;
  completion_rate?: number;
  profile?: Profile; // Campaign owner's profile
}

/**
 * Section with its options included
 */
export interface SectionWithOptions extends Section {
  options?: SectionOption[];
}

/**
 * Lead with responses and variable values
 */
export interface LeadWithRelations extends Lead {
  responses?: LeadResponse[];
  variable_values?: LeadVariableValue[];
  campaign?: Campaign;
}

/**
 * Response with section and lead context
 */
export interface LeadResponseWithRelations extends LeadResponse {
  section?: Section;
  lead?: Lead;
}

/**
 * Profile with usage statistics
 */
export interface ProfileWithUsage extends Profile {
  total_campaigns?: number;
  total_leads?: number;
  current_month_campaigns?: number;
  current_month_leads?: number;
  usage_percentage?: {
    campaigns: number;
    leads: number;
  };
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    has_more?: boolean;
  };
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
    total_pages: number;
  };
}

// =============================================================================
// VALIDATION AND ERROR TYPES
// =============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: ValidationError[];
}

// =============================================================================
// SUPABASE SPECIFIC TYPES
// =============================================================================

/**
 * Supabase database schema type (generated by CLI)
 * This will be replaced when running `supabase gen types typescript`
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: CreateProfile;
        Update: UpdateProfile;
      };
      campaigns: {
        Row: Campaign;
        Insert: CreateCampaign;
        Update: UpdateCampaign;
      };
      sections: {
        Row: Section;
        Insert: CreateSection;
        Update: UpdateSection;
      };
      section_options: {
        Row: SectionOption;
        Insert: CreateSectionOption;
        Update: UpdateSectionOption;
      };
      leads: {
        Row: Lead;
        Insert: CreateLead;
        Update: UpdateLead;
      };
      lead_responses: {
        Row: LeadResponse;
        Insert: CreateLeadResponse;
        Update: UpdateLeadResponse;
      };
      campaign_variables: {
        Row: CampaignVariable;
        Insert: CreateCampaignVariable;
        Update: UpdateCampaignVariable;
      };
      lead_variable_values: {
        Row: LeadVariableValue;
        Insert: CreateLeadVariableValue;
        Update: UpdateLeadVariableValue;
      };
      campaign_analytics: {
        Row: CampaignAnalytics;
        Insert: CreateCampaignAnalytics;
        Update: UpdateCampaignAnalytics;
      };
    };
    Views: {
      // Add views here if any
    };
    Functions: {
      // Add functions here if any
    };
    Enums: {
      campaign_status: CampaignStatus;
      section_type: SectionType;
      response_type: ResponseType;
      variable_type: VariableType;
      variable_source: VariableSource;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
    };
  };
} 