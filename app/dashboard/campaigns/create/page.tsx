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
  Settings, 
  Palette, 
  Building,
  Save,
  AlertCircle
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

  const handleSubmit = async () => {
    if (!profile) return

    // Campaign limit check removed

    try {
      setIsSubmitting(true)
      setError(null)

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

      // Redirect to the campaign builder
      router.push(`/dashboard/campaigns/${result.data?.id}/builder`)
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
                  <div className="space-y-2">
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
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    <div className="flex items-center">
                      <div className={`
                        flex h-8 w-8 items-center justify-center rounded-full border-2 
                        ${getCurrentStepIndex() > stepIdx
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : getCurrentStepIndex() === stepIdx
                          ? 'border-blue-600 text-blue-600'
                          : 'border-input text-gray-400'
                        }
                      `}>
                        {getCurrentStepIndex() > stepIdx ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{stepIdx + 1}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <span className={`text-sm font-medium ${
                          getCurrentStepIndex() >= stepIdx ? 'text-foreground' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="absolute top-4 left-8 -ml-px h-0.5 w-full bg-gray-300" />
                    )}
                  </li>
                ))}
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
                  disabled={isSubmitting || !formData.name.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
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