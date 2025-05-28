# Database Schema Design for Flint Lead Magnet Tool

## Overview

This document outlines the database schema for the Flint Lead Magnet tool, designed to support interactive campaigns with multiple section types, lead capture, and comprehensive analytics.

## Schema Architecture

The schema follows a normalized relational design with proper foreign key relationships and supports the following core functionalities:

- **User Authentication**: Handled by Supabase Auth (users table managed by Supabase)
- **User Profiles**: Extended user information beyond authentication
- **Campaign Management**: Create and manage lead magnet campaigns
- **Section Types**: Support for 7 different section types as per PRD
- **Lead Capture**: Store leads with campaign attribution
- **Response Storage**: Store user responses with proper typing
- **Variable System**: Advanced variable interpolation and logic
- **Preview/Publishing**: Campaign state management

## Core Tables

### 1. `profiles`
Extended user information beyond Supabase's auth.users table.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  website VARCHAR(500),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'UTC',
  subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  monthly_campaign_limit INTEGER DEFAULT 3,
  monthly_campaigns_used INTEGER DEFAULT 0,
  monthly_leads_limit INTEGER DEFAULT 100,
  monthly_leads_captured INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `campaigns`
Primary table for campaign management.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  published_url VARCHAR(500) UNIQUE
);
```

### 3. `sections`
Stores all campaign sections with their configurations.

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('text_question', 'multiple_choice', 'slider', 'info', 'capture', 'logic', 'output')),
  title VARCHAR(500),
  description TEXT,
  order_index INTEGER NOT NULL,
  configuration JSONB DEFAULT '{}',
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, order_index)
);
```

### 4. `section_options`
Stores options for multiple choice sections and other configurable sections.

```sql
CREATE TABLE section_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label VARCHAR(500) NOT NULL,
  value VARCHAR(500) NOT NULL,
  order_index INTEGER NOT NULL,
  configuration JSONB DEFAULT '{}',
  
  UNIQUE(section_id, order_index)
);
```

