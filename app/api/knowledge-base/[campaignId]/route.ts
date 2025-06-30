import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
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

    const { campaignId } = await params
    const url = new URL(request.url)
    const entriesParam = url.searchParams.get('entries')
    
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Verify the campaign belongs to the user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' }, 
        { status: 403 }
      )
    }

    // Fetch all knowledge base entries for the campaign
    const { data: entries, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch knowledge base entries' },
        { status: 500 }
      )
    }

    let filteredEntries = entries || []

    // Filter by specific entry IDs if provided
    if (entriesParam) {
      const entryIds = entriesParam.split(',').filter(id => id.trim())
      filteredEntries = filteredEntries.filter(entry => entryIds.includes(entry.id))
    }

    return NextResponse.json({
      success: true,
      entries: filteredEntries
    })

  } catch (error) {
    console.error('Error fetching knowledge base entries:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch knowledge base entries' 
      },
      { status: 500 }
    )
  }
} 