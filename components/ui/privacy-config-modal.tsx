'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { X, Shield, Loader2 } from 'lucide-react'
import type { Campaign, Profile } from '@/lib/types/database'

interface PrivacyConfigModalProps {
  campaign: Campaign
  profile: Profile | null
  isOpen: boolean
  onClose: () => void
  onSave: (privacySettings: {
    organization_name: string
    privacy_contact_email: string
    organization_location: string
    privacy_policy_url?: string
  }) => void
}

export function PrivacyConfigModal({
  campaign,
  profile,
  isOpen,
  onClose,
  onSave
}: PrivacyConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    organization_name: '',
    privacy_contact_email: '',
    organization_location: '',
    privacy_policy_url: ''
  })

  // Initialize form with existing data or defaults
  useEffect(() => {
    if (isOpen) {
      const existingPrivacy = campaign.settings?.privacy
      
      setFormData({
        organization_name: existingPrivacy?.organization_name || profile?.company_name || '',
        privacy_contact_email: existingPrivacy?.privacy_contact_email || profile?.email || '',
        organization_location: existingPrivacy?.organization_location || '',
        privacy_policy_url: existingPrivacy?.privacy_policy_url || ''
      })
    }
  }, [isOpen, campaign.settings?.privacy, profile])

  const handleSave = async () => {
    // Validate required fields
    if (!formData.organization_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.privacy_contact_email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Privacy contact email is required.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.organization_location.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization location is required.',
        variant: 'destructive',
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.privacy_contact_email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      })
      return
    }

    // Validate privacy policy URL if provided
    if (formData.privacy_policy_url.trim()) {
      try {
        new URL(formData.privacy_policy_url.trim())
      } catch {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid privacy policy URL.',
          variant: 'destructive',
        })
        return
      }
    }

    setIsLoading(true)
    try {
      const privacySettings = {
        organization_name: formData.organization_name.trim(),
        privacy_contact_email: formData.privacy_contact_email.trim(),
        organization_location: formData.organization_location.trim(),
        privacy_policy_url: formData.privacy_policy_url.trim() || undefined
      }

      await onSave(privacySettings)
      
      toast({
        title: 'Privacy Details Saved',
        description: 'Your privacy configuration has been updated successfully.',
      })

      onClose()
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save privacy settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Tool Privacy & Preferences</h2>
                <p className="text-sm text-gray-600">
                  We'll add this to your tool's built-in privacy notice so your users know how their data is handled.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organization_name" className="text-sm font-medium">
                Who's running this tool? <span className="text-red-500">(required)</span>
              </Label>
              <p className="text-xs text-gray-500">
                Enter your company or organisation name.
              </p>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => handleInputChange('organization_name', e.target.value)}
                placeholder='e.g. "ABC Solutions Limited"'
                className="w-full"
              />
            </div>

            {/* Privacy Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="privacy_contact_email" className="text-sm font-medium">
                Contact for privacy questions <span className="text-red-500">(required)</span>
              </Label>
              <p className="text-xs text-gray-500">
                Where can people reach you about their data?
              </p>
              <Input
                id="privacy_contact_email"
                type="email"
                value={formData.privacy_contact_email}
                onChange={(e) => handleInputChange('privacy_contact_email', e.target.value)}
                placeholder='e.g. "contact@abc-solutions.io"'
                className="w-full"
              />
            </div>

            {/* Organization Location */}
            <div className="space-y-2">
              <Label htmlFor="organization_location" className="text-sm font-medium">
                Where are you based? <span className="text-red-500">(required)</span>
              </Label>
              <Input
                id="organization_location"
                value={formData.organization_location}
                onChange={(e) => handleInputChange('organization_location', e.target.value)}
                placeholder='e.g. "United Kingdom"'
                className="w-full"
              />
            </div>

            {/* Privacy Policy URL */}
            <div className="space-y-2">
              <Label htmlFor="privacy_policy_url" className="text-sm font-medium">
                Link to your privacy policy <span className="text-gray-500">(recommended)</span>
              </Label>
              <p className="text-xs text-gray-500">
                Shown with your marketing opt-in text.
              </p>
              <Input
                id="privacy_policy_url"
                type="url"
                value={formData.privacy_policy_url}
                onChange={(e) => handleInputChange('privacy_policy_url', e.target.value)}
                placeholder='e.g. "www.abc-solutions.io/privacy-policy"'
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
