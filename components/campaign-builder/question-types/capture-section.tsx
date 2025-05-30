'use client'

import React, { useState, useEffect } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Loader2, Mail, Phone, User, Users } from 'lucide-react'
import { useInlineEdit } from '@/hooks/use-inline-edit'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { useCaptureSubmission, type CaptureFormData } from '@/hooks/use-capture-submission'
import { useCapture } from '@/contexts/capture-context'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CaptureFieldConfig {
  name: string
  email: string
  phone: string
}

export interface CaptureSettings {
  title: string
  subheading: string
  enabledFields: {
    name: boolean
    email: boolean
    phone: boolean
  }
  requiredFields: {
    name: boolean
    email: boolean
    phone: boolean
  }
  fieldLabels: CaptureFieldConfig
  fieldPlaceholders: CaptureFieldConfig
  submitButtonText: string
  gdprConsent: boolean
  marketingConsent: boolean
}

export interface CaptureValidationErrors {
  name?: string
  email?: string
  phone?: string
  gdprConsent?: string
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters except + for international numbers
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  
  // Check for valid international format or US format
  const internationalRegex = /^\+[1-9]\d{6,14}$/
  const usRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/
  
  return internationalRegex.test(cleanPhone) || usRegex.test(cleanPhone)
}

const validateName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, apostrophes, and periods
  const nameRegex = /^[a-zA-Z\s\-'.]+$/
  return nameRegex.test(name.trim()) && name.trim().length >= 2
}

const validateCaptureForm = (
  data: CaptureFormData,
  settings: CaptureSettings
): CaptureValidationErrors => {
  const errors: CaptureValidationErrors = {}

  // Validate name field
  if (settings.enabledFields.name && settings.requiredFields.name) {
    if (!data.name?.trim()) {
      errors.name = 'Name is required'
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters'
    } else if (!validateName(data.name)) {
      errors.name = 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)'
    }
  }

  // Validate email field
  if (settings.enabledFields.email && settings.requiredFields.email) {
    if (!data.email?.trim()) {
      errors.email = 'Email is required'
    } else if (data.email.trim().length > 254) {
      errors.email = 'Email address is too long'
    } else if (!validateEmail(data.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }
  }

  // Validate phone field
  if (settings.enabledFields.phone && settings.requiredFields.phone) {
    if (!data.phone?.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!validatePhone(data.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g., +1 555-123-4567 or 555-123-4567)'
    }
  }

  // Validate GDPR consent if enabled
  if (settings.gdprConsent && !data.gdprConsent) {
    errors.gdprConsent = 'You must accept the privacy policy to continue'
  }

  return errors
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface CaptureSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  campaignId?: string
  onLeadCaptured?: (leadId: string) => void
}

