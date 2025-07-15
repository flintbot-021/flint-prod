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
 * Optional sections first, then mandatory sections in fixed order: capture -> logic -> output
 */
export function applySectionOrdering(sections: any[]): any[] {
  // Define mandatory section types and their order (using renderer section types)
  const mandatorySectionTypes = ['capture', 'logic', 'output']
  const outputSectionTypes = ['output']
  
  // Split sections into optional and mandatory
  const optionalSections = sections.filter(s => !mandatorySectionTypes.includes(s.type))
  const mandatorySections = sections.filter(s => mandatorySectionTypes.includes(s.type))
  
  // Sort mandatory sections in the correct order: capture -> logic -> output
  const sortedMandatorySections = mandatorySections.sort((a, b) => {
    const getOrder = (type: string) => {
      if (type === 'capture') return 1
      if (type === 'logic') return 2
      if (type === 'output') return 3
      return 999
    }
    return getOrder(a.type) - getOrder(b.type)
  })
  
  // Return optional sections first, then mandatory sections
  return [...optionalSections, ...sortedMandatorySections]
}
