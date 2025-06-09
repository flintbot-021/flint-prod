# 🚀 Simplified Campaign System Implementation Plan

## 📋 Overview
Transform the complex variable system into a simple, intuitive approach where section titles automatically become variables using @variable syntax. Users create campaigns by stacking question sections, processing them through AI, and displaying personalized outputs.

---

## 🎯 **Phase 1: Simple Variable System Foundation**
*Replace complex registry with simple helper functions*

### 1.1 Create Simple Variable Helpers
- **New File:** `lib/utils/section-variables.ts`
- **Purpose:** Replace complex variable registry with simple functions
- **Changes:**
  - Convert section titles to variable names
  - Filter question sections from other types
  - Extract user responses by section title

**Specific Implementation:**
```typescript
// Simple helper functions - no complex registry needed
export function titleToVariableName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

export function isQuestionSection(sectionType: string): boolean {
  return sectionType.includes('question-') || 
         ['text_question', 'multiple_choice', 'slider'].includes(sectionType)
}

export function extractSectionVariables(sections: CampaignSection[]): Record<string, string> {
  const variables: Record<string, string> = {}
  
  sections
    .filter(s => isQuestionSection(s.type))
    .forEach(section => {
      const varName = titleToVariableName(section.title)
      variables[varName] = section.title // Store both for reference
    })
    
  return variables
}

export function extractResponseValue(response: any, section: CampaignSection): any {
  let value = response
  
  // Handle nested response objects
  if (typeof response === 'object' && response.response) {
    value = response.response
    
    // Convert choice IDs to text if needed
    if (typeof value === 'string' && value.startsWith('option-')) {
      const config = section.configuration as any
      const choice = config?.options?.find((opt: any) => opt.id === value)
      value = choice?.text || value
    }
  }
  
  return value
}
```

### 1.2 Remove Complex Variable Registry
- **File:** `lib/variable-system/variable-registry.ts`
- **Changes:**
  - Keep file for compatibility but mark as deprecated
  - Add comment pointing to new simple approach
  - Eventually remove entire directory

### 1.3 Completely Simplify LogicSection Processing  
- **File:** `components/campaign-renderer/sections/LogicSection.tsx`
- **Changes:**
  - Remove ALL complex variable matching (lines 70-300+)
  - Replace with super simple section title → response mapping
  - Remove dependency on testInputs, variable registry, etc.

**Specific Implementation:**
```typescript
// Replace lines 70-300+ with this simple approach:
import { titleToVariableName, isQuestionSection, extractResponseValue } from '@/lib/utils/section-variables'

const processAILogic = async () => {
  try {
    const aiConfig = config as any
    
    // Super simple: get question sections and map their responses
    const variables: Record<string, any> = {}
    
    sections.forEach(section => {
      // Only process question sections
      if (isQuestionSection(section.type)) {
        const variableName = titleToVariableName(section.title)
        const userResponse = userInputs[section.id]
        
        if (userResponse) {
          variables[variableName] = extractResponseValue(userResponse, section)
        }
      }
    })
    
    console.log('✅ Simple variable mapping:', variables)
    
    // Send to AI - no complex preprocessing needed
    const aiRequest = {
      prompt: aiConfig.prompt,
      variables: variables,
      outputVariables: aiConfig.outputVariables
    }
    
    // ... rest of AI processing remains the same
  }
}
```

---

## 🎯 **Phase 2: Simple Section Management**  
*Show users their variables in real-time*

### 2.1 Real-time Variable Preview with @syntax
- **File:** `components/campaign-builder/section-top-bar.tsx`
- **Changes:**
  - Show generated variable name when user types section title  
  - Add variable name badge: `Section: "User Name" → Variable: @user_name`
  - Validate variable name uniqueness

**Specific Implementation:**
```typescript
// Add after the section name input
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'

{isQuestionSection(section.type) && (
  <div className="flex items-center space-x-2 mt-1">
    <Badge variant="secondary" className="text-xs font-mono">
      Variable: @{titleToVariableName(section.title)}
    </Badge>
    {/* Show warning if variable name conflicts */}
    {isVariableNameTaken(titleToVariableName(section.title), section.id, allSections) && (
      <Badge variant="destructive" className="text-xs">
        ⚠️ Duplicate variable name
      </Badge>
    )}
  </div>
)}

// Simple validation function
function isVariableNameTaken(variableName: string, currentSectionId: string, sections: CampaignSection[]): boolean {
  return sections.some(s => 
    s.id !== currentSectionId && 
    titleToVariableName(s.title) === variableName &&
    isQuestionSection(s.type)
  )
}
```

