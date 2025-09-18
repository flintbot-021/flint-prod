export interface AssetLibraryItem {
  id: string
  user_id: string
  name: string
  description?: string
  tags: string[]
  file_name: string
  file_size: number
  file_type: string
  file_extension?: string
  storage_path: string
  storage_bucket: string
  public_url: string
  width?: number
  height?: number
  source_campaign_id?: string
  source_section_id?: string
  source_type: 'manual' | 'screenshot' | 'upload'
  metadata: Record<string, any>
  usage_count: number
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface AssetMockup {
  id: string
  user_id: string
  asset_id: string
  name: string
  mockup_type: 'phone-1' | 'desktop-1' | 'tablet-1'
  background_type: string
  background_value: string
  asset_scale: number
  asset_position_x: number
  asset_position_y: number
  mockup_file_path?: string
  mockup_public_url?: string
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateAssetRequest {
  name: string
  description?: string
  tags?: string[]
  file: File
  source_campaign_id?: string
  source_section_id?: string
  source_type?: 'manual' | 'screenshot' | 'upload'
  metadata?: Record<string, any>
}

export interface CreateMockupRequest {
  asset_id: string
  name: string
  mockup_type: 'phone-1' | 'desktop-1' | 'tablet-1'
  background_type: string
  background_value: string
  asset_scale?: number
  asset_position_x?: number
  asset_position_y?: number
  config?: Record<string, any>
}

export interface ScreenshotCaptureOptions {
  element?: HTMLElement
  filename?: string
  width?: number
  height?: number
  quality?: number
  format?: 'png' | 'jpeg' | 'webp'
}

export interface AssetLibraryFilters {
  tags?: string[]
  source_type?: ('manual' | 'screenshot' | 'upload')[]
  campaign_id?: string
  search?: string
  limit?: number
  offset?: number
}
