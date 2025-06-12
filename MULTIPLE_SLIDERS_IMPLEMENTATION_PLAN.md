# 🚀 Multiple Sliders Implementation Plan

## Overview

This document outlines the implementation plan for adding a "Multiple Sliders" section type to the campaign builder. This approach creates a new section type specifically designed for multiple slider inputs on a single page, without modifying the existing single-input section architecture.

## Benefits of This Approach

- ✅ **Zero Breaking Changes** - All existing sections work exactly the same
- ✅ **No Data Migration** - Existing campaigns remain unaffected
- ✅ **Self-Contained** - Each multiple-type manages its own variables
- ✅ **Gradual Rollout** - Can be extended to other question types later
- ✅ **Clean Separation** - Clear distinction between single and multiple input modes

## Implementation Phases

---

## **Phase 1: Type Definitions & Configuration**

### **File: `lib/types/campaign-builder.ts`**
Add new section type to the `SECTION_TYPES` array:

```typescript
{
  id: 'question-slider-multiple',
  name: 'Multiple Sliders',
  description: 'Multiple slider questions on one page',
  icon: 'Sliders',
  category: 'input',
  color: 'bg-blue-100 text-blue-800 border-blue-200',
  defaultSettings: {
    sliders: [
      {
        id: 'slider_1',
        variableName: 'satisfaction',
        question: 'How satisfied are you with our service?',
        subheading: '',
        minValue: 0,
        maxValue: 10,
        defaultValue: 5,
        step: 1,
        minLabel: 'Not at all',
        maxLabel: 'Extremely',
        required: true,
        showValue: true
      }
    ],
    allowAddMore: true,
    buttonText: 'Next'
  }
}
```

### **File: `lib/utils/section-variables.ts`**
Update `isQuestionSection` function to include new type:

```typescript
export function isQuestionSection(sectionType: string): boolean {
  return sectionType.includes('question-') || 
         sectionType.includes('capture') ||
         ['text_question', 'multiple_choice', 'slider'].includes(sectionType)
}
```

Add helper function for multiple-input sections:

```typescript
export function isMultipleInputSection(sectionType: string): boolean {
  return sectionType.includes('-multiple')
}
```

Update `buildVariablesFromInputs` function:

```typescript
export function buildVariablesFromInputs(
  sections: SectionWithOptions[], 
  userInputs: Record<string, any>
): Record<string, any> {
  const variables: Record<string, any> = {}
  
  sections.forEach(section => {
    if (isQuestionSection(section.type)) {
      if (isMultipleInputSection(section.type)) {
        // Handle multiple-input sections
        const settings = section.configuration as any
        const sectionResponses = userInputs[section.id] || {}
        
        // For multiple sliders
        if (section.type === 'question-slider-multiple' && settings.sliders) {
          settings.sliders.forEach((slider: any) => {
            if (sectionResponses[slider.variableName] !== undefined) {
              variables[slider.variableName] = sectionResponses[slider.variableName]
            }
          })
        }
      } else {
        // Handle existing single-input sections (unchanged)
        if (section.title) {
          const variableName = titleToVariableName(section.title)
          const userResponse = userInputs[section.id]
          if (userResponse) {
            variables[variableName] = extractResponseValue(userResponse, section)
          }
        }
      }
    }
  })
  
  return variables
}
```

---

## **Phase 2: Campaign Builder Component**

### **File: `components/campaign-builder/question-types/multiple-sliders.tsx`** (NEW FILE)

Create the main builder component that allows configuring multiple sliders:

