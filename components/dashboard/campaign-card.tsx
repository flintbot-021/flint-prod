'use client'

import React, { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye,
  Calendar,
  Hammer,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Activity,
  Clock,
  Settings,
  Globe,
  Archive,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { CampaignStatus } from '@/lib/types/database'

interface CampaignWithStats {
  id: string
  name: string
  description: string | null
  status: CampaignStatus
  is_active: boolean
  user_key: string
  published_url: string | null
  updated_at: string
  leadCount: number
  completionRate: number
  viewCount: number
  lastActivity?: string
}

interface CampaignCardProps {
  campaign: CampaignWithStats
  onStatusChange: (campaignId: string, newStatus: CampaignStatus) => Promise<void>
  onDelete: (campaignId: string, campaignName: string) => Promise<void>
  onEdit: (campaign: CampaignWithStats) => void
}

const CampaignCard = memo(function CampaignCard({ 
  campaign, 
  onStatusChange, 
  onDelete, 
  onEdit 
}: CampaignCardProps) {
  const router = useRouter()

  const getStatusIcon = useCallback((status: CampaignStatus) => {
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
  }, [])

  const getStatusActions = useCallback((campaign: CampaignWithStats) => {
    const actions = []

    if (campaign.status === 'draft') {
      actions.push({
        label: 'Launch Tool',
        icon: Globe,
        action: () => onStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
      actions.push({
        label: 'Archive Tool',
        icon: Archive,
        action: () => onStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'published') {
      actions.push({
        label: 'Pause Tool',
        icon: FileText,
        action: () => onStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Archive Tool',
        icon: Archive,
        action: () => onStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'archived') {
      actions.push({
        label: 'Restore to Draft',
        icon: FileText,
        action: () => onStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Launch Tool',
        icon: Globe,
        action: () => onStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
    }

    return actions
  }, [onStatusChange])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  const handleBuildClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/campaigns/${campaign.id}/builder`)
  }, [router, campaign.id])

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(campaign)
  }, [onEdit, campaign])

  const handleViewLiveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const liveUrl = `${window.location.origin}/c/${campaign.user_key}/${campaign.published_url}`
    window.open(liveUrl, '_blank')
  }, [campaign.published_url, campaign.user_key])

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/campaigns/${campaign.id}/preview`, '_blank')
  }, [campaign.id])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(campaign.id, campaign.name)
  }, [onDelete, campaign.id, campaign.name])

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate mb-1 group-hover:text-primary transition-colors">
              {campaign.name}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {campaign.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {campaign.status === 'published' ? (
              campaign.is_active && campaign.published_url ? (
                <button
                  onClick={handleViewLiveClick}
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors hover:bg-green-100 bg-green-50 text-green-700 border-green-200`}
                  aria-label={`View live tool ${campaign.name}`}
                >
                  <div className="w-2 h-2 rounded-full mr-1.5 bg-green-500" />
                  <span>Live</span>
                  <Eye className="h-3 w-3 ml-1.5" aria-hidden="true" />
                </button>
              ) : (
                <Badge 
                  variant="default"
                  className="text-xs font-medium bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                >
                  <div className="w-2 h-2 rounded-full mr-1.5 bg-orange-500" />
                  <span>Inactive</span>
                </Badge>
              )
            ) : (
              <Badge 
                variant="secondary"
                className="text-xs font-medium bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              >
                {getStatusIcon(campaign.status)}
                <span className="ml-1 capitalize">{campaign.status}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
            <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">{campaign.viewCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Views</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
            <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">{campaign.leadCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Leads</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" aria-hidden="true" />
            <p className="text-lg font-bold text-foreground">
              {campaign.completionRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground font-medium">Rate</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>Updated {formatDate(campaign.updated_at)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuildClick}
              className="h-8 px-3"
              aria-label={`Build tool ${campaign.name}`}
            >
              <Hammer className="h-3 w-3 mr-1" aria-hidden="true" />
              Builder
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetailsClick}
              className="h-8 px-3"
              aria-label={`${campaign.status === 'published' && campaign.is_active ? 'View live campaign' : 'Preview campaign'} ${campaign.name}`}
            >
              {campaign.status === 'published' && campaign.is_active ? (
                <>
                  <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                  View Live
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
                  Preview
                </>
              )}
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label={`More actions for ${campaign.name}`}
              >
                <MoreVertical className="h-3 w-3" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={handleEditClick}
                className="flex items-center gap-2 text-sm"
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
                <span>Edit Tool</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {getStatusActions(campaign).map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action()
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
              {getStatusActions(campaign).length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete Tool</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
})

export { CampaignCard }
export type { CampaignWithStats, CampaignCardProps } 