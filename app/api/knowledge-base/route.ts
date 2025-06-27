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
    
    // If there's a file, extract its content
    if (file && content_type === 'file') {
      try {
        const fileText = await file.text()
        fileContent = content ? `${content}\n\n--- File Content ---\n${fileText}` : fileText
      } catch (error) {
        console.error('Error reading file:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to read uploaded file' },
          { status: 400 }
        )
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
        file_id: undefined,
        metadata: file ? { original_filename: file.name, file_size: file.size } : undefined,
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