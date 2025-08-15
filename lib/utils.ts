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
