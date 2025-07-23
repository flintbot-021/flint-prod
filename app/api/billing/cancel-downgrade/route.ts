import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile to check if downgrade is scheduled
    const serviceSupabase = createServiceRoleClient()
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, scheduled_tier_change, scheduled_change_date')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.scheduled_tier_change) {
      return NextResponse.json({ 
        error: 'No scheduled downgrade found' 
      }, { status: 400 })
    }

    // Clear the scheduled downgrade AND cancellation
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        scheduled_tier_change: null,
        scheduled_change_date: null,
        cancellation_scheduled_at: null, // Also clear this field
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error cancelling downgrade:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel downgrade' }, 
        { status: 500 }
      )
    }

    console.log(`Successfully cancelled downgrade for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Scheduled downgrade has been cancelled successfully.',
    })

  } catch (error) {
    console.error('Error cancelling downgrade:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel downgrade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 