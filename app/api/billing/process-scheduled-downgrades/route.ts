import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const serviceSupabase = createServiceRoleClient()
    
    // Get all profiles with scheduled downgrades that should have taken effect
    const now = new Date()
    const { data: scheduledDowngrades, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select('id, subscription_tier, scheduled_tier_change, scheduled_change_date')
      .not('scheduled_tier_change', 'is', null)
      .not('scheduled_change_date', 'is', null)
      .lte('scheduled_change_date', now.toISOString())

    if (fetchError) {
      console.error('Error fetching scheduled downgrades:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch scheduled downgrades' }, { status: 500 })
    }

    if (!scheduledDowngrades || scheduledDowngrades.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No scheduled downgrades to process',
        processed: 0 
      })
    }

    console.log(`Processing ${scheduledDowngrades.length} scheduled downgrades`)
    let processedCount = 0
    const results = []

    for (const profile of scheduledDowngrades) {
      try {
        console.log(`Processing downgrade for user ${profile.id}: ${profile.subscription_tier} -> ${profile.scheduled_tier_change}`)
        
        // Handle campaign unpublishing based on new tier limits
        const campaignResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/billing/handle-campaign-limits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || 'internal'}` // Add auth for internal calls
          },
          body: JSON.stringify({ 
            targetTier: profile.scheduled_tier_change, 
            preview: false,
            userId: profile.id // Pass userId for internal processing
          }),
        })

        let campaignResult = null
        if (campaignResponse.ok) {
          campaignResult = await campaignResponse.json()
          console.log(`Campaign handling result for user ${profile.id}:`, campaignResult)
        } else {
          console.error(`Failed to handle campaign limits for user ${profile.id}`)
        }

        // Update the profile tier and clear scheduled fields
        const { error: updateError } = await serviceSupabase
          .from('profiles')
          .update({
            subscription_tier: profile.scheduled_tier_change,
            scheduled_tier_change: null,
            scheduled_change_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Error updating profile for user ${profile.id}:`, updateError)
          results.push({
            userId: profile.id,
            success: false,
            error: updateError.message,
          })
          continue
        }

        results.push({
          userId: profile.id,
          success: true,
          oldTier: profile.subscription_tier,
          newTier: profile.scheduled_tier_change,
          campaignsAffected: campaignResult?.campaignsToUnpublish?.length || 0,
        })
        
        processedCount++
        console.log(`Successfully processed downgrade for user ${profile.id}`)

      } catch (error) {
        console.error(`Error processing downgrade for user ${profile.id}:`, error)
        results.push({
          userId: profile.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} of ${scheduledDowngrades.length} scheduled downgrades`,
      processed: processedCount,
      total: scheduledDowngrades.length,
      results,
    })

  } catch (error) {
    console.error('Error processing scheduled downgrades:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process scheduled downgrades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 