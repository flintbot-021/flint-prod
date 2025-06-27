import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    const campaign_id = formData.get('campaign_id') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const content_type = formData.get('content_type') as string
    const file = formData.get('file') as File | null
    
    if (!campaign_id || !title) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID and title are required' },
        { status: 400 }
      )
    }

    // Verify the campaign belongs to the user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' }, 
        { status: 403 }
      )
    }

    // For text entries, content is required. For file entries, content is optional (additional context)
    if (content_type !== 'file' && !content) {
      return NextResponse.json(
        { success: false, error: 'Content is required for text entries' },
        { status: 400 }
      )
    }

    let fileContent = content || ''
    let fileUrl: string | undefined = undefined
    
    // If there's a file, store it in Supabase Storage and optionally extract text content
    if (file && content_type === 'file') {
      try {
        // Store file in Supabase Storage
        const fileBuffer = await file.arrayBuffer()
        const fileName = `${Date.now()}-${file.name}`
        const filePath = `knowledge-base/${campaign_id}/${fileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: false
          })
        
        if (uploadError) {
          console.error('File upload error:', uploadError)
          throw new Error('Failed to upload file to storage')
        }
        
        // Get public URL for the file
        const { data: urlData } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(filePath)
        
        fileUrl = urlData.publicUrl
        
        // Note: We skip creating a record in uploaded_files table for knowledge base files
        // because they don't belong to a specific section and we store metadata in knowledge_base table instead
        console.log('📝 Knowledge base file uploaded successfully, skipping uploaded_files table entry')
        
        // Check if file is a supported text-based format for content extraction
        const supportedTextTypes = [
          'text/plain',
          'text/markdown', 
          'text/csv',
          'application/json',
          'text/html',
          'text/xml'
        ]
        
        const isTextFile = supportedTextTypes.includes(file.type) || 
                          file.name.match(/\.(txt|md|csv|json|html|xml)$/i)
        
        if (isTextFile) {
          // For text files, extract content directly
          const fileText = await file.text()
          // Sanitize content to remove null bytes and other problematic characters
          const sanitizedText = fileText.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          fileContent = content ? `${content}\n\n--- File Content ---\n${sanitizedText}` : sanitizedText
        } else {
          // For non-text files (images, PDFs, etc.), store metadata and user-provided context
          // The actual file will be sent to AI for vision processing
          const fileInfo = `File: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`
          fileContent = content ? `${content}\n\n--- File Info ---\n${fileInfo}` : fileInfo
        }
      } catch (error) {
        console.error('Error processing file:', error)
        // Fallback to just using the provided content
        fileContent = content || `File upload failed: ${file.name}`
      }
    }

    // Insert the knowledge base entry
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        campaign_id,
        user_id: user.id,
        title,
        content: fileContent,
        content_type: (content_type === 'file' ? 'document' : 'text') as 'text' | 'document',
        file_id: null,
        metadata: file ? { 
          original_filename: file.name, 
          file_size: file.size,
          file_type: file.type,
          file_url: fileUrl
        } : undefined,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create knowledge base entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error creating knowledge base entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create knowledge base entry' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const { id, title, content, content_type, file_id, metadata, is_active } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    // Update the knowledge base entry (only if it belongs to the user)
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({
        title,
        content,
        is_active,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update knowledge base entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error updating knowledge base entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update knowledge base entry' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    // Soft delete the knowledge base entry (only if it belongs to the user)
    const { error } = await supabase
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete knowledge base entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error deleting knowledge base entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete knowledge base entry' 
      },
      { status: 500 }
    )
  }
} 