### 2.2 Variable Registry Display
- **New File:** `components/campaign-builder/variable-registry-panel.tsx`
- **Features:**
  - Show all available variables from question sections
  - Display variable types (text, choice, slider, etc.)
  - Copy variable names for use in prompts

### 2.3 Section Type Validation
- **File:** `lib/types/campaign-builder.ts`
- **Changes:**
  - Ensure proper section ordering (questions → capture → AI logic → output)
  - Prevent multiple capture/AI logic sections
  - Add section flow validation

---

## 🎯 **Phase 3: AI Logic Section Overhaul**
*Rebuild AI prompt configuration with automatic variable detection*

### 3.1 Simple Prompt Editor with @variables
- **File:** `components/campaign-builder/logic-types/ai-logic-section.tsx`
- **Changes:**
  - Remove ALL testInputs configuration complexity
  - Add simple variable picker showing @variable syntax
  - Show available variables from previous question sections
  - Use @variable syntax instead of [variable]

**Specific Implementation:**
```typescript
// Remove the testInputs section entirely and replace with:
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'

const availableVariables = useMemo(() => {
  return sections
    .filter(s => 
      s.order < section.order && // Only previous sections
      isQuestionSection(s.type) // Only question sections
    )
    .map(s => ({
      name: titleToVariableName(s.title),
      title: s.title,
      type: s.type
    }))
}, [sections, section.order])

// Simple variable picker component
<div className="border rounded-lg p-4">
  <h4 className="font-medium mb-2">Available Variables (Click to Insert)</h4>
  <div className="flex flex-wrap gap-2 mb-4">
    {availableVariables.map(variable => (
      <Button
        key={variable.name}
        variant="outline"
        size="sm"
        onClick={() => insertVariable(`@${variable.name}`)}
        className="h-7 text-xs font-mono"
      >
        @{variable.name}
        <span className="ml-1 text-muted-foreground">({variable.title})</span>
      </Button>
    ))}
  </div>
  
  <Textarea
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Enter your AI prompt here. Use @variable_name to reference user responses."
    className="min-h-32"
  />
  
  {/* Simple validation */}
  {validatePromptVariables(prompt, availableVariables)}
</div>

// Simple validation function
function validatePromptVariables(prompt: string, availableVars: Array<{name: string}>) {
  const usedVars = prompt.match(/@(\w+)/g)?.map(v => v.slice(1)) || []
  const invalidVars = usedVars.filter(v => !availableVars.find(av => av.name === v))
  
  if (invalidVars.length > 0) {
    return (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
        Unknown variables: {invalidVars.map(v => `@${v}`).join(', ')}
      </div>
    )
  }
  return null
}

function insertVariable(variableText: string) {
  // Simple function to insert @variable at cursor position
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = prompt.substring(0, start) + variableText + prompt.substring(end)
    setPrompt(newValue)
  }
}
```

### 3.2 Output Variable Configuration
- **Same File**
- **Changes:**
  - Keep output variable definition (what AI should return)
  - Add output variable validation
  - Preview of final prompt with sample data

### 3.3 AI Processing Simplification
- **File:** `lib/services/ai-processing-engine.ts`
- **Changes:**
  - Remove complex variable preprocessing
  - Direct mapping: section titles → variables
  - Handle choice option text conversion automatically

---

## 🎯 **Phase 4: Output Section Enhancement**
*Create flexible output templates with variable interpolation*

### 4.1 Enhanced Output Editor
- **File:** `components/campaign-builder/content-types/output-section.tsx`
- **Changes:**
  - Rich text editor with variable insertion
  - Variable picker showing both input and AI output variables
  - Live preview with sample data
  - Support for conditional content

### 4.2 Output Rendering
- **New File:** `components/campaign-renderer/sections/OutputSection.tsx`
- **Features:**
  - Interpolate input variables from user responses
  - Interpolate AI output variables from logic section results
  - Handle missing variables gracefully
  - Support rich formatting (bold, italic, lists, etc.)

