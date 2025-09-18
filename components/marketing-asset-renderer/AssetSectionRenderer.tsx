'use client'

import React from 'react'
import { SectionWithOptions } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AssetSectionRendererProps {
  section: SectionWithOptions
  testInputs?: Record<string, any>
  className?: string
}

export function AssetSectionRenderer({ section, testInputs = {}, className }: AssetSectionRendererProps) {
  const config = (section.configuration || {}) as any
  const sectionValue = testInputs[section.id]

  // Helper to render different section types for marketing assets
  const renderSectionContent = () => {
    switch (section.type) {
      case 'content-hero':
      case 'info':
        // Check if this is a hero section
        const isHero = !!(
          config.overlayColor || 
          config.overlayOpacity !== undefined || 
          config.showButton !== undefined || 
          config.buttonText ||
          (config.image && (config.overlayColor || config.overlayOpacity !== undefined))
        )

        if (isHero) {
          return (
            <div 
              className="relative min-h-[400px] flex items-center justify-center text-white"
              style={{
                backgroundImage: config.image ? `url(${config.image})` : undefined,
                backgroundColor: config.overlayColor || '#1e293b',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {config.image && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: config.overlayColor || 'rgba(0,0,0,0.5)',
                    opacity: config.overlayOpacity !== undefined ? config.overlayOpacity / 100 : 0.5
                  }}
                />
              )}
              <div className="relative text-center space-y-6 max-w-2xl px-6">
                <h1 className="text-4xl md:text-6xl font-bold">
                  {config.headline || config.title || section.title || 'Welcome'}
                </h1>
                {(config.subheading || config.subtitle) && (
                  <p className="text-xl md:text-2xl opacity-90">
                    {config.subheading || config.subtitle}
                  </p>
                )}
                {config.showButton && (
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                    {config.buttonText || 'Get Started'}
                  </Button>
                )}
              </div>
            </div>
          )
        }

        // Regular content section
        return (
          <div className="py-12 px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {config.headline || config.title || section.title}
              </h2>
              {(config.content || config.description) && (
                <p className="text-gray-600">
                  {config.content || config.description}
                </p>
              )}
            </div>
          </div>
        )

      case 'text_question':
        return (
          <div className="py-12 px-6">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="text-gray-600">{section.description}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {config.question || 'Your answer'}
                </Label>
                <Input
                  value={sectionValue || ''}
                  placeholder={config.placeholder || 'Type your answer...'}
                  className="w-full"
                  readOnly
                />
              </div>
              <Button className="w-full">Continue</Button>
            </div>
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="py-12 px-6">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="text-gray-600">{section.description}</p>
                )}
              </div>
              <div className="space-y-3">
                {(config.options || []).map((option: any, index: number) => {
                  const optionText = typeof option === 'string' ? option : option.text || option.value
                  const isSelected = sectionValue === optionText
                  return (
                    <button
                      key={index}
                      className={cn(
                        'w-full p-4 text-left border rounded-lg transition-colors',
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {optionText}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'slider':
        return (
          <div className="py-12 px-6">
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.description && (
                  <p className="text-gray-600">{section.description}</p>
                )}
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="range"
                    min={config.minValue || 0}
                    max={config.maxValue || 10}
                    value={sectionValue || config.defaultValue || 5}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    readOnly
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{config.minLabel || 'Low'}</span>
                  <span className="font-medium text-blue-600">
                    {sectionValue || config.defaultValue || 5}
                  </span>
                  <span>{config.maxLabel || 'High'}</span>
                </div>
              </div>
              <Button className="w-full">Continue</Button>
            </div>
          </div>
        )

      case 'output':
        return (
          <div className="py-12 px-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {config.headline || 'Your Results'}
                </h2>
                {config.description && (
                  <p className="text-gray-600">{config.description}</p>
                )}
              </div>
              
              {/* Mock output content */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Personalized Recommendation</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Based on your responses, we've created a customized plan just for you. 
                      This takes into account your preferences and goals to provide the most 
                      relevant recommendations.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Review your personalized results
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Download your custom report
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Get started with your plan
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-4">
                <Button className="flex-1">Download Report</Button>
                <Button variant="outline" className="flex-1">Share Results</Button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="py-12 px-6 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {section.title || 'Section'}
              </h2>
              <p className="text-gray-600">
                {section.description || `${section.type} section`}
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn('bg-white', className)}>
      {renderSectionContent()}
    </div>
  )
}
