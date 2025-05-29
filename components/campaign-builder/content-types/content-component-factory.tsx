'use client'

import { CampaignSection } from '@/lib/types/campaign-builder'
import { InfoSection } from './info-section'
import { OutputSection } from './output-section'
import { cn } from '@/lib/utils'
import { AlertCircle, FileText, Image as ImageIcon, Type } from 'lucide-react'

interface ContentComponentFactoryProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function ContentComponentFactory({
  section,
  isPreview = false,
  onUpdate,
  className
}: ContentComponentFactoryProps) {
  // Route to appropriate content component based on section type
  switch (section.type) {
    case 'info':
    case 'text-block':
    case 'image-block':
    case 'hero':
    case 'content':
      return (
        <InfoSection
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // Video section (future implementation)
    case 'video':
      return (
        <PlaceholderSection
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
          icon={<FileText className="h-8 w-8" />}
          message="Video section component coming soon"
        />
      )

    // Divider section (simple implementation)
    case 'divider':
      if (isPreview) {
        return (
          <div className={cn('py-6', className)}>
            <hr className="border-gray-300" />
          </div>
        )
      }
      return (
        <SimpleDividerEditor
          section={section}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // Spacer section (simple implementation)
    case 'spacer':
      const height = (section.settings?.height as number) || 40
      if (isPreview) {
        return (
          <div 
            className={cn('w-full', className)}
            style={{ height: `${height}px` }}
          />
        )
      }
      return (
        <SimpleSpacerEditor
          section={section}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // Output sections
    case 'output-results':
    case 'output-download':
    case 'output-redirect':
      return (
        <OutputSection
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // Fallback for unknown content section types
    default:
      return (
        <PlaceholderSection
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
          icon={<FileText className="h-8 w-8" />}
          message={`Content component for "${section.type}" not implemented yet`}
        />
      )
  }
}

// Placeholder component for unimplemented section types
function PlaceholderSection({
  section,
  isPreview = false,
  onUpdate,
  className,
  icon,
  message
}: ContentComponentFactoryProps & {
  icon: React.ReactNode
  message: string
}) {
  if (isPreview) {
    return (
      <div className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <div className="text-gray-400">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {section.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {section.type} section
            </p>
          </div>
          {section.settings?.content && typeof section.settings.content === 'string' && (
            <div className="text-gray-700 max-w-md mx-auto">
              {section.settings.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {message}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Use the section controls above to configure basic settings.
            </p>
          </div>
        </div>

        {/* Basic content editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={String(section.settings?.content || '')}
            onChange={(e) => onUpdate({
              settings: {
                ...section.settings,
                content: e.target.value
              }
            })}
            placeholder="Enter content for this section..."
            className="w-full p-3 border border-gray-200 rounded-lg"
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}

// Simple divider editor
function SimpleDividerEditor({
  section,
  onUpdate,
  className
}: Pick<ContentComponentFactoryProps, 'section' | 'onUpdate' | 'className'>) {
  const style = (section.settings?.style as string) || 'solid'
  const color = (section.settings?.color as string) || '#d1d5db'
  const thickness = (section.settings?.thickness as number) || 1

  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            value={style}
            onChange={(e) => onUpdate({
              settings: {
                ...section.settings,
                style: e.target.value
              }
            })}
            className="w-full p-2 border border-gray-200 rounded"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => onUpdate({
                settings: {
                  ...section.settings,
                  color: e.target.value
                }
              })}
              className="w-full h-10 border border-gray-200 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thickness (px)
            </label>
            <input
              type="number"
              value={thickness}
              onChange={(e) => onUpdate({
                settings: {
                  ...section.settings,
                  thickness: parseInt(e.target.value) || 1
                }
              })}
              min={1}
              max={10}
              className="w-full p-2 border border-gray-200 rounded"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <hr 
            style={{
              borderStyle: style,
              borderColor: color,
              borderWidth: `${thickness}px 0 0 0`
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Simple spacer editor
function SimpleSpacerEditor({
  section,
  onUpdate,
  className
}: Pick<ContentComponentFactoryProps, 'section' | 'onUpdate' | 'className'>) {
  const height = (section.settings?.height as number) || 40

  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (px)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => onUpdate({
              settings: {
                ...section.settings,
                height: parseInt(e.target.value) || 40
              }
            })}
            min={10}
            max={200}
            className="w-full p-2 border border-gray-200 rounded"
          />
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div 
            className="w-full bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-500"
            style={{ height: `${height}px` }}
          >
            {height}px spacer
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the info section for direct use
export { InfoSection } 