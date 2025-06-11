'use client'

import React from 'react'
import { Info } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

export function InfoSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete
}: SectionRendererProps) {
  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: 'viewed',
      info_viewed: true
    })
  }

  return (
    <div className="h-full bg-background flex flex-col pb-20">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="h-8 w-8 text-blue-600" />
            </div>
            
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {title || 'Information'}
            </h1>
            
            {description && (
              <div className={cn(
                "text-muted-foreground space-y-4",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          {/* Content from config */}
          {config && (
            <div className="prose prose-gray max-w-none">
              {typeof config === 'string' ? (
                <div className="whitespace-pre-wrap">{config}</div>
              ) : (
                <>
                  {(config as any).content && (
                    <div className="whitespace-pre-wrap text-foreground">
                      {(config as any).content}
                    </div>
                  )}
                  
                  {(config as any).bullets && Array.isArray((config as any).bullets) && (
                    <ul className="list-disc list-inside space-y-2 text-foreground">
                      {(config as any).bullets.map((bullet: string, idx: number) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  
                  {(config as any).callout && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
                      <div className="flex">
                        <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                        <div className="text-blue-800">{(config as any).callout}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Info className="h-5 w-5 text-primary" />}
        label={`Info ${index + 1}`}
        actionButton={{
          label: 'Continue',
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 