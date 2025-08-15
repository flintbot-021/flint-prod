'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { User, Mail, Phone, AlertCircle, Check, Loader2 } from 'lucide-react'
import { useCaptureSubmission, type CaptureFormData } from '@/hooks/use-capture-submission'
import { useCapture } from '@/contexts/capture-context'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

interface CaptureSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  campaignId?: string
  onLeadCaptured?: (leadId: string) => void
  campaign?: any
}

interface CaptureSettings {
  headline?: string
  subheading?: string
  enabledFields?: {
    name: boolean
    email: boolean
    phone: boolean
  }
  requiredFields?: {
    name: boolean
    email: boolean
    phone: boolean
  }
  fieldLabels?: {
    name: string
    email: string
    phone: string
  }
  fieldPlaceholders?: {
    name: string
    email: string
    phone: string
  }
  submitButtonText?: string
  // For backward compatibility
  content?: string
  title?: string
}

interface CaptureValidationErrors {
  name?: string
  email?: string
  phone?: string
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return false
  
  try {
    // Try parsing with common regions (AU, GB, US)
    const regions = ['AU', 'GB', 'US'] as const
    
    for (const region of regions) {
      try {
        const phoneNumber = parsePhoneNumber(phone, region)
        if (phoneNumber && phoneNumber.isValid()) {
          return true
        }
      } catch {
        // Continue to next region
      }
    }
    
    // Try parsing as E.164 format (international with +)
    if (phone.startsWith('+')) {
      return isValidPhoneNumber(phone)
    }
    
    return false
  } catch {
    return false
  }
}

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'.]+$/
  return nameRegex.test(name.trim()) && name.trim().length >= 2
}

