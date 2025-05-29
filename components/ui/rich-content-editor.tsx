'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { 
  Bold, 
  Italic, 
  List,
  ListOrdered,
  Link,
  Type,
  Eye,
  Code,
  RotateCcw,
  Settings,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Hash,
  AtSign,
  Braces,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { VariableInterpolatedContent } from '@/components/ui/variable-interpolated-content'
import type { 
  VariableInterpolationContext,
  ConditionalContentRule
} from '@/lib/types/output-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface RichContentEditorProps {
  content: string
  onChange: (content: string) => void
  variableContext?: VariableInterpolationContext
  className?: string
  placeholder?: string
  enablePreview?: boolean
  enableVariables?: boolean
  enableFormatting?: boolean
  enableConditionals?: boolean
  maxHeight?: string
}

interface FormattingOption {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  syntax: string
  example: string
}

interface ConditionalRule {
  id: string
  variable: string
  operator: string
  value: string
  content: string
}

// =============================================================================
// FORMATTING OPTIONS
// =============================================================================

const FORMATTING_OPTIONS: FormattingOption[] = [
  {
    id: 'bold',
    label: 'Bold Text',
    description: 'Make text bold',
    icon: Bold,
    syntax: '**text**',
    example: '**Important note**'
  },
  {
    id: 'italic',
    label: 'Italic Text',
    description: 'Make text italic',
    icon: Italic,
    syntax: '*text*',
    example: '*Emphasis here*'
  },
  {
    id: 'heading',
    label: 'Heading',
    description: 'Create a heading',
    icon: Hash,
    syntax: '# Heading',
    example: '# Section Title'
  },
  {
    id: 'list',
    label: 'Bullet List',
    description: 'Create a bullet list',
    icon: List,
    syntax: '- Item',
    example: '- First item\n- Second item'
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    syntax: '1. Item',
    example: '1. First step\n2. Second step'
  },
  {
    id: 'link',
    label: 'Link',
    description: 'Create a hyperlink',
    icon: Link,
    syntax: '[text](url)',
    example: '[Visit our website](https://example.com)'
  },
  {
    id: 'variable',
    label: 'Variable',
    description: 'Insert a variable',
    icon: AtSign,
    syntax: '@variableName',
    example: '@name, @email, @score'
  },
  {
    id: 'conditional',
    label: 'Conditional Content',
    description: 'Show content based on conditions',
    icon: Braces,
    syntax: '{if @variable}content{/if}',
    example: '{if @score > 80}Excellent!{/if}'
  }
]

const CONDITIONAL_OPERATORS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' },
  { value: '=', label: 'Equal to' },
  { value: '!=', label: 'Not equal to' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' }
]

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function FormattingToolbar({ 
  onInsert, 
  enableVariables = true, 
  enableConditionals = true 
}: {
  onInsert: (syntax: string) => void
  enableVariables?: boolean
  enableConditionals?: boolean
}) {
  const filteredOptions = FORMATTING_OPTIONS.filter(option => {
    if (!enableVariables && option.id === 'variable') return false
    if (!enableConditionals && option.id === 'conditional') return false
    return true
  })

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
      {filteredOptions.map((option) => {
        const IconComponent = option.icon
        return (
          <Button
            key={option.id}
            variant="ghost"
            size="sm"
            onClick={() => onInsert(option.syntax)}
            className="h-8 px-2"
            title={`${option.label}: ${option.syntax}`}
          >
            <IconComponent className="h-3 w-3" />
          </Button>
        )
      })}
    </div>
  )
}

