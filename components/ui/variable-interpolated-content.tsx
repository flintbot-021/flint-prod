'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import type { 
  VariableInterpolationContext,
  InterpolationResult,
  VariablePreviewContext
} from '@/lib/types/output-section'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VariableInterpolatedContentProps {
  content: string
  context: VariableInterpolationContext
  className?: string
  showPreview?: boolean
  showDebugInfo?: boolean
  onInterpolationResult?: (result: InterpolationResult) => void
  enableRealTimeProcessing?: boolean
  fallbackContent?: string
  highlightVariables?: boolean
}

interface InterpolationDebugProps {
  result: InterpolationResult
  isVisible: boolean
  onToggle: () => void
}

// =============================================================================
// DEBUG COMPONENT
// =============================================================================

function InterpolationDebug({ result, isVisible, onToggle }: InterpolationDebugProps) {
  if (!isVisible) {
    return (
      <div className="flex items-center justify-between mt-2 p-2 bg-gray-50 rounded border">
        <div className="flex items-center space-x-2">
          <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
            {result.success ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Success
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Failed
              </>
            )}
          </Badge>
          
          <div className="text-xs text-gray-600">
            {result.processedVariables.length} variables processed
            {result.missingVariables.length > 0 && (
              <span className="text-amber-600 ml-1">
                • {result.missingVariables.length} missing
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 px-2"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Interpolation Debug Info</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 px-2"
        >
          <EyeOff className="h-3 w-3" />
        </Button>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-4">
        <Badge variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </>
          )}
        </Badge>
        
        <div className="text-xs text-gray-600">
          {result.processedVariables.length} processed • {result.missingVariables.length} missing
        </div>
      </div>

      {/* Processed Variables */}
      {result.processedVariables.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-1">Processed Variables:</div>
          <div className="flex flex-wrap gap-1">
            {result.processedVariables.map((variable, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700">
                @{variable}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Missing Variables */}
      {result.missingVariables.length > 0 && (
        <div>
          <div className="text-xs font-medium text-amber-700 mb-1">Missing Variables:</div>
          <div className="flex flex-wrap gap-1">
            {result.missingVariables.map((variable, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-amber-50 text-amber-700">
                @{variable}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Rules */}
      {result.usedConditionalRules.length > 0 && (
        <div>
          <div className="text-xs font-medium text-blue-700 mb-1">Applied Rules:</div>
          <div className="flex flex-wrap gap-1">
            {result.usedConditionalRules.map((rule, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {rule}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div>
          <div className="text-xs font-medium text-red-700 mb-1">Errors:</div>
          <div className="space-y-1">
            {result.errors.map((error, index) => (
              <div key={index} className="flex items-start space-x-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div>
          <div className="text-xs font-medium text-amber-700 mb-1">Warnings:</div>
          <div className="space-y-1">
            {result.warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HIGHLIGHTED CONTENT COMPONENT
// =============================================================================

function HighlightedContent({ content, highlightVariables }: { content: string; highlightVariables: boolean }) {
  if (!highlightVariables) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  // Simple highlighting of variable placeholders or error messages
  const highlightedContent = content
    .replace(/\[@([^\]]+) not found\]/g, '<span class="bg-red-100 text-red-700 px-1 rounded text-sm">[$1 not found]</span>')
    .replace(/\[Error: ([^\]]+)\]/g, '<span class="bg-red-100 text-red-700 px-1 rounded text-sm">[Error: $1]</span>')

  return <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VariableInterpolatedContent({
  content,
  context,
  className,
  showPreview = false,
  showDebugInfo = false,
  onInterpolationResult,
  enableRealTimeProcessing = true,
  fallbackContent = '',
  highlightVariables = false
}: VariableInterpolatedContentProps) {
  const [debugVisible, setDebugVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Create interpolator instance
  const interpolator = useMemo(() => new VariableInterpolator(), [])

  // Process content with variable interpolation
  const interpolationResult = useMemo(() => {
    if (!enableRealTimeProcessing) {
      return {
        success: true,
        content: content,
        processedVariables: [],
        missingVariables: [],
        errors: [],
        warnings: [],
        usedConditionalRules: []
      } as InterpolationResult
    }

    setIsProcessing(true)
    
    try {
      const result = interpolator.interpolate(content, context)
      return result
    } catch (error) {
      return {
        success: false,
        content: fallbackContent || content,
        processedVariables: [],
        missingVariables: [],
        errors: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        usedConditionalRules: []
      } as InterpolationResult
    } finally {
      setIsProcessing(false)
    }
  }, [content, context, interpolator, enableRealTimeProcessing, fallbackContent])

  // Notify parent component of interpolation result
  useEffect(() => {
    onInterpolationResult?.(interpolationResult)
  }, [interpolationResult, onInterpolationResult])

  // Determine what content to display
  const displayContent = useMemo(() => {
    if (showPreview && interpolationResult.success) {
      return interpolationResult.content
    }
    return content
  }, [showPreview, interpolationResult, content])

  return (
    <div className={cn('space-y-2', className)}>
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Processing variables...</span>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        'prose prose-sm max-w-none',
        !interpolationResult.success && 'bg-red-50 border border-red-200 rounded p-3'
      )}>
        <HighlightedContent 
          content={displayContent} 
          highlightVariables={highlightVariables}
        />
      </div>

      {/* Status Indicators */}
      {!interpolationResult.success && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          <span>Variable interpolation failed</span>
        </div>
      )}

      {interpolationResult.missingVariables.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span>{interpolationResult.missingVariables.length} variables missing</span>
        </div>
      )}

      {/* Debug Information */}
      {showDebugInfo && (
        <InterpolationDebug
          result={interpolationResult}
          isVisible={debugVisible}
          onToggle={() => setDebugVisible(!debugVisible)}
        />
      )}
    </div>
  )
}

export default VariableInterpolatedContent 