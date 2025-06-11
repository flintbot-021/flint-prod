import { createClient } from '@/lib/supabase/client';
import type {
  CampaignSession,
  Lead,
  CreateCampaignSession,
  CreateLead,
  UpdateCampaignSession,
  DatabaseResult
} from '@/lib/types/database';

// =============================================================================
// CAMPAIGN SESSIONS
// =============================================================================

/**
 * Create a new campaign session
 */
export async function createSession(
  sessionData: CreateCampaignSession
): Promise<DatabaseResult<CampaignSession>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('campaign_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      // Handle specific error cases
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Session already exists'
        };
      }

      console.error('❌ [CREATE_SESSION] Database error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('💥 [CREATE_SESSION] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to create session'
    };
  }
}

/**
 * Get session by session_id
 */
export async function getSession(sessionId: string): Promise<DatabaseResult<CampaignSession>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('campaign_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid "multiple rows" error

    if (error) {
      console.error('❌ [GET_SESSION] Query error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('💥 [GET_SESSION] Unexpected error:', error);
    return {
      success: false,
      error: 'Failed to fetch session'
    };
  }
}

/**
 * Update session progress and responses
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<{
    current_section_index: number;
    completed_sections: number[];
    is_completed: boolean;
    responses: Record<string, any>;
    metadata: Record<string, any>;
  }>
): Promise<DatabaseResult<CampaignSession>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('campaign_sessions')
      .update({
        ...updates,
        last_activity: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating session:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error updating session:', error);
    return {
      success: false,
      error: 'Failed to update session'
    };
  }
}

/**
 * Add/update a response in the session
 */
export async function addResponse(
  sessionId: string,
  sectionId: string,
  response: any
): Promise<DatabaseResult<CampaignSession>> {
  const supabase = createClient();

  try {
    // First get current responses
    const { data: session } = await supabase
      .from('campaign_sessions')
      .select('responses')
      .eq('session_id', sessionId)
      .single();

    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // Update the responses object
    const updatedResponses = {
      ...session.responses,
      [sectionId]: response
    };

    // Update the session
    const { data, error } = await supabase
      .from('campaign_sessions')
      .update({
        responses: updatedResponses,
        last_activity: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error adding response:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error adding response:', error);
    return {
      success: false,
      error: 'Failed to add response'
    };
  }
}

// =============================================================================
// LEADS (CONVERSIONS)
// =============================================================================

/**
 * Create a lead when user provides contact info
 */
export async function createLead(
  leadData: CreateLead
): Promise<DatabaseResult<Lead>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error creating lead:', error);
    return {
      success: false,
      error: 'Failed to create lead'
    };
  }
}

/**
 * Check if session already converted to lead
 */
export async function getLeadBySession(sessionId: string): Promise<DatabaseResult<Lead | null>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lead:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error fetching lead:', error);
    return {
      success: false,
      error: 'Failed to fetch lead'
    };
  }
}

/**
 * Get session with lead data (for complete context)
 */
export async function getSessionWithLead(sessionId: string) {
  const supabase = createClient();

  try {
    const [sessionResult, leadResult] = await Promise.all([
      getSession(sessionId),
      getLeadBySession(sessionId)
    ]);

    if (!sessionResult.success) {
      return sessionResult;
    }

    return {
      success: true,
      data: {
        session: sessionResult.data,
        lead: leadResult.success ? leadResult.data : null,
        hasConverted: !!(leadResult.success && leadResult.data)
      }
    };
  } catch (error) {
    console.error('Unexpected error fetching session with lead:', error);
    return {
      success: false,
      error: 'Failed to fetch session data'
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get response for a specific section
 */
export function getResponseForSection(session: CampaignSession, sectionId: string) {
  return session.responses?.[sectionId] || null;
}

/**
 * Check if section is completed
 */
export function isSectionCompleted(session: CampaignSession, sectionIndex: number): boolean {
  return session.completed_sections?.includes(sectionIndex) || false;
}

/**
 * Generate unique session ID (UUID format for database compatibility)
 */
export function generateSessionId(): string {
  // Generate a proper UUID v4 format for database compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 