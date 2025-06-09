'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'

interface OutputSectionProps {
  section: CampaignSection
  allSections?: CampaignSection[]
  onUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function OutputSection({
  section,
  allSections = [],
  onUpdate,
  className
}: OutputSectionProps) {
  const [content, setContent] = useState('')
  const [availableVariables, setAvailableVariables] = useState<{ name: string; type: 'input' | 'ai'; example: string }[]>([])

  // Initialize content from section configuration
  useEffect(() => {
    const config = section.settings as any
    if (config?.content) {
      setContent(config.content)
    }
  }, [section.settings])

  // Build available variables
  useEffect(() => {
    const variables: { name: string; type: 'input' | 'ai'; example: string }[] = []
    
    // Add input variables from question sections
    allSections.forEach(sect => {
      if (isQuestionSection(sect.type) && sect.title) {
        const varName = titleToVariableName(sect.title)
        variables.push({
          name: varName,
          type: 'input',
          example: sect.type === 'slider' ? '7' : sect.type === 'multiple_choice' ? 'Option 1' : 'User answer'
        })
      }
    })

    // Add AI output variables if available
    const mockAiResults = { recommendation: 'Sample AI output', score: '85' }
    Object.keys(mockAiResults).forEach(key => {
      variables.push({
        name: key,
        type: 'ai',
        example: String(mockAiResults[key as keyof typeof mockAiResults]).slice(0, 30) + '...'
      })
    })

    setAvailableVariables(variables)
  }, [allSections])

  const handleContentChange = async (newContent: string) => {
    setContent(newContent)
    
    try {
      await onUpdate(section.id, {
        settings: {
          ...section.settings,
          content: newContent
        }
      })
    } catch (error) {
      console.error('Failed to update output section:', error)
    }
  }

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById('output-content-editor') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + `@${variableName}` + content.slice(end)
      setContent(newContent)
      handleContentChange(newContent)
      
      // Focus back on textarea and set cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variableName.length + 1, start + variableName.length + 1)
      }, 0)
    }
  }

  const inputVariables = availableVariables.filter(v => v.type === 'input')
  const aiVariables = availableVariables.filter(v => v.type === 'ai')

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Output Section Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Variables */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Available Variables
          </h3>
          
          {/* Input Variables */}
          {inputVariables.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">User Inputs</h4>
              <div className="flex flex-wrap gap-2">
                {inputVariables.map(variable => (
                  <Badge 
                    key={variable.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => insertVariable(variable.name)}
                  >
                    @{variable.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* AI Variables */}
          {aiVariables.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">AI Outputs</h4>
              <div className="flex flex-wrap gap-2">
                {aiVariables.map(variable => (
                  <Badge 
                    key={variable.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-100 border-purple-200 transition-colors"
                    onClick={() => insertVariable(variable.name)}
                  >
                    @{variable.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {availableVariables.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No variables available. Add question sections or AI logic sections to create variables.
              </p>
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Output Content</label>
          <Textarea
            id="output-content-editor"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your personalized output content here. Use @variable_name to insert user answers or AI results.

Example:
Hey @what_is_your_name! Based on your answers, here's your personalized recommendation:

@recommendation

Your score: @score"
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use @variable_name syntax to insert variables. Click variable badges above to insert them.
          </p>
        </div>

        {/* Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pro tip:</strong> Your output section will display personalized content based on user answers and AI processing. 
            Use variables to create dynamic, engaging results that feel custom-made for each user.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 