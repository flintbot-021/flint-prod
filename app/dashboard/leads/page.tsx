'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserProfile } from '@/components/ui/user-profile'
import { FlintLogo } from '@/components/flint-logo'
import { useAuth } from '@/lib/auth-context'
import { 
  getLeads,
  getCampaigns,
  getCurrentProfile,
  deleteLead,
  type PaginationParams
} from '@/lib/data-access'
import { Lead, Campaign, Profile } from '@/lib/types/database'
import { ExportButton } from '@/components/export'
import { getLeadsExportData, getLeadsExportFields } from '@/lib/export'
import { 
  Download,
  Search,
  Filter,
  Users,
  Mail,
  Phone,
  Calendar,
  Target,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Trash2,
  User,
  Clock,
  MessageSquare,
  X,
  Globe,
  Hash,
  CheckCircle,
  Activity,
  LogOut
} from 'lucide-react'

interface LeadWithCampaign extends Lead {
  campaign: Campaign | null
}

type SortField = 'created_at' | 'email' | 'phone' | 'campaign_name' | 'converted_at' | 'name' | 'conversion_time'
type SortDirection = 'asc' | 'desc'

// Utility function to calculate and format conversion time
const calculateConversionTime = (createdAt: string, convertedAt: string | null): { seconds: number; formatted: string } => {
  if (!convertedAt) {
    return { seconds: 0, formatted: 'Not converted' }
  }
  
  const startTime = new Date(createdAt).getTime()
  const endTime = new Date(convertedAt).getTime()
  const diffInSeconds = Math.floor((endTime - startTime) / 1000)
  
  // Format the time in a human-readable way
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    } else {
      const days = Math.floor(seconds / 86400)
      const remainingHours = Math.floor((seconds % 86400) / 3600)
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
    }
  }
  
  return {
    seconds: diffInSeconds,
    formatted: formatTime(diffInSeconds)
  }
}

