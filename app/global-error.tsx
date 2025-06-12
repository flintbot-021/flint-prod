'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'GlobalErrorHandler',
        source: 'global_error_boundary'
      },
      extra: {
        digest: error.digest,
        timestamp: Date.now()
      }
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-900">
                Application Error
              </CardTitle>
              <CardDescription className="text-red-700">
                An unexpected error occurred in the application. This error has been reported and we're working to fix it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-2">
                <Button
                  onClick={reset}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Error ID: {error.digest || 'unknown'}
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
} 