### 5. `leads`
Stores captured lead information.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, email)
);
```

### 6. `lead_responses`
Stores individual responses from leads.

```sql
CREATE TABLE lead_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL CHECK (response_type IN ('text', 'choice', 'number', 'boolean', 'multiple_choice')),
  response_value TEXT NOT NULL,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, section_id)
);
```

### 7. `campaign_variables`
Stores variables defined for campaigns and their values.

```sql
CREATE TABLE campaign_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'array', 'object')),
  default_value TEXT,
  description TEXT,
  source VARCHAR(100) CHECK (source IN ('user_input', 'calculation', 'external_api', 'static')),
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, name)
);
```

### 8. `lead_variable_values`
Stores computed/resolved variable values for each lead.

```sql
CREATE TABLE lead_variable_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  variable_id UUID NOT NULL REFERENCES campaign_variables(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lead_id, variable_id)
);
```

### 9. `campaign_analytics`
Stores campaign performance metrics.

```sql
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  average_completion_time INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(campaign_id, date)
);
```

## Section Type Configurations

### Text Question Section
```json
{
  "input_type": "text|textarea|email|phone",
  "placeholder": "Enter your response...",
  "max_length": 500,
  "validation": {
    "pattern": "regex_pattern",
    "message": "Validation error message"
  }
}
```

### Multiple Choice Section
```json
{
  "allow_multiple": false,
  "randomize_options": false,
  "min_selections": 1,
  "max_selections": 1,
  "display_type": "radio|checkbox|dropdown"
}
```

### Slider Section
```json
{
  "min_value": 0,
  "max_value": 100,
  "step": 1,
  "default_value": 50,
  "labels": {
    "min": "Low",
    "max": "High"
  }
}
```

### Info Section
```json
{
  "content": "HTML content to display",
  "show_continue_button": true,
  "auto_advance": false,
  "auto_advance_delay": 3000
}
```

### Capture Section
```json
{
  "fields": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "label": "Full Name"
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "label": "Email Address"
    }
  ]
}
```

### Logic Section
```json
{
  "variable_access": ["var1", "var2"],
  "prompt_template": "Based on {{var1}}, suggest...",
  "output_variable": "ai_suggestion",
  "ai_provider": "openai",
  "model": "gpt-4"
}
```

### Output Section
```json
{
  "template": "Your result: {{ai_suggestion}}",
  "variables": ["ai_suggestion", "user_name"],
  "format": "html|text|pdf",
  "download_enabled": true
}
```

## User Preferences Configuration

The `profiles.preferences` JSONB field supports the following structure:

```json
{
  "theme": "light|dark|system",
  "dashboard": {
    "default_view": "grid|list",
    "campaigns_per_page": 10,
    "show_archived": false
  },
  "notifications": {
    "email_campaign_published": true,
    "email_new_lead": true,
    "email_weekly_summary": true,
    "browser_notifications": false
  },
  "editor": {
    "auto_save": true,
    "show_grid": false,
    "snap_to_grid": true
  },
  "billing": {
    "currency": "USD",
    "timezone": "America/New_York"
  }
}
```

## Subscription Plans and Limits

### Free Plan
- Monthly campaigns: 3
- Monthly leads: 100
- Basic section types only

### Starter Plan
- Monthly campaigns: 10
- Monthly leads: 1,000
- All section types
- Basic analytics

### Pro Plan
- Monthly campaigns: 50
- Monthly leads: 10,000
- Advanced analytics
- Custom branding
- AI logic sections

### Enterprise Plan
- Unlimited campaigns
- Unlimited leads
- White-label solution
- Priority support
- Custom integrations

## Automatic Profile Creation

When a user signs up through Supabase Auth, a corresponding profile record is automatically created using a database trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Indexes

### Performance Indexes
```sql
-- Campaign queries
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- Section queries
CREATE INDEX idx_sections_campaign_id ON sections(campaign_id);
CREATE INDEX idx_sections_type ON sections(type);
CREATE INDEX idx_sections_order ON sections(campaign_id, order_index);

-- Lead queries
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_completed ON leads(completed_at);

-- Response queries
CREATE INDEX idx_responses_lead_id ON lead_responses(lead_id);
CREATE INDEX idx_responses_section_id ON lead_responses(section_id);

-- Variable queries
CREATE INDEX idx_variables_campaign_id ON campaign_variables(campaign_id);
CREATE INDEX idx_variable_values_lead_id ON lead_variable_values(lead_id);

-- Analytics queries
CREATE INDEX idx_analytics_campaign_date ON campaign_analytics(campaign_id, date);
```

## Relationships Summary

1. **auth.users → profiles**: One-to-One (extended user information)
2. **auth.users → campaigns**: One-to-Many (user can have multiple campaigns)
3. **Campaign → Sections**: One-to-Many (campaign has multiple sections)
4. **Section → Options**: One-to-Many (section can have multiple options)
5. **Campaign → Leads**: One-to-Many (campaign captures multiple leads)
6. **Lead → Responses**: One-to-Many (lead provides multiple responses)
7. **Section → Responses**: One-to-Many (section receives multiple responses)
8. **Campaign → Variables**: One-to-Many (campaign defines multiple variables)
9. **Lead → Variable Values**: One-to-Many (lead has multiple computed variable values)
10. **Campaign → Analytics**: One-to-Many (campaign has daily analytics records)

## Data Flow

1. **Campaign Creation**: User creates campaign with sections and variables
2. **Lead Engagement**: Visitor accesses published campaign URL
3. **Response Collection**: Lead progresses through sections, responses stored
4. **Variable Computation**: Variables computed based on responses and logic
5. **Lead Completion**: Final output generated and lead marked complete
6. **Analytics Update**: Daily metrics updated for reporting

This schema supports all requirements from the PRD including advanced variable systems, multiple section types, and comprehensive lead management. 