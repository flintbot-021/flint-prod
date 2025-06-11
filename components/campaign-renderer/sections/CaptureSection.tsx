'use client'

import React, { useState } from 'react'
import { CheckCircle, Brain, Target, Zap, Clock, User, Mail } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, isValidEmail } from '../utils'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionNavigationBar } from '../SectionNavigationBar'

// =============================================================================
// CAPTURE SECTION COMPONENT
// =============================================================================

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
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  // Handle form field changes
  const handleFieldChange = (field: 'name' | 'email', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Real-time response collection
    onResponseUpdate(section.id, field, value, {
      inputType: field === 'email' ? 'email' : 'text',
      isRequired: true
    })
  }

  // Validate form
  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (validateForm()) {
      onSectionComplete(index, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        [section.id]: {
          name: formData.name.trim(),
          email: formData.email.trim()
        }
      })
    }
  }

  // Handle continue action for navigation bar
  const handleContinue = () => {
    handleSubmit()
  }

  // Get configuration
  const configData = config as any
  const question = configData.content || title || 'Get Your Personalized Results'
  const subheading = configData.subheading || description || 'Enter your information to unlock AI-powered personalized insights.'
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Generate My Results'

  const isFormValid = formData.name.trim() && formData.email.trim() && isValidEmail(formData.email)
  
  // Generate validation text for bottom bar
  const validationText = (!formData.name.trim() || !formData.email.trim() || !isValidEmail(formData.email)) 
    ? 'Please fill in all required fields' 
    : undefined

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
              {question}
            </h1>
            
            <p className={cn(
              "text-muted-foreground",
              deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
            )}>
              {subheading}
            </p>
          </div>

          {/* Preview of what happens next */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Brain className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium text-foreground">What happens next:</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>AI analyzes your responses</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span>Personalized insights generated</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Custom results delivered</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  "h-12 text-base",
                  errors.name && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="your@email.com"
                className={cn(
                  "h-12 text-base",
                  errors.email && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Trust signals */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-primary mr-1" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-purple-500 mr-1" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<User className="h-5 w-5 text-primary" />}
        label={`Contact ${index + 1}`}
        validationText={validationText}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !isFormValid
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 