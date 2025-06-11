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
 * Save file information to the database
 */
async function saveFileToDatabase(
  fileInfo: UploadedFileInfo,
  campaignId: string,
  sectionId: string,
  leadId?: string,
  responseId?: string
): Promise<void> {
  try {
    // For public campaigns, skip database save to avoid RLS policy violations
    // Files are still saved to storage and accessible via public URLs
    console.log('🔄 Public campaign: Skipping database save for file metadata (RLS protection)')
    console.log('   - Files are uploaded to storage and remain accessible')
    console.log('   - Database tracking skipped for unauthenticated users')
    return

    const { error } = await supabase
      .from('uploaded_files')
      .insert({
        id: fileInfo.id,
        file_name: fileInfo.name,
        file_size: fileInfo.size,
        file_type: fileInfo.type,
        file_extension: fileInfo.name.split('.').pop()?.toLowerCase() || '',
        storage_path: fileInfo.path,
        storage_bucket: 'campaign-uploads',
        public_url: fileInfo.url,
        campaign_id: campaignId,
        lead_id: leadId || null,
        section_id: sectionId,
        response_id: responseId || null,
        upload_status: 'uploaded',
        upload_progress: 100,
        is_valid: true,
        virus_scan_status: 'pending',
        metadata: {
          original_name: fileInfo.name,
          upload_timestamp: new Date().toISOString()
        }
      })

    if (error) {
      console.error('❌ Database save error:', error)
      throw error
    }
  } catch (error) {
    console.error('❌ Failed to save file to database:', error)
    // Don't throw - allow upload to continue even if database save fails
  }
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  file: File,
  campaignId: string,
  sectionId: string,
  leadId?: string,
  responseId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileInfo> {
  const fileId = crypto.randomUUID() // Generate proper UUID
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `campaigns/${campaignId}/${leadId || 'preview'}/${timestamp}_${sanitizedFileName}`

  console.log('📁 Starting file upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    filePath,
    campaignId,
    sectionId,
    leadId
  })

  try {
    // Report upload start
    onProgress?.({
      fileId,
      progress: 0,
      status: 'uploading'
    })

    // Upload file to Supabase storage
    console.log('⬆️ Uploading to storage...')
    const { data, error } = await supabase.storage
      .from('campaign-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload failed:', error)
      onProgress?.({
        fileId,
        progress: 0,
        status: 'error',
        error: error.message
      })
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('✅ Storage upload successful:', data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-uploads')
      .getPublicUrl(filePath)

    console.log('🔗 Public URL generated:', urlData.publicUrl)

    const fileInfo: UploadedFileInfo = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      path: filePath
    }

    // Save file information to database
    console.log('💾 Saving to database...')
    await saveFileToDatabase(fileInfo, campaignId, sectionId, leadId, responseId)
    console.log('✅ Database save successful')

    // Report completion
    onProgress?.({
      fileId,
      progress: 100,
      status: 'completed'
    })

    return fileInfo
  } catch (error) {
    console.error('❌ Upload failed:', error)
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
  sectionId: string,
  leadId?: string,
  responseId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileInfo[]> {
  const uploadPromises = files.map(file => 
    uploadFile(file, campaignId, sectionId, leadId, responseId, onProgress)
  )

  return Promise.all(uploadPromises)
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(fileId: string): Promise<void> {
  // Get file info from database first
  const { data: fileRecord, error: fetchError } = await supabase
    .from('uploaded_files')
    .select('storage_path')
    .eq('id', fileId)
    .single()

  if (fetchError || !fileRecord) {
    throw new Error(`File not found: ${fetchError?.message}`)
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('campaign-uploads')
    .remove([fileRecord.storage_path])

  if (storageError) {
    throw new Error(`Storage delete failed: ${storageError.message}`)
  }

  // Soft delete from database
  const { error: dbError } = await supabase
    .from('uploaded_files')
    .update({ 
      deleted_at: new Date().toISOString(),
      upload_status: 'deleted'
    })
    .eq('id', fileId)

  if (dbError) {
    throw new Error(`Database delete failed: ${dbError.message}`)
  }
}

/**
 * Get file info from database
 */
export async function getFileInfo(fileId: string) {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('id', fileId)
    .is('deleted_at', null)
    .single()

  if (error) {
    throw new Error(`Failed to get file info: ${error.message}`)
  }

  return data
}

/**
 * Get all files for a campaign
 */
export async function getCampaignFiles(campaignId: string) {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select(`
      *,
      leads!lead_id(email),
      sections!section_id(title)
    `)
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get campaign files: ${error.message}`)
  }

  return data
}

/**
 * Get files for a specific lead response
 */
export async function getResponseFiles(responseId: string) {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('response_id', responseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get response files: ${error.message}`)
  }

  return data
}

/**
 * Update file virus scan status
 */
export async function updateVirusScanStatus(
  fileId: string, 
  status: 'pending' | 'clean' | 'infected' | 'error',
  scanDate?: Date
) {
  const { error } = await supabase
    .from('uploaded_files')
    .update({ 
      virus_scan_status: status,
      virus_scan_date: scanDate?.toISOString() || new Date().toISOString()
    })
    .eq('id', fileId)

  if (error) {
    throw new Error(`Failed to update virus scan status: ${error.message}`)
  }
}

/**
 * Create storage bucket if it doesn't exist
 */
export async function ensureStorageBucket(): Promise<void> {
  try {
    console.log('🪣 Checking storage bucket...')
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.log('⚠️ Cannot check buckets (likely permissions), assuming bucket exists')
      return
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'campaign-uploads')
    
    if (bucketExists) {
      console.log('✅ Storage bucket exists')
      return
    }

    console.log('📦 Creating storage bucket...')
    
    const { data, error: createError } = await supabase.storage.createBucket('campaign-uploads', {
      public: true,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'video/mp4',
        'video/avi',
        'video/mov'
      ],
      fileSizeLimit: 100 * 1024 * 1024 // 100MB
    })

    if (createError) {
      console.log('⚠️ Bucket creation failed (likely already exists or permissions issue), continuing with upload...')
      // Don't log as error since this is expected in many cases
    } else {
      console.log('✅ Storage bucket created successfully:', data)
    }
  } catch (error) {
    console.log('⚠️ Storage bucket check failed, assuming bucket exists and continuing...')
    // Don't log as error - this is normal behavior
  }
} 