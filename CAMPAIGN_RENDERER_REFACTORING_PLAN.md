# Campaign Renderer Refactoring Plan

## 📋 Overview

This document outlines the refactoring plan to eliminate code duplication between the preview page (`/campaigns/[id]/preview`) and public page (`/c/[slug]`) by extracting shared campaign renderer components.

### Current State
- **~60-70% code duplication** in section rendering logic
- **Similar UI patterns** replicated across both files
- **Maintenance burden** - bugs/changes need fixing in two places
- **UI drift risk** - inconsistencies will emerge over time

### Goal
- Extract shared section components while maintaining page-specific functionality
- Reduce ~2300 lines of duplicated code to ~400 lines of shared components
- Improve maintainability without overcomplicating the architecture

---

## 🏗️ Architecture Strategy

### What Gets Shared
- Section rendering components (CaptureSection, TextQuestionSection, etc.)
- Navigation controls
- Progress tracking logic
- Variable interpolation
- Common validation

### What Stays Separate
- **Preview-specific:** Device simulation, debug modes, mock AI processing
- **Public-specific:** Lead storage, session recovery, real AI processing, analytics

---

## 📂 New File Structure

```
components/campaign-renderer/
├── index.ts                          # Export all components
├── types.ts                          # Shared types and interfaces
├── SectionRenderer.tsx               # Main section router component
├── NavigationControls.tsx            # Shared navigation (Phase 4)
├── sections/
│   ├── index.ts                      # Export all section components
│   ├── CaptureSection.tsx           # Shared capture form
│   ├── TextQuestionSection.tsx      # Shared text input
│   ├── MultipleChoiceSection.tsx    # Shared choice selection
│   ├── LogicSection.tsx             # Shared AI processing UI
│   ├── OutputSection.tsx            # Shared results display
│   └── UnsupportedSection.tsx       # Fallback component
└── utils/
    ├── validation.ts                 # Shared validation logic
    └── interpolation.ts              # Variable interpolation helpers
```

---

## 🎯 Implementation Phases

### Phase 1: Create Shared Section Components ⏱️ Week 1

#### Step 1.1: Create Base Infrastructure

**New Files to Create:**

1. **`components/campaign-renderer/types.ts`**
```typescript
import { SectionWithOptions } from '@/lib/types/database'

export interface BaseSectionProps {
  section: SectionWithOptions
  sectionIndex: number
  isActive: boolean
  userInputs: Record<string, any>
  aiOutputs: Record<string, any>
  onSectionComplete: (sectionIndex: number, data: any) => void
  onNext: () => void
  onPrevious: () => void
  currentSectionIndex: number
  totalSections: number
  
  // Mode-specific flags
  isPreview?: boolean
  previewConfig?: PreviewModeConfig
  allowSkip?: boolean
  showDebugInfo?: boolean
}

export interface PreviewModeConfig {
  mode: 'sequence' | 'realtime' | 'testing'
  bypassDisplayRules: boolean
  enableAITesting: boolean
  simulateRealTiming: boolean
  showDebugInfo: boolean
}
```

2. **`components/campaign-renderer/index.ts`**
```typescript
export { SectionRenderer } from './SectionRenderer'
export { NavigationControls } from './NavigationControls'
export * from './types'
export * from './sections'
```

3. **`components/campaign-renderer/sections/index.ts`**
```typescript
export { CaptureSection } from './CaptureSection'
export { TextQuestionSection } from './TextQuestionSection'
export { MultipleChoiceSection } from './MultipleChoiceSection'
export { LogicSection } from './LogicSection'
export { OutputSection } from './OutputSection'
export { UnsupportedSection } from './UnsupportedSection'
```

#### Step 1.2: Extract Section Components

Extract the following components from both existing pages:

1. **CaptureSection.tsx** (Start here - most complex)
2. **TextQuestionSection.tsx**
3. **MultipleChoiceSection.tsx** 
4. **LogicSection.tsx**
5. **OutputSection.tsx**

**Key Implementation Notes:**
- Use `isPreview` prop to handle behavioral differences
- Extract common UI patterns and validation logic
- Maintain existing styling and functionality
- Add conditional logic for preview vs public modes

---

### Phase 2: Create Main Section Router ⏱️ Week 1

#### Step 2.1: SectionRenderer Component

**File: `components/campaign-renderer/SectionRenderer.tsx`**

```typescript
import { BaseSectionProps } from './types'
import { 
  CaptureSection,
  TextQuestionSection, 
  MultipleChoiceSection,
  LogicSection,
  OutputSection,
  UnsupportedSection
} from './sections'

export function SectionRenderer(props: BaseSectionProps) {
  const { section } = props
  
  switch (section.type) {
    case 'capture':
      return <CaptureSection {...props} />
    case 'text_question':
      return <TextQuestionSection {...props} />
    case 'multiple_choice':
      return <MultipleChoiceSection {...props} />
    case 'logic':
      return <LogicSection {...props} />
    case 'output':
    case 'output-results':
    case 'output-download':
    case 'output-redirect':
      return <OutputSection {...props} />
    default:
      return <UnsupportedSection {...props} />
  }
}
```

