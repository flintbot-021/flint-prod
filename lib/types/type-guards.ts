/**
 * Type Guard Functions for Runtime Type Validation
 * 
 * These functions help validate complex types at runtime,
 * especially useful when dealing with JSON data from the database.
 */

import {
  SectionType,
  SectionConfiguration,
  TextQuestionConfiguration,
  MultipleChoiceConfiguration,
  SliderConfiguration,
  InfoConfiguration,
  CaptureConfiguration,
  LogicConfiguration,
  OutputConfiguration,
  CampaignStatus,
  ResponseType,
  VariableType,
  VariableSource,
} from './database';

// =============================================================================
// ENUM TYPE GUARDS
// =============================================================================

export function isCampaignStatus(value: any): value is CampaignStatus {
  return typeof value === 'string' && ['draft', 'published', 'archived'].includes(value);
}

export function isSectionType(value: any): value is SectionType {
  return typeof value === 'string' && [
    'text_question',
    'multiple_choice',
    'slider',
    'info',
    'capture',
    'logic',
    'output'
  ].includes(value);
}

export function isResponseType(value: any): value is ResponseType {
  return typeof value === 'string' && [
    'text',
    'choice',
    'number',
    'boolean',
    'multiple_choice'
  ].includes(value);
}

export function isVariableType(value: any): value is VariableType {
  return typeof value === 'string' && [
    'text',
    'number',
    'boolean',
    'array',
    'object'
  ].includes(value);
}

export function isVariableSource(value: any): value is VariableSource {
  return typeof value === 'string' && [
    'user_input',
    'calculation',
    'external_api',
    'static'
  ].includes(value);
}

// =============================================================================
// SECTION CONFIGURATION TYPE GUARDS
// =============================================================================

export function isTextQuestionConfiguration(
  type: SectionType,
  config: any
): config is TextQuestionConfiguration {
  if (type !== 'text_question') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.input_type === 'string' &&
    ['text', 'textarea', 'email', 'phone', 'url', 'number'].includes(config.input_type)
  );
}

export function isMultipleChoiceConfiguration(
  type: SectionType,
  config: any
): config is MultipleChoiceConfiguration {
  if (type !== 'multiple_choice') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.allow_multiple === 'boolean' &&
    typeof config.randomize_options === 'boolean' &&
    typeof config.min_selections === 'number' &&
    typeof config.max_selections === 'number' &&
    typeof config.display_type === 'string' &&
    ['radio', 'checkbox', 'dropdown', 'buttons'].includes(config.display_type)
  );
}

export function isSliderConfiguration(
  type: SectionType,
  config: any
): config is SliderConfiguration {
  if (type !== 'slider') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.min_value === 'number' &&
    typeof config.max_value === 'number' &&
    typeof config.step === 'number' &&
    typeof config.labels === 'object' &&
    config.labels !== null &&
    typeof config.labels.min === 'string' &&
    typeof config.labels.max === 'string'
  );
}

export function isInfoConfiguration(
  type: SectionType,
  config: any
): config is InfoConfiguration {
  if (type !== 'info') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.content === 'string' &&
    typeof config.show_continue_button === 'boolean' &&
    typeof config.auto_advance === 'boolean'
  );
}

export function isCaptureConfiguration(
  type: SectionType,
  config: any
): config is CaptureConfiguration {
  if (type !== 'capture') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    Array.isArray(config.fields) &&
    config.fields.every((field: any) =>
      typeof field === 'object' &&
      field !== null &&
      typeof field.name === 'string' &&
      typeof field.type === 'string' &&
      typeof field.label === 'string' &&
      typeof field.required === 'boolean'
    )
  );
}

export function isLogicConfiguration(
  type: SectionType,
  config: any
): config is LogicConfiguration {
  if (type !== 'logic') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    Array.isArray(config.variable_access) &&
    typeof config.prompt_template === 'string' &&
    typeof config.output_variable === 'string' &&
    typeof config.ai_provider === 'string' &&
    ['openai', 'anthropic', 'google', 'custom'].includes(config.ai_provider)
  );
}

