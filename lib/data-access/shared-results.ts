import { createClient } from '@/lib/supabase/server'

export interface SharedResult {
  id: string
  short_id: string
  campaign_id: string
  session_id?: string
  shared_data: any
  metadata?: any
  view_count: number
  last_viewed_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface CreateSharedResultData {
  campaign_id: string
  session_id?: string
  shared_data: any
  metadata?: any
  expires_at?: string
}

/**
 * Create a new shared result and return the short ID
 */
export async function createSharedResult(data: CreateSharedResultData) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('shared_results')
      .insert({
        campaign_id: data.campaign_id,
        session_id: data.session_id,
        shared_data: data.shared_data,
        metadata: data.metadata || {},
        expires_at: data.expires_at
      })
      .select('short_id, id, created_at')
      .single()

    if (error) {
      console.error('Error creating shared result:', error)
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      data: {
        shortId: result.short_id,
        id: result.id,
        createdAt: result.created_at
      }
    }
  } catch (error) {
    console.error('Error in createSharedResult:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get shared result by short ID
 */
export async function getSharedResultByShortId(shortId: string) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('shared_results')
      .select(`
        id,
        short_id,
        campaign_id,
        session_id,
        shared_data,
        metadata,
        view_count,
        last_viewed_at,
        expires_at,
        created_at,
        campaigns!inner(
          id,
          name,
          user_key,
          published_url,
          status
        )
      `)
      .eq('short_id', shortId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Shared result not found' }
      }
      console.error('Error getting shared result:', error)
      return { success: false, error: error.message }
    }

    // Check if expired
    if (result.expires_at && new Date(result.expires_at) < new Date()) {
      return { success: false, error: 'Shared result has expired' }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in getSharedResultByShortId:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Increment view count for a shared result
 */
export async function incrementViewCount(shortId: string) {
  try {
    const supabase = await createClient()
    
    // First get current view count, then increment it
    const { data: current, error: fetchError } = await supabase
      .from('shared_results')
      .select('view_count')
      .eq('short_id', shortId)
      .single()

    if (fetchError) {
      console.error('Error fetching current view count:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const { error } = await supabase
      .from('shared_results')
      .update({
        view_count: (current.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('short_id', shortId)

    if (error) {
      console.error('Error incrementing view count:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in incrementViewCount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete expired shared results (cleanup function)
 */
export async function cleanupExpiredSharedResults() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('shared_results')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up expired shared results:', error)
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      data: { deletedCount: data?.length || 0 }
    }
  } catch (error) {
    console.error('Error in cleanupExpiredSharedResults:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get shared results for a campaign (for analytics)
 */
export async function getSharedResultsForCampaign(campaignId: string) {
  try {
    const supabase = await createClient()
    
    const { data: results, error } = await supabase
      .from('shared_results')
      .select(`
        id,
        short_id,
        view_count,
        last_viewed_at,
        created_at,
        expires_at
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting shared results for campaign:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error in getSharedResultsForCampaign:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
