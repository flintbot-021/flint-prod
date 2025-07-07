'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { CalendarIcon, Clock } from 'lucide-react'

interface DateTimeQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface DateTimeSettings {
  content?: string
  subheading?: string
  includeDate?: boolean
  includeTime?: boolean
  required?: boolean
  buttonLabel?: string
}

export function DateTimeQuestion({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: DateTimeQuestionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  // Get current settings with defaults
  const settings = section.settings as DateTimeSettings || {}
  const {
    content = '',
    subheading = '',
    includeDate = true,
    includeTime = false,
    required = false,
    buttonLabel = 'Next'
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<DateTimeSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update date time settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle subheading change
  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Handle setting change
  const handleSettingChange = async (setting: keyof DateTimeSettings, value: boolean) => {
    await updateSettings({ [setting]: value })
  }

  if (isPreview) {
    // Preview Mode - Show what end users see
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        <div className="space-y-6">
          {/* Question Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {content || 'Select a date and time'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className="text-xl text-gray-600">
                {subheading}
              </p>
            )}
          </div>

          {/* Date & Time Inputs - Only show if enabled */}
          <div className="space-y-6 pt-6">
            {/* Date Input - Only if includeDate is true */}
            {settings.includeDate && (
              <div className="space-y-3">
                <Label htmlFor={`date-${section.id}`} className="text-sm font-medium text-gray-700">
                  Date
                </Label>
                <Input
                  id={`date-${section.id}`}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white border-gray-300 text-gray-900"
                />
              </div>
            )}

            {/* Time Input - Only if includeTime is true */}
            {settings.includeTime && (
              <div className="space-y-3">
                <Label htmlFor={`time-${section.id}`} className="text-sm font-medium text-gray-700">
                  Time
                </Label>
                <Input
                  id={`time-${section.id}`}
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-white border-gray-300 text-gray-900"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="When would you like to schedule this?"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subheading */}
      <div className="text-center">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          variant="body"
          placeholder="Type sub heading here"
          className="text-xl text-gray-500 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Date & Time Inputs */}
      <div className="space-y-6 pt-6">
        {/* Date Input with Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`date-${section.id}`} className="text-sm font-medium text-gray-300">
              Date
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Include</span>
              <Switch
                checked={settings.includeDate}
                onCheckedChange={(checked) => handleSettingChange('includeDate', checked)}
                className="scale-75"
              />
            </div>
          </div>
          {settings.includeDate && (
            <Input
              id={`date-${section.id}`}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900"
            />
          )}
        </div>

        {/* Time Input with Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`time-${section.id}`} className="text-sm font-medium text-gray-300">
              Time
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Include</span>
              <Switch
                checked={settings.includeTime}
                onCheckedChange={(checked) => handleSettingChange('includeTime', checked)}
                className="scale-75"
              />
            </div>
          </div>
          {settings.includeTime && (
            <Input
              id={`time-${section.id}`}
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900"
            />
          )}
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 