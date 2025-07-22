/**
 * Billing calculation utilities for prorated charges and subscription management
 */

/**
 * Calculate prorated amount for additional credits based on remaining days in billing cycle
 */
export function calculateProratedAmount(
  creditsToAdd: number, 
  billingAnchorDate: string,
  pricePerCreditCents: number = 9900 // $99 per credit
): number {
  const now = new Date();
  const anchor = new Date(billingAnchorDate);
  
  // Calculate next billing date (1 month from anchor)
  const nextBilling = new Date(anchor);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  
  // If we're past the next billing date, use current month as anchor
  if (now > nextBilling) {
    const currentMonthAnchor = new Date(now.getFullYear(), now.getMonth(), anchor.getDate());
    const currentNextBilling = new Date(currentMonthAnchor);
    currentNextBilling.setMonth(currentNextBilling.getMonth() + 1);
    
    const totalDays = (currentNextBilling.getTime() - currentMonthAnchor.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (currentNextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.round((creditsToAdd * pricePerCreditCents * (remainingDays / totalDays)));
  }
  
  // Normal case: calculate based on original anchor date
  const totalDays = (nextBilling.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  const remainingDays = (nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  // Ensure we don't charge negative or more than full price
  const proratedRatio = Math.max(0, Math.min(1, remainingDays / totalDays));
  
  return Math.round(creditsToAdd * pricePerCreditCents * proratedRatio);
}

/**
 * Get human-readable description of prorated billing
 */
export function getProratedDescription(
  creditsToAdd: number,
  billingAnchorDate: string,
  nextBillingDate: string
): string {
  const now = new Date();
  const nextBilling = new Date(nextBillingDate);
  const remainingDays = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const proratedAmount = calculateProratedAmount(creditsToAdd, billingAnchorDate);
  const fullAmount = creditsToAdd * 9900;
  
  if (proratedAmount >= fullAmount) {
    return `${creditsToAdd} credit${creditsToAdd > 1 ? 's' : ''} - $${(fullAmount / 100).toFixed(2)}`;
  }
  
  return `${creditsToAdd} credit${creditsToAdd > 1 ? 's' : ''} - $${(proratedAmount / 100).toFixed(2)} (prorated for ${remainingDays} remaining days)`;
}

/**
 * Calculate the next billing date from an anchor date
 */
export function calculateNextBillingDate(billingAnchorDate: string): string {
  const anchor = new Date(billingAnchorDate);
  const nextBilling = new Date(anchor);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  return nextBilling.toISOString();
} 