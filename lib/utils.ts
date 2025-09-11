import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Apply consistent section ordering that matches the campaign builder
 * New flow: Optional sections (questions) first, then mandatory sections in fixed order: logic -> capture -> output
 */
export function applySectionOrdering(sections: any[]): any[] {
  // Define mandatory section types and their order (using renderer section types)
  const mandatorySectionTypes = ['capture', 'logic', 'output']
  const outputSectionTypes = ['output']
  
  // Split sections into optional and mandatory
  const optionalSections = sections.filter(s => !mandatorySectionTypes.includes(s.type))
  const mandatorySections = sections.filter(s => mandatorySectionTypes.includes(s.type))
  
  // Sort mandatory sections in the NEW order: logic -> capture -> output
  // This creates the better UX flow: Questions -> Process -> Capture to unlock -> Output
  const sortedMandatorySections = mandatorySections.sort((a, b) => {
    const getOrder = (type: string) => {
      if (type === 'logic') return 1      // Process the answers first
      if (type === 'capture') return 2    // Then ask for email to unlock results
      if (type === 'output') return 3     // Finally show the unlocked results
      return 999
    }
    return getOrder(a.type) - getOrder(b.type)
  })
  
  // Return optional sections first, then mandatory sections
  return [...optionalSections, ...sortedMandatorySections]
}

/**
 * Normalizes a URL input to ensure it has a proper protocol
 * Only normalizes inputs that look like valid domains
 * Handles cases like:
 * - "website.com" -> "https://website.com"
 * - "www.website.com" -> "https://www.website.com"
 * - "https://website.com" -> "https://website.com" (unchanged)
 * - "http://website.com" -> "http://website.com" (unchanged)
 * - Invalid inputs remain unchanged for validation to catch
 */
export function normalizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }

  const trimmed = input.trim()
  
  // If it's empty, return as is
  if (!trimmed) {
    return trimmed
  }

  // If it already has a protocol, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Only normalize if it looks like a valid domain (proper TLD required)
  if (!trimmed.includes('.')) return trimmed
  
  const parts = trimmed.split('.')
  if (parts.length < 2) return trimmed
  
  // Last part must be a valid TLD (2+ characters, letters only, reasonable length)
  const tld = parts[parts.length - 1].toLowerCase()
  if (!/^[a-z]{2,}$/.test(tld) || tld.length > 10) return trimmed
  
  // Basic domain pattern check
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  if (domainPattern.test(trimmed)) {
    return `https://${trimmed}`
  }

  // For anything else, return as is (let validation handle it)
  return trimmed
}
