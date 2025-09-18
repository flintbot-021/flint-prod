'use client'

import React from 'react'
import { SectionWithOptions } from '@/lib/types/database'
import { AssetSectionRenderer } from './AssetSectionRenderer'
import { cn } from '@/lib/utils'

interface MockupRendererProps {
  sections: SectionWithOptions[]
  testInputs: Record<string, any>
  templateId: string
  backgroundId: string
  screenType: 'questions' | 'output'
  className?: string
}

const BACKGROUND_OPTIONS = {
  'gradient-1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'solid-1': '#ffffff',
  'solid-2': '#f8fafc',
  'solid-3': '#1e293b'
}

export function MockupRenderer({ 
  sections, 
  testInputs, 
  templateId, 
  backgroundId, 
  screenType,
  className 
}: MockupRendererProps) {
  
  // Filter sections based on screen type
  const relevantSections = screenType === 'questions' 
    ? sections.filter(section => 
        section.type === 'text_question' ||
        section.type === 'multiple_choice' ||
        section.type === 'slider' ||
        section.type === 'date_time_question' ||
        section.type === 'upload_question' ||
        section.type === 'info' ||
        section.type === 'content-hero' ||
        section.type === 'content-basic'
      )
    : sections.filter(section => 
        section.type === 'output' ||
        section.type === 'dynamic_redirect' ||
        section.type === 'html_embed'
      )

  // Get the first relevant section to display
  const sectionToRender = relevantSections[0]

  const backgroundStyle = BACKGROUND_OPTIONS[backgroundId as keyof typeof BACKGROUND_OPTIONS] || BACKGROUND_OPTIONS['gradient-1']

  // Render different mockup templates
  const renderMockup = () => {
    switch (templateId) {
      case 'phone-1':
        return (
          <div className="relative mx-auto" style={{ width: '300px', height: '600px' }}>
            {/* iPhone Frame */}
            <div className="absolute inset-0 bg-black rounded-[3rem] p-2">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                {/* iPhone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                
                {/* Screen Content */}
                <div className="w-full h-full overflow-hidden">
                  {sectionToRender && (
                    <AssetSectionRenderer 
                      section={sectionToRender} 
                      testInputs={testInputs}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'desktop-1':
        return (
          <div className="relative mx-auto" style={{ width: '600px', height: '400px' }}>
            {/* MacBook Frame */}
            <div className="absolute inset-0">
              {/* Screen */}
              <div className="w-full h-[85%] bg-black rounded-t-lg p-3">
                <div className="w-full h-full bg-white rounded-md overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="h-8 bg-gray-100 flex items-center px-3 border-b">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-5 bg-white rounded border text-xs flex items-center px-2 text-gray-500">
                        https://your-tool.com
                      </div>
                    </div>
                  </div>
                  
                  {/* Screen Content */}
                  <div className="h-[calc(100%-2rem)] overflow-hidden">
                    {sectionToRender && (
                      <AssetSectionRenderer 
                        section={sectionToRender} 
                        testInputs={testInputs}
                        className="h-full"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* MacBook Base */}
              <div className="absolute bottom-0 w-full h-[15%] bg-gray-300 rounded-b-lg"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-400 rounded-t"></div>
            </div>
          </div>
        )

      case 'tablet-1':
        return (
          <div className="relative mx-auto" style={{ width: '400px', height: '500px' }}>
            {/* iPad Frame */}
            <div className="absolute inset-0 bg-black rounded-[2rem] p-3">
              <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden relative">
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full"></div>
                
                {/* Screen Content */}
                <div className="w-full h-full overflow-hidden pb-6">
                  {sectionToRender && (
                    <AssetSectionRenderer 
                      section={sectionToRender} 
                      testInputs={testInputs}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="relative mx-auto max-w-md">
            {sectionToRender && (
              <AssetSectionRenderer 
                section={sectionToRender} 
                testInputs={testInputs}
              />
            )}
          </div>
        )
    }
  }

  return (
    <div 
      className={cn('flex items-center justify-center min-h-[600px] p-8', className)}
      style={{ background: backgroundStyle }}
    >
      {renderMockup()}
    </div>
  )
}
