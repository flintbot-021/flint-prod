# Stripe Checkout Migration - Cleanup Plan

## ✅ What We've Built (New System)

### New API Routes
- `app/api/billing/create-checkout-session/route.ts` - Creates Stripe Checkout sessions
- `app/api/billing/summary-new/route.ts` - Simplified billing summary for tiers
- `app/api/billing/webhook-new/route.ts` - Webhook handler for new tier system

### New UI Components
- `app/dashboard/account/page-new.tsx` - Simplified account page with tier system

### Database Migration
- `database-migration-simplified-tiers.sql` - Adds subscription_tier and related fields

## 🗑️ Files to Remove (Old Complex System)

### UI Components to Delete
- `components/ui/credit-adjustment-modal.tsx` ❌ - Complex credit slider modal
- `components/ui/simple-setup-modal.tsx` ❌ - Complex setup with Stripe Elements
- `components/ui/payment-method-modal.tsx` ❌ - Custom payment method form

### API Routes to Remove/Replace
- `app/api/billing/purchase-credits/route.ts` ❌ - Complex credit purchase logic
- `app/api/billing/subscription-change/route.ts` ❌ - Complex subscription management
- `app/api/billing/update-payment-method/route.ts` ❌ - Custom payment method updates
- `app/api/billing/cancel-subscription/route.ts` ❌ - Can use simple Stripe cancellation
- `app/api/billing/summary/route.ts` ❌ - Replace with summary-new.ts
- `app/api/billing/webhook/route.ts` ❌ - Replace with webhook-new.ts

### Utility Files to Remove
- `lib/utils/billing-calculations.ts` ❌ - Complex pro-rata calculations (Stripe handles this)

### Files to Replace
- `app/dashboard/account/page.tsx` - Replace with page-new.tsx

## 🔄 Files to Modify

### Stripe Service Cleanup
- `lib/services/stripe-service.ts` - Simplify by removing:
  - `createCreditPurchaseIntent()` 
  - `chargeStoredPaymentMethod()`
  - `createOrUpdateSubscription()`
  - Complex webhook handlers
  - Keep: `createOrGetStripeCustomer()`, basic utilities

### Environment Variables to Add
```bash
# Add to .env
STRIPE_STANDARD_PRICE_ID=price_xxx  # Create in Stripe Dashboard: $99/month
STRIPE_PREMIUM_PRICE_ID=price_xxx   # Create in Stripe Dashboard: $249/month
```

### Webhook Endpoint Update
- Update Stripe webhook endpoint from `/api/billing/webhook` to `/api/billing/webhook-new`

## 📝 Migration Steps

### 1. Database Migration
```sql
-- Run the migration SQL to add tier system
```

### 2. Create Stripe Products
In Stripe Dashboard, create:
- **Standard Plan**: $99/month recurring subscription
- **Premium Plan**: $249/month recurring subscription

### 3. Update Environment Variables
Add the new price IDs to your environment.

### 4. Deploy New Routes
Deploy the new API routes and account page.

### 5. Update Webhook Endpoint
Update your Stripe webhook endpoint URL.

### 6. Remove Old Files
Delete all the files marked with ❌ above.

### 7. Test the New Flow
- Test free → standard upgrade
- Test standard → premium upgrade  
- Test premium → standard downgrade
- Test subscription cancellation

## 🎯 Benefits of New System

### For Users
- ✅ Faster checkout with Stripe's optimized flow
- ✅ Clear pricing: 3 simple tiers instead of flexible credits
- ✅ Better mobile experience
- ✅ Built-in tax calculation and international payments
- ✅ Support for promotional codes

### For Development
- ✅ 70% less code to maintain
- ✅ No complex pro-rata calculations
- ✅ Stripe handles payment method management
- ✅ Fewer edge cases and bugs
- ✅ Simpler testing and debugging

### For Business
- ✅ Higher conversion rates (Stripe Checkout optimized)
- ✅ Better analytics and insights
- ✅ Easier pricing experiments
- ✅ Reduced support complexity

## 🚨 Important Notes

1. **Backup First**: Backup your database before running migrations
2. **Gradual Migration**: Consider feature flagging to test new system with subset of users first
3. **Existing Customers**: Migration script handles existing customers by mapping credit_balance to appropriate tier
4. **Webhook Testing**: Test webhooks thoroughly in Stripe test mode first

## 📈 Metrics to Track Post-Migration

- Conversion rate from free to paid
- Checkout abandonment rate  
- Customer support tickets related to billing
- Time spent on billing-related development tasks
- Revenue per user by tier 