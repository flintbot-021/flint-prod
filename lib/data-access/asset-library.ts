import { createClient } from '@/lib/supabase/client'
import { requireAuth } from './base'
import type { 
  AssetLibraryItem, 
  AssetMockup, 
  CreateAssetRequest, 
  CreateMockupRequest,
  AssetLibraryFilters 
} from '@/lib/types/asset-library'

/**
 * Get all assets for the current user
 */
export async function getAssets(filters?: AssetLibraryFilters): Promise<AssetLibraryItem[]> {
  const userId = await requireAuth()
  const supabase = createClient()
  
  let query = supabase
    .from('asset_library')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }
  
  if (filters?.source_type && filters.source_type.length > 0) {
    query = query.in('source_type', filters.source_type)
  }
  
  if (filters?.campaign_id) {
    query = query.eq('source_campaign_id', filters.campaign_id)
  }
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`)
  }

  return data || []
}

/**
 * Get a single asset by ID
 */
export async function getAsset(assetId: string): Promise<AssetLibraryItem | null> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_library')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Asset not found
    }
    throw new Error(`Failed to fetch asset: ${error.message}`)
  }

  return data
}

/**
 * Create a new asset in the library
 */
export async function createAsset(assetData: Omit<AssetLibraryItem, 'id' | 'user_id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<AssetLibraryItem> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_library')
    .insert({
      ...assetData,
      user_id: userId,
      usage_count: 0
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`)
  }

  return data
}

/**
 * Update an existing asset
 */
export async function updateAsset(assetId: string, updates: Partial<Omit<AssetLibraryItem, 'id' | 'user_id' | 'created_at'>>): Promise<AssetLibraryItem> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_library')
    .update(updates)
    .eq('id', assetId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`)
  }

  return data
}

/**
 * Delete an asset from the library
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { error } = await supabase
    .from('asset_library')
    .delete()
    .eq('id', assetId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`)
  }
}

/**
 * Increment usage count for an asset
 */
export async function incrementAssetUsage(assetId: string): Promise<void> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { error } = await supabase
    .from('asset_library')
    .update({ 
      usage_count: supabase.raw('usage_count + 1'),
      last_used_at: new Date().toISOString()
    })
    .eq('id', assetId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update asset usage: ${error.message}`)
  }
}

/**
 * Get all mockups for the current user
 */
export async function getMockups(): Promise<AssetMockup[]> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_mockups')
    .select(`
      *,
      asset_library (
        id,
        name,
        public_url,
        width,
        height
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch mockups: ${error.message}`)
  }

  return data || []
}

/**
 * Get mockups for a specific asset
 */
export async function getAssetMockups(assetId: string): Promise<AssetMockup[]> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_mockups')
    .select('*')
    .eq('asset_id', assetId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch asset mockups: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new mockup configuration
 */
export async function createMockup(mockupData: Omit<AssetMockup, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<AssetMockup> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_mockups')
    .insert({
      ...mockupData,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create mockup: ${error.message}`)
  }

  return data
}

/**
 * Update a mockup configuration
 */
export async function updateMockup(mockupId: string, updates: Partial<Omit<AssetMockup, 'id' | 'user_id' | 'created_at'>>): Promise<AssetMockup> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('asset_mockups')
    .update(updates)
    .eq('id', mockupId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update mockup: ${error.message}`)
  }

  return data
}

/**
 * Delete a mockup configuration
 */
export async function deleteMockup(mockupId: string): Promise<void> {
  const userId = await requireAuth()
  const supabase = createClient()

  const { error } = await supabase
    .from('asset_mockups')
    .delete()
    .eq('id', mockupId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete mockup: ${error.message}`)
  }
}