function ConditionalBuilder({ 
  onInsert,
  availableVariables = []
}: {
  onInsert: (content: string) => void
  availableVariables?: string[]
}) {
  const [rule, setRule] = useState<ConditionalRule>({
    id: Date.now().toString(),
    variable: '',
    operator: '>',
    value: '',
    content: ''
  })
  const [isOpen, setIsOpen] = useState(false)

  const handleInsert = () => {
    if (!rule.variable || !rule.content) return
    
    const conditionalSyntax = `{if @${rule.variable} ${rule.operator} ${rule.value}}${rule.content}{/if}`
    onInsert(conditionalSyntax)
    
    // Reset form
    setRule({
      id: Date.now().toString(),
      variable: '',
      operator: '>',
      value: '',
      content: ''
    })
    setIsOpen(false)
  }

  return (
    <Card className="border-dashed">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Braces className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Conditional Content</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Variable</Label>
              <select
                value={rule.variable}
                onChange={(e) => setRule({ ...rule, variable: e.target.value })}
                className="w-full text-sm border rounded px-2 py-1"
              >
                <option value="">Select variable...</option>
                {availableVariables.map(variable => (
                  <option key={variable} value={variable}>@{variable}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="text-xs">Operator</Label>
              <select
                value={rule.operator}
                onChange={(e) => setRule({ ...rule, operator: e.target.value })}
                className="w-full text-sm border rounded px-2 py-1"
              >
                {CONDITIONAL_OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Value</Label>
            <Input
              value={rule.value}
              onChange={(e) => setRule({ ...rule, value: e.target.value })}
              placeholder="Comparison value..."
              className="text-sm"
            />
          </div>
          
          <div>
            <Label className="text-xs">Content to show</Label>
            <Textarea
              value={rule.content}
              onChange={(e) => setRule({ ...rule, content: e.target.value })}
              placeholder="Content to display when condition is true..."
              className="text-sm"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInsert}
              disabled={!rule.variable || !rule.content}
            >
              Insert Conditional
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function SyntaxHelper() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Formatting Help</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-blue-600" />
          )}
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-1 gap-2 text-xs">
            {FORMATTING_OPTIONS.map((option) => (
              <div key={option.id} className="flex justify-between items-center py-1">
                <span className="text-blue-800">{option.label}:</span>
                <code className="bg-white px-2 py-1 rounded border text-blue-900">
                  {option.syntax}
                </code>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-xs text-blue-700">
              <strong>Variable Examples:</strong>
              <div className="mt-1 space-y-1">
                <div><code className="bg-white px-1 rounded">@name</code> - User's name</div>
                <div><code className="bg-white px-1 rounded">@score</code> - Calculated score</div>
                <div><code className="bg-white px-1 rounded">@recommendation</code> - AI recommendation</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RichContentEditor({
  content,
  onChange,
  variableContext,
  className,
  placeholder = "Enter your content...",
  enablePreview = true,
  enableVariables = true,
  enableFormatting = true,
  enableConditionals = true,
  maxHeight = "400px"
}: RichContentEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get available variable names for conditional builder
  const availableVariableNames = useMemo(() => {
    return variableContext?.availableVariables?.map(v => v.name) || []
  }, [variableContext?.availableVariables])

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInsertSyntax = useCallback((syntax: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let newContent = content
    let newCursorPosition = start

    // Handle different syntax insertions
    if (syntax.includes('text')) {
      // Replace 'text' with selected text or placeholder
      const replacement = selectedText || 'text'
      const formatted = syntax.replace('text', replacement)
      newContent = content.substring(0, start) + formatted + content.substring(end)
      newCursorPosition = start + formatted.length
    } else if (syntax.includes('url')) {
      // Handle link insertion
      const linkText = selectedText || 'link text'
      const formatted = syntax.replace('text', linkText)
      newContent = content.substring(0, start) + formatted + content.substring(end)
      newCursorPosition = start + formatted.indexOf('url')
    } else {
      // Direct insertion
      newContent = content.substring(0, start) + syntax + content.substring(end)
      newCursorPosition = start + syntax.length
    }

    onChange(newContent)

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }, [content, onChange])

  const handleInsertConditional = useCallback((conditionalSyntax: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const newContent = content.substring(0, start) + conditionalSyntax + content.substring(start)
    
    onChange(newContent)

    // Focus and position cursor after insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(
          start + conditionalSyntax.length, 
          start + conditionalSyntax.length
        )
      }
    }, 0)
  }, [content, onChange])

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Content Editor</Label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
          
          {enablePreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
          )}
        </div>
      </div>

      {/* Help Section */}
      {showHelp && <SyntaxHelper />}

      {/* Editor/Preview */}
      <Card>
        {enableFormatting && !isPreviewMode && (
          <FormattingToolbar
            onInsert={handleInsertSyntax}
            enableVariables={enableVariables}
            enableConditionals={enableConditionals}
          />
        )}
        
        <CardContent className="p-0">
          {isPreviewMode ? (
            <div className="p-4 min-h-[200px]">
              {variableContext ? (
                <VariableInterpolatedContent
                  content={content}
                  context={variableContext}
                  showPreview={true}
                  enableRealTimeProcessing={true}
                  highlightVariables={true}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              )}
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 resize-none focus:ring-0 text-sm"
              style={{ maxHeight, minHeight: "200px" }}
            />
          )}
        </CardContent>
      </Card>

      {/* Conditional Builder */}
      {enableConditionals && !isPreviewMode && (
        <ConditionalBuilder
          onInsert={handleInsertConditional}
          availableVariables={availableVariableNames}
        />
      )}

      {/* Variable Suggestions */}
      {enableVariables && availableVariableNames.length > 0 && !isPreviewMode && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Available Variables:</Label>
          <div className="flex flex-wrap gap-1">
            {availableVariableNames.slice(0, 8).map((variable) => (
              <Button
                key={variable}
                variant="outline"
                size="sm"
                onClick={() => handleInsertSyntax(`@${variable}`)}
                className="h-6 px-2 text-xs"
              >
                <AtSign className="h-3 w-3 mr-1" />
                {variable}
              </Button>
            ))}
            {availableVariableNames.length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{availableVariableNames.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RichContentEditor 