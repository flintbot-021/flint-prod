'use client'

import { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface CampaignEditModalProps {
  campaign: Campaign | null // null for creation mode
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCampaign: Campaign) => void
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

export function CampaignEditModal({ campaign, isOpen, onClose, onSave }: CampaignEditModalProps) {
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

  const updateFormData = (updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateSettings = (updates: Partial<CampaignSettings>) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }))
  }

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep)
  }

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim().length > 0
      case 'theme':
        return true
      default:
        return false
    }
  }

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
      
      onClose()
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter your campaign name"
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Give your lead magnet campaign a clear, descriptive name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe what your campaign is about (optional)"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Help your team understand the purpose of this campaign
              </p>
            </div>
          </div>
        )

      case 'theme':
        const currentBackground = formData.settings.theme?.background_color || '#FFFFFF'
        const currentButton = formData.settings.theme?.button_color || '#3B82F6'
        const currentText = formData.settings.theme?.text_color || '#1F2937'

        return (
          <div className="space-y-6">
            {/* Background Color Selection */}
            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <p className="text-sm text-muted-foreground">Choose any background color for your campaign</p>
              <div className="flex items-center space-x-3">
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
                  className="w-12 h-12 rounded border border-input"
                />
                <Input
                  value={currentBackground}
                  onChange={(e) => updateSettings({
                    theme: {
                      ...formData.settings.theme,
                      background_color: e.target.value
                    }
                  })}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Button and Text Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="button-color">Button Color</Label>
                <p className="text-sm text-muted-foreground">Color for buttons and interactive elements</p>
                <div className="flex items-center space-x-3">
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
                    className="w-12 h-12 rounded border border-input"
                  />
                  <Input
                    value={currentButton}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        button_color: e.target.value
                      }
                    })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <p className="text-sm text-muted-foreground">Primary text color for headings and content</p>
                <div className="flex items-center space-x-3">
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
                    className="w-12 h-12 rounded border border-input"
                  />
                  <Input
                    value={currentText}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        text_color: e.target.value
                      }
                    })}
                    placeholder="#1F2937"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-3">
              <Label>Color Preview</Label>
              <div 
                className="p-6 rounded-lg border-2 border-dashed border-gray-300"
                style={{ backgroundColor: currentBackground }}
              >
                <h3 style={{ color: currentText }} className="text-lg font-semibold mb-2">
                  Sample Campaign Content
                </h3>
                <p style={{ color: currentText }} className="text-sm mb-4 opacity-80">
                  This is how your text will appear on the selected background color.
                </p>
                <button
                  type="button"
                  style={{ backgroundColor: currentButton }}
                  className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sample Button
                </button>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-3">
              <Label>Campaign Logo</Label>
              
              {!logoPreview ? (
                <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                     onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Click to upload your logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-input rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Logo Preview</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLogoRemove}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 max-w-full object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Campaign</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between relative">
                {steps.map((step, stepIdx) => {
                  const isCompleted = getCurrentStepIndex() > stepIdx;
                  const isActive = getCurrentStepIndex() === stepIdx;
                  return (
                    <li
                      key={step.id}
                      className={`relative flex-1 flex flex-col items-center min-w-0 ${stepIdx !== steps.length - 1 ? 'pr-2 sm:pr-8' : ''}`}
                    >

                      {/* Step circle */}
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full border-2 z-10 ${
                          isCompleted
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : isActive
                            ? 'border-blue-600 text-blue-600 bg-background'
                            : 'border-gray-300 text-gray-400 bg-background'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{stepIdx + 1}</span>
                        )}
                      </div>
                      {/* Step text */}
                      <div className="mt-2 text-center min-w-0">
                        <span className={`block text-sm font-medium ${
                          isCompleted || isActive ? 'text-foreground' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                        <span className={`block text-xs ${
                          isCompleted || isActive ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </span>
                      </div>

                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Error updating campaign</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentStep === 'basic' && <Building className="h-5 w-5" />}
                {currentStep === 'theme' && <Palette className="h-5 w-5" />}
                <span>{steps[getCurrentStepIndex()].title}</span>
              </CardTitle>
              <CardDescription>{steps[getCurrentStepIndex()].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={getCurrentStepIndex() === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              {currentStep !== 'theme' ? (
                <Button
                  onClick={goToNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploadingLogo || !formData.name.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isUploadingLogo ? 'Uploading Logo...' : campaign ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {campaign ? 'Save Changes' : 'Create Campaign'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 