import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const supabase = await createClient()
    const { shortId } = await params

    if (!shortId) {
      return NextResponse.json(
        { error: 'Short ID is required' },
        { status: 400 }
      )
    }

    // Get the shared result with campaign information (include user_key for URL construction)
    const { data: sharedResult, error: fetchError } = await supabase
      .from('shared_results')
      .select(`
        *,
        campaign:campaigns!inner(
          id,
          name,
          description,
          published_url,
          user_key,
          settings
        )
      `)
      .eq('short_id', shortId)
      .single()

    if (fetchError || !sharedResult) {
      return NextResponse.json(
        { error: 'Shared result not found' },
        { status: 404 }
      )
    }

    // Check if the shared result has expired
    if (sharedResult.expires_at && new Date(sharedResult.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This shared result has expired' },
        { status: 410 } // Gone
      )
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('shared_results')
      .update({
        view_count: (sharedResult.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('short_id', shortId)

    if (updateError) {
      console.error('Error updating view count:', updateError)
      // Don't fail the request if view count update fails
    }

    // Return the shared result data
    return NextResponse.json({
      success: true,
      data: {
        short_id: sharedResult.short_id,
        campaign: sharedResult.campaign,
        shared_data: sharedResult.shared_data,
        view_count: (sharedResult.view_count || 0) + 1,
        created_at: sharedResult.created_at,
        expires_at: sharedResult.expires_at
      }
    })

  } catch (error) {
    console.error('Error fetching shared result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