**Specific Implementation:**
```typescript
'use client'

import { useMemo } from 'react'
import { SectionRendererProps } from '../types'
import { titleToVariableName, isQuestionSection, extractResponseValue } from '@/lib/utils/section-variables'
import { getAITestResults } from '@/lib/utils/ai-test-storage'

export function OutputSection({
  section,
  config,
  userInputs = {},
  sections = [],
  ...props
}: SectionRendererProps) {
  const outputConfig = config as { content: string }
  
  // Build simple variable map
  const variableMap = useMemo(() => {
    const map: Record<string, any> = {}
    
    // Add input variables from question sections - super simple
    sections.forEach(sec => {
      if (isQuestionSection(sec.type)) {
        const variableName = titleToVariableName(sec.title)
        const response = userInputs[sec.id]
        
        if (response) {
          map[variableName] = extractResponseValue(response, sec)
        }
      }
    })
    
    // Add AI output variables
    const aiResults = getAITestResults()
    Object.assign(map, aiResults)
    
    return map
  }, [sections, userInputs])
  
  // Interpolate @variables in content  
  const interpolatedContent = useMemo(() => {
    let content = outputConfig.content || ''
    
    // Replace @variable_name with actual values
    Object.entries(variableMap).forEach(([key, value]) => {
      const regex = new RegExp(`@${key}`, 'g')
      content = content.replace(regex, String(value || `@${key}`))
    })
    
    return content
  }, [outputConfig.content, variableMap])
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: interpolatedContent.replace(/\n/g, '<br>') 
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 **Phase 5: Data Flow Integration**
*Connect all pieces with proper data management*

### 5.1 Response Collection System
- **File:** `app/campaigns/[id]/preview/page.tsx`
- **Changes:**
  - Collect responses with section title as key
  - Skip capture section data from AI processing
  - Store capture data separately for leads table

### 5.2 Lead Management
- **Files:** `lib/services/lead-service.ts` (new)
- **Features:**
  - Extract capture section data (name, email, phone, etc.)
  - Store in leads table with campaign association
  - Keep separate from AI processing pipeline

### 5.3 AI Result Storage
- **File:** `lib/utils/ai-test-storage.ts`
- **Changes:**
  - Store AI outputs with proper variable names
  - Make available to output sections
  - Handle result persistence for multi-section campaigns

---

## 🎯 **Phase 6: User Experience Improvements**
*Polish the campaign builder and preview experience*

### 6.1 Campaign Builder UX
- **Files:** Various builder components
- **Features:**
  - Section flow visualization
  - Variable dependency tracking
  - Drag and drop section reordering
  - Real-time validation feedback

### 6.2 Preview Mode Enhancements
- **File:** `app/campaigns/[id]/preview/page.tsx`
- **Features:**
  - Progress indicators
  - Smooth transitions between sections
  - Error handling and fallbacks
  - Mobile-responsive design

### 6.3 Testing and Validation
- **New Files:** Testing utilities
- **Features:**
  - Campaign flow testing
  - Variable interpolation testing
  - AI prompt validation
  - End-to-end preview testing

---

## 🎯 **Phase 7: Advanced Features**
*Add sophisticated campaign capabilities*

### 7.1 Conditional Logic
- **Features:**
  - Show/hide sections based on previous answers
  - Conditional variable interpolation
  - Dynamic section ordering

### 7.2 Multiple AI Logic Sections
- **Features:**
  - Support multiple AI processing steps
  - Variable passing between AI sections
  - Complex workflow building

### 7.3 Analytics and Optimization
- **Features:**
  - Campaign performance tracking
  - Conversion rate analysis
  - A/B testing capabilities

---

## 🚦 **Implementation Priority**

**Immediate (Week 1-2):**
- Phase 1: Simplify variable system
- Phase 3.2: Fix AI logic section processing

**Short-term (Week 3-4):**
- Phase 2: Variable preview and management
- Phase 4: Output section improvements

**Medium-term (Month 2):**
- Phase 5: Complete data flow integration
- Phase 6: UX improvements

**Long-term (Month 3+):**
- Phase 7: Advanced features

---

## 🔧 **Technical Dependencies**

1. **Database Changes:** Minimal - existing schema supports this
2. **API Changes:** Simplify AI processing endpoint
3. **UI Components:** Enhance existing, add variable picker
4. **Testing:** Add comprehensive campaign flow tests

---

## 🎯 **Current System Issues to Address**

### Variable System Complexity
- **Problem:** Complex predefined variable matching in `LogicSection.tsx` (lines 70-180)
- **Solution:** Direct section title → variable mapping

### Data Flow Confusion
- **Problem:** Capture data mixed with AI processing data
- **Solution:** Separate data streams - capture goes to leads, questions go to AI

### User Experience
- **Problem:** Users can't see what variables are available
- **Solution:** Real-time variable preview and picker

### AI Configuration
- **Problem:** Requires technical setup of testInputs
- **Solution:** Automatic variable detection from campaign structure

---

## 📝 **Key Principles**

1. **Simplicity:** Section title = Variable name
2. **Intuitive:** What you see is what you get
3. **Automatic:** Minimal configuration required
4. **Flexible:** Support complex workflows
5. **Reliable:** Graceful error handling

---

## 🔄 **Super Simple Data Flow**

```
1. Campaign Builder:
   - User creates question sections: "What is your name?" → @what_is_your_name
   - User creates capture section: email, phone (goes to leads table)  
   - User creates AI logic: "A user named @what_is_your_name wants advice..."
   - User creates output: "Hi @what_is_your_name, based on your info: @ai_advice"

