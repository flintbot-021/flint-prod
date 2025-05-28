/**
 * Base Data Access Layer
 * 
 * This module provides common utilities, error handling, and base functionality
 * for all data access operations in the Flint Lead Magnet tool.
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { ApiResponse, DatabaseResult, ValidationError } from '@/lib/types/database';

// Re-export types for convenience
export type { ApiResponse, DatabaseResult, ValidationError };

/**
 * Get the appropriate Supabase client based on environment
 */
export async function getSupabaseClient() {
  // In Next.js, check if we're on the server or client
  if (typeof window === 'undefined') {
    // Server-side: use server client (async)
    return await createServerClient();
  } else {
    // Client-side: use client
    return createClient();
  }
}

/**
 * Standard error types for database operations
 */
export class DataAccessError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public validationErrors?: ValidationError[]
  ) {
    super(message);
    this.name = 'DataAccessError';
  }
}

/**
 * Wrap database operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<DatabaseResult<T>> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error('Database operation failed:', error);
      
      // Handle specific Supabase error codes
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'No records found'
        };
      }
      
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Record already exists',
          validation_errors: [
            {
              field: 'unique_constraint',
              message: 'A record with this information already exists',
              code: 'DUPLICATE_ENTRY'
            }
          ]
        };
      }
      
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Referenced record does not exist',
          validation_errors: [
            {
              field: 'foreign_key',
              message: 'The referenced record does not exist',
              code: 'INVALID_REFERENCE'
            }
          ]
        };
      }
      
      return {
        success: false,
        error: error.message || 'Database operation failed'
      };
    }
    
    return {
      success: true,
      data: data || undefined
    };
  } catch (err) {
    console.error('Unexpected error in database operation:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error occurred'
    };
  }
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  result: DatabaseResult<T>,
  message?: string
): ApiResponse<T> {
  if (result.success) {
    return {
      data: result.data,
      message: message || 'Operation completed successfully'
    };
  } else {
    return {
      error: result.error,
      message: message || 'Operation failed'
    };
  }
}

/**
 * Validate required fields before database operations
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING',
        value
      });
    }
  }
  
  return errors;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Apply pagination to Supabase query
 */
export function applyPagination<T>(
  query: any,
  params: PaginationParams = {}
) {
  const { page = 1, per_page = 20, sort_by, sort_order = 'desc' } = params;
  
  // Calculate offset
  const offset = (page - 1) * per_page;
  
  // Apply range (pagination)
  query = query.range(offset, offset + per_page - 1);
  
  // Apply sorting if specified
  if (sort_by) {
    query = query.order(sort_by, { ascending: sort_order === 'asc' });
  }
  
  return query;
}

/**
 * Get user ID from Supabase auth (for RLS)
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Ensure user is authenticated before database operations
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new DataAccessError(
      'Authentication required',
      'AUTH_REQUIRED'
    );
  }
  return userId;
} 