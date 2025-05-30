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
import { getCampaignById, updateCampaign, getCurrentProfile } from '@/lib/data-access'
import { Profile, Campaign, CampaignSettings } from '@/lib/types/database'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Settings, 
  Palette, 
  Building,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react'

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
    description: 'Update your campaign name and description'
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
    title: 'Review & Save',
    description: 'Review your changes and save the campaign'
  }
]

export default function EditCampaignPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    if (user && campaignId) {
      loadCampaignAndProfile()
    }
  }, [user, campaignId])

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
    } catch (err) {
      console.error('Error loading campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
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

  const handleSubmit = async () => {
    if (!campaign) return

    try {
      setIsSubmitting(true)
      setError(null)

      const result = await updateCampaign(campaign.id, {
        name: formData.name,
        description: formData.description,
        settings: formData.settings
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update campaign')
      }

      // Redirect back to campaigns list
      router.push('/dashboard/campaigns')
    } catch (err) {
      console.error('Error updating campaign:', err)
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-powered-by"
                  checked={formData.settings.branding?.show_powered_by || false}
                  onChange={(e) => updateSettings({
                    branding: {
                      ...formData.settings.branding,
                      show_powered_by: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <Label htmlFor="show-powered-by">Show "Powered by Flint" branding</Label>
              </div>
            </div>

            {/* Theme Preview */}
            <div className="space-y-2">
              <Label>Theme Preview</Label>
              <div 
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: formData.settings.theme?.background_color || '#FFFFFF',
                  borderColor: formData.settings.theme?.primary_color || '#3B82F6',
                  fontFamily: formData.settings.theme?.font_family || 'Inter, sans-serif'
                }}
              >
                <h3 
                  style={{ color: formData.settings.theme?.primary_color || '#3B82F6' }}
                  className="text-xl font-bold mb-2"
                >
                  Sample Campaign Title
                </h3>
                <p className="text-muted-foreground mb-4">
                  This is how your campaign will look with the selected theme settings.
                </p>
                <button
                  style={{ 
                    backgroundColor: formData.settings.theme?.secondary_color || '#10B981',
                    color: '#FFFFFF'
                  }}
                  className="px-4 py-2 rounded font-medium"
                >
                  Sample Button
                </button>
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
                  checked={formData.settings.completion?.email_notifications || false}
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
              
              <p className="text-sm text-muted-foreground">
                When enabled, you'll receive an email notification each time someone completes your campaign.
              </p>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Campaign Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
                    <p className="text-lg font-medium">{formData.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground">
                      {formData.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Notifications</Label>
                    <p className="text-sm">
                      {formData.settings.completion?.email_notifications ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Theme Colors</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border border-input"
                        style={{ backgroundColor: formData.settings.theme?.primary_color }}
                      ></div>
                      <div 
                        className="w-6 h-6 rounded border border-input"
                        style={{ backgroundColor: formData.settings.theme?.secondary_color }}
                      ></div>
                      <div 
                        className="w-6 h-6 rounded border border-input"
                        style={{ backgroundColor: formData.settings.theme?.background_color }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Font Family</Label>
                    <p className="text-sm">{formData.settings.theme?.font_family}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Powered By Branding</Label>
                    <p className="text-sm">
                      {formData.settings.branding?.show_powered_by ? 'Shown' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes Summary */}
            {campaign && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-blue-900">Changes Summary</h3>
                <div className="space-y-2 text-sm">
                  {formData.name !== campaign.name && (
                    <p className="text-blue-800">
                      <span className="font-medium">Name:</span> "{campaign.name}" → "{formData.name}"
                    </p>
                  )}
                  {formData.description !== (campaign.description || '') && (
                    <p className="text-blue-800">
                      <span className="font-medium">Description:</span> Updated
                    </p>
                  )}
                  {JSON.stringify(formData.settings) !== JSON.stringify(campaign.settings) && (
                    <p className="text-blue-800">
                      <span className="font-medium">Settings:</span> Theme and preferences updated
                    </p>
                  )}
                  {formData.name === campaign.name && 
                   formData.description === (campaign.description || '') && 
                   JSON.stringify(formData.settings) === JSON.stringify(campaign.settings) && (
                    <p className="text-muted-foreground">No changes detected</p>
                  )}
                </div>
              </div>
            )}
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
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted">
        <header className="bg-background shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/campaigns')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Edit Campaign</h1>
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
                onClick={() => router.push('/dashboard/campaigns')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Edit Campaign: {campaign?.name}
              </h1>
            </div>
            <UserProfile variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCurrent = step.id === currentStep
                const isCompleted = getCurrentStepIndex() > index
                const isActive = isCurrent || isCompleted

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 
                        ${isActive 
                          ? 'border-blue-600 bg-blue-600 text-white' 
                          : 'border-input bg-background text-gray-400'
                        }
                      `}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${isActive ? 'text-muted-foreground' : 'text-gray-400'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        flex-1 mx-4 h-0.5 
                        ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentStep === 'basic' && <Building className="h-5 w-5" />}
                {currentStep === 'theme' && <Palette className="h-5 w-5" />}
                {currentStep === 'settings' && <Settings className="h-5 w-5" />}
                {currentStep === 'review' && <Check className="h-5 w-5" />}
                <span>{steps.find(s => s.id === currentStep)?.title}</span>
              </CardTitle>
              <CardDescription>
                {steps.find(s => s.id === currentStep)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={getCurrentStepIndex() === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-3">
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
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
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