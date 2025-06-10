'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Code2, Variable, Eye, Lightbulb } from 'lucide-react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { getVariablesFromSections } from '@/lib/utils/section-variables'
import { toast } from '@/components/ui/use-toast'
import { getAITestResults, hasAITestResults } from '@/lib/utils/ai-test-storage'
import { interpolateVariables } from '@/lib/utils/variable-interpolator'

interface HtmlEmbedSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  allSections?: CampaignSection[]
}

interface HtmlEmbedSettings {
  htmlContent: string
  previewTitle: string
}

export function HtmlEmbedSection({
  section,
  isPreview = false,
  onUpdate,
  className,
  allSections = []
}: HtmlEmbedSectionProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const settings = (section.settings || {}) as unknown as HtmlEmbedSettings
  
  // Get all available variables from campaign sections
  const availableVariables = useMemo(() => {
    return getVariablesFromSections(allSections)
  }, [allSections])

  const updateSettings = async (newSettings: Partial<HtmlEmbedSettings>) => {
    await onUpdate({
      settings: { ...settings, ...newSettings }
    })
  }

  const generatePrompt = () => {
    const variableList = availableVariables.map(v => `- @${v.name} (${v.description || 'campaign variable'})`).join('\n')
    
    const prompt = `I need a single HTML snippet with embedded CSS and JavaScript that creates an attractive, responsive results page. Please make it self-contained (all CSS and JS inline) and use the following variables.

Available Variables:
${variableList || '- No variables available yet (add question sections or AI logic to generate variables)'}

Variable Usage Options:
1. Direct replacement: Use @variablename anywhere in your HTML and it will be replaced with the actual value
   Example: <h1>Hello @name!</h1> → <h1>Hello John!</h1>

2. Element attributes: Use variable-name="variablename" on elements for dynamic content
   Example: <h1 variable-name="name">Default Name</h1>
   Example: <span variable-name="score">0</span>

3. Advanced features (optional):
   - Formatters: @price | currency, @name | uppercase, @description | truncate:100
   - Conditionals: {if @score > 80}Excellent job!{/if}
   - Nested variables: @user.profile.name (if using nested data)

Instructions:
- Create a complete HTML snippet with embedded <style> and <script> tags
- DO NOT include <html>, <body>, <head>, or <!DOCTYPE> tags - this will be injected into an existing page
- Start with a main container div and include all CSS in <style> tags and JS in <script> tags within the snippet
- Make it visually appealing and mobile-responsive
- Include fallback text for elements in case variables aren't available
- Style it to look professional and modern
- You can use either @variable replacement OR variable-name attributes (or both)

Example structure:
<div class="results-container">
  <style>
    .results-container { /* your styles */ }
  </style>
  
  <h1>Hello @name!</h1>
  <p variable-name="score">Default score</p>
  
  <script>
    // Any JavaScript logic here
  </script>
</div>

The final HTML should be ready to paste directly into our system and will automatically populate with the user's actual data using our advanced variable interpolation system.`

    return prompt
  }

  const copyPrompt = async () => {
    const prompt = generatePrompt()
    try {
      await navigator.clipboard.writeText(prompt)
      toast({
        title: 'Prompt copied!',
        description: 'The AI prompt has been copied to your clipboard. Take it to ChatGPT, Claude, or your preferred AI to generate the HTML.'
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy prompt to clipboard',
        variant: 'destructive'
      })
    }
  }

  // Process HTML content with AI test data using the established variable interpolation system
  const processHtmlWithTestData = (htmlContent: string) => {
    const testData = getAITestResults()
    
    if (Object.keys(testData).length === 0) {
      return htmlContent // No test data available
    }

    // Step 1: Use the established variable interpolation system for @variable references
    const interpolationResult = interpolateVariables(htmlContent, testData, {
      enableConditionalContent: true,
      enableFormatting: true,
      enableNestedAccess: true,
      missingVariablePlaceholder: '[variable not found]'
    })

    let processedHtml = interpolationResult.content

    // Step 2: Add JavaScript to populate elements with variable-name attributes
    const scriptToInject = `
      <script>
        (function() {
          const testData = ${JSON.stringify(testData)};
          
          // Find all elements with variable-name attributes
          document.querySelectorAll('[variable-name]').forEach(element => {
            const variableName = element.getAttribute('variable-name');
            if (testData[variableName] !== undefined) {
              // Replace the content with test data
              if (element.tagName === 'INPUT') {
                element.value = testData[variableName];
              } else {
                element.textContent = testData[variableName];
              }
            }
          });
        })();
      </script>
    `

    // Inject the script at the end of the HTML
    if (processedHtml.includes('</body>')) {
      processedHtml = processedHtml.replace('</body>', scriptToInject + '</body>')
    } else if (processedHtml.includes('</html>')) {
      processedHtml = processedHtml.replace('</html>', scriptToInject + '</html>')
    } else {
      processedHtml = processedHtml + scriptToInject
    }

    return processedHtml
  }

  // Simple preview of the HTML content
  const renderPreview = () => {
    if (!settings.htmlContent) {
      return (
        <div className="py-16 px-6 bg-gradient-to-br from-slate-50 to-blue-50 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {settings.previewTitle || 'HTML Embed Results'}
          </h3>
          <p className="text-gray-600">
            Paste your custom HTML code to see it rendered here
          </p>
        </div>
      )
    }

    const hasTestData = hasAITestResults()
    const processedHtml = hasTestData ? processHtmlWithTestData(settings.htmlContent) : settings.htmlContent

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className={cn(
          "px-4 py-2 border-b text-sm",
          hasTestData 
            ? "bg-green-50 text-green-800" 
            : "bg-yellow-50 text-yellow-800"
        )}>
          {hasTestData ? (
            <>✅ Preview with AI test data - Variables are populated with actual results from AI Logic section</>
          ) : (
            <>⚠️ Preview Mode - Variables (@name, @score, etc.) will be replaced with actual data when campaign runs</>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      </div>
    )
  }

  if (isPreview) {
    return <div className={cn(className)}>{renderPreview()}</div>
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-500" />
            HTML Embed Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="previewTitle">Preview Title (Optional)</Label>
            <input
              id="previewTitle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.previewTitle || ''}
              onChange={(e) => updateSettings({ previewTitle: e.target.value })}
              placeholder="Custom Results Page"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="htmlContent">HTML Content</Label>
            <Textarea
              id="htmlContent"
              value={settings.htmlContent || ''}
              onChange={(e) => updateSettings({ htmlContent: e.target.value })}
              placeholder="Paste your HTML/CSS/JS code here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5 text-purple-500" />
            Available Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableVariables.map(variable => (
              <Badge key={variable.name} variant="outline">
                @{variable.name}
              </Badge>
            ))}
          </div>
          {availableVariables.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add question sections or AI logic to generate variables
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Prompt Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            Generate AI Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this prompt and take it to ChatGPT, Claude, or your preferred AI to generate custom HTML that uses your campaign variables.
          </p>
          
          <Button onClick={copyPrompt} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy AI Prompt to Clipboard
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">📋 How to use:</h4>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Click "Copy AI Prompt" above</li>
              <li>Go to ChatGPT, Claude, or your preferred AI tool</li>
              <li>Paste the prompt and hit enter</li>
              <li>Copy the generated HTML code</li>
              <li>Paste it into the "HTML Content" field above</li>
              <li>Your variables will automatically populate when the campaign runs!</li>
            </ol>
          </div>

          {availableVariables.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ Variables that will be available:</h4>
              <div className="space-y-1 text-sm text-green-800">
                {availableVariables.map(variable => (
                  <div key={variable.name} className="flex items-start gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 font-mono text-xs">
                      @{variable.name}
                    </Badge>
                    <span className="text-xs text-green-700">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">HTML Preview</h3>
              <Button onClick={() => setShowPreviewModal(false)} variant="ghost" size="sm">
                ×
              </Button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              {renderPreview()}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setShowPreviewModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HtmlEmbedSection 