export function isOutputConfiguration(
  type: SectionType,
  config: any
): config is OutputConfiguration {
  if (type !== 'output') return false;
  
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.template === 'string' &&
    Array.isArray(config.variables) &&
    typeof config.format === 'string' &&
    ['html', 'text', 'pdf', 'json'].includes(config.format) &&
    typeof config.download_enabled === 'boolean'
  );
}

/**
 * Main type guard for section configurations
 */
export function isSectionConfiguration(
  type: SectionType,
  config: any
): config is SectionConfiguration {
  switch (type) {
    case 'text_question':
      return isTextQuestionConfiguration(type, config);
    case 'multiple_choice':
      return isMultipleChoiceConfiguration(type, config);
    case 'slider':
      return isSliderConfiguration(type, config);
    case 'info':
      return isInfoConfiguration(type, config);
    case 'capture':
      return isCaptureConfiguration(type, config);
    case 'logic':
      return isLogicConfiguration(type, config);
    case 'output':
      return isOutputConfiguration(type, config);
    default:
      return false;
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates if a value is a valid UUID format
 */
export function isUUID(value: any): value is string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === 'string' && uuidRegex.test(value);
}

/**
 * Validates if a value is a valid timestamp string
 */
export function isTimestamp(value: any): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates if a value is a valid email address
 */
export function isEmail(value: any): value is string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof value === 'string' && emailRegex.test(value);
}

/**
 * Validates if a value is a valid phone number
 */
export function isPhoneNumber(value: any): value is string {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return typeof value === 'string' && phoneRegex.test(value) && value.length >= 10;
}

/**
 * Validates if a value is a valid URL
 */
export function isURL(value: any): value is string {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// ARRAY TYPE GUARDS
// =============================================================================

/**
 * Type guard for arrays with specific element type validation
 */
export function isArrayOf<T>(
  value: any,
  typeGuard: (item: any) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(typeGuard);
}

/**
 * Type guard for string arrays
 */
export function isStringArray(value: any): value is string[] {
  return isArrayOf(value, (item): item is string => typeof item === 'string');
}

/**
 * Type guard for number arrays
 */
export function isNumberArray(value: any): value is number[] {
  return isArrayOf(value, (item): item is number => typeof item === 'number');
}

// =============================================================================
// OBJECT TYPE GUARDS
// =============================================================================

/**
 * Validates if a value is a plain object (not null, not array)
 */
export function isPlainObject(value: any): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
}

/**
 * Validates if an object has all required keys
 */
export function hasRequiredKeys<T extends Record<string, any>>(
  obj: any,
  keys: string[]
): obj is T {
  if (!isPlainObject(obj)) return false;
  return keys.every(key => key in obj);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a type-safe configuration validator for sections
 */
export function createSectionValidator(type: SectionType) {
  return (config: any): config is SectionConfiguration => {
    return isSectionConfiguration(type, config);
  };
}

/**
 * Validates and casts section configuration with proper typing
 */
export function validateSectionConfig<T extends SectionType>(
  type: T,
  config: any
): SectionConfiguration | null {
  if (!isSectionConfiguration(type, config)) {
    return null;
  }
  return config;
}

/**
 * Safe JSON parsing with type validation
 */
export function safeJsonParse<T>(
  json: string,
  typeGuard: (value: any) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Validates database record structure
 */
export function validateDatabaseRecord<T extends Record<string, any>>(
  record: any,
  requiredFields: string[],
  typeValidators?: Record<string, (value: any) => boolean>
): record is T {
  if (!isPlainObject(record)) return false;
  
  // Check required fields exist
  if (!hasRequiredKeys(record, requiredFields)) return false;
  
  // Run type validators if provided
  if (typeValidators) {
    for (const [field, validator] of Object.entries(typeValidators)) {
      if (field in record && !validator(record[field])) {
        return false;
      }
    }
  }
  
  return true;
} 