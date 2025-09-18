import { createClient } from '@/lib/supabase/client'
import { createAsset } from '@/lib/data-access/asset-library'
import type { AssetLibraryItem, CreateAssetRequest } from '@/lib/types/asset-library'

/**
 * Upload a file to the asset library storage bucket
 */
export async function uploadAssetFile(
  file: File,
  metadata: {
    name: string
    description?: string
    tags?: string[]
    source_campaign_id?: string
    source_section_id?: string
    source_type?: 'manual' | 'screenshot' | 'upload'
  }
): Promise<AssetLibraryItem> {
  const supabase = createClient()
  
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `assets/${timestamp}_${sanitizedFileName}`

    console.log('📁 Starting asset upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath
    })

    // Upload file to Supabase storage (using existing campaign-uploads bucket)
    console.log('⬆️ Uploading to campaign-uploads bucket...')
    const { data, error } = await supabase.storage
      .from('campaign-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload failed:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('✅ Storage upload successful:', data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-uploads')
      .getPublicUrl(filePath)

    console.log('🔗 Public URL generated:', urlData.publicUrl)

    // Get image dimensions if it's an image
    let width: number | undefined
    let height: number | undefined
    
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await getImageDimensions(file)
        width = dimensions.width
        height = dimensions.height
      } catch (error) {
        console.warn('Failed to get image dimensions:', error)
      }
    }

    // Create asset record in database
    console.log('💾 Saving to database...')
    const assetData = {
      name: metadata.name,
      description: metadata.description,
      tags: metadata.tags || [],
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_extension: file.name.split('.').pop()?.toLowerCase(),
      storage_path: filePath,
      storage_bucket: 'campaign-uploads',
      public_url: urlData.publicUrl,
      width,
      height,
      source_campaign_id: metadata.source_campaign_id,
      source_section_id: metadata.source_section_id,
      source_type: metadata.source_type || 'upload',
      metadata: {
        original_name: file.name,
        upload_timestamp: new Date().toISOString()
      }
    }

    const asset = await createAsset(assetData)
    console.log('✅ Asset created successfully:', asset.id)

    return asset
  } catch (error) {
    console.error('❌ Asset upload failed:', error)
    throw error
  }
}

/**
 * Upload a screenshot to the asset library
 */
export async function uploadScreenshot(
  file: File,
  metadata: {
    name: string
    description?: string
    tags?: string[]
    source_campaign_id?: string
    source_section_id?: string
  }
): Promise<AssetLibraryItem> {
  return uploadAssetFile(file, {
    ...metadata,
    source_type: 'screenshot'
  })
}

/**
 * Delete an asset file from storage
 */
export async function deleteAssetFile(storagePath: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from('campaign-uploads')
    .remove([storagePath])

  if (error) {
    console.error('❌ Failed to delete asset file:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }

  console.log('✅ Asset file deleted:', storagePath)
}


/**
 * Get image dimensions from a file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Generate a unique asset name based on timestamp and source
 */
export function generateAssetName(
  baseName?: string,
  sourceType: 'manual' | 'screenshot' | 'upload' = 'upload'
): string {
  const timestamp = new Date().toLocaleString()
  const prefix = sourceType === 'screenshot' ? 'Screenshot' : 'Asset'
  
  if (baseName) {
    return `${baseName} - ${timestamp}`
  }
  
  return `${prefix} ${timestamp}`
}
