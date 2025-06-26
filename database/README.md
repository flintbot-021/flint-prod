# Database Schema and Data Access Layer Documentation

This document provides comprehensive documentation for the Flint Lead Magnet database schema, built with Supabase (PostgreSQL), and the corresponding TypeScript data access layer.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Schema Relationships](#schema-relationships)
4. [Table Specifications](#table-specifications)
5. [Row-Level Security (RLS)](#row-level-security-rls)
6. [Data Access Layer](#data-access-layer)
7. [Usage Examples](#usage-examples)
8. [TypeScript Types](#typescript-types)
9. [Migration System](#migration-system)
10. [Troubleshooting](#troubleshooting)
11. [Performance Considerations](#performance-considerations)
12. [Future Enhancements](#future-enhancements)

## Overview

The Flint Lead Magnet database is designed as a multi-tenant SaaS application with comprehensive support for:

- **Campaign Management**: Create, edit, and publish interactive lead magnet campaigns
- **Lead Capture**: Store lead information with detailed tracking and analytics
- **Variable System**: Support for dynamic content and AI-generated variables
- **User Profiles**: Extended user information beyond Supabase authentication
- **Analytics**: Campaign performance tracking and reporting

### Key Design Principles

- **Normalized Design**: Efficient storage with minimal redundancy
- **Multi-tenant Security**: Row-level security ensures user data isolation
- **JSONB Configuration**: Flexible section configuration storage
- **Performance Optimized**: Strategic indexes and query patterns
- **Type Safety**: Comprehensive TypeScript interface coverage

## Database Schema

The database consists of 9 core tables organized into logical groups:

### Core Tables
- `profiles` - Extended user information
- `campaigns` - Lead magnet campaigns
- `sections` - Campaign sections/slides
- `section_options` - Multiple choice options

### Lead Management
- `leads` - Captured lead information
- `lead_responses` - Individual section responses

### Variable System
- `campaign_variables` - Variable definitions
- `lead_variable_values` - Computed variable values

### Analytics
- `campaign_analytics` - Daily performance metrics

## Schema Relationships

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   profiles  │      │  campaigns  │      │  sections   │
│             │ 1:N  │             │ 1:N  │             │
│ id (PK)     ├─────▶│ user_id     ├─────▶│ campaign_id │
│ email       │      │ id (PK)     │      │ id (PK)     │
│ ...         │      │ name        │      │ type        │
└─────────────┘      │ ...         │      │ ...         │
                     └─────────────┘      └─────────────┘
                                                 │
                                                 │ 1:N
                                                 ▼
                     ┌─────────────┐      ┌─────────────┐
                     │    leads    │      │section_opts │
                     │             │      │             │
                     │ id (PK)     │      │ section_id  │
                     │ campaign_id ◀──────┤ id (PK)     │
                     │ email       │      │ label       │
                     │ ...         │      │ ...         │
                     └─────────────┘      └─────────────┘
                            │
                            │ 1:N
                            ▼
                     ┌─────────────┐
                     │lead_responses│
                     │             │
                     │ lead_id     │
                     │ section_id  │
                     │ response    │
                     │ ...         │
                     └─────────────┘
```

### Variable System Relationships

```
┌─────────────┐ 1:N  ┌─────────────┐ N:M  ┌─────────────┐
│  campaigns  ├─────▶│ camp_vars   ├─────▶│ lead_var_   │
│ id (PK)     │      │ campaign_id │      │ values      │
└─────────────┘      │ id (PK)     │      │ variable_id │
                     │ name        │      │ lead_id     │
                     └─────────────┘      │ value       │
                                          └─────────────┘
```

## Table Specifications

### 1. profiles

Extended user information beyond Supabase authentication.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  website TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  monthly_campaign_limit INTEGER NOT NULL DEFAULT -1, -- Unlimited campaigns (legacy field)
  monthly_campaigns_used INTEGER NOT NULL DEFAULT 0,
  monthly_leads_limit INTEGER NOT NULL DEFAULT 100,
  monthly_leads_captured INTEGER NOT NULL DEFAULT 0,
  preferences JSONB NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Store extended user profile information and subscription details.

**Key Features**:
- Links to Supabase auth.users via foreign key
- Subscription management with usage tracking
- User preferences stored as JSONB
- Automatic timestamp management with triggers

### 2. campaigns

Core campaign definitions and settings.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_url TEXT
);
```

**Purpose**: Store campaign metadata, settings, and publication status.

**Key Features**:
- Multi-tenant isolation via user_id
- Flexible settings storage via JSONB
- Publication tracking with timestamps
- Status-based workflow management

### 3. sections

Individual sections/slides within campaigns.

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type section_type NOT NULL,
  title TEXT,
  description TEXT,
  order_index INTEGER NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Store individual campaign sections with type-specific configurations.

**Supported Section Types**:
- `text_question` - Text input fields
- `multiple_choice` - Radio buttons/checkboxes
- `slider` - Numeric range inputs
- `info` - Information/content slides
- `capture` - Lead information collection
- `logic` - AI processing sections
- `output` - Results display sections

**Key Features**:
- Ordered sections via order_index
- Type-specific configuration in JSONB
- Cascade deletion with campaigns

### 4. section_options

Options for multiple choice and configurable sections.

```sql
CREATE TABLE section_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'
);
```

**Purpose**: Store options for multiple choice sections and other configurable elements.

**Key Features**:
- Ordered options via order_index
- Flexible option configuration via JSONB
- Cascade deletion with sections

### 5. leads

Captured lead information with tracking data.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Store captured lead information with comprehensive tracking.

**Key Features**:
- Email as primary identifier
- Complete UTM parameter tracking
- IP and user agent for analytics
- Completion tracking via completed_at
- Additional metadata via JSONB

### 6. lead_responses

Individual responses from leads to sections.

```sql
CREATE TABLE lead_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  response_type response_type NOT NULL,
  response_value TEXT NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, section_id)
);
```

**Purpose**: Store individual responses to campaign sections.

**Response Types**:
- `text` - Text responses
- `choice` - Single choice selections
- `number` - Numeric values
- `boolean` - Yes/no responses
- `multiple_choice` - Multiple selections

**Key Features**:
- Unique constraint prevents duplicate responses
- Typed response storage
- Additional response data via JSONB

### 7. campaign_variables

Variable definitions for logic and output sections.

```sql
CREATE TABLE campaign_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type variable_type NOT NULL,
  default_value TEXT,
  description TEXT,
  source variable_source,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, name)
);
```

**Purpose**: Define variables for dynamic content and AI processing.

**Variable Types**:
- `text` - String values
- `number` - Numeric values
- `boolean` - Boolean values
- `array` - Array values
- `object` - Object values

**Variable Sources**:
- `user_input` - From user responses
- `calculation` - Computed values
- `external_api` - External API calls
- `static` - Static values

### 8. lead_variable_values

Computed variable values for each lead.

```sql
CREATE TABLE lead_variable_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  variable_id UUID NOT NULL REFERENCES campaign_variables(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, variable_id)
);
```

**Purpose**: Store computed variable values for each lead.

**Key Features**:
- Unique constraint per lead/variable pair
- Timestamp tracking for computation
- Text storage with type conversion in application layer

### 9. campaign_analytics

Daily campaign performance metrics.

```sql
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  starts INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_completion_time INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE(campaign_id, date)
);
```

**Purpose**: Track daily campaign performance metrics.

**Key Features**:
- Daily aggregated metrics
- Conversion rate calculation
- Additional analytics via JSONB metadata
- Unique constraint prevents duplicate entries

## Row-Level Security (RLS)

All tables implement Row-Level Security to ensure multi-tenant data isolation.

### Security Policies

#### profiles Table
```sql
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### campaigns Table
```sql
-- Users can only access their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);
```

#### sections Table
```sql
-- Users can access sections of their own campaigns
CREATE POLICY "Users can view own campaign sections" ON sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = sections.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );
```

#### leads Table
```sql
-- Users can access leads from their own campaigns
CREATE POLICY "Users can view own campaign leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Public can create leads (for lead capture)
CREATE POLICY "Anyone can create leads" ON leads
  FOR INSERT WITH CHECK (true);
```

### RLS Implications

1. **Data Isolation**: Users can only access their own data
2. **Lead Capture**: Public lead creation for campaign functionality
3. **Cascade Security**: Child table access is controlled via parent relationships
4. **Performance**: Policies are optimized with proper indexes

## Data Access Layer

The TypeScript data access layer provides a clean, type-safe interface to the database.

### Architecture

```
┌─────────────────────┐
│   Application       │
│   Components        │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│   Data Access       │
│   Layer (DAL)       │
│   - campaigns.ts    │
│   - leads.ts        │
│   - profiles.ts     │
│   - base.ts         │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│   Supabase Client   │
│   - RLS Policies    │
│   - Type Safety     │
│   - Error Handling  │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│   PostgreSQL        │
│   Database          │
└─────────────────────┘
```

### Core Modules

#### lib/data-access/base.ts
Common utilities and error handling for all data operations.

**Key Functions**:
- `getSupabaseClient()` - Get appropriate client (server/client)
- `withErrorHandling()` - Standardized error handling wrapper
- `validateRequiredFields()` - Input validation
- `requireAuth()` - Authentication enforcement
- `applyPagination()` - Query pagination utilities

#### lib/data-access/campaigns.ts
Campaign and section CRUD operations.

**Key Functions**:
- `createCampaign()` - Create new campaigns
- `getCampaignById()` - Retrieve single campaigns
- `getCampaigns()` - List user campaigns with pagination
- `createSection()` - Add sections to campaigns
- `reorderSections()` - Manage section ordering

#### lib/data-access/leads.ts
Lead and response management operations.

**Key Functions**:
- `createLead()` - Capture new leads
- `getLeadById()` - Retrieve lead details
- `getCampaignLeads()` - List campaign leads
- `createLeadResponse()` - Store section responses
- `getCampaignLeadStats()` - Analytics and statistics

#### lib/data-access/profiles.ts
User profile and subscription management.

**Key Functions**:
- `getCurrentProfile()` - Get current user profile
- `updateCurrentProfile()` - Update profile information
- `updateSubscription()` - Manage subscription status
- `incrementCampaignUsage()` - Track usage limits
- `getUserPreferences()` - Manage user preferences

### Error Handling

The data access layer implements standardized error handling:

```typescript
interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: ValidationError[];
}
```

**Error Types**:
- **Validation Errors**: Missing required fields, invalid formats
- **Database Errors**: Constraint violations, foreign key errors
- **Authentication Errors**: Missing or invalid authentication
- **Permission Errors**: RLS policy violations

### Type Safety

All database operations are fully typed with TypeScript interfaces:

```typescript
// Database record types
interface Campaign {
  id: UUID;
  user_id: UUID;
  name: string;
  // ... other fields
}

// Create operation types (omit generated fields)
type CreateCampaign = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;

// Update operation types (partial updates with ID)
type UpdateCampaign = Partial<Omit<Campaign, 'id' | 'user_id' | 'created_at'>> & { id: UUID };
```

## Usage Examples

### Creating a Campaign

```typescript
import { createCampaign } from '@/lib/data-access';

const result = await createCampaign({
  name: 'My Lead Magnet',
  description: 'A compelling lead magnet campaign',
  status: 'draft',
  settings: {
    theme: {
      primary_color: '#3B82F6',
      secondary_color: '#10B981'
    }
  }
});

if (result.success) {
  console.log('Campaign created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Adding Sections to a Campaign

```typescript
import { createSection } from '@/lib/data-access';

// Add a text question section
const textSection = await createSection({
  campaign_id: campaignId,
  type: 'text_question',
  title: 'What is your name?',
  order_index: 1,
  required: true,
  configuration: {
    input_type: 'text',
    placeholder: 'Enter your full name',
    max_length: 100
  }
});

// Add a multiple choice section
const choiceSection = await createSection({
  campaign_id: campaignId,
  type: 'multiple_choice',
  title: 'What interests you most?',
  order_index: 2,
  configuration: {
    allow_multiple: false,
    display_type: 'radio'
  }
});
```

### Capturing a Lead

```typescript
import { createLead, createLeadResponse } from '@/lib/data-access';

// Create the lead
const leadResult = await createLead({
  campaign_id: campaignId,
  email: 'user@example.com',
  name: 'John Doe',
  utm_source: 'google',
  utm_medium: 'cpc'
});

if (leadResult.success) {
  // Store responses
  await createLeadResponse({
    lead_id: leadResult.data.id,
    section_id: textSectionId,
    response_type: 'text',
    response_value: 'John Doe'
  });
}
```

### Retrieving Campaign Analytics

```typescript
import { getCampaignLeadStats } from '@/lib/data-access';

const stats = await getCampaignLeadStats(campaignId);

if (stats.success) {
  console.log('Total leads:', stats.data.total);
  console.log('Completed:', stats.data.completed);
  console.log('Conversion rate:', stats.data.conversion_rate);
}
```

### Managing User Profiles

```typescript
import { getCurrentProfile, updateCurrentProfile } from '@/lib/data-access';

// Get current profile
const profile = await getCurrentProfile();

// Update profile information
const updated = await updateCurrentProfile({
  full_name: 'John Doe',
  company_name: 'Acme Corp',
  preferences: {
    theme: 'dark',
    notifications: {
      email_new_lead: true
    }
  }
});
```

## TypeScript Types

### Core Database Types

Located in `lib/types/database.ts`, the type system provides:

#### Base Types
```typescript
type UUID = string;
type Timestamp = string;
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];
```

#### Enum Types
```typescript
type CampaignStatus = 'draft' | 'published' | 'archived';
type SectionType = 'text_question' | 'multiple_choice' | 'slider' | 'info' | 'capture' | 'logic' | 'output';
type ResponseType = 'text' | 'choice' | 'number' | 'boolean' | 'multiple_choice';
```

#### Configuration Types
```typescript
interface CampaignSettings {
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
  // ... additional settings
}
```

#### Section Configuration Union
```typescript
type SectionConfiguration = 
  | TextQuestionConfiguration
  | MultipleChoiceConfiguration
  | SliderConfiguration
  | InfoConfiguration
  | CaptureConfiguration
  | LogicConfiguration
  | OutputConfiguration;
```

### Runtime Type Validation

Located in `lib/types/type-guards.ts`, runtime validation ensures type safety:

```typescript
// Enum validators
export function isCampaignStatus(value: any): value is CampaignStatus {
  return ['draft', 'published', 'archived'].includes(value);
}

export function isSectionType(value: any): value is SectionType {
  return [
    'text_question', 'multiple_choice', 'slider', 
    'info', 'capture', 'logic', 'output'
  ].includes(value);
}

// Configuration validators
export function isTextQuestionConfiguration(config: any): config is TextQuestionConfiguration {
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.input_type === 'string' &&
    ['text', 'textarea', 'email', 'phone', 'url', 'number'].includes(config.input_type)
  );
}
```

## Migration System

Database migrations are located in the `database/migrations/` directory.

### Migration Order

1. `001_create_campaigns_table.sql` - Core campaigns table
2. `002_create_sections_table.sql` - Campaign sections
3. `003_create_section_options_table.sql` - Multiple choice options
4. `004_create_leads_table.sql` - Lead capture
5. `005_create_lead_responses_table.sql` - Response storage
6. `006_create_campaign_variables_table.sql` - Variable system
7. `007_create_lead_variable_values_table.sql` - Variable values
8. `008_create_campaign_analytics_table.sql` - Analytics
9. `009_create_rls_policies.sql` - Security policies
10. `010_create_profiles_table.sql` - User profiles

### Running Migrations

To apply all migrations to your Supabase instance:

1. **Via Supabase Dashboard**: Copy and paste each migration file in order
2. **Via Supabase CLI**: Use `supabase db reset` with migrations in place
3. **Via SQL**: Execute files manually in the SQL editor

### Migration Best Practices

- **Sequential Numbering**: Always use sequential numbering (001, 002, etc.)
- **Rollback Scripts**: Consider creating reverse migration scripts
- **Data Migration**: Separate schema changes from data migrations
- **Testing**: Test migrations on development instances first

## Troubleshooting

### Common Issues

#### 1. RLS Policy Violations

**Symptoms**: "new row violates row-level security policy" errors

**Solutions**:
- Ensure user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
- Check policy conditions match your use case
- Verify foreign key relationships for cascade policies

```typescript
// Example: Ensure user_id is set correctly
const { data, error } = await supabase
  .from('campaigns')
  .insert({
    ...campaignData,
    user_id: user.id // Explicit user_id setting
  });
```

#### 2. Foreign Key Constraint Errors

**Symptoms**: "violates foreign key constraint" errors

**Solutions**:
- Verify referenced records exist
- Check UUID format validity
- Ensure proper cascade deletion setup

```typescript
// Example: Verify campaign exists before creating section
const { data: campaign } = await supabase
  .from('campaigns')
  .select('id')
  .eq('id', campaignId)
  .single();

if (!campaign) {
  throw new Error('Campaign not found');
}
```

#### 3. JSONB Configuration Issues

**Symptoms**: Invalid JSONB data or structure errors

**Solutions**:
- Validate JSON structure before insertion
- Use TypeScript interfaces for type safety
- Implement runtime validation with type guards

```typescript
// Example: Validate configuration before saving
if (!isTextQuestionConfiguration(configuration)) {
  throw new Error('Invalid text question configuration');
}
```

#### 4. Performance Issues

**Symptoms**: Slow query performance

**Solutions**:
- Check index usage with `EXPLAIN ANALYZE`
- Optimize RLS policies for performance
- Use appropriate pagination
- Consider materialized views for complex analytics

```sql
-- Example: Check query performance
EXPLAIN ANALYZE 
SELECT * FROM campaigns 
WHERE user_id = 'user-uuid' 
AND status = 'published';
```

### Debug Mode

Enable debug logging in the data access layer:

```typescript
// Set environment variable
NEXT_PUBLIC_DEBUG_DAL=true

// Or programmatically
process.env.NEXT_PUBLIC_DEBUG_DAL = 'true';
```

This will log all database operations and results to the console.

## Performance Considerations

### Database Indexes

Key indexes for optimal performance:

```sql
-- Campaign queries
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Section queries
CREATE INDEX idx_sections_campaign_id ON sections(campaign_id);
CREATE INDEX idx_sections_order_index ON sections(campaign_id, order_index);

-- Lead queries
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Response queries
CREATE INDEX idx_lead_responses_lead_id ON lead_responses(lead_id);
CREATE INDEX idx_lead_responses_section_id ON lead_responses(section_id);

-- Analytics queries
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date DESC);
```

### Query Optimization

#### Pagination
Always use pagination for large datasets:

```typescript
const { data, count } = await supabase
  .from('leads')
  .select('*', { count: 'exact' })
  .eq('campaign_id', campaignId)
  .range(0, 19) // First 20 records
  .order('created_at', { ascending: false });
```

#### Selective Columns
Only select needed columns:

```typescript
// Instead of SELECT *
const { data } = await supabase
  .from('campaigns')
  .select('id, name, status, created_at')
  .eq('user_id', userId);
```

#### Batch Operations
Use batch operations for multiple records:

```typescript
// Insert multiple responses at once
const responses = leadResponses.map(response => ({
  lead_id: leadId,
  section_id: response.sectionId,
  response_type: response.type,
  response_value: response.value
}));

const { data, error } = await supabase
  .from('lead_responses')
  .insert(responses);
```

### Caching Strategies

#### Application-Level Caching
Consider caching for frequently accessed data:

```typescript
// Example: Cache campaign configuration
const campaignCache = new Map<string, Campaign>();

async function getCachedCampaign(id: string): Promise<Campaign> {
  if (campaignCache.has(id)) {
    return campaignCache.get(id)!;
  }
  
  const result = await getCampaignById(id);
  if (result.success) {
    campaignCache.set(id, result.data);
    return result.data;
  }
  
  throw new Error(result.error);
}
```

#### Database-Level Caching
Supabase automatically handles connection pooling and query caching.

## Future Enhancements

### Planned Schema Updates

1. **Campaign Templates**: Pre-built campaign templates
2. **Team Collaboration**: Multi-user campaign access
3. **Advanced Analytics**: Funnel analysis and cohort tracking
4. **Integrations**: CRM and email marketing platform connections
5. **A/B Testing**: Campaign variant testing support

### Potential Optimizations

1. **Read Replicas**: For analytics and reporting queries
2. **Partitioning**: For large analytics tables
3. **Materialized Views**: For complex aggregations
4. **Full-Text Search**: For campaign and lead search
5. **Event Sourcing**: For detailed audit trails

### Migration Considerations

When implementing future enhancements:

1. **Backward Compatibility**: Ensure existing data remains accessible
2. **Migration Scripts**: Provide clear upgrade paths
3. **Feature Flags**: Allow gradual rollout of new features
4. **Documentation**: Update this documentation with changes
5. **Testing**: Comprehensive testing of migration scripts

---

## Support

For questions about the database schema or data access layer:

1. Check this documentation first
2. Review the inline code comments
3. Examine the TypeScript interfaces in `lib/types/database.ts`
4. Test queries in the Supabase SQL editor
5. Use the debug mode for detailed operation logging

This documentation is maintained alongside the codebase and should be updated whenever schema changes are made. 