'use client'

import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, removeToast } from './use-toast'

// Helper function to highlight quoted text in descriptions
const formatDescription = (description: string) => {
  // Split by quotes and wrap quoted content in highlighted spans
  const parts = description.split('"')
  return parts.map((part, index) => {
    // Every odd index is inside quotes
    if (index % 2 === 1) {
      return (
        <span 
          key={index} 
          className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm border"
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
            "animate-in slide-in-from-top-full sm:slide-in-from-bottom-full",
            toast.variant === 'destructive'
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border bg-background text-foreground"
          )}
        >
          <div className="grid gap-1">
            <div className="flex items-center space-x-2">
              {toast.variant === 'destructive' ? (
                <AlertCircle className="h-4 w-4" />
              ) : toast.title.includes('💡') ? (
                <Info className="h-4 w-4 text-blue-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <div className="text-sm font-semibold">{toast.title}</div>
            </div>
            {toast.description && (
              <div className="text-sm opacity-90 leading-relaxed">
                {formatDescription(toast.description)}
              </div>
            )}
          </div>
          <button
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            onClick={() => removeToast(toast.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
} 