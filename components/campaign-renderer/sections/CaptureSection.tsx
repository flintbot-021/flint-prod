'use client'

import React, { useState } from 'react'
import { CheckCircle, Brain, Target, Zap, Clock } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, isValidEmail } from '../utils'
import { cn } from '@/lib/utils'

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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

  const isFormValid = formData.name.trim() && formData.email.trim() && isValidEmail(formData.email)

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Main Heading */}
          <div className="text-center">
            <h1 className={cn(
              "font-bold text-gray-900 mb-4",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-4xl"
            )}>
              {title || config.content || 'Get Your Personalized Results'}
            </h1>
          </div>

          {/* Subheading */}
          <div className="text-center">
            <p className={cn(
              "text-gray-600",
              deviceInfo?.type === 'mobile' ? "text-base px-4" : "text-xl"
            )}>
              {description || config.subheading || 'Enter your information to unlock AI-powered personalized insights.'}
            </p>
          </div>

          {/* Preview of what happens next */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">What happens next:</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>AI analyzes your responses</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  <span>Personalized insights generated</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span>Custom results delivered</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.name ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="your@email.com"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.email ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={cn(
                "w-full px-6 py-3 rounded-lg font-medium text-lg transition-colors mt-6",
                getMobileClasses("", deviceInfo?.type),
                isFormValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              🚀 Generate My Results
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-blue-600 mr-1" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-purple-600 mr-1" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 