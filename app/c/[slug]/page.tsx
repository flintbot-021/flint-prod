'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Campaign } from '@/lib/types/database'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { getSupabaseClient } from '@/lib/data-access/base'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Globe,
  Target,
  MessageSquare,
  Brain,
  FileText,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PublicCampaignPageProps {}

interface CampaignState {
  currentSection: number
  userInputs: Record<string, any>
  completedSections: Set<number>
  startTime: Date
  sessionId: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PublicCampaignPage({}: PublicCampaignPageProps) {
  const params = useParams()
  const slug = params?.slug as string
  
  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<CampaignSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [campaignState, setCampaignState] = useState<CampaignState>({
    currentSection: 0,
    userInputs: {},
    completedSections: new Set(),
    startTime: new Date(),
    sessionId: crypto.randomUUID()
  })

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (slug) {
      loadPublicCampaign()
    }
  }, [slug])

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadPublicCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = await getSupabaseClient()

      // Get campaign by published_url with activation check
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('published_url', slug)
        .eq('status', 'published')
        .eq('is_active', true) // Only allow active campaigns
        .single()

      if (campaignError || !campaign) {
        // Campaign not found, not published, or not active
        notFound()
        return
      }

      setCampaign(campaign)
      
      // TODO: Load actual campaign sections from database
      // For now, create sample sections for testing
      const now = new Date().toISOString()
      const sampleSections: CampaignSection[] = [
        {
          id: '1',
          type: 'capture',
          title: 'Welcome',
          order: 0,
          isVisible: true,
          createdAt: now,
          updatedAt: now,
          settings: {
            title: `Welcome to ${campaign.name}`,
            content: 'Please provide your information to get started.',
            fields: [
              { id: 'name', type: 'text', label: 'Full Name', required: true },
              { id: 'email', type: 'email', label: 'Email Address', required: true }
            ]
          }
        },
        {
          id: '2',
          type: 'choice',
          title: 'Your Goal',
          order: 1,
          isVisible: true,
          createdAt: now,
          updatedAt: now,
          settings: {
            title: 'What\'s your primary goal?',
            content: 'Select the option that best describes your main objective.',
            choices: [
              { id: 'growth', text: 'Business Growth', value: 'growth' },
              { id: 'efficiency', text: 'Efficiency Improvement', value: 'efficiency' },
              { id: 'innovation', text: 'Innovation & Technology', value: 'innovation' }
            ]
          }
        },
        {
          id: '3',
          type: 'output-results',
          title: 'Your Results',
          order: 2,
          isVisible: true,
          createdAt: now,
          updatedAt: now,
          settings: {
            title: 'Your Personalized Results',
            content: 'Thank you, @name! Based on your goal of @goal, here are your personalized recommendations.',
            enableVariableInterpolation: true
          }
        }
      ]
      
      setSections(sampleSections)

      // Initialize campaign state
      setCampaignState(prev => ({
        ...prev,
        startTime: new Date(),
        sessionId: crypto.randomUUID()
      }))

    } catch (err) {
      console.error('Error loading public campaign:', err)
      setError('This campaign is not available')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSectionComplete = (sectionIndex: number, data: any) => {
    setCampaignState(prev => ({
      ...prev,
      userInputs: { ...prev.userInputs, ...data },
      completedSections: new Set([...prev.completedSections, sectionIndex])
    }))

    // Auto-advance to next section
    if (sectionIndex < sections.length - 1) {
      setTimeout(() => {
        setCampaignState(prev => ({
          ...prev,
          currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
        }))
      }, 1000)
    }
  }

  const handlePrevious = () => {
    setCampaignState(prev => ({
      ...prev,
      currentSection: Math.max(0, prev.currentSection - 1)
    }))
  }

  const handleNext = () => {
    setCampaignState(prev => ({
      ...prev,
      currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
    }))
  }

  // =============================================================================
  // SECTION RENDERING
  // =============================================================================

  const renderSection = (section: CampaignSection, index: number) => {
    const isActive = index === campaignState.currentSection
    const isCompleted = campaignState.completedSections.has(index)
    
    if (!isActive) return null

    const getSectionIcon = (type: string) => {
      switch (type) {
        case 'capture': return Target
        case 'choice': return MessageSquare
        case 'logic': return Brain
        case 'output-results': return FileText
        default: return Target
      }
    }

    const IconComponent = getSectionIcon(section.type)
    const settings = section.settings || {}

    return (
      <div key={section.id} className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <IconComponent className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <Badge variant="outline" className="mb-2">
            Step {index + 1} of {sections.length}
          </Badge>
        </div>

        {/* Section Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {section.type === 'capture' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                {(settings as any).title || 'Capture Section'}
              </h1>
              <p className="text-gray-600 mb-8 text-center text-lg">
                {(settings as any).content || 'Please provide your information.'}
              </p>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data: Record<string, any> = {}
                formData.forEach((value, key) => {
                  data[key] = value
                })
                handleSectionComplete(index, data)
              }} className="space-y-6">
                {((settings as any).fields || []).map((field: any, fieldIndex: number) => (
                  <div key={field.id || fieldIndex}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      name={field.id}
                      required={field.required}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
                
                <div className="text-center pt-4">
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                    Continue
                  </Button>
                </div>
              </form>
            </div>
          )}

          {section.type === 'choice' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                {(settings as any).title || 'Make Your Choice'}
              </h1>
              <p className="text-gray-600 mb-8 text-center text-lg">
                {(settings as any).content || 'Please select from the options below.'}
              </p>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                {((settings as any).choices || []).map((choice: any, choiceIndex: number) => (
                  <div
                    key={choice.id || choiceIndex}
                    className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    onClick={() => handleSectionComplete(index, { choice: choice.value, goal: choice.value })}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded mr-4"></div>
                      <span className="text-lg text-gray-900">{choice.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.type === 'output-results' && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {(settings as any).title || 'Thank You!'}
              </h1>
              
              <div className="prose prose-lg mx-auto text-gray-600">
                {(() => {
                  let content = (settings as any).content || 'Thank you for completing this campaign.'
                  
                  // Variable interpolation
                  if ((settings as any).enableVariableInterpolation) {
                    Object.entries(campaignState.userInputs).forEach(([key, value]) => {
                      content = content.replace(new RegExp(`@${key}`, 'g'), String(value))
                    })
                  }
                  
                  return <p className="text-xl">{content}</p>
                })()}
              </div>
              
              <div className="mt-8 p-6 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Completed in {Math.round((new Date().getTime() - campaignState.startTime.getTime()) / 1000)} seconds
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Campaign</h3>
          <p className="text-gray-600">Please wait while we prepare your experience...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Available</h1>
          <p className="text-gray-600 mb-6">
            This campaign is currently not accessible. It may have been deactivated or the URL is incorrect.
          </p>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Shield className="h-4 w-4 mr-2" />
              Campaign Status: Inactive
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign || sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Content</h3>
          <p className="text-gray-600">This campaign doesn't have any content to display.</p>
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Campaign Info Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{campaign.name}</h2>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {campaignState.currentSection + 1} of {sections.length}
              </span>
              <div className="flex space-x-1">
                {sections.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === campaignState.currentSection
                        ? "bg-blue-600"
                        : campaignState.completedSections.has(index)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="py-12 px-6">
        {sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={campaignState.currentSection <= 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={campaignState.currentSection >= sections.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 