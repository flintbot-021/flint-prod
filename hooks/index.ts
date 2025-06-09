// =============================================================================
// CAMPAIGN HOOKS - EXPORTS
// =============================================================================

// Core campaign functionality
export { useCampaignState } from './useCampaignState'
export { useCampaignRenderer } from './useCampaignRenderer'

// Device and environment detection
export { useDeviceInfo } from './useDeviceInfo'
export { useNetworkState } from './useNetworkState'

// Error handling
export { useErrorHandler } from './useErrorHandler'

// Variable interpolation
export { useVariableEngine } from './useVariableEngine'

// Re-export types for convenience
export type { 
  DeviceInfo, 
  NetworkState, 
  ErrorState, 
  VariableContext 
} from '@/components/campaign-renderer/types' 