export function CaptureSection({
  section,
  isPreview = false,
  onUpdate,
  className,
  campaignId,
  onLeadCaptured
}: CaptureSectionProps) {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const settings = (section.settings as unknown) as CaptureSettings
  const [formData, setFormData] = useState<CaptureFormData>({})
  const [validationErrors, setValidationErrors] = useState<CaptureValidationErrors>({})

  // =============================================================================
  // CAPTURE SUBMISSION HOOK
  // =============================================================================

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

  // =============================================================================
  // INLINE EDITING HOOKS
  // =============================================================================

  const titleEdit = useInlineEdit(settings.title || 'Get Your Results', {
    onSave: async (value: string) => {
      await onUpdate({
        settings: { ...settings, title: value }
      })
    }
  })

  const subheadingEdit = useInlineEdit(settings.subheading || 'Enter your information to unlock your personalized results', {
    onSave: async (value: string) => {
      await onUpdate({
        settings: { ...settings, subheading: value }
      })
    }
  })

  const submitButtonEdit = useInlineEdit(settings.submitButtonText || 'Get My Results', {
    onSave: async (value: string) => {
      await onUpdate({
        settings: { ...settings, submitButtonText: value }
      })
    }
  })

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateCaptureForm(formData, settings)
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors and attempt submission
    setValidationErrors({})
    await submitCapture(formData)
  }

  const handleFieldChange = (field: keyof CaptureFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof CaptureValidationErrors]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field as keyof CaptureValidationErrors]
        return updated
      })
    }
  }

  const updateFieldSettings = async (field: string, updates: Partial<CaptureSettings>) => {
    await onUpdate({
      settings: { ...settings, ...updates }
    })
  }

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderFieldCheckbox = (field: 'name' | 'email' | 'phone', icon: React.ComponentType<{ className?: string }>, label: string) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <div className="flex items-center space-x-2">
        {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
        <span className="text-sm font-medium">{label}</span>
      </div>
      
      <div className="flex items-center space-x-4 ml-auto">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`enable-${field}`}
            checked={settings.enabledFields[field]}
            onCheckedChange={(checked) => {
              updateFieldSettings(field, {
                enabledFields: { ...settings.enabledFields, [field]: checked }
              })
            }}
          />
          <Label htmlFor={`enable-${field}`} className="text-xs text-muted-foreground">
            Enabled
          </Label>
        </div>
        
        {settings.enabledFields[field] && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`require-${field}`}
              checked={settings.requiredFields[field]}
              onCheckedChange={(checked) => {
                updateFieldSettings(field, {
                  requiredFields: { ...settings.requiredFields, [field]: checked }
                })
              }}
            />
            <Label htmlFor={`require-${field}`} className="text-xs text-muted-foreground">
              Required
            </Label>
          </div>
        )}
      </div>
    </div>
  )

  const renderFormField = (field: 'name' | 'email' | 'phone', icon: React.ComponentType<{ className?: string }>) => {
    if (!settings.enabledFields[field]) return null

    const hasError = validationErrors[field]

    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="text-sm font-medium">
          {settings.fieldLabels[field]}
          {settings.requiredFields[field] && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {React.createElement(icon, { className: "h-4 w-4 text-gray-400" })}
          </div>
          
          <Input
            id={field}
            type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
            placeholder={settings.fieldPlaceholders[field]}
            value={formData[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(
              "pl-10",
              hasError && "border-red-500 focus:border-red-500"
            )}
            required={settings.requiredFields[field]}
          />
        </div>
        
        {hasError && (
          <div className="flex items-center space-x-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{hasError}</span>
          </div>
        )}
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isPreview) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl font-bold">{settings.title}</CardTitle>
          <p className="text-muted-foreground text-sm">{settings.subheading}</p>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">Thank you!</h3>
                <p className="text-sm text-green-600">Your information has been saved.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormField('name', User)}
              {renderFormField('email', Mail)}
              {renderFormField('phone', Phone)}
              
              {(settings.gdprConsent || settings.marketingConsent) && (
                <div className="space-y-3 pt-2">
                  {settings.gdprConsent && (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="gdpr-consent"
                        checked={formData.gdprConsent || false}
                        onCheckedChange={(checked) => handleFieldChange('gdprConsent', checked)}
                      />
                      <Label htmlFor="gdpr-consent" className="text-xs text-muted-foreground leading-relaxed">
                        I agree to the privacy policy and terms of service *
                      </Label>
                    </div>
                  )}
                  
                  {settings.marketingConsent && (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketing-consent"
                        checked={formData.marketingConsent || false}
                        onCheckedChange={(checked) => handleFieldChange('marketingConsent', checked)}
                      />
                      <Label htmlFor="marketing-consent" className="text-xs text-muted-foreground leading-relaxed">
                        I would like to receive marketing emails and updates
                      </Label>
                    </div>
                  )}
                </div>
              )}
              
              {validationErrors.gdprConsent && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{validationErrors.gdprConsent}</span>
                </div>
              )}
              
              {submitError && (
                <div className="flex items-center space-x-1 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{submitError}</span>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {settings.submitButtonText}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    )
  }

  // Edit Mode
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-green-600" />
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Lead Capture
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-foreground">Title</Label>
            <InlineEditableText
              value={titleEdit.value}
              onSave={titleEdit.save}
              placeholder="Enter section title..."
              className="text-lg font-semibold"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-foreground">Subheading</Label>
            <InlineEditableText
              value={subheadingEdit.value}
              onSave={subheadingEdit.save}
              placeholder="Enter section subheading..."
              className="text-muted-foreground"
              multiline={true}
            />
          </div>
        </div>
      </div>

      {/* Field Configuration */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Form Fields</Label>
        <div className="space-y-3">
          {renderFieldCheckbox('name', User, 'Name')}
          {renderFieldCheckbox('email', Mail, 'Email')}
          {renderFieldCheckbox('phone', Phone, 'Phone')}
        </div>
      </div>

      {/* Submit Button Configuration */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Submit Button Text</Label>
        <InlineEditableText
          value={submitButtonEdit.value}
          onSave={submitButtonEdit.save}
          placeholder="Get My Results"
          className="font-medium"
        />
      </div>

      {/* Consent Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Consent Options</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gdpr-consent-toggle"
              checked={settings.gdprConsent}
              onCheckedChange={(checked) => {
                updateFieldSettings('gdpr', { gdprConsent: checked === true })
              }}
            />
            <Label htmlFor="gdpr-consent-toggle" className="text-sm">
              Require GDPR consent checkbox
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="marketing-consent-toggle"
              checked={settings.marketingConsent}
              onCheckedChange={(checked) => {
                updateFieldSettings('marketing', { marketingConsent: checked === true })
              }}
            />
            <Label htmlFor="marketing-consent-toggle" className="text-sm">
              Show marketing consent checkbox
            </Label>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-medium text-foreground mb-3 block">Preview</Label>
        <div className="scale-90 origin-top-left">
          <CaptureSection
            section={section}
            isPreview={true}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default CaptureSection 