// Simple modal component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// Lead Detail Modal Component
function LeadDetailModal({ lead, campaign, isOpen, onClose }: { 
  lead: Lead; 
  campaign: Campaign | null; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [sessionData, setSessionData] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadSessionData = async () => {
    setLoading(true)
    try {
      // Fetch the actual session data from the database
      const sessionResult = await fetch(`/api/sessions/${lead.session_id}`)
      if (sessionResult.ok) {
        const session = await sessionResult.json()
        setSessionData(session)
      }

      // Fetch the campaign sections to get question titles
      if (campaign?.id) {
        const sectionsResult = await fetch(`/api/campaigns/${campaign.id}/sections`)
        if (sectionsResult.ok) {
          const campaignSections = await sectionsResult.json()
          setSections(campaignSections)
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error)
      // Fallback to lead metadata if API calls fail
      setSessionData({
        session_id: lead.session_id,
        responses: lead.metadata || {},
        conversion_section: lead.conversion_section_id,
        converted_at: lead.converted_at,
        created_at: lead.created_at
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSessionData()
    }
  }, [isOpen])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return 'No data available'
    
    try {
      return JSON.stringify(metadata, null, 2)
    } catch {
      return 'Invalid metadata format'
    }
  }

  const formatUserAnswer = (value: any) => {
    if (value === null || value === undefined) return 'No answer provided'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'No selection'
      }
      
      // Handle complex response objects - extract the actual user input
      if (value.value !== undefined) {
        // If there's a direct value field, use that
        if (typeof value.value === 'object' && value.value.response !== undefined) {
          return String(value.value.response)
        }
        if (typeof value.value === 'string' || typeof value.value === 'number') {
          return String(value.value)
        }
        // For complex value objects, try to extract user input
        if (typeof value.value === 'object') {
          // Look for common user input fields
          for (const key of ['input', 'answer', 'response', 'text', 'selection']) {
            if (value.value[key] !== undefined) {
              return String(value.value[key])
            }
          }
        }
      }
      
      // Handle direct response objects
      if (value.response !== undefined) {
        return String(value.response)
      }
      
      // Handle processed boolean values
      if (value.processed !== undefined) {
        return value.processed ? 'Yes' : 'No'
      }
      
      // Fallback for unknown object structures - try to find any meaningful user input
      const keys = Object.keys(value)
      for (const key of ['input', 'answer', 'text', 'content', 'selection', 'choice']) {
        if (value[key] !== undefined && typeof value[key] !== 'object') {
          return String(value[key])
        }
      }
      
      // If all else fails, show a simplified representation
      return 'Complex response'
    }
    return String(value)
  }

  const formatAIResponse = (value: any) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'object') {
      // Extract AI outputs/summary
      if (value.value && value.value.outputs) {
        if (value.value.outputs.summary) {
          return String(value.value.outputs.summary)
        }
        if (value.value.outputs.approve !== undefined) {
          return `AI Assessment: ${value.value.outputs.approve === 'yes' ? 'Approved' : 'Not Approved'}`
        }
      }
      
      if (value.outputs) {
        if (value.outputs.summary) {
          return String(value.outputs.summary)
        }
        if (value.outputs.approve !== undefined) {
          return `AI Assessment: ${value.outputs.approve === 'yes' ? 'Approved' : 'Not Approved'}`
        }
      }
    }
    return null
  }

  const isUserResponse = (sectionId: string, response: any) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      // If the section doesn't exist in the current campaign definition, don't show it.
      return false;
    }

    const sectionType = section.type?.toLowerCase();

    // Whitelist of section types that are considered user questions.
    const userInputSectionTypes = [
      'date_time_question',
      'multiple_choice',
      'question-slider-multiple',
      'slider',
      'text_question',
      'upload_question',
    ];

    if (!userInputSectionTypes.includes(sectionType)) {
      return false;
    }

    // Also, ensure there's a response to display.
    if (response === null || response === undefined) {
      return false;
    }
    
    // Final check: if a question-type section somehow only contains AI output, hide it.
    if (response && typeof response === 'object') {
      const hasUserInput = response.value !== undefined || response.response !== undefined || response.input !== undefined || response.answer !== undefined;
      const hasAiOutput = response.outputs !== undefined;

      if (hasAiOutput && !hasUserInput) {
        return false;
      }
    }

    return true;
  };

  const getQuestionTitle = (sectionId: string) => {
    // The 'sectionId' from the responses object is often the variable_name.
    // We need to find the section where its variable_name matches this ID.
    const section = sections.find(s => 
      s.id === sectionId || 
      (s.configuration?.variable_name === sectionId)
    );

    if (!section) {
      // As a fallback, format the sectionId itself to be more readable.
      return sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    const config = section.configuration || {};
    // Use the standardized 'headline' property
    return config.headline || section.title || 'Untitled Question';
  };

  const getQuestionType = (sectionId:string) => {
    const section = sections.find(s => 
      s.id === sectionId || 
      (s.configuration?.variable_name === sectionId)
    );
    if (!section) return 'unknown';
    return section?.type || 'unknown';
  }

  const conversionTime = calculateConversionTime(lead.created_at, lead.converted_at)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Lead Details</h2>
            <p className="text-muted-foreground">
              Complete session information and responses for {lead.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="mt-1 text-lg">{lead.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg">{lead.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg">{lead.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tool</label>
                      <div className="mt-1">
                        <Badge variant="default" className="text-sm">
                          {campaign?.name || 'Unknown Tool'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions & Answers Card */}
            {sessionData?.responses && Object.keys(sessionData.responses).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Questions & Answers
                  </CardTitle>
                  <CardDescription>
                    User responses to tool questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {sessionData.responses && Object.entries(sessionData.responses)
                      .filter(([sectionId, response]) => isUserResponse(sectionId, response))
                      .map(([sectionId, response], index) => {
                        const questionTitle = getQuestionTitle(sectionId)
                        const questionType = getQuestionType(sectionId)
                        const userAnswer = formatUserAnswer(response)
                        const aiResponse = formatAIResponse(response)
                        
                        return (
                          <div key={sectionId} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {questionTitle}
                                </h4>
                                <p className="text-xs text-muted-foreground capitalize mt-1">
                                  {questionType} question
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Q{index + 1}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-3">
                              {/* User Answer */}
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">User Response:</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {userAnswer}
                                </p>
                              </div>
                              
                              {/* AI Response (if available) */}
                              {aiResponse && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs text-blue-600 mb-1">AI Analysis:</p>
                                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                    {aiResponse}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-5 w-5 mr-2" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {lead.session_id}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Session Started</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p>{formatDate(lead.created_at)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time to Convert</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {conversionTime.formatted}
                          {conversionTime.seconds > 0 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({conversionTime.seconds} seconds)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Conversion Section</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {lead.conversion_section_id || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lead Captured</label>
                      <div className="mt-1 flex items-center space-x-2">
                        {lead.converted_at ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <p>{formatDate(lead.converted_at)}</p>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Not yet captured</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tool Details Card */}
            {campaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Globe className="h-5 w-5 mr-2" />
                    Tool Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tool Name</label>
                        <p className="mt-1 text-lg font-medium">{campaign.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge 
                            variant={campaign.status === 'published' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tool URL</label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {campaign.published_url || 'Not published'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(campaign.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Session Data Card (Fallback) */}
            {sessionData?.responses && Object.keys(sessionData.responses).length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Session Data
                  </CardTitle>
                  <CardDescription>
                    Raw session metadata and responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lead.metadata && Object.keys(lead.metadata).length > 0 ? (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Lead Metadata
                        </label>
                        <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {formatMetadata(lead.metadata)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No session responses available</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This lead may have been captured without additional form data
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* AI & Logic Responses */}
            {sessionData?.responses && (
              <div className="p-6 border-t">
                <h3 className="text-lg font-semibold mb-4 text-foreground">AI & Logic Responses</h3>
                <div className="space-y-4">
                  {Object.entries(sessionData.responses).map(([sectionId, response]) => {
                    if (!isUserResponse(sectionId, response)) {
                      const aiResponse = formatAIResponse(response)
                      if (aiResponse) {
                        return (
                          <div key={sectionId} className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                              {getQuestionType(sectionId)}
                              <span>{getQuestionTitle(sectionId)}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{aiResponse}</p>
                          </div>
                        )
                      }
                    }
                    return null
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function LeadsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<LeadWithCampaign[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [selectedLead, setSelectedLead] = useState<LeadWithCampaign | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const leadsPerPage = 20

  // Lazy loading for export data
  const [exportData, setExportData] = useState<any[]>([])
  const [loadingExportData, setLoadingExportData] = useState(false)
  const [hasLoadedExportData, setHasLoadedExportData] = useState(false)

  // Delete state
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, currentPage, searchTerm, selectedCampaign, sortField, sortDirection])

  // Memoize sorted leads to prevent unnecessary re-sorting
  const sortedLeads = useMemo(() => {
    const leadsToSort = [...leads]
    
    leadsToSort.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'converted_at':
          aValue = a.converted_at ? new Date(a.converted_at) : new Date(0)
          bValue = b.converted_at ? new Date(b.converted_at) : new Date(0)
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'phone':
          aValue = a.phone || ''
          bValue = b.phone || ''
          break
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'campaign_name':
          aValue = a.campaign?.name || ''
          bValue = b.campaign?.name || ''
          break
        case 'conversion_time':
          aValue = calculateConversionTime(a.created_at, a.converted_at).seconds
          bValue = calculateConversionTime(b.created_at, b.converted_at).seconds
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return leadsToSort
  }, [leads, sortField, sortDirection])

  const loadData = async () => {
    try {
      setLoadingData(true)
      setError(null)

      // Load profile and campaigns in parallel
      const [profileResult, campaignsResult] = await Promise.all([
        getCurrentProfile(),
        getCampaigns({ page: 1, per_page: 100 })
      ])

      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data)
      }

      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data.data || [])
      }

      // Prepare pagination params
      const paginationParams: PaginationParams & {
        campaign_id?: string;
        campaign_ids?: string[];
        search?: string;
      } = {
        page: currentPage,
        per_page: leadsPerPage
      }

      // Add filters
      if (selectedCampaign !== 'all') {
        paginationParams.campaign_id = selectedCampaign
      } else {
        // Only show leads for campaigns owned by the user
        const userCampaignIds = campaignsResult.data?.data?.map((c: any) => c.id) || []
        paginationParams.campaign_ids = userCampaignIds
      }

      if (searchTerm) {
        paginationParams.search = searchTerm
      }

      // Load leads
      const leadsResult = await getLeads(paginationParams)

      if (!leadsResult.success) {
        throw new Error(leadsResult.error || 'Failed to load leads')
      }

      if (leadsResult.data) {
        // Enrich leads with campaign data
        const enrichedLeads: LeadWithCampaign[] = leadsResult.data.data?.map((lead: Lead) => {
          const campaign = campaignsResult.data?.data?.find((c: any) => c.id === lead.campaign_id) || null
          return { ...lead, campaign }
        }) || []

        setLeads(enrichedLeads)
        setTotalLeads(leadsResult.data.meta?.total || 0)
        setTotalPages(Math.ceil((leadsResult.data.meta?.total || 0) / leadsPerPage))
      }
    } catch (err) {
      console.error('Error loading leads data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Lazy load export data only when needed
  const loadExportData = async () => {
    if (hasLoadedExportData) return

    try {
      setLoadingExportData(true)
      const exportResult = await getLeadsExportData({
        searchTerm,
        selectedCampaign,
        sortField,
        sortDirection,
        includeCompleted: true,
        maxRecords: 1000
      }, profile)
      
      if (exportResult.success && exportResult.data) {
        setExportData(exportResult.data)
      } else {
        console.error('Failed to load export data:', exportResult.error)
        setExportData([])
      }
      setHasLoadedExportData(true)
    } catch (error) {
      console.error('Error loading export data:', error)
      setExportData([])
    } finally {
      setLoadingExportData(false)
    }
  }

  const handleExportStart = () => {
    if (!hasLoadedExportData) {
      loadExportData()
    }
    console.log('Export started...')
  }

  const handleExportComplete = (filename: string) => {
    console.log(`Export completed: ${filename}`)
  }

  const handleExportError = (error: string) => {
    console.error('Export error:', error)
    setError(`Export failed: ${error}`)
  }

  const handleViewLeadDetails = (lead: LeadWithCampaign) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLead(null)
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingLeadId(leadId)
      const result = await deleteLead(leadId)
      
      if (result.success) {
        // Remove lead from local state immediately for better UX
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId))
        setTotalLeads(prev => prev - 1)
        
        // Also remove from export data if present
        setExportData(prevData => prevData.filter(item => item.id !== leadId))
      } else {
        setError(result.error || 'Failed to delete lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      setError('Failed to delete lead')
    } finally {
      setDeletingLeadId(null)
    }
  }

  const getCampaignBadge = (campaign: Campaign | null) => {
    if (!campaign) {
      return <Badge variant="outline">Unknown</Badge>
    }
    
    const colors = {
      published: 'default',
      draft: 'secondary', 
      archived: 'outline'
    } as const

    return (
      <div className="max-w-[140px]">
        <Badge variant={colors[campaign.status] || 'outline'} className="truncate inline-block max-w-full" title={campaign.name}>
          {campaign.name}
        </Badge>
      </div>
    )
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
      <header className="bg-background shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <FlintLogo size="sm" showText={false} className="!h-6 !w-auto" />
              <span className="mx-4 text-gray-300 select-none">|</span>
              <nav className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/leads')}
                  className="text-sm font-medium text-primary"
                >
                  Leads
                </Button>
              </nav>
            </div>
            {/* Avatar dropdown only */}
            <div className="relative ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <span className="text-base font-medium text-blue-600">
                      {user?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {/* signOut logic here */}} className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-lg text-foreground">{totalLeads}</span>
                <span className="ml-1">total leads</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ExportButton
                data={exportData}
                source="leads"
                title="Export Leads Data"
                defaultFields={getLeadsExportFields()}
                onExportStart={handleExportStart}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                variant="outline"
                size="sm"
                disabled={loadingExportData}
                showDropdown={true}
              />
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search leads by email, phone, or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Campaign Filter */}
                <div className="w-full sm:w-64">
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Tools</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <p className="font-medium">Error loading leads</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={loadData}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Database</CardTitle>
              <CardDescription>
                Manage and view all captured leads from your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : sortedLeads.length > 0 ? (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('name')}
                              className="hover:bg-accent font-medium"
                            >
                              Name
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('email')}
                              className="hover:bg-accent font-medium"
                            >
                              Email
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('phone')}
                              className="hover:bg-accent font-medium"
                            >
                              Phone
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('campaign_name')}
                              className="hover:bg-accent font-medium"
                            >
                              Tool
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('conversion_time')}
                              className="hover:bg-accent font-medium"
                            >
                              Time to Convert
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('created_at')}
                              className="hover:bg-accent font-medium"
                            >
                              Date Captured
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortedLeads.map((lead) => {
                          const conversionTime = calculateConversionTime(lead.created_at, lead.converted_at)
                          
                          return (
                            <tr key={lead.id} className="hover:bg-muted">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {lead.name || 'Anonymous'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{lead.email}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {lead.phone ? (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{lead.phone}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not provided</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {getCampaignBadge(lead.campaign)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-1 text-sm">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className={conversionTime.seconds > 0 ? 'font-medium' : 'text-muted-foreground'}>
                                    {conversionTime.formatted}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(lead.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewLeadDetails(lead)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteLead(lead.id)}
                                        disabled={deletingLeadId === lead.id}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {deletingLeadId === lead.id ? 'Deleting...' : 'Delete Lead'}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * leadsPerPage) + 1} to {Math.min(currentPage * leadsPerPage, totalLeads)} of {totalLeads} leads
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No leads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Leads will appear here once people start completing your campaigns.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    size="sm"
                  >
                    View Your Tools
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          campaign={selectedLead.campaign}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
} 