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
  headline?: string
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
    headline = '',
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
  const handleHeadlineChange = async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
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
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        {/* Question Text */}
        <div className="pt-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {headline || 'Select a date and time'}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h1>
          
          {subheading && (
            <div className="pt-4">
              <p className="text-xl text-gray-600">
                {subheading}
              </p>
            </div>
          )}
        </div>

        {/* Date & Time Inputs - Only show if enabled */}
        <div className="pt-6 space-y-6">
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
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="pt-8">
        <InlineEditableText
          value={headline}
          onSave={handleHeadlineChange}
          placeholder="When would you like to schedule this?"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Pick a date and time that works for you"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Configuration Options */}
      <div className="pt-6">
        {/* Date & Time Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Date & Time Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Date</span>
              </div>
              <Switch
                checked={settings.includeDate}
                onCheckedChange={(checked) => handleSettingChange('includeDate', checked)}
                className="scale-75"
              />
        </div>

            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Time</span>
              </div>
              <Switch
                checked={settings.includeTime}
                onCheckedChange={(checked) => handleSettingChange('includeTime', checked)}
                className="scale-75"
              />
            </div>
          </div>
        </div>


      </div>


    </div>
  )
} 