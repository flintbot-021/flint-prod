// =============================================================================
// CAMPAIGN RENDERER - MAIN EXPORTS
// =============================================================================

// Main components
export { SectionRenderer } from './SectionRenderer'
export { CampaignHeader, type PreviewDevice } from './CampaignHeader'
export { ShareResultsModal } from './ShareResultsModal'

// Individual section components
export {
  CaptureSection,
  TextQuestionSection,
  MultipleChoiceSection,
  SliderSection,
  InfoSection,
  LogicSection,
  OutputSection
} from './sections'

// Shared components
export { SectionNavigationBar } from './SectionNavigationBar'

// Types and utilities
export type {
  BaseSectionProps,
  CampaignState,
  DeviceInfo,
  NetworkState,
  ErrorState,
  ProgressMetrics,
  VariableContext,
  SectionConfiguration,
  SectionRendererProps
} from './types'

export {
  processVariableContent,
  interpolateTextSimple,
  getMobileClasses,
  getSectionWeight,
  createError,
  getDefaultChoices,
  getDefaultCaptureFields,
  formatDuration,
  isValidEmail,
  debounce
} from './utils' 