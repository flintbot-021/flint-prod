'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCampaign, createCampaignWithUsageTracking } from '@/lib/data-access'
import { Campaign, CampaignSettings, CreateCampaign } from '@/lib/types/database'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Building,
  Palette,
  Save,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Image
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface CampaignEditModalProps {
  campaign: Campaign | null // null for creation mode
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCampaign: Campaign) => void
  mode?: 'create' | 'edit' // NEW: controls modal behavior
  initialStep?: 'basic' | 'theme' // NEW: controls which step is shown on open
}

interface CampaignFormData {
  name: string
  description: string
  settings: CampaignSettings
}

type Step = 'basic' | 'theme'

const steps: { id: Step; title: string; description: string }[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Set up your campaign name and description'
  },
  {
    id: 'theme',
    title: 'Theme & Branding',
    description: 'Customize the look and feel of your campaign'
  }
]

export function CampaignEditModal({ campaign, isOpen, onClose, onSave, mode = 'edit', initialStep }: CampaignEditModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: campaign?.name || 'New Campaign',
    description: campaign?.description || '',
    settings: campaign?.settings || {
      theme: {
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        background_color: '#FFFFFF',
        font_family: 'Inter, sans-serif'
      },
      branding: {
        show_powered_by: true
      },
      completion: {
        email_notifications: true
      }
    }
  })
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when campaign changes
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        settings: campaign.settings || {
          theme: {
            primary_color: '#3B82F6',
            secondary_color: '#10B981',
            background_color: '#FFFFFF',
            font_family: 'Inter, sans-serif'
          },
          branding: {
            show_powered_by: true
          },
          completion: {
            email_notifications: true
          }
        }
      })
    } else {
      // Creation mode - reset to defaults
      setFormData({
        name: 'New Campaign',
        description: '',
        settings: {
          theme: {
            primary_color: '#3B82F6',
            secondary_color: '#10B981',
            background_color: '#FFFFFF',
            font_family: 'Inter, sans-serif'
          },
          branding: {
            show_powered_by: true
          },
          completion: {
            email_notifications: true
          }
        }
      })
    }
    
    // Reset other form state
    setCurrentStep('basic')
    setError(null)
    setLogoFile(null)
    setLogoPreview(null)
  }, [campaign, isOpen])

  // Set initial step based on mode/initialStep
  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep)
    } else if (mode === 'create') {
      setCurrentStep('basic')
    } else {
      setCurrentStep('theme')
    }
  }, [initialStep, mode])

  // Focus tool name input when modal opens in create mode
  useEffect(() => {
    if (mode === 'create' && isOpen && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [mode, isOpen])

  const updateFormData = (updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateSettings = (updates: Partial<CampaignSettings>) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }))
  }

  // Only show steps based on mode
  const visibleSteps = mode === 'create' ? [steps[0]] : [steps[1]]
  const getCurrentStepIndex = () => 0 // Only one step in either mode

  // Navigation logic: no next/prev in single-step mode
  const canProceedToNextStep = () => true
  const goToNextStep = () => {}
  const goToPreviousStep = () => {}

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, etc.)',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      })
      return
    }

    setLogoFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    setLogoFile(null)
    setLogoPreview(null)
    // Clear the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const uploadLogo = async (campaignId: string): Promise<string | null> => {
    if (!logoFile) return null

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', logoFile)
      formData.append('campaignId', campaignId)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload logo')
      }

      const result = await response.json()
      return result.logoUrl
    } catch (error) {
      console.error('Logo upload error:', error)
      throw error
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Campaign name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (campaign) {
        // Update existing campaign
        let logoUrl = null
        if (logoFile) {
          logoUrl = await uploadLogo(campaign.id)
        }

        const updateData = {
          name: formData.name.trim(),
          description: formData.description || null,
          settings: {
            ...formData.settings,
            ...(logoUrl && {
              branding: {
                ...formData.settings.branding,
                logo_url: logoUrl
              }
            })
          }
        }

        const result = await updateCampaign(campaign.id, updateData)

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to update campaign')
        }

        toast({
          title: 'Campaign updated',
          description: 'Your campaign settings have been saved successfully',
          duration: 3000
        })

        onSave(result.data)
      } else {
        // Create new campaign
        const createData = {
          name: formData.name.trim(),
          description: formData.description || '',
          status: 'draft',
          settings: formData.settings,
          published_at: null,
          published_url: null,
          is_active: true
        } as CreateCampaign

        const result = await createCampaignWithUsageTracking(createData)

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create campaign')
        }

        // Upload logo after creation if there is one
        let updatedCampaign = result.data
        if (logoFile) {
          const logoUrl = await uploadLogo(result.data.id)
          if (logoUrl) {
            const updateResult = await updateCampaign(result.data.id, {
              settings: {
                ...formData.settings,
                branding: {
                  ...formData.settings.branding,
                  logo_url: logoUrl
                }
              }
            })
            if (updateResult.success && updateResult.data) {
              updatedCampaign = updateResult.data
            }
          }
        }

        toast({
          title: 'Campaign created',
          description: 'Your new campaign has been created successfully',
          duration: 3000
        })

        onSave(updatedCampaign)
      }
      // Only close modal after onSave (navigation) is triggered
    } catch (err) {
      console.error('Error saving campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign'
      setError(errorMessage)
      toast({
        title: campaign ? 'Update failed' : 'Creation failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render content based on mode
  const renderStepContent = () => {
    if (mode === 'create') {
      // Only show name/description, no Card wrapper
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name *</Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Enter your tool name"
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              Give your tool a clear, descriptive name
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Describe what your tool is about (optional)"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Help your team understand the purpose of this tool
            </p>
          </div>
        </div>
      )
    } else {
      // Screenshot-exact: left = config, right = preview, shadcn look
      const currentBackground = formData.settings.theme?.background_color || '#FFFFFF'
      const currentButton = formData.settings.theme?.button_color || '#3B82F6'
      const currentText = formData.settings.theme?.text_color || '#1F2937'
      return (
        <>
          <div className="flex flex-col sm:flex-row h-full min-h-[400px]">
            {/* Left: Configure (50%) */}
            <div className="flex flex-col min-w-[340px] max-w-[480px] flex-1 sm:w-1/2 px-10 py-8">
              {/* Colors Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-base">Colors</span>
                </div>
                {/* Background */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-base">Background</div>
                    <div className="text-xs text-muted-foreground">Main background color</div>
                  </div>
                  <input
                    type="color"
                    id="background-color"
                    value={currentBackground}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        background_color: e.target.value
                      }
                    })}
                    className="w-8 h-8 rounded border border-input shadow-sm cursor-pointer"
                    style={{ background: currentBackground, padding: 0, width: 32, height: 32 }}
                  />
                </div>
                {/* Button */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-base">Primary Button</div>
                    <div className="text-xs text-muted-foreground">Call-to-action buttons</div>
                  </div>
                  <input
                    type="color"
                    id="button-color"
                    value={currentButton}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        button_color: e.target.value
                      }
                    })}
                    className="w-8 h-8 rounded border border-input shadow-sm cursor-pointer"
                    style={{ background: currentButton, padding: 0, width: 32, height: 32 }}
                  />
                </div>
                {/* Text */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-base">Text</div>
                    <div className="text-xs text-muted-foreground">Primary text color</div>
                  </div>
                  <input
                    type="color"
                    id="text-color"
                    value={currentText}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        text_color: e.target.value
                      }
                    })}
                    className="w-8 h-8 rounded border border-input shadow-sm cursor-pointer"
                    style={{ background: currentText, padding: 0, width: 32, height: 32 }}
                  />
                </div>
              </div>
              <hr className="my-4" />
              {/* Logo Section */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-base">Logo</span>
                </div>
                <div className="font-medium text-base mb-1">Brand Logo</div>
                {!logoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer min-h-[120px] flex flex-col justify-center items-center w-full"
                       onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-0">Click to change logo</p>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center w-full cursor-pointer min-h-[120px]"
                       onClick={() => document.getElementById('logo-upload')?.click()}>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-16 max-w-[120px] object-contain rounded mb-2"
                    />
                    <p className="text-sm text-muted-foreground mb-0">Click to change logo</p>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px bg-gray-200 mx-0" />
            {/* Right: Preview (50%) */}
            <div className="flex-1 sm:w-1/2 bg-[#f5f5f5] flex flex-col items-start justify-start min-h-full px-8">
              <div className="font-semibold text-base mb-4">Preview</div>
              <div 
                className="w-full max-w-md p-8 rounded-xl border border-gray-200 flex flex-col items-center shadow-sm bg-white mb-4"
                style={{ backgroundColor: currentBackground }}
              >
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-12 max-w-[80px] object-contain rounded mb-3"
                  />
                )}
                <h3 style={{ color: currentText }} className="text-xl font-bold mb-1">
                  Sample Content
                </h3>
                <p style={{ color: currentText }} className="text-base mb-6 opacity-80 text-center">
                  This is how your text will appear with the selected colors.
                </p>
                <button
                  type="button"
                  style={{ backgroundColor: currentButton }}
                  className="px-5 py-2 text-white text-base font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sample Button
                </button>
              </div>
              <div className="w-full max-w-md bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                <span className="font-semibold">Tip:</span> Make sure there's enough contrast between your text and background colors for accessibility.
              </div>
            </div>
          </div>
          <hr className="mt-0 mb-0 border-t border-gray-200" />
        </>
      )
    }
  }

  // Modal rendering
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Create Tool' : 'Theme & Branding'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">{mode === 'create' ? 'Error creating tool' : 'Error updating tool'}</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Step Content */}
          {renderStepContent()}
          {/* Footer Buttons */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="mr-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingLogo || !formData.name.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isUploadingLogo ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Creating...' : 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Tool' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 