2. Campaign Runtime (Super Simple):
   - End user answers questions → userInputs[section.id] = { response: "John" }
   - Capture section → leads table (completely separate)
   - Logic section processes:
     * Loop through sections, if question type: map title → response
     * titleToVariableName("What is your name?") = "what_is_your_name"  
     * variables = { "what_is_your_name": "John" }
     * Send to AI → AI response = { "ai_advice": "Take it slow and steady" }
   - Output section renders:
     * variableMap = { "what_is_your_name": "John", "ai_advice": "Take it slow..." }
     * "@what_is_your_name" → "John", "@ai_advice" → "Take it slow..."

3. Database Storage (No Changes Needed):
   - leads table: { email, phone, campaign_id, created_at }
   - lead_responses table: { lead_id, section_id, response, metadata }
   - sections table: { title, type, configuration } (title becomes @variable)
```

---

## 🧪 **Testing Strategy**

### Unit Tests
- Variable name conversion
- Response mapping
- AI output handling

### Integration Tests
- Complete campaign flow
- Data persistence
- Error scenarios

### User Acceptance Tests
- Campaign builder usability
- End user experience
- Performance under load

---

## 📋 **Success Metrics**

1. **Developer Experience:** Reduced code complexity by 70%
2. **User Experience:** Campaign creation time reduced by 50%
3. **Reliability:** 99%+ successful AI processing
4. **Performance:** <2s response time for AI processing
5. **Adoption:** 90%+ of campaigns use new variable system

---

---

## 🛠️ **Simple Implementation Checklist**

### Phase 1 - Super Simple Variable System (Day 1-2)
- [ ] Create `lib/utils/section-variables.ts` with helper functions
- [ ] Replace ALL complex logic in `LogicSection.tsx` with simple loop
- [ ] Test that @variable conversion works with existing campaigns

### Phase 2 - UI With @Variables (Day 3-4) 
- [ ] Add @variable preview badges to `section-top-bar.tsx`
- [ ] Update AI logic section to show @variable picker
- [ ] Remove ALL testInputs configuration completely
- [ ] Test variable picker inserts @variables correctly

### Phase 3 - Output With @Variables (Day 5)
- [ ] Update `OutputSection.tsx` to use @variable interpolation
- [ ] Test end-to-end flow: question → AI logic → output
- [ ] Verify @variables get replaced with actual values

### Phase 4 - Clean Up (Day 6-7)
- [ ] Remove old variable-system directory (mark deprecated first)
- [ ] Update any remaining [variable] syntax to @variable
- [ ] Test complete campaign flow works perfectly

---

## 🎯 **Start Here - Immediate Actions**

1. **Create** `lib/utils/section-variables.ts` (new simple approach)
2. **Gut** `components/campaign-renderer/sections/LogicSection.tsx` lines 70-300+
3. **Replace** with super simple section loop using new helpers
4. **Test** immediately with existing campaign data

## 🚀 **Key Benefits of This Simplified Approach**

- ✅ **10x Simpler Code** - Remove 200+ lines of complex variable matching
- ✅ **Intuitive for Users** - Section title automatically becomes @variable  
- ✅ **No Configuration** - No need to set up testInputs or variable mappings
- ✅ **Works with Existing Data** - Database schema doesn't need changes
- ✅ **Easy to Debug** - Clear path from section title → @variable → response

---

*Ready to transform the campaign system into an intuitive, powerful lead generation platform!* 