```typescript
'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'

interface SliderConfig {
  id: string
  variableName: string
  question: string
  subheading: string
  minValue: number
  maxValue: number
  defaultValue: number
  step: number
  minLabel: string
  maxLabel: string
  required: boolean
  showValue: boolean
}

interface MultipleSlidersSettings {
  sliders: SliderConfig[]
  allowAddMore: boolean
  buttonText: string
}

interface MultipleSlidersProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function MultipleSliders({ section, isPreview = false, onUpdate, className }: MultipleSlidersProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  const settings = section.settings as MultipleSlidersSettings || { 
    sliders: [], 
    allowAddMore: true, 
    buttonText: 'Next' 
  }

  const updateSettings = async (newSettings: Partial<MultipleSlidersSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addSlider = async () => {
    const newSlider: SliderConfig = {
      id: `slider_${Date.now()}`,
      variableName: `slider_${settings.sliders.length + 1}`,
      question: 'New slider question',
      subheading: '',
      minValue: 0,
      maxValue: 10,
      defaultValue: 5,
      step: 1,
      minLabel: 'Low',
      maxLabel: 'High',
      required: true,
      showValue: true
    }
    
    await updateSettings({
      sliders: [...settings.sliders, newSlider]
    })
  }

  const updateSlider = async (index: number, updates: Partial<SliderConfig>) => {
    const updatedSliders = [...settings.sliders]
    updatedSliders[index] = { ...updatedSliders[index], ...updates }
    await updateSettings({ sliders: updatedSliders })
  }

  const deleteSlider = async (index: number) => {
    const updatedSliders = settings.sliders.filter((_, i) => i !== index)
    await updateSettings({ sliders: updatedSliders })
  }

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-8', className)}>
        {settings.sliders.map((slider) => (
          <div key={slider.id} className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">
                {slider.question}
              </h3>
              {slider.subheading && (
                <p className="text-lg text-gray-300 mt-2">
                  {slider.subheading}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{slider.minLabel}</span>
                <span>{slider.maxLabel}</span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min={slider.minValue}
                  max={slider.maxValue}
                  step={slider.step}
                  defaultValue={slider.defaultValue}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled
                />
              </div>
              
              {slider.showValue && (
                <div className="text-center">
                  <span className="text-lg font-semibold text-white">
                    {slider.defaultValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {settings.sliders.map((slider, index) => (
        <SliderConfigCard
          key={slider.id}
          slider={slider}
          index={index}
          onUpdate={(updates) => updateSlider(index, updates)}
          onDelete={() => deleteSlider(index)}
          canDelete={settings.sliders.length > 1}
        />
      ))}
      
      {settings.allowAddMore && (
        <button
          onClick={addSlider}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="h-5 w-5 mx-auto mb-2" />
          Add another slider
        </button>
      )}

      {/* Global Settings */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label>Allow adding more sliders</Label>
          <Switch
            checked={settings.allowAddMore}
            onCheckedChange={(checked) => updateSettings({ allowAddMore: checked })}
          />
        </div>
        
        <div>
          <Label>Button Text</Label>
          <Input
            value={settings.buttonText}
            onChange={(e) => updateSettings({ buttonText: e.target.value })}
            placeholder="Next"
          />
        </div>
      </div>
    </div>
  )
}

function SliderConfigCard({ slider, index, onUpdate, onDelete, canDelete }: {
  slider: SliderConfig
  index: number
  onUpdate: (updates: Partial<SliderConfig>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="font-medium">Slider {index + 1}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono text-xs">
            @{slider.variableName}
          </Badge>
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Question and Variable Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Question Text</Label>
          <Input
            value={slider.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Slider question"
          />
        </div>
        
        <div>
          <Label>Variable Name</Label>
          <Input
            value={slider.variableName}
            onChange={(e) => onUpdate({ variableName: e.target.value })}
            placeholder="variable_name"
            className="font-mono text-sm"
          />
        </div>
      </div>

      {/* Subheading */}
      <div>
        <Label>Subheading (optional)</Label>
        <Input
          value={slider.subheading}
          onChange={(e) => onUpdate({ subheading: e.target.value })}
          placeholder="Additional context or instructions"
        />
      </div>

      {/* Slider Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Min Value</Label>
          <Input
            type="number"
            value={slider.minValue}
            onChange={(e) => onUpdate({ minValue: parseInt(e.target.value) })}
          />
        </div>
        
        <div>
          <Label>Max Value</Label>
          <Input
            type="number"
            value={slider.maxValue}
            onChange={(e) => onUpdate({ maxValue: parseInt(e.target.value) })}
          />
        </div>
        
        <div>
          <Label>Default Value</Label>
          <Input
            type="number"
            value={slider.defaultValue}
            onChange={(e) => onUpdate({ defaultValue: parseInt(e.target.value) })}
            min={slider.minValue}
            max={slider.maxValue}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Label</Label>
          <Input
            value={slider.minLabel}
            onChange={(e) => onUpdate({ minLabel: e.target.value })}
            placeholder="Low"
          />
        </div>
        
        <div>
          <Label>Max Label</Label>
          <Input
            value={slider.maxLabel}
            onChange={(e) => onUpdate({ maxLabel: e.target.value })}
            placeholder="High"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label>Required</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.showValue}
            onCheckedChange={(checked) => onUpdate({ showValue: checked })}
          />
          <Label>Show Value</Label>
        </div>
      </div>
    </div>
  )
}
```

