import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Fetch current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    
    console.log('Current subscription details:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at: subscription.cancel_at,
      schedule: subscription.schedule,
      current_period_end: subscription.current_period_end,
      items: subscription.items.data.map(item => ({
        price_id: item.price.id,
        product: item.price.product
      }))
    })

    // If there's a schedule, fetch it
    let scheduleDetails = null
    if (subscription.schedule) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string)
        scheduleDetails = {
          id: schedule.id,
          status: schedule.status,
          end_behavior: schedule.end_behavior,
          phases: schedule.phases.map(phase => ({
            start_date: phase.start_date,
            end_date: phase.end_date,
            items: phase.items?.map(item => ({
              price: item.price,
              quantity: item.quantity
            }))
          }))
        }
        console.log('Schedule details:', scheduleDetails)
      } catch (error) {
        console.error('Error fetching schedule:', error)
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at: subscription.cancel_at,
        schedule: subscription.schedule,
        current_period_end: subscription.current_period_end
      },
      schedule: scheduleDetails
    })

  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    )
  }
}
