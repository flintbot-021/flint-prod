import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionChangeRequest } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubscriptionChangeRequest = await request.json();
    const { action, new_credit_amount } = body;

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance, billing_anchor_date, cancellation_scheduled_at, downgrade_scheduled_at, downgrade_to_credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get current total credits owned
    const { data: creditTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('transaction_type', 'purchase');

    const currentTotalCredits = creditTransactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    let responseMessage = '';
    let transactionDescription = '';

    switch (action) {
      case 'cancel':
        // Schedule cancellation at end of billing period
        updateData.cancellation_scheduled_at = new Date().toISOString();
        updateData.downgrade_scheduled_at = null; // Clear any scheduled downgrades
        updateData.downgrade_to_credits = null;
        responseMessage = `Subscription scheduled for cancellation at end of current billing period.`;
        transactionDescription = 'Subscription cancellation scheduled';
        break;

      case 'reactivate':
        // Remove scheduled cancellation and any downgrades
        updateData.cancellation_scheduled_at = null;
        updateData.downgrade_scheduled_at = null;
        updateData.downgrade_to_credits = null;
        responseMessage = `Subscription reactivated. Your plan will continue renewing.`;
        transactionDescription = 'Subscription reactivated';
        break;

      case 'upgrade':
        if (!new_credit_amount || new_credit_amount <= currentTotalCredits) {
          return NextResponse.json(
            { error: 'New credit amount must be greater than current amount for upgrade' },
            { status: 400 }
          );
        }
        
        // For immediate upgrade, add credits now
        const upgradeAmount = new_credit_amount - currentTotalCredits;
        updateData.credit_balance = (profile.credit_balance || 0) + upgradeAmount;
        // Clear any scheduled changes since this is an immediate upgrade
        updateData.cancellation_scheduled_at = null;
        updateData.downgrade_scheduled_at = null;
        updateData.downgrade_to_credits = null;
        
        // Create purchase transaction for the upgrade
        const { error: upgradeTransactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            transaction_type: 'purchase',
            amount: upgradeAmount,
            description: `Upgraded subscription: +${upgradeAmount} credit${upgradeAmount > 1 ? 's' : ''}`,
            metadata: {
              action: 'upgrade',
              from_credits: currentTotalCredits,
              to_credits: new_credit_amount
            }
          });

        if (upgradeTransactionError) {
          console.error('Failed to create upgrade transaction:', upgradeTransactionError);
        }

        responseMessage = `Subscription upgraded! Added ${upgradeAmount} credit${upgradeAmount > 1 ? 's' : ''} immediately.`;
        transactionDescription = `Upgraded from ${currentTotalCredits} to ${new_credit_amount} credits`;
        break;

      case 'downgrade':
        if (!new_credit_amount || new_credit_amount >= currentTotalCredits) {
          return NextResponse.json(
            { error: 'New credit amount must be less than current amount for downgrade' },
            { status: 400 }
          );
        }

        if (new_credit_amount < 0) {
          return NextResponse.json(
            { error: 'Credit amount cannot be negative' },
            { status: 400 }
          );
        }

        // Check if user has enough published campaigns for the downgrade
        const { count: publishedCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'published');

        if ((publishedCount || 0) > new_credit_amount) {
          return NextResponse.json(
            { error: `Cannot downgrade to ${new_credit_amount} credit${new_credit_amount !== 1 ? 's' : ''} while ${publishedCount} campaign${publishedCount !== 1 ? 's are' : ' is'} published. Please unpublish some campaigns first.` },
            { status: 400 }
          );
        }

        if (new_credit_amount === 0) {
          // Downgrading to 0 is the same as canceling
          updateData.cancellation_scheduled_at = new Date().toISOString();
          updateData.downgrade_scheduled_at = null;
          updateData.downgrade_to_credits = null;
          responseMessage = `Subscription scheduled for cancellation at end of current billing period.`;
          transactionDescription = 'Subscription scheduled for cancellation (downgrade to 0)';
        } else {
          // Schedule downgrade for next billing cycle
          updateData.downgrade_scheduled_at = new Date().toISOString();
          updateData.downgrade_to_credits = new_credit_amount;
          updateData.cancellation_scheduled_at = null; // Clear any existing cancellation
          responseMessage = `Subscription will downgrade to ${new_credit_amount} credit${new_credit_amount !== 1 ? 's' : ''} at next billing cycle.`;
          transactionDescription = `Downgrade scheduled from ${currentTotalCredits} to ${new_credit_amount} credits`;
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Create audit transaction (except for upgrades which already create a purchase transaction)
    if (action !== 'upgrade') {
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'refund', // Using refund as audit trail
          amount: 0, // No credit change for scheduling actions
          description: transactionDescription,
          metadata: {
            action,
            current_total_credits: currentTotalCredits,
            new_credit_amount: new_credit_amount || currentTotalCredits,
            scheduled_at: new Date().toISOString()
          }
        });

      if (transactionError) {
        console.error('Failed to create audit transaction:', transactionError);
      }
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        action,
        current_total_credits: currentTotalCredits,
        new_credit_amount: new_credit_amount || currentTotalCredits,
        cancellation_scheduled: action === 'cancel' || (action === 'downgrade' && new_credit_amount === 0),
        effective_immediately: action === 'upgrade' || action === 'reactivate'
      }
    });

  } catch (error) {
    console.error('Error processing subscription change:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription change' },
      { status: 500 }
    );
  }
} 