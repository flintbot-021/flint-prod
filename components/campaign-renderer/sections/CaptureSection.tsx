'use client'

import React, { useState } from 'react'
import { CheckCircle, Target, Zap, Clock, User, Mail, Phone, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, isValidEmail } from '../utils'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SectionNavigationBar } from '../SectionNavigationBar'

// =============================================================================
// CAPTURE SECTION COMPONENT
// =============================================================================

// Capture settings interface (matches builder component)
interface CaptureSettings {
  content?: string
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
  gdprConsent?: boolean
  marketingConsent?: boolean
}

// Validation functions (use existing utils for email)
// Email validation is handled by isValidEmail from utils

const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  const internationalRegex = /^\+[1-9]\d{6,14}$/
  const usRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/
  return internationalRegex.test(cleanPhone) || usRegex.test(cleanPhone)
}

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'.]+$/
  return nameRegex.test(name.trim()) && name.trim().length >= 2
}

export function CaptureSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  onResponseUpdate
}: SectionRendererProps) {
  // Get current settings with defaults
  const configData = config as any
  const settings: CaptureSettings = {
    content: configData.content || title || 'Get Your Personalized Results',
    subheading: configData.subheading || description || 'Enter your information to unlock AI-powered personalized insights.',
    enabledFields: {
      name: configData.enabledFields?.name ?? true,
      email: configData.enabledFields?.email ?? true,
      phone: configData.enabledFields?.phone ?? false
    },
    requiredFields: {
      name: configData.requiredFields?.name ?? true,
      email: configData.requiredFields?.email ?? true,
      phone: configData.requiredFields?.phone ?? false
    },
    fieldLabels: {
      name: configData.fieldLabels?.name ?? 'Full Name',
      email: configData.fieldLabels?.email ?? 'Email Address',
      phone: configData.fieldLabels?.phone ?? 'Phone Number'
    },
    fieldPlaceholders: {
      name: configData.fieldPlaceholders?.name ?? 'Enter your full name',
      email: configData.fieldPlaceholders?.email ?? 'your@email.com',
      phone: configData.fieldPlaceholders?.phone ?? 'Enter your phone number'
    },
    submitButtonText: configData.submitButtonText || configData.buttonText || config.buttonLabel || 'Generate My Results',
    gdprConsent: configData.gdprConsent ?? false,
    marketingConsent: configData.marketingConsent ?? false
  }

  // Dynamic form data based on enabled fields
  const [formData, setFormData] = useState<{
    name?: string
    email?: string
    phone?: string
    gdprConsent?: boolean
    marketingConsent?: boolean
  }>({})
  
  const [errors, setErrors] = useState<{ 
    name?: string
    email?: string
    phone?: string
    gdprConsent?: string
  }>({})

  // Handle form field changes
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Real-time response collection
    if (typeof value === 'string' && value.trim()) {
      onResponseUpdate(section.id, field, value, {
        inputType: field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text',
        isRequired: settings.requiredFields?.[field as keyof typeof settings.requiredFields] || false
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Validate name
    if (settings.enabledFields?.name && settings.requiredFields?.name) {
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      } else if (!validateName(formData.name)) {
        newErrors.name = 'Please enter a valid name'
      }
    }

    // Validate email
    if (settings.enabledFields?.email && settings.requiredFields?.email) {
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required'
      } else if (!isValidEmail(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Validate phone
    if (settings.enabledFields?.phone && settings.requiredFields?.phone) {
      if (!formData.phone?.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // Validate GDPR consent
    if (settings.gdprConsent && !formData.gdprConsent) {
      newErrors.gdprConsent = 'You must accept the privacy policy to continue'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (validateForm()) {
      // Prepare response data with only enabled fields
      const responseData: any = {}
      
      if (settings.enabledFields?.name && formData.name?.trim()) {
        responseData.name = formData.name.trim()
      }
      
      if (settings.enabledFields?.email && formData.email?.trim()) {
        responseData.email = formData.email.trim()
      }
      
      if (settings.enabledFields?.phone && formData.phone?.trim()) {
        responseData.phone = formData.phone.trim()
      }
      
      if (settings.gdprConsent) {
        responseData.gdprConsent = formData.gdprConsent
      }
      
      if (settings.marketingConsent) {
        responseData.marketingConsent = formData.marketingConsent
      }

      onSectionComplete(index, {
        ...responseData,
        [section.id]: responseData
      })
    }
  }

  // Handle continue action for navigation bar
  const handleContinue = () => {
    handleSubmit()
  }

  // Check if form is valid
  const isFormValid = () => {
    let isValid = true
    
    // Check required fields
    if (settings.enabledFields?.name && settings.requiredFields?.name && !formData.name?.trim()) {
      isValid = false
    }
    
    if (settings.enabledFields?.email && settings.requiredFields?.email) {
      if (!formData.email?.trim() || !isValidEmail(formData.email)) {
        isValid = false
      }
    }
    
    if (settings.enabledFields?.phone && settings.requiredFields?.phone) {
      if (!formData.phone?.trim() || !validatePhone(formData.phone)) {
        isValid = false
      }
    }
    
    if (settings.gdprConsent && !formData.gdprConsent) {
      isValid = false
    }
    
    return isValid
  }
  
  // Generate validation text for bottom bar
  const getValidationText = () => {
    if (!isFormValid()) {
      return 'Please fill in all required fields'
    }
    
    return undefined
  }

    return (
    <div className="h-full bg-background flex flex-col pb-20">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {settings.content}
            </h1>
            
            <p className={cn(
              "text-muted-foreground",
              deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
            )}>
              {settings.subheading}
            </p>
          </div>
          
          {/* Form */}
          <div className="space-y-6">
            {/* Name Field */}
            {settings.enabledFields?.name && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  {settings.fieldLabels?.name}
                  {settings.requiredFields?.name && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={settings.fieldPlaceholders?.name}
                  className={cn(
                    "h-12 text-base bg-background border-input",
                    errors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.name && (
                  <div className="flex items-center space-x-1 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            {settings.enabledFields?.email && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {settings.fieldLabels?.email}
                  {settings.requiredFields?.email && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder={settings.fieldPlaceholders?.email}
                  className={cn(
                    "h-12 text-base bg-background border-input",
                    errors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.email && (
                  <div className="flex items-center space-x-1 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Phone Field */}
            {settings.enabledFields?.phone && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  {settings.fieldLabels?.phone}
                  {settings.requiredFields?.phone && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder={settings.fieldPlaceholders?.phone}
                  className={cn(
                    "h-12 text-base bg-background border-input",
                    errors.phone && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.phone && (
                  <div className="flex items-center space-x-1 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Consent Checkboxes */}
            {(settings.gdprConsent || settings.marketingConsent) && (
              <div className="space-y-3 pt-2">
                {settings.gdprConsent && (
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="gdpr-consent"
                      checked={formData.gdprConsent || false}
                      onCheckedChange={(checked) => handleFieldChange('gdprConsent', checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="gdpr-consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                      I agree to the privacy policy and terms of service
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                )}
                
                {settings.marketingConsent && (
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="marketing-consent"
                      checked={formData.marketingConsent || false}
                      onCheckedChange={(checked) => handleFieldChange('marketingConsent', checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="marketing-consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                      I would like to receive marketing emails and updates
                    </Label>
                  </div>
                )}
              </div>
            )}

            {errors.gdprConsent && (
              <div className="flex items-center space-x-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.gdprConsent}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<User className="h-5 w-5 text-primary" />}
        label="Contact"
        validationText={getValidationText()}
        actionButton={{
          label: settings.submitButtonText || 'Generate My Results',
          onClick: handleContinue,
          disabled: !isFormValid()
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 