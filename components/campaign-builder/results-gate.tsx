'use client'

import React from 'react'
import { useResultsGating } from '@/contexts/capture-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultsGateProps {
  children: React.ReactNode
  className?: string
  lockedTitle?: string
  lockedMessage?: string
  showProgress?: boolean
}

export function ResultsGate({
  children,
  className,
  lockedTitle = "Results Locked",
  lockedMessage = "Complete the form above to unlock your personalized results.",
  showProgress = true
}: ResultsGateProps) {
  const { isResultsLocked, canAccessResults, captureCompleted } = useResultsGating()

  if (canAccessResults) {
    return <>{children}</>
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred/Hidden Content */}
      <div className="filter blur-sm pointer-events-none select-none opacity-30">
        {children}
      </div>
      
      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              {captureCompleted ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Lock className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {lockedTitle}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {lockedMessage}
            </p>
            
            {showProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    captureCompleted ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span>Form Completion</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResultsGate 