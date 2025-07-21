import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { processWebhookEvent } from '@/lib/services/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Process the webhook event
    const result = await processWebhookEvent(
      JSON.parse(body), // This will be re-parsed inside processWebhookEvent for verification
      signature,
      body
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 