---

## **Phase 3: Campaign Renderer Component**

### **File: `components/campaign-renderer/sections/MultipleSlidersSection.tsx`** (NEW FILE)

Create the end-user facing component that renders multiple sliders:

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Sliders } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

interface SliderConfig {
  id: string
  variableName: string
  question: string
  subheading: string
  minValue: number
  maxValue: number
  defaultValue: number
  step: number
  minLabel: string
  maxLabel: string
  required: boolean
  showValue: boolean
}

interface MultipleSlidersSettings {
  sliders: SliderConfig[]
  buttonText: string
}

export function MultipleSlidersSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onNext,
  onPrevious,
  onSectionComplete,
  onResponseUpdate
}: SectionRendererProps) {
  const [values, setValues] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const configData = config as MultipleSlidersSettings
  const sliders = configData.sliders || []
  const buttonLabel = configData.buttonText || 'Continue'
  
  // Initialize default values
  useEffect(() => {
    const defaultValues: Record<string, number> = {}
    sliders.forEach(slider => {
      defaultValues[slider.id] = slider.defaultValue
    })
    setValues(defaultValues)
  }, [sliders])

  const handleSliderChange = (sliderId: string, value: number) => {
    setValues(prev => ({ ...prev, [sliderId]: value }))
    
    // Clear any existing error for this slider
    if (errors[sliderId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[sliderId]
        return newErrors
      })
    }

    // Find the slider config to get variable name
    const slider = sliders.find(s => s.id === sliderId)
    if (slider) {
      onResponseUpdate(section.id, slider.variableName, value, {
        sliderId: sliderId,
        sliderQuestion: slider.question,
        isValid: true,
        isRequired: slider.required
      })
    }
  }

  const validateResponses = (): Record<string, string> => {
    const validationErrors: Record<string, string> = {}
    
    sliders.forEach(slider => {
      if (slider.required) {
        const value = values[slider.id]
        if (value === undefined || value === null) {
          validationErrors[slider.id] = 'This slider is required'
        }
      }
    })
    
    return validationErrors
  }

  const handleContinue = () => {
    const validationErrors = validateResponses()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Build response object with variable names as keys
    const responses: Record<string, any> = {}
    
    sliders.forEach(slider => {
      const value = values[slider.id]
      if (value !== undefined) {
        responses[slider.variableName] = value
      }
    })

    onSectionComplete(index, {
      [section.id]: responses, // Store responses under section ID
      ...responses // Also store each variable directly for easy access
    })
  }

  const canContinue = () => {
    const requiredSliders = sliders.filter(s => s.required)
    return requiredSliders.every(slider => {
      const value = values[slider.id]
      return value !== undefined && value !== null
    })
  }

  const mobileClasses = getMobileClasses(deviceInfo)

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      mobileClasses.container
    )}>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-8">
          
          {sliders.map((slider, sliderIndex) => (
            <div key={slider.id} className="space-y-6">
              
              {/* Question */}
              <div className="text-center space-y-2">
                <h1 className={cn(
                  'font-bold text-white leading-tight',
                  deviceInfo?.type === 'mobile' ? 'text-2xl' : 'text-4xl'
                )}>
                  {slider.question}
                </h1>
                
                {slider.subheading && (
                  <p className={cn(
                    'text-gray-300',
                    deviceInfo?.type === 'mobile' ? 'text-base' : 'text-xl'
                  )}>
                    {slider.subheading}
                  </p>
                )}
              </div>

              {/* Slider Interface */}
              <div className="space-y-4">
                
                {/* Labels */}
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{slider.minLabel}</span>
                  <span>{slider.maxLabel}</span>
                </div>
                
                {/* Slider */}
                <div className="relative px-2">
                  <input
                    type="range"
                    min={slider.minValue}
                    max={slider.maxValue}
                    step={slider.step}
                    value={values[slider.id] || slider.defaultValue}
                    onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                    className={cn(
                      'w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors[slider.id] && 'ring-2 ring-red-500'
                    )}
                  />
                </div>
                
                {/* Value Display */}
                {slider.showValue && (
                  <div className="text-center">
                    <span className={cn(
                      'font-bold text-white',
                      deviceInfo?.type === 'mobile' ? 'text-xl' : 'text-2xl'
                    )}>
                      {values[slider.id] || slider.defaultValue}
                    </span>
                  </div>
                )}
                
                {/* Error Message */}
                {errors[slider.id] && (
                  <div className="text-center">
                    <span className="text-red-400 text-sm">
                      {errors[slider.id]}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Separator between sliders */}
              {sliderIndex < sliders.length - 1 && (
                <div className="border-t border-gray-700 pt-8" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <SectionNavigationBar
        canContinue={canContinue()}
        onNext={handleContinue}
        onPrevious={onPrevious}
        buttonText={buttonLabel}
        showPrevious={index > 0}
        validationText={
          sliders.some(s => s.required) 
            ? 'Please complete all required sliders' 
            : undefined
        }
        deviceInfo={deviceInfo}
      />
    </div>
  )
}
```

---

## **Phase 4: Component Factory Integration**

### **File: `components/campaign-builder/factories/QuestionComponentFactory.tsx`**
Add case for new section type:

```typescript
// Add import
import { MultipleSliders } from '../question-types/multiple-sliders'

// Add to switch statement
case 'question-slider-multiple':
  return (
    <MultipleSliders
      section={section}
      isPreview={isPreview}
      onUpdate={onUpdate}
    />
  )
```

### **File: `components/campaign-renderer/SectionRenderer.tsx`**
Add case for new section type:

```typescript
// Add import
import { MultipleSlidersSection } from './sections/MultipleSlidersSection'

// Add to switch statement
case 'question-slider-multiple':
  return <MultipleSlidersSection {...enhancedProps} />
```

---

## **Phase 5: Database Mapping**

### **File: `app/dashboard/campaigns/[id]/builder/page.tsx`**
Update type mapping functions:

```typescript
const mapDatabaseTypeToCampaignBuilder = (dbType: string): string => {
  const typeMapping: Record<string, string> = {
    'text_question': 'question-text',
    'multiple_choice': 'question-multiple-choice', 
    'slider': 'question-slider',
    'slider_multiple': 'question-slider-multiple', // Add this
    'info': 'content-basic',
    'capture': 'capture-details',
    'logic': 'logic-ai',
    'output': 'output-results',
    'dynamic_redirect': 'output-dynamic-redirect',
    'html_embed': 'output-html-embed'
  }
  return typeMapping[dbType] || dbType
}

const mapCampaignBuilderTypeToDatabase = (builderType: string): string => {
  const typeMapping: Record<string, string> = {
    'question-text': 'text_question',
    'question-multiple-choice': 'multiple_choice',
    'question-slider': 'slider', 
    'question-slider-multiple': 'slider_multiple', // Add this
    'content-basic': 'info',
    'capture-details': 'capture',
    'logic-ai': 'logic',
    'output-results': 'output',
    'output-dynamic-redirect': 'dynamic_redirect',
    'output-html-embed': 'html_embed'
  }
  return typeMapping[builderType] || builderType
}
```

---

## **Phase 6: Database Schema Update**

### **File: `supabase/migrations/[timestamp]_add_slider_multiple_type.sql`** (NEW FILE)

```sql
-- Add new section type for multiple sliders
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'slider_multiple';

-- Update type check constraint if it exists
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_type_check;
ALTER TABLE sections ADD CONSTRAINT sections_type_check 
  CHECK (type IN (
    'text_question', 
    'multiple_choice', 
    'slider', 
    'slider_multiple',
    'info', 
    'capture', 
    'logic', 
    'output', 
    'dynamic_redirect', 
    'html_embed'
  ));
```

---

## **Phase 7: Variable System Integration**

### **File: `components/campaign-builder/logic-types/ai-logic-section.tsx`**
Update variable extraction for AI logic sections:

```typescript
function extractInputVariablesWithTypesFromBuilder(sections: CampaignSection[], currentOrder: number): Array<{
  name: string
  title: string  
  type: 'text' | 'file'
  section: CampaignSection
}> {
  const variables: Array<any> = []
  
  sections
    .filter(s => s.order < currentOrder && isQuestionSection(s.type))
    .forEach(section => {
      if (section.type === 'question-slider-multiple') {
        // Handle multiple sliders - each slider becomes a variable
        const settings = section.settings as any
        if (settings.sliders) {
          settings.sliders.forEach((slider: any) => {
            variables.push({
              name: slider.variableName,
              title: slider.question,
              type: 'text' as const,
              section
            })
          })
        }
      } else if (section.title) {
        // Handle single-input sections (existing logic)
        variables.push({
          name: titleToVariableName(section.title),
          title: section.title,
          type: isFileVariableFromBuilder(section) ? 'file' : 'text',
          section
        })
      }
    })
    
  return variables
}
```

---

## **Phase 8: Section Top Bar Updates**

### **File: `components/campaign-builder/section-top-bar.tsx`**
Update variable preview logic:

```typescript
// Update variable preview badge logic
{isQuestionSection(section.type) && (
  <div className="flex items-center space-x-2 mt-1">
    {section.type === 'question-slider-multiple' ? (
      // Show multiple variable badges for multiple sliders
      <div className="flex flex-wrap gap-1">
        {((section.settings as any)?.sliders || []).map((slider: any, index: number) => (
          <Badge 
            key={slider.id}
            variant="secondary"
            className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200"
          >
            @{slider.variableName}
          </Badge>
        ))}
        {((section.settings as any)?.sliders || []).length === 0 && (
          <span className="text-xs text-muted-foreground">No sliders configured</span>
        )}
      </div>
    ) : section.title ? (
      // Show single variable badge for regular sections
      <>
        <Badge 
          variant={checkVariableNameConflict(section.title) ? "destructive" : "secondary"}
          className={cn(
            "text-xs font-mono",
            checkVariableNameConflict(section.title) 
              ? "bg-red-50 text-red-700 border-red-200" 
              : "bg-blue-50 text-blue-700 border-blue-200"
          )}
        >
          @{titleToVariableName(section.title)}
        </Badge>
        {checkVariableNameConflict(section.title) ? (
          <span className="text-xs text-red-600">⚠️ Duplicate variable name</span>
        ) : (
          <span className="text-xs text-muted-foreground">← Variable name</span>
        )}
      </>
    ) : (
      <span className="text-xs text-muted-foreground">Configure section to see variables</span>
    )}
  </div>
)}
```

---

## **Summary of Files**

### **New Files:**
1. `components/campaign-builder/question-types/multiple-sliders.tsx`
2. `components/campaign-renderer/sections/MultipleSlidersSection.tsx`  
3. `supabase/migrations/[timestamp]_add_slider_multiple_type.sql`

### **Modified Files:**
1. `lib/types/campaign-builder.ts` - Add section type definition
2. `lib/utils/section-variables.ts` - Update variable extraction logic
3. `components/campaign-builder/factories/QuestionComponentFactory.tsx` - Add factory case
4. `components/campaign-renderer/SectionRenderer.tsx` - Add renderer case
5. `app/dashboard/campaigns/[id]/builder/page.tsx` - Add type mapping
6. `components/campaign-builder/logic-types/ai-logic-section.tsx` - Update variable extraction
7. `components/campaign-builder/section-top-bar.tsx` - Update variable preview

## **Data Structure Examples**

### **Section Configuration (stored in database):**
```json
{
  "sliders": [
    {
      "id": "slider_1",
      "variableName": "satisfaction",
      "question": "How satisfied are you with our service?",
      "subheading": "Rate your overall experience",
      "minValue": 0,
      "maxValue": 10,
      "defaultValue": 5,
      "step": 1,
      "minLabel": "Not at all",
      "maxLabel": "Extremely",
      "required": true,
      "showValue": true
    },
    {
      "id": "slider_2", 
      "variableName": "likelihood_recommend",
      "question": "How likely are you to recommend us?",
      "subheading": "",
      "minValue": 0,
      "maxValue": 10,
      "defaultValue": 5,
      "step": 1,
      "minLabel": "Not likely",
      "maxLabel": "Very likely", 
      "required": true,
      "showValue": true
    }
  ],
  "allowAddMore": true,
  "buttonText": "Continue"
}
```

### **User Responses (stored in userInputs):**
```json
{
  "section_id_123": {
    "satisfaction": 8,
    "likelihood_recommend": 9
  }
}
```

### **Variables for AI Processing:**
```json
{
  "satisfaction": 8,
  "likelihood_recommend": 9,
  "user_name": "John Doe"
}
```

## **Future Extensions**

This pattern can be easily extended to create:

- `question-text-multiple` - Multiple text input fields
- `question-choice-multiple` - Multiple choice questions  
- `question-upload-multiple` - Multiple file upload fields
- `question-rating-multiple` - Multiple star rating components

Each would follow the same self-contained pattern without affecting existing functionality. 