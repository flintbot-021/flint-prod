# Stripe Checkout Setup Guide

The account page upgrade buttons are failing because Stripe is not properly configured. Follow these steps to set up Stripe Checkout for your tier system.

## 1. Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Price IDs (create these in Stripe Dashboard)
STRIPE_STANDARD_PRICE_ID=price_1234567890abcdef # Replace with actual Standard tier price ID
STRIPE_PREMIUM_PRICE_ID=price_0987654321ghijkl # Replace with actual Premium tier price ID

# Your site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # or your production URL
```

## 2. Create Stripe Products & Prices

### In your Stripe Dashboard:

1. **Go to Products** → **Add Product**

2. **Create Standard Product:**
   - Name: "Standard Plan"  
   - Description: "Up to 3 published campaigns"
   - Add Price: $99/month (recurring)
   - Copy the Price ID (starts with `price_`) and use it for `STRIPE_STANDARD_PRICE_ID`

3. **Create Premium Product:**
   - Name: "Premium Plan"
   - Description: "Unlimited published campaigns"  
   - Add Price: $249/month (recurring)
   - Copy the Price ID and use it for `STRIPE_PREMIUM_PRICE_ID`

## 3. Set Up Webhook Endpoint

1. **In Stripe Dashboard** → **Webhooks** → **Add Endpoint**

2. **Endpoint URL:** `https://yourdomain.com/api/billing/webhook`
   - For local development: Use ngrok or similar to expose localhost

3. **Select Events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copy Webhook Signing Secret** and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 4. Test the Integration

1. **Restart your development server** after adding environment variables
2. **Go to** `/dashboard/account`
3. **Click "Upgrade to Standard"** - should redirect to Stripe Checkout
4. **Use test card:** `4242 4242 4242 4242` with any future date and CVC

## 5. Verify Database Migration

Make sure you've run the database migration to add the subscription tier system:

```sql
-- Run the migration files:
-- database-migration-simplified-tiers.sql
-- database-cleanup-remove-transactions.sql
```

## Common Issues

### "Price ID not configured" Error
- Check that `STRIPE_STANDARD_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` are set correctly
- Verify the price IDs exist in your Stripe dashboard

### "Failed to create customer" Error  
- Check that `STRIPE_SECRET_KEY` is set and valid
- Ensure the secret key matches your environment (test vs live)

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check that your webhook endpoint is accessible
- For local development, use ngrok to expose your localhost

## Quick Test Commands

```bash
# Check if environment variables are loaded
echo $STRIPE_SECRET_KEY
echo $STRIPE_STANDARD_PRICE_ID  
echo $STRIPE_PREMIUM_PRICE_ID

# Test Stripe connection
curl -X POST https://api.stripe.com/v1/customers \
  -u $STRIPE_SECRET_KEY: \
  -d email=test@example.com
```

Once these are configured, the "Upgrade to Standard" and "Upgrade to Premium" buttons should work correctly and redirect to Stripe Checkout! 