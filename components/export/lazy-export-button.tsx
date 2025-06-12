'use client'

import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { ExportButtonProps } from '@/components/export'

// Lazy load the ExportButton component
const ExportButton = lazy(() => import('@/components/export').then(module => ({ default: module.ExportButton })))

const LoadingButton = ({ variant = 'outline', size = 'sm', className = '' }: { variant?: string, size?: string, className?: string }) => (
  <Button variant={variant as any} size={size as any} disabled className={className}>
    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
    Loading...
  </Button>
)

export function LazyExportButton(props: ExportButtonProps) {
  return (
    <Suspense fallback={<LoadingButton variant={props.variant} size={props.size} className={props.className} />}>
      <ExportButton {...props} />
    </Suspense>
  )
} 