---

### Phase 3: Update Existing Pages ⏱️ Week 2

#### Step 3.1: Update Preview Page

**File: `app/campaigns/[id]/preview/page.tsx`**

**Changes Required:**

1. **Add Imports:**
```typescript
import { SectionRenderer } from '@/components/campaign-renderer'
import type { PreviewModeConfig } from '@/components/campaign-renderer/types'
```

2. **Replace Section Rendering Logic:**

**DELETE:** Entire `SectionRenderer` function component (lines ~230-1800)

**REPLACE:** Section rendering in main component with:
```typescript
{sections.length > 0 && previewState.currentSection < sections.length && (
  <SectionRenderer
    section={sections[previewState.currentSection]}
    sectionIndex={previewState.currentSection}
    isActive={true}
    userInputs={previewState.userInputs}
    aiOutputs={previewState.aiOutputs}
    onSectionComplete={handleSectionComplete}
    onNext={handleNext}
    onPrevious={handlePrevious}
    currentSectionIndex={previewState.currentSection}
    totalSections={sections.length}
    isPreview={true}
    previewConfig={previewConfig}
    showDebugInfo={previewConfig.showDebugInfo}
  />
)}
```

**KEEP:** All preview-specific functionality:
- Device frame rendering (`renderDeviceFrame`)
- Preview controls and indicators
- Debug panels and bypass modes
- Mock AI processing logic

#### Step 3.2: Update Public Page

**File: `app/c/[slug]/page.tsx`**

**Changes Required:**

1. **Add Imports:**
```typescript
import { SectionRenderer } from '@/components/campaign-renderer'
```

2. **Replace Section Rendering Logic:**

**DELETE:** All section rendering functions (lines ~1437-2182):
- `renderSectionContent`
- `renderSectionContentFallback`
- `renderCaptureSection`
- `renderTextQuestionSection`
- `renderMultipleChoiceSection`
- `renderSliderSection`
- `renderInfoSection`
- `renderLogicSection`
- `renderOutputSection`
- `renderUnsupportedSection`
- `getDefaultCaptureFields`
- `getDefaultChoices`

**REPLACE:** Section rendering in main component with:
```typescript
{sections.length > 0 && campaignState.currentSection < sections.length && (
  <SectionRenderer
    section={sections[campaignState.currentSection]}
    sectionIndex={campaignState.currentSection}
    isActive={true}
    userInputs={campaignState.userInputs}
    aiOutputs={{}}
    onSectionComplete={handleSectionComplete}
    onNext={handleNext}
    onPrevious={handlePrevious}
    currentSectionIndex={campaignState.currentSection}
    totalSections={sections.length}
    isPreview={false}
    allowSkip={false}
  />
)}
```

**KEEP:** All public-specific functionality:
- Session management and recovery
- Lead data storage pipeline
- Error handling and retry logic
- Real AI processing
- Analytics tracking
- Offline handling

---

### Phase 4: Extract Navigation Components ⏱️ Week 3 (Optional)

#### Step 4.1: Create Navigation Component

**File: `components/campaign-renderer/NavigationControls.tsx`**

```typescript
interface NavigationControlsProps {
  currentSection: number
  totalSections: number
  canProceed: boolean
  isLoading?: boolean
  onNext: () => void
  onPrevious: () => void
  nextButtonText?: string
  showPrevious?: boolean
  isPreview?: boolean
  className?: string
}

export function NavigationControls({
  currentSection,
  totalSections,
  canProceed,
  isLoading = false,
  onNext,
  onPrevious,
  nextButtonText = 'Next',
  showPrevious = true,
  isPreview = false,
  className
}: NavigationControlsProps) {
  // Extract shared navigation logic from both pages
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10", className)}>
      {/* Shared navigation controls */}
    </div>
  )
}
```

#### Step 4.2: Update Pages to Use Navigation

Both preview and public pages get updated to use the shared navigation component instead of their custom bottom bars.

---

## 🗑️ Code Deletion Summary

### From Preview Page (`app/campaigns/[id]/preview/page.tsx`)

**DELETE these functions:**
- `SectionRenderer` component function (lines ~230-1800)
- `renderSectionContent`
- `renderCaptureSection`
- `renderTextQuestionSection`
- `renderMultipleChoiceSection`
- `renderLogicSection`
- `renderOutputSection`
- `renderUnsupportedSection`
- `getSectionIcon`
- `getSectionTypeLabel`

**Estimated lines deleted:** ~1,500 lines

