# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_key_here

# Stripe Configuration (Test Keys - Replace with your actual keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Stripe Price IDs (Create these in your Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_your_starter_price_id_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here

# Optional: Unsplash (for image search in campaign builder)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

# Optional: Sentry (for error monitoring)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional: Performance Tracking
NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING=true

# Node Environment
NODE_ENV=development
```

## Stripe Setup Instructions

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: In your Stripe dashboard, go to Developers → API keys
3. **Copy Keys**: Copy the "Publishable key" and "Secret key" (test versions)
4. **Create Price IDs**: In Stripe dashboard, create products for your pricing tiers
5. **Update Environment Variables**: Replace the placeholder values with your actual keys

## Current Implementation Status

✅ **Already Implemented:**
- Stripe dependencies installed
- Database schema with payment fields
- API routes for setup intent and payment methods
- Payment setup modal component
- Campaign publishing payment requirement
- Account management page
- Profile dropdown with account settings

⚠️ **Setup Required:**
- Create `.env.local` file with above variables
- Add your actual Stripe keys
- Test the payment flow

The Stripe integration is fully implemented and ready to use once you add your API keys! 