export function CaptureSection({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className,
  campaignId,
  onLeadCaptured,
  campaign
}: CaptureSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as CaptureSettings || {}
  const headline = (settings.headline || settings.content || settings.title || 'Get Your Results') as string
  const subheading = (settings.subheading || 'Enter your information to unlock your personalized results') as string
  const enabledFields = settings.enabledFields || { name: true, email: true, phone: false }
  
  // Default marketing consent to true if any contact fields are enabled
  const defaultMarketingConsent = (enabledFields.name || enabledFields.email || enabledFields.phone)
  
  const [formData, setFormData] = useState<CaptureFormData>({
    marketingConsent: defaultMarketingConsent
  })
  const [validationErrors, setValidationErrors] = useState<CaptureValidationErrors>({})
  const requiredFields = settings.requiredFields || { name: true, email: true, phone: false }
  const fieldLabels = settings.fieldLabels || { name: 'Full Name', email: 'Email Address', phone: 'Phone Number' }
  const fieldPlaceholders = settings.fieldPlaceholders || { name: 'Enter your full name', email: 'your@email.com', phone: '+61 400 000 000 or 0400 000 000' }
  const submitButtonText = settings.submitButtonText || 'Get my results'



  // Capture hooks
  const { markCaptureCompleted, setCaptureRequired } = useCapture()
  
  const {
    submitCapture,
    isSubmitting,
    isSubmitted,
    submitError,
    resetSubmission
  } = useCaptureSubmission({
    campaignId: campaignId || '',
    onSuccess: (lead) => {
      console.log('Lead captured successfully:', lead.id)
      markCaptureCompleted(lead.id)
      onLeadCaptured?.(lead.id)
    },
    onError: (error) => {
      console.error('Failed to capture lead:', error)
    }
  })

  // Set capture as required when component mounts (only in preview mode)
  useEffect(() => {
    if (isPreview) {
      setCaptureRequired(true)
    }
  }, [isPreview, setCaptureRequired])

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<CaptureSettings>) => {
    setIsSaving(true)
    try {
      // Always save as headline/subheading
      const mappedSettings = { ...settings, ...newSettings }
      if ('content' in mappedSettings) mappedSettings.headline = mappedSettings.content
      if ('title' in mappedSettings) mappedSettings.headline = mappedSettings.title
      delete mappedSettings.content
      delete mappedSettings.title
      await onUpdate({
        settings: mappedSettings
      })
    } catch (error) {
      console.error('Failed to update capture settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Save default headline and subheading if they're empty (only in edit mode)
  useEffect(() => {
    if (!isPreview) {
      const currentSettings = section.settings as CaptureSettings || {}
      const needsUpdate = !currentSettings.headline || !currentSettings.subheading
      
      if (needsUpdate) {
        updateSettings({
          headline: currentSettings.headline || currentSettings.content || currentSettings.title || 'Get Your Results',
          subheading: currentSettings.subheading || 'Enter your information to unlock your personalized results'
        }).catch(error => {
          console.error('Failed to save default headline/subheading:', error)
        })
      }
    }
  }, [isPreview, section.settings, updateSettings])

  // Handle headline change
  const handleHeadlineChange = async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
  }

  // Handle subheading change
  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Handle field settings change
  const handleFieldSettingChange = async (field: 'name' | 'email' | 'phone', setting: 'enabled' | 'required', value: boolean) => {
    if (setting === 'enabled') {
      await updateSettings({ 
        enabledFields: { ...enabledFields, [field]: value }
      })
    } else {
      await updateSettings({ 
        requiredFields: { ...requiredFields, [field]: value }
      })
    }
  }

  // Handle form field change
  const handleFieldChange = (field: keyof CaptureFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof CaptureValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: CaptureValidationErrors = {}

    // Validate name
    if (enabledFields.name && requiredFields.name) {
      if (!formData.name?.trim()) {
        errors.name = 'Name is required'
      } else if (formData.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
      } else if (!validateName(formData.name)) {
        errors.name = 'Please enter a valid name'
      }
    }

    // Validate email
    if (enabledFields.email && requiredFields.email) {
      if (!formData.email?.trim()) {
        errors.email = 'Email is required'
      } else if (!validateEmail(formData.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Validate phone
    if (enabledFields.phone && requiredFields.phone) {
      if (!formData.phone?.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number (include country code for international numbers)'
      }
    }



    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Expose form submission to external trigger (for bottom bar button)
  useEffect(() => {
    if (isPreview) {
      const handleExternalSubmit = async () => {
        if (!validateForm()) {
          return
        }
        try {
          await submitCapture(formData)
        } catch (error) {
          console.error('Submission failed:', error)
        }
      }

      // Add event listener for external form submission
      const formElement = document.getElementById(`capture-form-${section.id}`)
      if (formElement) {
        const submitHandler = (e: Event) => {
          e.preventDefault()
          handleExternalSubmit()
        }
        formElement.addEventListener('submit', submitHandler)
        return () => formElement.removeEventListener('submit', submitHandler)
      }
    }
  }, [isPreview, section.id, formData, validateForm, submitCapture])

  if (isPreview) {
    // Preview Mode - Show capture form
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        {isSubmitted ? (
          // Success state
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Thank you!</h1>
              <p className="text-xl text-gray-600">Your information has been saved.</p>
            </div>
          </div>
        ) : (
          <form id={`capture-form-${section.id}`} className="space-y-6">
            {/* Question Text */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                {headline}
              </h1>
              
              {subheading && (
                <p className="text-xl text-gray-600">
                  {subheading}
                </p>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name Field */}
              {enabledFields.name && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    {fieldLabels.name}
                    {requiredFields.name && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder={fieldPlaceholders.name}
                    className={cn(
                      'w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      validationErrors.name && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {validationErrors.name && (
                    <div className="flex items-center space-x-1 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email Field */}
              {enabledFields.email && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    {fieldLabels.email}
                    {requiredFields.email && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder={fieldPlaceholders.email}
                    className={cn(
                      'w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      validationErrors.email && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {validationErrors.email && (
                    <div className="flex items-center space-x-1 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Phone Field */}
              {enabledFields.phone && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    {fieldLabels.phone}
                    {requiredFields.phone && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder={fieldPlaceholders.phone}
                    className={cn(
                      'w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      validationErrors.phone && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {validationErrors.phone && (
                    <div className="flex items-center space-x-1 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Consent Checkboxes */}
              <div className="space-y-3 pt-2">
                {/* Marketing Consent - Only show if at least one contact field is enabled */}
                {(enabledFields.name || enabledFields.email || enabledFields.phone) && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="marketing-consent"
                      checked={!!formData.marketingConsent}
                      onCheckedChange={(checked) => handleFieldChange('marketingConsent', !!checked)}
                      className="mt-1"
                    />
                    <label htmlFor="marketing-consent" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                      I agree to receive relevant marketing communications from {campaign?.settings?.privacy?.organization_name || 'this business'} in accordance with their{' '}
                      {campaign?.settings?.privacy?.privacy_policy_url ? (
                        <a href={campaign.settings.privacy.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="underline inline">
                          Privacy Policy
                        </a>
                      ) : (
                        <span className="inline">Privacy Policy</span>
                      )}.
                    </label>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="flex items-center space-x-2 text-red-400 text-sm p-3 bg-red-950/50 border border-red-800 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          </form>
        )}
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
          placeholder="Get Your Results"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Enter your information to unlock your personalized results"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Field Configuration */}
      <div className="pt-6">
        {/* Fields to Collect */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Fields to Collect</h3>
          <div className="space-y-4">
            {/* Name Field */}
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Name</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={enabledFields.name}
                    onCheckedChange={(checked) => handleFieldSettingChange('name', 'enabled', checked)}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">Enabled</span>
                </div>
                {enabledFields.name && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={requiredFields.name}
                      onCheckedChange={(checked) => handleFieldSettingChange('name', 'required', checked)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Email</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={enabledFields.email}
                    onCheckedChange={(checked) => handleFieldSettingChange('email', 'enabled', checked)}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">Enabled</span>
                </div>
                {enabledFields.email && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={requiredFields.email}
                      onCheckedChange={(checked) => handleFieldSettingChange('email', 'required', checked)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Phone</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={enabledFields.phone}
                    onCheckedChange={(checked) => handleFieldSettingChange('phone', 'enabled', checked)}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">Enabled</span>
                </div>
                {enabledFields.phone && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={requiredFields.phone}
                      onCheckedChange={(checked) => handleFieldSettingChange('phone', 'required', checked)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
} 