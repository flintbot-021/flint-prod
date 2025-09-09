'use client'

import React from 'react'
import { Share2, Link, FileText, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getCampaignTheme } from './utils'
import type { Campaign } from '@/lib/types/database'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  campaign?: Campaign
  onShareResults: () => Promise<void>
  onShareForm: () => Promise<void>
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  campaign, 
  onShareResults, 
  onShareForm 
}: ShareModalProps) {
  const [isSharing, setIsSharing] = React.useState<'results' | 'form' | null>(null)
  const theme = getCampaignTheme(campaign)

  const handleShareResults = async () => {
    setIsSharing('results')
    try {
      await onShareResults()
    } finally {
      setIsSharing(null)
      onClose()
    }
  }

  const handleShareForm = async () => {
    setIsSharing('form')
    try {
      await onShareForm()
    } finally {
      setIsSharing(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Options
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to share this content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Results Option */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${theme.buttonColor}20` }}
              >
                <FileText 
                  className="h-5 w-5" 
                  style={{ color: theme.buttonColor }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Share Results Page</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Share a link with all your personalized results and content. 
                  Perfect for sharing with team members or stakeholders.
                </p>
              </div>
            </div>
            <Button
              onClick={handleShareResults}
              disabled={isSharing !== null}
              className="w-full"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
              }}
            >
              {isSharing === 'results' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Copying Link...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Results Link
                </>
              )}
            </Button>
          </div>

          {/* Share Form Option */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Link className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Share Clean Form</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Share the original form URL for others to take their own assessment. 
                  No personalized content included.
                </p>
              </div>
            </div>
            <Button
              onClick={handleShareForm}
              disabled={isSharing !== null}
              variant="outline"
              className="w-full"
            >
              {isSharing === 'form' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Form Link
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          <p>Both options copy links to your clipboard. Results links preserve all your personalized content.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
