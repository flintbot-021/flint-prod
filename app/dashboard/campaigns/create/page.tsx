'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { createCampaignWithUsageTracking, getCurrentProfile } from '@/lib/data-access'
import { Profile, CampaignSettings, CreateCampaign } from '@/lib/types/database'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Save,
  AlertCircle,
  Upload,
  X
} from 'lucide-react'

// Import logo upload functionality

interface CampaignFormData {
  name: string
  description: string
  settings: CampaignSettings
}

type Step = 'basic' | 'theme' | 'settings' | 'review'

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
  },
  {
    id: 'settings',
    title: 'Campaign Settings',
    description: 'Configure completion and notification settings'
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your campaign settings and create'
  }
]

export default function CreateCampaignPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const result = await getCurrentProfile()
      if (result.success && result.data) {
        setProfile(result.data)
        // Campaign limit check removed
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

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
      case 'settings':
        return true
      case 'review':
        return false
      default:
        return false
    }
  }

  // Logo upload handlers
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Reset any previous errors
      setError(null)
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file must be less than 5MB')
        return
      }

      // Validate file name
      if (file.name.length > 100) {
        setError('File name is too long. Please rename your file to be shorter than 100 characters.')
        return
      }

      console.log('Logo file selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.onerror = () => {
        setError('Failed to read the selected file. Please try again.')
        setLogoFile(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoRemove = () => {
    setLogoFile(null)
    setLogoPreview(null)
    
    // Remove logo URL from settings
    updateSettings({
      branding: {
        ...formData.settings.branding,
        logo_url: undefined
      }
    })
  }

  const uploadLogo = async (campaignId: string): Promise<string | null> => {
    if (!logoFile) return null

    try {
      setIsUploadingLogo(true)
      
      // Use API route for upload with proper server-side authentication
      const formData = new FormData()
      formData.append('logo', logoFile)
      formData.append('campaignId', campaignId)
      
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      console.log('Logo uploaded successfully via API:', result.url)
      return result.url
      
    } catch (error) {
      console.error('Logo upload failed:', error)
      throw new Error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async () => {
    if (!profile) return

    // Campaign limit check removed

    try {
      setIsSubmitting(true)
      setError(null)

      // First create the campaign
      const result = await createCampaignWithUsageTracking({
        name: formData.name,
        description: formData.description,
        status: 'draft',
        settings: formData.settings,
        published_at: null,
        published_url: null,
        is_active: true
      } as CreateCampaign)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      const campaignId = result.data?.id
      if (!campaignId) {
        throw new Error('Campaign created but ID not returned')
      }

      // Upload logo if one was selected
      if (logoFile) {
        try {
          console.log('Starting logo upload for campaign:', campaignId)
          const logoUrl = await uploadLogo(campaignId)
          if (logoUrl) {
            console.log('Logo uploaded successfully, updating campaign settings...')
            // Update campaign settings with logo URL
            const updatedSettings = {
              ...formData.settings,
              branding: {
                ...formData.settings.branding,
                logo_url: logoUrl
              }
            }

            // Update the campaign with logo URL
            const { updateCampaign } = await import('@/lib/data-access')
            const updateResult = await updateCampaign(campaignId, {
              settings: updatedSettings
            })

            if (!updateResult.success) {
              console.error('Failed to save logo URL to campaign:', updateResult.error)
              // Don't fail the entire flow, just show a warning
              setError('Campaign created successfully, but there was an issue saving the logo. You can upload it again later in the campaign builder.')
            } else {
              console.log('Logo uploaded and saved successfully to campaign settings')
            }
          } else {
            console.warn('Logo upload returned no URL')
            setError('Campaign created successfully, but logo upload failed. You can add a logo later in the campaign builder.')
          }
        } catch (logoError) {
          console.error('Logo upload failed:', logoError)
          // Don't fail the entire campaign creation for logo upload failure
          const errorMessage = logoError instanceof Error ? logoError.message : 'Unknown error occurred'
          setError(`Campaign created successfully, but logo upload failed: ${errorMessage}. You can add a logo later in the campaign builder.`)
        }
      }

      // Redirect to the campaign builder
      router.push(`/dashboard/campaigns/${campaignId}/builder`)
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
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
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="primary-color"
                    value={formData.settings.theme?.primary_color || '#3B82F6'}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        primary_color: e.target.value
                      }
                    })}
                    className="w-12 h-12 rounded border border-input"
                  />
                  <Input
                    value={formData.settings.theme?.primary_color || '#3B82F6'}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        primary_color: e.target.value
                      }
                    })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="secondary-color"
                    value={formData.settings.theme?.secondary_color || '#10B981'}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        secondary_color: e.target.value
                      }
                    })}
                    className="w-12 h-12 rounded border border-input"
                  />
                  <Input
                    value={formData.settings.theme?.secondary_color || '#10B981'}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        secondary_color: e.target.value
                      }
                    })}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="background-color"
                    value={formData.settings.theme?.background_color || '#FFFFFF'}
                    onChange={(e) => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        background_color: e.target.value
                      }
                    })}
                    className="w-12 h-12 rounded border border-input"
                  />
                  <Input
                    value={formData.settings.theme?.background_color || '#FFFFFF'}
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

              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <select
                  id="font-family"
                  value={formData.settings.theme?.font_family || 'Inter, sans-serif'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({
                    theme: {
                      ...formData.settings.theme,
                      font_family: e.target.value
                    }
                  })}
                  className="w-full p-2 border border-input rounded-md"
                >
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Branding Options</h3>
              
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <Label>Campaign Logo</Label>
                
                {!logoPreview ? (
                  <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('logo-upload')?.click()}>
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP up to 5MB</p>
                      </div>
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-contain bg-white border rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{logoFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogoRemove}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Your logo will appear on campaign pages. Recommended size: 200x60px or similar aspect ratio.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-powered-by"
                  checked={formData.settings.branding?.show_powered_by ?? true}
                  onChange={(e) => updateSettings({
                    branding: {
                      ...formData.settings.branding,
                      show_powered_by: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <Label htmlFor="show-powered-by">Show "Powered by Flint" attribution</Label>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Completion Settings</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={formData.settings.completion?.email_notifications ?? true}
                  onChange={(e) => updateSettings({
                    completion: {
                      ...formData.settings.completion,
                      email_notifications: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <Label htmlFor="email-notifications">Send email notifications when leads complete the campaign</Label>
              </div>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span> {formData.description || 'No description'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Theme Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Logo Preview */}
                    {logoPreview && (
                      <div>
                        <span className="text-sm font-medium">Logo:</span>
                        <div className="mt-1 p-2 bg-gray-50 border rounded flex items-center justify-center h-16">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="max-h-12 max-w-32 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: formData.settings.theme?.primary_color }}
                      ></div>
                      <span className="text-sm">Primary: {formData.settings.theme?.primary_color}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: formData.settings.theme?.secondary_color }}
                      ></div>
                      <span className="text-sm">Secondary: {formData.settings.theme?.secondary_color}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Font:</span> {formData.settings.theme?.font_family}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Check className="h-4 w-4 inline mr-2 text-green-600" />
                    Logo: {logoFile ? `${logoFile.name} (${(logoFile.size / 1024).toFixed(1)} KB)` : 'None'}
                  </li>
                  <li>
                    <Check className="h-4 w-4 inline mr-2 text-green-600" />
                    {formData.settings.branding?.show_powered_by ? 'Show' : 'Hide'} Flint attribution
                  </li>
                  <li>
                    <Check className="h-4 w-4 inline mr-2 text-green-600" />
                    Email notifications: {formData.settings.completion?.email_notifications ? 'Enabled' : 'Disabled'}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Create New Campaign
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Step Indicator */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between relative">
                {steps.map((step, stepIdx) => {
                  const isCompleted = getCurrentStepIndex() > stepIdx;
                  const isActive = getCurrentStepIndex() === stepIdx;
                  const isUpcoming = getCurrentStepIndex() < stepIdx;
                  return (
                    <li
                      key={step.id}
                      className={`relative flex-1 flex flex-col items-center min-w-0 ${stepIdx !== steps.length - 1 ? 'pr-2 sm:pr-8' : ''}`}
                    >
                      {/* Connector line */}
                      {stepIdx !== 0 && (
                        <div
                          className="absolute left-0 top-4 h-0.5 w-full -z-1"
                          style={{
                            background: isCompleted ? '#2563EB' : '#E5E7EB',
                            zIndex: 0,
                            right: '50%',
                          }}
                        />
                      )}
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
                      {/* Connector line to next step */}
                      {stepIdx !== steps.length - 1 && (
                        <div
                          className="absolute right-0 top-4 h-0.5 w-full -z-1"
                          style={{
                            background: getCurrentStepIndex() > stepIdx ? '#2563EB' : '#E5E7EB',
                            zIndex: 0,
                            left: '50%',
                          }}
                        />
                      )}
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
                    <p className="font-medium">Error creating campaign</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{steps[getCurrentStepIndex()].title}</CardTitle>
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
              {currentStep !== 'review' ? (
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isUploadingLogo ? 'Uploading Logo...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>


        </div>
      </main>
    </div>
  )
} 