### From Public Page (`app/c/[slug]/page.tsx`)

**DELETE these functions:**
- `renderSectionContent`
- `renderSectionContentFallback`
- `renderCaptureSection`
- `renderTextQuestionSection`
- `renderMultipleChoiceSection`
- `renderSliderSection`
- `renderInfoSection`
- `renderLogicSection`
- `renderOutputSection`
- `renderUnsupportedSection`
- `getDefaultCaptureFields`
- `getDefaultChoices`

**Estimated lines deleted:** ~800 lines

---

## 📊 Impact Analysis

### Before Refactoring
- **Total lines in both files:** ~4,000 lines
- **Duplicated logic:** ~60-70%
- **Maintenance complexity:** High
- **New feature implementation:** Requires changes in 2 places

### After Refactoring
- **Shared component lines:** ~400 lines
- **Page-specific logic:** ~1,700 lines
- **Total lines:** ~2,100 lines
- **Lines saved:** ~1,900 lines (47% reduction)
- **Maintenance complexity:** Low
- **New feature implementation:** Single location

### Benefits
✅ **Eliminates 60-70% duplication**  
✅ **Consistent UI across preview/public**  
✅ **Single place for bug fixes**  
✅ **Easier to add new section types**  
✅ **Maintains page-specific concerns**  
✅ **Reduces bundle size**  
✅ **Improves developer experience**  

---

## 🧪 Testing Strategy

### Phase 1 Testing
1. Test extracted CaptureSection in isolation
2. Verify preview page still works with new component
3. Verify public page still works with new component
4. Compare UI behavior between old and new implementations

### Phase 2 Testing
1. Test all section types in both modes
2. Verify variable interpolation works correctly
3. Test AI processing flows
4. Verify error handling and edge cases

### Phase 3 Testing
1. End-to-end testing of complete user flows
2. Cross-browser testing
3. Mobile responsiveness testing
4. Performance testing (bundle size, rendering speed)

### Regression Testing Checklist
- [ ] Preview mode device simulation works
- [ ] Preview mode debug controls work
- [ ] Public mode lead capture works
- [ ] Public mode session recovery works
- [ ] AI processing works in both modes
- [ ] Variable interpolation works correctly
- [ ] Navigation controls work
- [ ] Progress tracking works
- [ ] Error handling works
- [ ] Mobile experience is consistent

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- **Days 1-2:** Create base infrastructure and types
- **Days 3-5:** Extract CaptureSection and test integration
- **Weekend:** Test and refine CaptureSection

### Week 2: Core Components
- **Days 1-2:** Extract TextQuestionSection and MultipleChoiceSection
- **Days 3-4:** Extract LogicSection and OutputSection  
- **Day 5:** Create SectionRenderer router and update both pages
- **Weekend:** Testing and bug fixes

### Week 3: Polish (Optional)
- **Days 1-2:** Extract NavigationControls
- **Days 3-4:** Extract remaining utilities
- **Day 5:** Final cleanup and documentation
- **Weekend:** Comprehensive testing

---

## 🔧 Migration Guidelines

### During Development
1. **Keep both systems running** until migration is complete
2. **Test each component** in isolation before integration
3. **Maintain backward compatibility** during transition
4. **Use feature flags** if needed for gradual rollout

### After Migration
1. **Monitor for regressions** in both preview and public modes
2. **Update documentation** for new component structure
3. **Train team** on new shared component patterns
4. **Plan future section types** using new architecture

---

## 📚 Additional Considerations

### Performance
- Shared components will reduce bundle size
- Better tree-shaking with modular exports
- Potential for component-level caching

### Maintainability  
- New section types only need single implementation
- Bug fixes apply to both modes automatically
- Consistent patterns across the application

### Extensibility
- Easy to add new section types
- Simple to add new preview modes
- Straightforward to enhance shared functionality

---

## 🎯 Success Criteria

### Technical Goals
- [ ] Reduce codebase by ~1,900 lines
- [ ] Eliminate section rendering duplication
- [ ] Maintain all existing functionality
- [ ] No performance regressions
- [ ] No UI/UX changes visible to users

### Quality Goals
- [ ] All tests pass
- [ ] No new TypeScript errors
- [ ] No console errors or warnings
- [ ] Cross-browser compatibility maintained
- [ ] Mobile experience unchanged

### Team Goals
- [ ] Easier maintenance going forward
- [ ] Faster feature development
- [ ] Reduced onboarding complexity
- [ ] Better code organization

---

## 📝 Notes

- This refactoring is **low-risk, high-reward**
- Implementation can be done **incrementally**
- Both pages will continue working during migration
- The approach maintains **clear separation of concerns**
- Future enhancements will be **much easier to implement**

---

*Last Updated: [Current Date]*  
*Document Version: 1.0* 