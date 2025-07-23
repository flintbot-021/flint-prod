import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Test endpoint to manually update user subscription
// This helps debug webhook issues
export async function POST(request: NextRequest) {
  try {
    const { userId, tier } = await request.json()
    
    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 })
    }

    if (!['standard', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const TIER_CONFIG = {
      standard: { max_campaigns: 3, price: 99 },
      premium: { max_campaigns: -1, price: 249 },
    }
    
    const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
    
    const { error, data } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        max_published_campaigns: tierConfig.max_campaigns,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error updating user subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated user ${userId} to ${tier} tier`,
      data 
    })
    
  } catch (error) {
    console.error('Error in test webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 