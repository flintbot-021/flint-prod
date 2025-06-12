import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('campaign_sessions')
      .select(`
        *,
        campaign:campaigns!inner(
          id,
          name,
          user_id
        )
      `)
      .eq('session_id', sessionId)
      .eq('campaign.user_id', user.id)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Return session data with responses
    return NextResponse.json({
      session_id: session.session_id,
      campaign_id: session.campaign_id,
      current_section_index: session.current_section_index,
      responses: session.user_inputs || {},
      created_at: session.created_at,
      updated_at: session.updated_at
    })

  } catch (error) {
    console.error('Error in session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 