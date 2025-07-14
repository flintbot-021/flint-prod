'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, createCampaignWithUsageTracking, getCurrentProfile } from '@/lib/data-access'
import { Profile, Campaign, CampaignSettings, CreateCampaign } from '@/lib/types/database'
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

export default function CampaignFormPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string
  const isCreateMode = campaignId === 'new'

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!isCreateMode)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
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
      if (isCreateMode) {
        loadProfile()
      } else {
        loadCampaignAndProfile()
      }
    }
  }, [user, isCreateMode])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const result = await getCurrentProfile()
      if (result.success && result.data) {
        setProfile(result.data)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  const loadCampaignAndProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [campaignResult, profileResult] = await Promise.all([
        getCampaignById(campaignId),
        getCurrentProfile()
      ])

      if (!campaignResult.success) {
        throw new Error(campaignResult.error || 'Failed to load campaign')
      }

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to load profile')
      }

      if (!campaignResult.data) {
        throw new Error('Campaign not found')
      }

      setCampaign(campaignResult.data)
      setProfile(profileResult.data || null)

      // Pre-populate form with existing campaign data
      setFormData({
        name: campaignResult.data.name,
        description: campaignResult.data.description || '',
        settings: campaignResult.data.settings || {
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

      // Set existing logo preview if available
      const existingLogoUrl = campaignResult.data.settings?.branding?.logo_url
      if (existingLogoUrl) {
        setLogoPreview(existingLogoUrl)
      }
    } catch (err) {
      console.error('Error loading campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
      setProfileLoading(false)
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

    try {
      setIsSubmitting(true)
      setError(null)

      if (isCreateMode) {
        // Create new campaign
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

        const newCampaignId = result.data?.id
        if (!newCampaignId) {
          throw new Error('Campaign created but ID not returned')
        }

        // Upload logo if one was selected
        if (logoFile) {
          try {
            console.log('Starting logo upload for campaign:', newCampaignId)
            const logoUrl = await uploadLogo(newCampaignId)
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
              const updateResult = await updateCampaign(newCampaignId, {
                settings: updatedSettings
              })

              if (!updateResult.success) {
                console.error('Failed to save logo URL to campaign:', updateResult.error)
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
            const errorMessage = logoError instanceof Error ? logoError.message : 'Unknown error occurred'
            setError(`Campaign created successfully, but logo upload failed: ${errorMessage}. You can add a logo later in the campaign builder.`)
          }
        }

        // Redirect to the campaign builder
        router.push(`/dashboard/campaigns/${newCampaignId}/builder`)
      } else {
        // Update existing campaign
        let finalSettings = { ...formData.settings }

        // Upload logo if a new one was selected
        if (logoFile) {
          try {
            const logoUrl = await uploadLogo(campaignId)
            if (logoUrl) {
              finalSettings = {
                ...finalSettings,
                branding: {
                  ...finalSettings.branding,
                  logo_url: logoUrl
                }
              }
            }
          } catch (logoError) {
            console.error('Logo upload failed:', logoError)
            setError('Campaign updated successfully, but logo upload failed. Please try uploading the logo again.')
          }
        }

        const result = await updateCampaign(campaignId, {
          name: formData.name,
          description: formData.description,
          settings: finalSettings
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update campaign')
        }

        // Redirect back to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error submitting campaign:', err)
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
        const backgroundOptions = [
          { name: 'White', value: '#FFFFFF', preview: 'bg-white' },
          { name: 'Light Gray', value: '#F8FAFC', preview: 'bg-slate-50' },
          { name: 'Light Blue', value: '#F0F9FF', preview: 'bg-sky-50' },
          { name: 'Light Green', value: '#F0FDF4', preview: 'bg-green-50' },
          { name: 'Light Purple', value: '#FAF5FF', preview: 'bg-purple-50' },
          { name: 'Light Orange', value: '#FFF7ED', preview: 'bg-orange-50' }
        ]

        const currentBackground = formData.settings.theme?.background_color || '#FFFFFF'
        const currentButton = formData.settings.theme?.button_color || '#3B82F6'
        const currentText = formData.settings.theme?.text_color || '#1F2937'

        return (
          <div className="space-y-6">
            {/* Background Color Selection */}
            <div className="space-y-3">
              <Label>Background Color</Label>
              <p className="text-sm text-muted-foreground">Choose a light background color for your campaign</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateSettings({
                      theme: {
                        ...formData.settings.theme,
                        background_color: option.value
                      }
                    })}
                    className={`relative p-4 rounded-lg border-2 transition-all hover:border-blue-300 ${
                      currentBackground === option.value 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-full h-12 rounded ${option.preview} border border-gray-200`}></div>
                    <p className="text-sm font-medium mt-2">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.value}</p>
                    {currentBackground === option.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
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

            {/* Branding Options */}
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


            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isCreateMode ? 'Loading...' : 'Loading campaign...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error && !isCreateMode) {
    return (
      <div className="min-h-screen bg-background">
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
                  {isCreateMode ? 'Create New Campaign' : 'Edit Campaign'}
                </h1>
              </div>
              <UserProfile variant="compact" />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error loading campaign</p>
                    <p className="text-sm mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={loadCampaignAndProfile}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
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
                {isCreateMode ? 'Create New Campaign' : `Edit Campaign: ${campaign?.name}`}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {profileLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              ) : (
                <UserProfile variant="compact" />
              )}
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
                    <p className="font-medium">
                      {isCreateMode ? 'Error creating campaign' : 'Error updating campaign'}
                    </p>
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
                  disabled={isSubmitting || isUploadingLogo || !formData.name.trim() || profileLoading}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isUploadingLogo ? 'Uploading Logo...' : (isCreateMode ? 'Creating...' : 'Saving...')}
                    </>
                  ) : profileLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isCreateMode ? 'Create Campaign' : 'Save Changes'}
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