'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Globe, Code, Eye, Settings, Variable, Plus, Trash2, ExternalLink } from 'lucide-react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { getVariablesFromSections } from '@/lib/utils/section-variables'
import { toast } from '@/components/ui/use-toast'

interface DynamicRedirectSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  allSections?: CampaignSection[]
}

interface DynamicRedirectSettings {
  targetUrl: string
  dataTransmissionMethod: 'localStorage' | 'sessionStorage' | 'urlParams' | 'postMessage'
  delay: number
  showPreloader: boolean
  preloaderMessage: string
}

export function DynamicRedirectSection({
  section,
  isPreview = false,
  onUpdate,
  className,
  allSections = []
}: DynamicRedirectSectionProps) {
  const [showScriptModal, setShowScriptModal] = useState(false)

  const settings = (section.settings || {}) as unknown as DynamicRedirectSettings
  
  // Get all available variables from campaign sections
  const availableVariables = useMemo(() => {
    return getVariablesFromSections(allSections)
  }, [allSections])

  const updateSettings = async (newSettings: Partial<DynamicRedirectSettings>) => {
    await onUpdate({
      settings: { ...settings, ...newSettings }
    })
  }



  const generateScript = () => {
    const method = settings.dataTransmissionMethod || 'postMessage'
    
    const script = `<!-- Flint Campaign Dynamic Data Script -->
<script>
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    dataSource: '${method}',
    storageKey: 'flint_campaign_data',
    debug: true // TEMP: Always debug for testing
  };
  
  // Store for postMessage data
  let campaignData = {};
  
  // Get campaign data based on transmission method
  function getCampaignData() {
    try {
      switch (CONFIG.dataSource) {
        case 'postMessage':
          // Data comes via postMessage, return stored data
          return campaignData;
          
        case 'localStorage':
          const data = localStorage.getItem(CONFIG.storageKey);
          return data ? JSON.parse(data) : {};
          
        case 'sessionStorage':
          const sessionData = sessionStorage.getItem(CONFIG.storageKey);
          return sessionData ? JSON.parse(sessionData) : {};
          
        case 'urlParams':
          const urlParams = new URLSearchParams(window.location.search);
          const urlData = {};
          urlParams.forEach((value, key) => {
            urlData[key] = decodeURIComponent(value);
          });
          return urlData;
          
        default:
          return {};
      }
    } catch (error) {
      console.error('Error getting campaign data:', error);
      return {};
    }
  }
  
  // Apply data to elements automatically
  function applyDataToElements(data) {
    if (CONFIG.debug) {
      console.log('🚀 Flint Campaign Data:', data);
    }
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === undefined || value === null) return;
      
      if (CONFIG.debug) {
        console.log(\`🔍 Processing variable: @\${key} = "\${value}"\`);
      }
      
      // 1. Replace @variable in text content using a more robust approach
      function replaceInTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const originalText = node.textContent;
          if (originalText && originalText.includes(\`@\${key}\`)) {
            const newText = originalText.replace(
              new RegExp(\`@\${key}\\\\b\`, 'g'), 
              value
            );
            if (newText !== originalText) {
              node.textContent = newText;
              if (CONFIG.debug) {
                console.log(\`📝 Replaced @\${key} in text: "\${originalText}" → "\${newText}"\`);
              }
            }
          }
        } else {
          // Recursively process child nodes
          for (let child of node.childNodes) {
            replaceInTextNodes(child);
          }
        }
      }
      
      // Process the entire document body
      replaceInTextNodes(document.body);
      
      // 2. Replace data-variable attributes
      const attributeElements = document.querySelectorAll(\`[data-variable="\${key}"]\`);
      attributeElements.forEach(element => {
        element.textContent = value;
        if (CONFIG.debug) {
          console.log(\`🏷️ Set data-variable="\${key}" to: "\${value}"\`);
        }
      });
    });
  }
  
  // Initialize when DOM is ready
  function initialize() {
    const data = getCampaignData();
    if (Object.keys(data).length > 0) {
      applyDataToElements(data);
      
      // Optional: Clean up storage after use
      if (CONFIG.dataSource === 'localStorage') {
        localStorage.removeItem(CONFIG.storageKey);
      } else if (CONFIG.dataSource === 'sessionStorage') {
        sessionStorage.removeItem(CONFIG.storageKey);
      }
      
      if (CONFIG.debug) {
        console.log('✅ Flint Campaign data applied successfully');
      }
    } else {
      if (CONFIG.debug) {
        console.warn('⚠️ No campaign data found');
      }
    }
  }
  
  // Listen for postMessage data (for cross-origin communication)
  if (CONFIG.dataSource === 'postMessage') {
    window.addEventListener('message', function(event) {
      // In production, check event.origin for security
      if (event.data && event.data.type === 'FLINT_CAMPAIGN_DATA') {
        if (CONFIG.debug) {
          console.log('📨 Received campaign data via postMessage:', event.data.data);
        }
        campaignData = event.data.data || {};
        
        // Apply data immediately when received
        if (Object.keys(campaignData).length > 0) {
          applyDataToElements(campaignData);
          if (CONFIG.debug) {
            console.log('✅ Flint Campaign data applied via postMessage');
          }
        }
      }
    });
  }
  
  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
</script>`

    return script
  }

  const copyScript = async () => {
    const script = generateScript()
    try {
      await navigator.clipboard.writeText(script)
      toast({
        title: 'Script copied!',
        description: 'The dynamic data script has been copied to your clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy script to clipboard',
        variant: 'destructive'
      })
    }
  }

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 bg-gradient-to-br from-blue-50 to-purple-50', className)}>
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {settings.preloaderMessage || 'Preparing your personalized page...'}
            </h2>
            <p className="text-gray-600">
              {settings.targetUrl ? `Redirecting to: ${settings.targetUrl}` : 'Configure your Webflow page URL'}
            </p>
          </div>
          
          {settings.targetUrl && (
            <Button
              className="mt-6"
              onClick={() => window.open(settings.targetUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Webflow Page
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Dynamic Redirect Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Webflow Page URL</Label>
            <Input
              id="targetUrl"
              value={settings.targetUrl || ''}
              onChange={(e) => updateSettings({ targetUrl: e.target.value })}
              placeholder="https://yoursite.webflow.io/results"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Data Transmission</Label>
              <Select
                                  value={settings.dataTransmissionMethod || 'postMessage'}
                onValueChange={(value: any) => updateSettings({ dataTransmissionMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postMessage">PostMessage (Recommended)</SelectItem>
                  <SelectItem value="urlParams">URL Parameters</SelectItem>
                  <SelectItem value="localStorage">Local Storage</SelectItem>
                  <SelectItem value="sessionStorage">Session Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">Redirect Delay (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                max="10"
                value={settings.delay || 2}
                onChange={(e) => updateSettings({ delay: parseInt(e.target.value) || 2 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preloaderMessage">Preloader Message</Label>
            <Input
              id="preloaderMessage"
              value={settings.preloaderMessage || ''}
              onChange={(e) => updateSettings({ preloaderMessage: e.target.value })}
              placeholder="Preparing your personalized page..."
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

      {/* Webflow Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-500" />
            Webflow Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">📋 How to Use Variables in Your Webflow Page:</h4>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg">1.</span>
                <div>
                  <div className="font-medium">Inline Text Variables:</div>
                  <div>Type <code className="bg-blue-200 px-2 py-1 rounded font-mono">@variablename</code> directly in your Webflow text elements</div>
                  <div className="text-xs mt-1 opacity-75">Example: "Hello @name! Your score is @score."</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg">2.</span>
                <div>
                  <div className="font-medium">Element Attributes:</div>
                  <div>Add <code className="bg-blue-200 px-2 py-1 rounded font-mono">data-variable="variablename"</code> to any element</div>
                  <div className="text-xs mt-1 opacity-75">Example: &lt;div data-variable="recommendation"&gt;&lt;/div&gt;</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg">3.</span>
                <div>
                  <div className="font-medium">Copy Script:</div>
                  <div>Use the "Copy Script" button below and paste into Webflow's custom code</div>
                  <div className="text-xs mt-1 opacity-75">Paste in Page Settings → Custom Code → Before &lt;/body&gt;</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✅ Available Variables You Can Use:</h4>
            <div className="flex flex-wrap gap-2">
              {availableVariables.length > 0 ? (
                availableVariables.map(variable => (
                  <Badge key={variable.name} variant="secondary" className="bg-green-100 text-green-800 font-mono">
                    @{variable.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-green-700">Variables will appear here when you add question sections or AI logic</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">💡 Real Examples:</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <div><span className="font-medium">Webflow Text:</span> <code className="bg-amber-200 px-1 rounded font-mono">"Thanks @name! Your result: @recommendation"</code></div>
              <div><span className="font-medium">Webflow Element:</span> <code className="bg-amber-200 px-1 rounded font-mono">&lt;h2 data-variable="score"&gt;&lt;/h2&gt;</code></div>
              <div><span className="font-medium">Button Text:</span> <code className="bg-amber-200 px-1 rounded font-mono">&lt;a data-variable="call_to_action"&gt;Click Here&lt;/a&gt;</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Script Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-orange-500" />
            Generated Script
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this script and paste it into your Webflow page's custom code section (before &lt;/body&gt;).
          </p>
          
          <div className="flex gap-2">
            <Button onClick={copyScript} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Script to Clipboard
            </Button>
            <Button 
              onClick={() => setShowScriptModal(true)}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Script
            </Button>
          </div>

          {/* Usage Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Usage Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the generated script above</li>
              <li>In Webflow, go to your page settings → Custom Code</li>
              <li>Paste the script in the "Before &lt;/body&gt; tag" section</li>
              <li>Add <code className="bg-blue-200 px-1 rounded">data-variable="variable-name"</code> attributes to elements</li>
              <li>Or use @variable text that will be automatically replaced</li>
              <li>Publish your Webflow site</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Generated Script</h3>
              <Button onClick={() => setShowScriptModal(false)} variant="ghost" size="sm">
                ×
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                <code>{generateScript()}</code>
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button onClick={() => setShowScriptModal(false)} variant="outline">
                Close
              </Button>
              <Button onClick={copyScript}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Script
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicRedirectSection 