import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UploadedFileInfo {
  id: string
  name: string
  size: number
  type: string
  url: string
  path: string
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  file: File,
  campaignId: string,
  leadId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileInfo> {
  const fileId = Math.random().toString(36).substr(2, 9)
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `campaigns/${campaignId}/${leadId || 'preview'}/${timestamp}_${sanitizedFileName}`

  try {
    // Report upload start
    onProgress?.({
      fileId,
      progress: 0,
      status: 'uploading'
    })

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('campaign-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      onProgress?.({
        fileId,
        progress: 0,
        status: 'error',
        error: error.message
      })
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-uploads')
      .getPublicUrl(filePath)

    // Report completion
    onProgress?.({
      fileId,
      progress: 100,
      status: 'completed'
    })

    return {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    onProgress?.({
      fileId,
      progress: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  campaignId: string,
  leadId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileInfo[]> {
  const uploadPromises = files.map(file => 
    uploadFile(file, campaignId, leadId, onProgress)
  )

  return Promise.all(uploadPromises)
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('campaign-uploads')
    .remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Get file info from storage
 */
export async function getFileInfo(filePath: string) {
  const { data, error } = await supabase.storage
    .from('campaign-uploads')
    .list(filePath.split('/').slice(0, -1).join('/'), {
      search: filePath.split('/').pop()
    })

  if (error) {
    throw new Error(`Failed to get file info: ${error.message}`)
  }

  return data?.[0] || null
}

/**
 * Create storage bucket if it doesn't exist
 */
export async function ensureStorageBucket(): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('Failed to list buckets:', listError)
    return
  }

  const bucketExists = buckets?.some(bucket => bucket.name === 'campaign-uploads')
  
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket('campaign-uploads', {
      public: true,
      allowedMimeTypes: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'audio/*',
        'video/*'
      ],
      fileSizeLimit: 100 * 1024 * 1024 // 100MB
    })

    if (createError) {
      console.error('Failed to create storage bucket:', createError)
    }
  }
} 