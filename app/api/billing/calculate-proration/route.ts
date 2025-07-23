import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Stripe Price IDs and amounts
const TIER_CONFIG = {
  standard: { 
    priceId: process.env.STRIPE_STANDARD_PRICE_ID,
    amount: 99 
  },
  premium: { 
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    amount: 249 
  },
} as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetTier } = body

    if (!['free', 'standard', 'premium'].includes(targetTier)) {
      return NextResponse.json({ error: 'Invalid target tier' }, { status: 400 })
    }

    // Get current profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 })
    }

    if (profile.subscription_tier === targetTier) {
      return NextResponse.json({ 
        error: `Already on ${targetTier} plan` 
      }, { status: 400 })
    }

    // Special handling for downgrade to Free tier
    if (targetTier === 'free') {
      // Get subscription from Stripe to get billing period info
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      
      if (!subscription || subscription.status !== 'active') {
        return NextResponse.json({ 
          error: 'Subscription is not active' 
        }, { status: 400 })
      }

      // Get billing period from the subscription item
      const subscriptionItems = (subscription as any).items?.data
      if (!subscriptionItems || subscriptionItems.length === 0) {
        return NextResponse.json({ 
          error: 'No subscription items found' 
        }, { status: 500 })
      }
      
      const subscriptionItem = subscriptionItems[0]
      const periodStart = subscriptionItem.current_period_start
      const periodEnd = subscriptionItem.current_period_end
      
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ 
          error: 'Invalid billing period data from Stripe' 
        }, { status: 500 })
      }
      
      const currentPeriodStart = new Date(periodStart * 1000)
      const currentPeriodEnd = new Date(periodEnd * 1000)
      const now = new Date()
      
      // Calculate days
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      const currentTier = profile.subscription_tier as 'standard' | 'premium'
      const currentAmount = TIER_CONFIG[currentTier].amount

      return NextResponse.json({
        success: true,
        calculation: {
          currentTier,
          targetTier: 'free',
          currentAmount,
          targetAmount: 0, // Free tier costs $0
          
          // Billing period info
          currentPeriodStart: currentPeriodStart.toISOString(),
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          totalDays,
          daysUsed: totalDays - daysRemaining,
          daysRemaining,
          
          // No charges for downgrade to free
          immediateCharge: 0,
          isUpgrade: false,
          isDowngrade: true,
          
          // Next billing (none - free tier)
          nextBillingDate: currentPeriodEnd.toISOString(),
          nextBillingAmount: 0,
          
          // Display formatting
          formattedImmediateCharge: '$0.00',
          changeType: 'downgrade',
          actionText: 'No immediate charge',
        }
      })
    }

    // Get subscription from Stripe to get accurate billing info
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ 
        error: 'Subscription is not active' 
      }, { status: 400 })
    }

    console.log('Full subscription object:', JSON.stringify(subscription, null, 2))

    // Calculate proration
    const currentTier = profile.subscription_tier as 'standard' | 'premium'
    
    if (!currentTier || !TIER_CONFIG[currentTier]) {
      return NextResponse.json({ error: 'Invalid current tier' }, { status: 400 })
    }
    
    const currentAmount = TIER_CONFIG[currentTier].amount
    const targetAmount = TIER_CONFIG[targetTier as keyof typeof TIER_CONFIG].amount
    
    // Get billing period from the subscription item (not the subscription itself)
    const subscriptionItems = (subscription as any).items?.data
    if (!subscriptionItems || subscriptionItems.length === 0) {
      return NextResponse.json({ 
        error: 'No subscription items found' 
      }, { status: 500 })
    }
    
    const subscriptionItem = subscriptionItems[0]
    const periodStart = subscriptionItem.current_period_start
    const periodEnd = subscriptionItem.current_period_end
    
    console.log('Period data from subscription item:', { periodStart, periodEnd })
    
    if (!periodStart || !periodEnd) {
      return NextResponse.json({ 
        error: 'Invalid billing period data from Stripe' 
      }, { status: 500 })
    }
    
    const currentPeriodStart = new Date(periodStart * 1000)
    const currentPeriodEnd = new Date(periodEnd * 1000)
    
    console.log('Converted dates:', { 
      currentPeriodStart: currentPeriodStart.toISOString(), 
      currentPeriodEnd: currentPeriodEnd.toISOString() 
    })
    
    // Validate dates
    if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid billing period dates' 
      }, { status: 500 })
    }
    const now = new Date()
    
    // Calculate days in billing period and days remaining
    const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const daysUsed = totalDays - daysRemaining
    
    // Determine if it's an upgrade or downgrade
    const isUpgrade = targetAmount > currentAmount
    const isDowngrade = targetAmount < currentAmount
    
    let immediateCharge = 0
    let actionText = 'No immediate charge'
    let formattedImmediateCharge = '$0.00'

    if (isUpgrade) {
      // For upgrades: Calculate prorated charge for immediate feature access
      const currentPeriodUsed = (currentAmount / totalDays) * daysUsed
      const currentPeriodRemaining = currentAmount - currentPeriodUsed
      
      const targetPeriodRemaining = (targetAmount / totalDays) * daysRemaining
      immediateCharge = targetPeriodRemaining - currentPeriodRemaining
      
      actionText = 'You will be charged'
      formattedImmediateCharge = `$${Math.abs(immediateCharge).toFixed(2)}`
    } else if (isDowngrade) {
      // For downgrades: No immediate charge/credit - plan changes at period end
      immediateCharge = 0
      actionText = 'No immediate charge'
      formattedImmediateCharge = '$0.00'
    }

    return NextResponse.json({
      success: true,
      calculation: {
        currentTier,
        targetTier,
        currentAmount,
        targetAmount,
        
        // Billing period info
        currentPeriodStart: currentPeriodStart.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        totalDays,
        daysUsed,
        daysRemaining,
        
        // Proration calculation
        immediateCharge: Math.round(immediateCharge * 100) / 100, // Round to 2 decimal places
        isUpgrade,
        isDowngrade,
        
        // Next billing
        nextBillingDate: currentPeriodEnd.toISOString(),
        nextBillingAmount: targetAmount,
        
        // Display formatting
        formattedImmediateCharge,
        changeType: isUpgrade ? 'upgrade' : 'downgrade',
        actionText,
      }
    })

  } catch (error) {
    console.error('Error calculating proration:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate proration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 