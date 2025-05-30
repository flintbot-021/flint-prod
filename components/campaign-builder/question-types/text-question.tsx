'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Type, AlignLeft, Hash, Mail, Phone, Calendar } from 'lucide-react'

interface TextQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

type TextInputType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date'

interface TextQuestionSettings {
  content?: string
  placeholder?: string
  inputType?: TextInputType
  minLength?: number
  maxLength?: number
  required?: boolean
  buttonLabel?: string
  helpText?: string
  validation?: {
    pattern?: string
    message?: string
  }
}

export function TextQuestion({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: TextQuestionProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as TextQuestionSettings || {}
  const {
    content = '',
    placeholder = 'Type your answer here...',
    inputType = 'text',
    minLength = 0,
    maxLength = 500,
    required = false,
    buttonLabel = 'Next',
    helpText = '',
    validation = {}
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<TextQuestionSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update text question settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle placeholder change
  const handlePlaceholderChange = async (newPlaceholder: string) => {
    await updateSettings({ placeholder: newPlaceholder })
  }

  // Handle help text change
  const handleHelpTextChange = async (newHelpText: string) => {
    await updateSettings({ helpText: newHelpText })
  }

  // Input type icons
  const getInputTypeIcon = (type: TextInputType) => {
    switch (type) {
      case 'textarea': return AlignLeft
      case 'email': return Mail
      case 'phone': return Phone
      case 'number': return Hash
      case 'date': return Calendar
      default: return Type
    }
  }

  // Validation
  const validateContent = (text: string): string | null => {
    if (!text.trim()) {
      return 'Question text is required'
    }
    if (text.length > 200) {
      return 'Question text must be 200 characters or less'
    }
    return null
  }

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('p-6', className)}>
        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              {content || 'Your question text here...'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {helpText && (
              <p className="text-sm text-muted-foreground mb-4">{helpText}</p>
            )}
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            {inputType === 'textarea' ? (
              <Textarea
                placeholder={placeholder}
                disabled
                className="min-h-[100px] resize-none"
                maxLength={maxLength}
              />
            ) : (
              <Input
                type={inputType === 'text' ? 'text' : inputType}
                placeholder={placeholder}
                disabled
                maxLength={maxLength}
              />
            )}
            
            {/* Character limit indicator */}
            {maxLength > 0 && (
              <div className="text-xs text-muted-foreground text-right">
                0 / {maxLength} characters
              </div>
            )}
          </div>

          {/* Validation preview */}
          {validation.pattern && (
            <div className="text-xs text-muted-foreground">
              <strong>Format:</strong> {validation.message || 'Must match required pattern'}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Question Content */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Question Text {required && <span className="text-red-500">*</span>}
          </Label>
          <InlineEditableText
            value={content}
            onSave={handleContentChange}
            variant="body"
            placeholder="Enter your question text..."
            className="min-h-[60px] p-3 border border-border rounded-lg w-full"
            showEditIcon={false}
            showSaveStatus={true}
            multiline={true}
            maxLength={200}
            required={true}
            validation={validateContent}
          />
        </div>

        {/* Input Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Input Type
            </Label>
            <Select
              value={inputType}
              onValueChange={(value: TextInputType) => updateSettings({ inputType: value })}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const Icon = getInputTypeIcon(inputType)
                      return <Icon className="h-4 w-4" />
                    })()}
                    <span className="capitalize">{inputType === 'textarea' ? 'Long Text' : inputType}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center space-x-2">
                    <Type className="h-4 w-4" />
                    <span>Short Text</span>
                  </div>
                </SelectItem>
                <SelectItem value="textarea">
                  <div className="flex items-center space-x-2">
                    <AlignLeft className="h-4 w-4" />
                    <span>Long Text</span>
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </div>
                </SelectItem>
                <SelectItem value="number">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>Number</span>
                  </div>
                </SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Character Limit
            </Label>
            <Input
              type="number"
              value={maxLength}
              onChange={(e) => updateSettings({ maxLength: parseInt(e.target.value) || 0 })}
              min={0}
              max={2000}
              className="w-full"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Placeholder Text */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Placeholder Text
          </Label>
          <InlineEditableText
            value={placeholder}
            onSave={handlePlaceholderChange}
            variant="body"
            placeholder="Enter placeholder text..."
            className="p-3 border border-border rounded-lg w-full text-muted-foreground"
            showEditIcon={false}
            showSaveStatus={true}
            maxLength={100}
          />
        </div>

        {/* Help Text */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Help Text (Optional)
          </Label>
          <InlineEditableText
            value={helpText}
            onSave={handleHelpTextChange}
            variant="body"
            placeholder="Add helpful instructions for users..."
            className="p-3 border border-border rounded-lg w-full text-muted-foreground"
            showEditIcon={false}
            showSaveStatus={true}
            maxLength={200}
            multiline={true}
          />
        </div>

        {/* Validation Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={required}
              onCheckedChange={(checked) => updateSettings({ required: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="required" className="text-sm font-medium cursor-pointer">
              Required field
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Min Length
              </Label>
              <Input
                type="number"
                value={minLength}
                onChange={(e) => updateSettings({ minLength: parseInt(e.target.value) || 0 })}
                min={0}
                max={maxLength}
                disabled={isSaving}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Validation Pattern (Regex)
              </Label>
              <Input
                type="text"
                value={validation.pattern || ''}
                onChange={(e) => updateSettings({ 
                  validation: { 
                    ...validation, 
                    pattern: e.target.value 
                  } 
                })}
                placeholder="^[A-Za-z]+$"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Preview
          </Label>
          <div className="bg-muted rounded-lg p-4">
            <div className="space-y-3">
              <div className="font-medium">
                {content || 'Your question text here...'}
                {required && <span className="text-red-500 ml-1">*</span>}
              </div>
              {helpText && (
                <div className="text-sm text-muted-foreground">{helpText}</div>
              )}
              {inputType === 'textarea' ? (
                <Textarea
                  placeholder={placeholder}
                  disabled
                  className="bg-background"
                />
              ) : (
                <Input
                  type={inputType}
                  placeholder={placeholder}
                  disabled
                  className="bg-background"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 