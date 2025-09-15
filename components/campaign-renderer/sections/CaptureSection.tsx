'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle, Target, Zap, Clock, User, Mail, Phone, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, isValidEmail, getCampaignTheme, getCampaignTextColor } from '../utils'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

// =============================================================================
// CAPTURE SECTION COMPONENT
// =============================================================================

// Capture settings interface (matches builder component)
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
  businessName?: string
  privacyPolicyLink?: string
}

// Validation functions (use existing utils for email)
// Email validation is handled by isValidEmail from utils

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
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  onResponseUpdate,
  userInputs,
  campaign
}: SectionRendererProps) {
  // Get current settings with defaults - data is stored in section.configuration (which comes as config prop)
  const configData = config as any
  
  const settings: CaptureSettings = {
    headline: title || 'Get Your Results',
    subheading: description || 'Enter your information to unlock your personalized results',
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
      phone: configData.fieldPlaceholders?.phone ?? '+61 400 000 000 or 0400 000 000'
    },
    submitButtonText: configData.submitButtonText || configData.buttonText || config.buttonLabel || 'Unlock Results',
    businessName: configData.businessName || '',
    privacyPolicyLink: configData.privacyPolicyLink || ''
  }

  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')

  // Initialize form data with existing responses if available
  const existingData = userInputs?.[section.id] || {}
  
  // Default marketing consent to false - users must explicitly opt in
  const defaultMarketingConsent = existingData.marketingConsent === undefined ? false : (existingData.marketingConsent || false)
  
  const [formData, setFormData] = useState<{
    name?: string
    email?: string
    phone?: string
    marketingConsent?: boolean
  }>({
    name: existingData.name || '',
    email: existingData.email || '',
    phone: existingData.phone || '',
    marketingConsent: defaultMarketingConsent,
  })
  
  const [errors, setErrors] = useState<{ 
    name?: string
    email?: string
    phone?: string
  }>({})

  // Refs for auto-focus
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

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
        newErrors.phone = 'Please enter a valid phone number (include country code for international numbers)'
      }
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
      
      responseData.marketingConsent = formData.marketingConsent

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
    


    return isValid
  }
  
  // Auto-focus the first enabled field when component mounts (only once)
  useEffect(() => {
    // Focus on the first enabled field in order: name, email, phone
    let inputToFocus: HTMLInputElement | null = null
    
    if (settings.enabledFields?.name && nameInputRef.current) {
      inputToFocus = nameInputRef.current
    } else if (settings.enabledFields?.email && emailInputRef.current) {
      inputToFocus = emailInputRef.current
    } else if (settings.enabledFields?.phone && phoneInputRef.current) {
      inputToFocus = phoneInputRef.current
    }
    
    if (inputToFocus) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        inputToFocus?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, []) // Empty dependency array - only run once on mount

  // Generate validation text for bottom bar
  const getValidationText = () => {
    if (!isFormValid()) {
      return 'Please fill in all required fields'
    }
    
    return undefined
  }

    return (
    <div className="h-full flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 
              className={cn(
                "font-black tracking-tight leading-tight",
                deviceInfo?.type === 'mobile' ? "text-4xl" : "text-5xl lg:text-6xl"
              )}
              style={primaryTextStyle}
            >
              {settings.headline}
            </h1>
            
            <p 
              className={cn(
                "font-medium leading-relaxed max-w-2xl mx-auto",
                deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl lg:text-2xl"
              )}
              style={mutedTextStyle}
            >
              {settings.subheading}
            </p>
          </div>
          
          {/* Form */}
          <div className="space-y-8">
            {/* Name Field */}
            {settings.enabledFields?.name && (
              <div className="space-y-4">
                <Label htmlFor="name" className="text-base font-semibold" style={primaryTextStyle}>
                  {settings.fieldLabels?.name}
                  {settings.requiredFields?.name && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder={settings.fieldPlaceholders?.name}
                    className={cn(
                      "h-14 text-lg backdrop-blur-md border-0 rounded-2xl transition-all duration-300 ease-out",
                      "focus:ring-2 focus:ring-opacity-50 focus:outline-none shadow-lg hover:shadow-xl",
                      "placeholder:text-opacity-60",
                      errors.name 
                        ? "ring-2 ring-red-500 ring-opacity-50" 
                        : "hover:shadow-2xl focus:shadow-2xl"
                    )}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid rgba(255, 255, 255, 0.2)`,
                      color: theme.textColor,
                      boxShadow: errors.name 
                        ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium text-sm">{errors.name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            {settings.enabledFields?.email && (
              <div className="space-y-4">
                <Label htmlFor="email" className="text-base font-semibold" style={primaryTextStyle}>
                  {settings.fieldLabels?.email}
                  {settings.requiredFields?.email && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder={settings.fieldPlaceholders?.email}
                    className={cn(
                      "h-14 text-lg backdrop-blur-md border-0 rounded-2xl transition-all duration-300 ease-out",
                      "focus:ring-2 focus:ring-opacity-50 focus:outline-none shadow-lg hover:shadow-xl",
                      "placeholder:text-opacity-60",
                      errors.email 
                        ? "ring-2 ring-red-500 ring-opacity-50" 
                        : "hover:shadow-2xl focus:shadow-2xl"
                    )}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid rgba(255, 255, 255, 0.2)`,
                      color: theme.textColor,
                      boxShadow: errors.email 
                        ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium text-sm">{errors.email}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phone Field */}
            {settings.enabledFields?.phone && (
              <div className="space-y-4">
                <Label htmlFor="phone" className="text-base font-semibold" style={primaryTextStyle}>
                  {settings.fieldLabels?.phone}
                  {settings.requiredFields?.phone && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder={settings.fieldPlaceholders?.phone}
                    className={cn(
                      "h-14 text-lg backdrop-blur-md border-0 rounded-2xl transition-all duration-300 ease-out",
                      "focus:ring-2 focus:ring-opacity-50 focus:outline-none shadow-lg hover:shadow-xl",
                      "placeholder:text-opacity-60",
                      errors.phone 
                        ? "ring-2 ring-red-500 ring-opacity-50" 
                        : "hover:shadow-2xl focus:shadow-2xl"
                    )}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid rgba(255, 255, 255, 0.2)`,
                      color: theme.textColor,
                      boxShadow: errors.phone 
                        ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
                {errors.phone && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium text-sm">{errors.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              {/* Marketing Consent - Only show if at least one contact field is enabled */}
              {(settings.enabledFields?.name || settings.enabledFields?.email || settings.enabledFields?.phone) && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={formData.marketingConsent || false}
                    onCheckedChange={(checked) => handleFieldChange('marketingConsent', !!checked)}
                    className="mt-1"
                  />
                  <label htmlFor="marketing-consent" className="text-sm leading-relaxed cursor-pointer" style={primaryTextStyle}>
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



          </div>
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<User className="h-5 w-5 text-primary" />}
        label="Contact"
        validationText={getValidationText()}
        navigationHints={{
          text: deviceInfo?.type === 'mobile' 
            ? "Fill in required fields • Tap Continue to proceed" 
            : "Fill in required fields • Tab to navigate • Enter to continue • ← → to navigate • Esc to go back"
        }}
        actionButton={{
          label: settings.submitButtonText || 'Unlock Results',
          onClick: handleContinue,
          disabled: !isFormValid()
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 