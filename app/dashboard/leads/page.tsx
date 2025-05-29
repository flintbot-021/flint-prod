'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { 
  getLeads,
  getCampaigns,
  getCurrentProfile,
  type PaginationParams
} from '@/lib/data-access'
import { Lead, Campaign, Profile } from '@/lib/types/database'
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
  Trash2
} from 'lucide-react'

interface LeadWithCampaign extends Lead {
  campaign: Campaign | null
}

type SortField = 'created_at' | 'email' | 'phone' | 'campaign_name'
type SortDirection = 'asc' | 'desc'

export default function LeadsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<LeadWithCampaign[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, currentPage, searchTerm, selectedCampaign, sortField, sortDirection]) // eslint-disable-line react-hooks/exhaustive-deps

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
      const paginationParams: PaginationParams = {
        page: currentPage,
        per_page: leadsPerPage
      }

      // Load leads
      const leadsResult = await getLeads(paginationParams)

      if (!leadsResult.success) {
        throw new Error(leadsResult.error || 'Failed to load leads')
      }

      if (leadsResult.data) {
        // Enrich leads with campaign data
        const enrichedLeads: LeadWithCampaign[] = leadsResult.data.data?.map((lead: Lead) => {
          const campaign = campaignsResult.data?.data?.find(c => c.id === lead.campaign_id) || null
          return { ...lead, campaign }
        }) || []

        // Apply client-side filtering and sorting
        let filteredLeads = enrichedLeads

        // Filter by search term
        if (searchTerm) {
          filteredLeads = filteredLeads.filter(lead =>
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone?.includes(searchTerm) ||
            lead.campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Filter by campaign
        if (selectedCampaign !== 'all') {
          filteredLeads = filteredLeads.filter(lead => lead.campaign_id === selectedCampaign)
        }

        // Sort leads
        filteredLeads.sort((a, b) => {
          let aValue: string | number | Date
          let bValue: string | number | Date

          switch (sortField) {
            case 'created_at':
              aValue = new Date(a.created_at)
              bValue = new Date(b.created_at)
              break
            case 'email':
              aValue = a.email || ''
              bValue = b.email || ''
              break
            case 'phone':
              aValue = a.phone || ''
              bValue = b.phone || ''
              break
            case 'campaign_name':
              aValue = a.campaign?.name || ''
              bValue = b.campaign?.name || ''
              break
            default:
              aValue = a.created_at
              bValue = b.created_at
          }

          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
          return 0
        })

        setLeads(filteredLeads)
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

  const handleExportLeads = async () => {
    try {
      // Get all leads for export (up to reasonable limit)
      const allLeadsResult = await getLeads({ page: 1, per_page: 1000 })
      
      if (!allLeadsResult.success || !allLeadsResult.data) {
        throw new Error('Failed to load leads for export')
      }

      // Get campaigns for enrichment
      const campaignsResult = await getCampaigns({ page: 1, per_page: 100 })
      const campaignsMap = new Map()
      
      if (campaignsResult.success && campaignsResult.data) {
        campaignsResult.data.data?.forEach(campaign => {
          campaignsMap.set(campaign.id, campaign)
        })
      }

      // Create CSV data
      const csvData = [
        [
          'Email',
          'Phone', 
          'Campaign',
          'Lead Source',
          'UTM Source',
          'UTM Medium',
          'UTM Campaign',
          'Created Date',
          'Status'
        ].join(',')
      ]

      allLeadsResult.data.data?.forEach((lead: Lead) => {
        const campaign = campaignsMap.get(lead.campaign_id)

        csvData.push([
          lead.email || '',
          lead.phone || '',
          campaign?.name || '',
          lead.utm_source || 'Direct',
          lead.utm_source || '',
          lead.utm_medium || '',
          lead.utm_campaign || '',
          new Date(lead.created_at).toLocaleDateString(),
          'Active' // Could be enhanced with actual status field
        ].join(','))
      })

      // Download CSV
      const csvContent = csvData.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flint-leads-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting leads:', err)
      setError('Failed to export leads')
    }
  }

  const getContactBadge = (lead: Lead) => {
    if (lead.email && lead.phone) {
      return <Badge variant="default">Email + Phone</Badge>
    } else if (lead.email) {
      return <Badge variant="secondary">Email</Badge>
    } else if (lead.phone) {
      return <Badge variant="outline">Phone</Badge>
    }
    return <Badge variant="destructive">No Contact</Badge>
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
      <Badge variant={colors[campaign.status] || 'outline'}>
        {campaign.name}
      </Badge>
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
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Leads
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
          {/* Stats and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-lg text-gray-900">{totalLeads}</span>
                <span className="ml-1">total leads</span>
              </div>
              {profile && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {profile.monthly_leads_captured || 0} / {profile.monthly_leads_limit || 1000}
                  </span>
                  <span className="ml-1">leads this month</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLeads}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
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
                      placeholder="Search leads by email, phone, or campaign..."
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Campaigns</option>
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
              ) : leads.length > 0 ? (
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
                              onClick={() => handleSort('email')}
                              className="hover:bg-gray-100 font-medium"
                            >
                              Contact Info
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('campaign_name')}
                              className="hover:bg-gray-100 font-medium"
                            >
                              Campaign
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-left py-3 px-4">Source</th>
                          <th className="text-left py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('created_at')}
                              className="hover:bg-gray-100 font-medium"
                            >
                              Created
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </th>
                          <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  {lead.email && (
                                    <div className="flex items-center space-x-1">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm font-medium">{lead.email}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {lead.phone && (
                                    <div className="flex items-center space-x-1">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">{lead.phone}</span>
                                    </div>
                                  )}
                                  {getContactBadge(lead)}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getCampaignBadge(lead.campaign)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm">
                                <div className="text-gray-900">{lead.utm_source || 'Direct'}</div>
                                {lead.utm_source && (
                                  <div className="text-gray-500">
                                    {lead.utm_source || 'Unknown'}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
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
                        <span className="text-sm text-gray-600">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                  <p className="text-gray-500 mb-4">
                    Leads will appear here once people start completing your campaigns.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/campaigns')}
                    size="sm"
                  >
                    View Your Campaigns
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 