'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { getCampaigns, getCurrentProfile, getCampaignLeadStats, updateCampaign, publishCampaign, deleteCampaign, activateCampaign, deactivateCampaign } from '@/lib/data-access'
import { Campaign, Profile, CampaignStatus } from '@/lib/types/database'
import { 
  Plus, 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  Clock,
  Settings,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Target,
  Activity,
  MoreVertical,
  Archive,
  Globe,
  FileText,
  Hammer,
  Lock,
  Unlock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface CampaignWithStats extends Campaign {
  leadCount: number
  completionRate: number
  viewCount: number
  lastActivity?: string
}

export default function CampaignsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCampaignsAndProfile()
    }
  }, [user])

  const loadCampaignsAndProfile = async () => {
    try {
      setLoadingCampaigns(true)
      setError(null)

      // Load user profile and campaigns in parallel
      const [profileResult, campaignsResult] = await Promise.all([
        getCurrentProfile(),
        getCampaigns({ page: 1, per_page: 20 })
      ])

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to load profile')
      }

      if (!campaignsResult.success) {
        throw new Error(campaignsResult.error || 'Failed to load campaigns')
      }

      // Set profile with proper null check
      if (profileResult.data) {
        setProfile(profileResult.data)
      }

      // Access campaigns data correctly
      const campaignsData = campaignsResult.data?.data || []

      // Enhance campaigns with statistics
      const campaignsWithStats = await Promise.all(
        campaignsData.map(async (campaign: Campaign) => {
          const statsResult = await getCampaignLeadStats(campaign.id)
          const stats = statsResult.success && statsResult.data ? statsResult.data : {
            total: 0,
            completed: 0,
            conversion_rate: 0
          }

          return {
            ...campaign,
            leadCount: stats.total,
            completionRate: stats.conversion_rate,
            viewCount: stats.total, // For now, using total as view count
            lastActivity: campaign.updated_at
          } as CampaignWithStats
        })
      )

      setCampaigns(campaignsWithStats)
    } catch (err) {
      console.error('Error loading campaigns:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const getStatusColor = (status: CampaignStatus): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: CampaignStatus) => {
    switch (status) {
      case 'published':
        return <Activity className="h-3 w-3" />
      case 'draft':
        return <Clock className="h-3 w-3" />
      case 'archived':
        return <Settings className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const canCreateCampaign = profile && 
    profile.monthly_campaigns_used < profile.monthly_campaign_limit

  // Status management functions
  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      setError(null)
      
      let result
      if (newStatus === 'published') {
        // Use publishCampaign for publishing
        result = await publishCampaign(campaignId)
      } else {
        // Use updateCampaign for other status changes
        result = await updateCampaign(campaignId, { status: newStatus })
      }

      if (!result.success) {
        throw new Error(result.error || `Failed to ${newStatus === 'published' ? 'publish' : 'update'} campaign`)
      }

      // Reload campaigns to reflect changes
      await loadCampaignsAndProfile()
    } catch (err) {
      console.error('Error updating campaign status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setError(null)
      
      const result = await deleteCampaign(campaignId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete campaign')
      }

      // Reload campaigns to reflect changes
      await loadCampaignsAndProfile()
    } catch (err) {
      console.error('Error deleting campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleActivateCampaign = async (campaignId: string) => {
    try {
      setError(null)
      
      const result = await activateCampaign(campaignId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate campaign')
      }

      // Reload campaigns to reflect changes
      await loadCampaignsAndProfile()
    } catch (err) {
      console.error('Error activating campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeactivateCampaign = async (campaignId: string) => {
    try {
      setError(null)
      
      const result = await deactivateCampaign(campaignId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate campaign')
      }

      // Reload campaigns to reflect changes
      await loadCampaignsAndProfile()
    } catch (err) {
      console.error('Error deactivating campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const getStatusActions = (campaign: CampaignWithStats) => {
    const actions = []

    // Status transition actions
    if (campaign.status === 'draft') {
      actions.push({
        label: 'Publish Campaign',
        icon: Globe,
        action: () => handleStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
      actions.push({
        label: 'Archive Campaign',
        icon: Archive,
        action: () => handleStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'published') {
      // Activation controls for published campaigns
      if (campaign.is_active) {
        actions.push({
          label: 'Deactivate Campaign',
          icon: Lock,
          action: () => handleDeactivateCampaign(campaign.id),
          variant: 'secondary' as const
        })
      } else {
        actions.push({
          label: 'Activate Campaign',
          icon: Unlock,
          action: () => handleActivateCampaign(campaign.id),
          variant: 'default' as const
        })
      }
      
      actions.push({
        label: 'Unpublish (Draft)',
        icon: FileText,
        action: () => handleStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Archive Campaign',
        icon: Archive,
        action: () => handleStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'archived') {
      actions.push({
        label: 'Restore to Draft',
        icon: FileText,
        action: () => handleStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Publish Campaign',
        icon: Globe,
        action: () => handleStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
    }

    return actions
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Campaigns
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Usage Stats & Create Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {profile.monthly_campaigns_used} / {profile.monthly_campaign_limit}
                  </span>
                  <span className="ml-1">campaigns used this month</span>
                </div>
              )}
            </div>
            <Button 
              onClick={() => router.push('/dashboard/campaigns/create')}
              disabled={!canCreateCampaign}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Campaign</span>
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <p className="font-medium">Error loading campaigns</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={loadCampaignsAndProfile}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loadingCampaigns && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Analytics Dashboard */}
          {!loadingCampaigns && campaigns.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Campaigns */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                        <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Leads */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Leads</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {campaigns.reduce((sum, campaign) => sum + campaign.leadCount, 0)}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Average Completion Rate */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {campaigns.length > 0 
                            ? Math.round(campaigns.reduce((sum, campaign) => sum + campaign.completionRate, 0) / campaigns.length)
                            : 0
                          }%
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Published Campaigns */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Published</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {campaigns.filter(c => c.status === 'published').length}
                          </p>
                          <div className="text-xs">
                            {(() => {
                              const published = campaigns.filter(c => c.status === 'published')
                              const active = published.filter(c => c.is_active).length
                              const inactive = published.length - active
                              return (
                                <div className="space-y-0.5">
                                  {active > 0 && (
                                    <div className="flex items-center space-x-1 text-green-600">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                      <span>{active} active</span>
                                    </div>
                                  )}
                                  {inactive > 0 && (
                                    <div className="flex items-center space-x-1 text-orange-600">
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                      <span>{inactive} inactive</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Draft Campaigns */}
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-800">
                        {campaigns.filter(c => c.status === 'draft').length}
                      </p>
                      <p className="text-sm text-yellow-600">Draft Campaigns</p>
                    </div>

                    {/* Published Campaigns */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center mb-2">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-800">
                        {campaigns.filter(c => c.status === 'published').length}
                      </p>
                      <p className="text-sm text-green-600">Published Campaigns</p>
                    </div>

                    {/* Archived Campaigns */}
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center mb-2">
                        <Archive className="h-5 w-5 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {campaigns.filter(c => c.status === 'archived').length}
                      </p>
                      <p className="text-sm text-gray-600">Archived Campaigns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaigns Grid */}
          {!loadingCampaigns && campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {campaign.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {campaign.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="ml-2 flex flex-col items-end space-y-1">
                        <Badge 
                          variant="secondary" 
                          className={`flex items-center space-x-1 ${getStatusColor(campaign.status)}`}
                        >
                          {getStatusIcon(campaign.status)}
                          <span className="capitalize">{campaign.status}</span>
                        </Badge>
                        
                        {/* Activation Status Indicator for Published Campaigns */}
                        {campaign.status === 'published' && (
                          <div className="flex items-center space-x-1">
                            {campaign.is_active ? (
                              <div className="flex items-center space-x-1 text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 font-medium">Live</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-xs">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-orange-600 font-medium">Inactive</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Campaign Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{campaign.viewCount}</p>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{campaign.leadCount}</p>
                        <p className="text-xs text-gray-500">Leads</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {campaign.completionRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Rate</p>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {formatDate(campaign.updated_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/campaigns/${campaign.id}/edit`)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/campaigns/${campaign.id}/builder`)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Hammer className="h-3 w-3" />
                        </Button>
                        
                        {/* Status Management Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {getStatusActions(campaign).map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  action.action()
                                }}
                                className="flex items-center space-x-2"
                              >
                                <action.icon className="h-4 w-4" />
                                <span>{action.label}</span>
                              </DropdownMenuItem>
                            ))}
                            {getStatusActions(campaign).length > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCampaign(campaign.id, campaign.name)
                              }}
                              className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete Campaign</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {campaign.status === 'published' && campaign.published_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(campaign.published_url!, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Live
                        </Button>
                      )}
                      
                      {campaign.status !== 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/campaigns/${campaign.id}`)
                          }}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingCampaigns && campaigns.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2">No campaigns yet</CardTitle>
                <CardDescription className="mb-6 max-w-md mx-auto">
                  Create your first lead magnet campaign to start capturing and converting leads.
                </CardDescription>
                <Button 
                  onClick={() => router.push('/dashboard/campaigns/create')}
                  disabled={!canCreateCampaign}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Campaign</span>
                </Button>
                {!canCreateCampaign && profile && (
                  <p className="text-sm text-gray-500 mt-3">
                    You've reached your monthly campaign limit ({profile.monthly_campaign_limit}).
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Warning */}
          {profile && profile.monthly_campaigns_used >= profile.monthly_campaign_limit && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-yellow-800">
                  <p className="font-medium">Campaign Limit Reached</p>
                  <p className="text-sm mt-1">
                    You've used all {profile.monthly_campaign_limit} campaigns for this month. 
                    Upgrade your plan to create more campaigns.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push('/dashboard/settings/billing')}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 