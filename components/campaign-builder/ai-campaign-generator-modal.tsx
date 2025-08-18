'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Sparkles, 
  Plus, 
  X, 
  Edit2, 
  Loader2,
  CheckCircle,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface SuggestedInput {
  id: string
  type: 'text_question' | 'multiple_choice' | 'slider' | 'date_time_question' | 'upload_question'
  variableName: string
  headline: string
  subheading: string
  placeholder?: string
  options?: string[]
  minValue?: number
  maxValue?: number
  step?: number
  minLabel?: string
  maxLabel?: string
  required: boolean
}

interface SuggestedOutput {
  id: string
  variableName: string
  name: string
  description: string
}

interface AISuggestions {
  inputs: SuggestedInput[]
  outputs: SuggestedOutput[]
  aiPrompt: string
}

interface CampaignIdea {
  description: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface AICampaignGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (suggestions: AISuggestions) => Promise<void>
  campaignId?: string
  campaignName?: string
}

export function AICampaignGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  campaignId,
  campaignName
}: AICampaignGeneratorModalProps) {
  const [step, setStep] = useState<'idea' | 'review'>('idea')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  
  // Step 1: Campaign Idea
  const [inputType, setInputType] = useState<'idea' | 'business'>('idea')
  const [campaignIdea, setCampaignIdea] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  
  // Step 2: AI Suggestions
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null)

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleClose = () => {
    // Reset state when closing
    setStep('idea')
    setCampaignIdea('')
    setSuggestions(null)
    setIsLoading(false)
    setIsGenerating(false)
    setGenerationComplete(false)
    onClose()
  }

  const handleGetSuggestions = async () => {
    const inputText = inputType === 'idea' ? campaignIdea.trim() : businessDescription.trim()
    if (!inputText) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-campaign-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: inputText,
          inputType: inputType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get suggestions')
      }

      const result = await response.json()
      setSuggestions(result.suggestions)
      setStep('review')
      
    } catch (error) {
      console.error('Error getting suggestions:', error)
      // Handle error - could show toast
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!suggestions) return
    
    setIsGenerating(true)
    try {
      await onGenerate(suggestions)
      setGenerationComplete(true)
      
      // Auto-close after success
      setTimeout(() => {
        handleClose()
      }, 2000)
      
    } catch (error) {
      console.error('Error generating campaign:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // =============================================================================
  // INPUT MANAGEMENT
  // =============================================================================

  const addInput = () => {
    if (!suggestions) return
    
    const newInput: SuggestedInput = {
      id: Date.now().toString(),
      type: 'text_question',
      variableName: 'new_input',
      headline: 'New Question',
      subheading: '',
      placeholder: 'Enter your answer...',
      required: true
    }
    
    setSuggestions({
      ...suggestions,
      inputs: [...suggestions.inputs, newInput]
    })
  }

  const updateInput = (id: string, updates: Partial<SuggestedInput>) => {
    if (!suggestions) return
    
    setSuggestions({
      ...suggestions,
      inputs: suggestions.inputs.map(input => 
        input.id === id ? { ...input, ...updates } : input
      )
    })
  }

  const removeInput = (id: string) => {
    if (!suggestions) return
    
    setSuggestions({
      ...suggestions,
      inputs: suggestions.inputs.filter(input => input.id !== id)
    })
  }

  // =============================================================================
  // OUTPUT MANAGEMENT
  // =============================================================================

  const addOutput = () => {
    if (!suggestions) return
    
    const newOutput: SuggestedOutput = {
      id: Date.now().toString(),
      variableName: 'new_output',
      name: 'New Output',
      description: 'Description of the output'
    }
    
    setSuggestions({
      ...suggestions,
      outputs: [...suggestions.outputs, newOutput]
    })
  }

  const updateOutput = (id: string, updates: Partial<SuggestedOutput>) => {
    if (!suggestions) return
    
    setSuggestions({
      ...suggestions,
      outputs: suggestions.outputs.map(output => 
        output.id === id ? { ...output, ...updates } : output
      )
    })
  }

  const removeOutput = (id: string) => {
    if (!suggestions) return
    
    setSuggestions({
      ...suggestions,
      outputs: suggestions.outputs.filter(output => output.id !== id)
    })
  }

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderInputCard = (input: SuggestedInput) => (
    <Card key={input.id} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {input.type.replace('_', ' ').replace('question', '')}
          </Badge>
          <span className="text-xs text-muted-foreground">@{input.variableName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeInput(input.id)}
          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Headline</Label>
            <Input
              value={input.headline}
              onChange={(e) => updateInput(input.id, { headline: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Variable Name</Label>
            <Input
              value={input.variableName}
              onChange={(e) => updateInput(input.id, { variableName: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Subheading</Label>
          <Input
            value={input.subheading}
            onChange={(e) => updateInput(input.id, { subheading: e.target.value })}
            className="mt-1 text-sm"
          />
        </div>

        {input.type === 'multiple_choice' && (
          <div>
            <Label className="text-xs">Options (comma-separated)</Label>
            <Input
              value={input.options?.join(', ') || ''}
              onChange={(e) => updateInput(input.id, { 
                options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="mt-1 text-sm"
            />
          </div>
        )}

        {input.type === 'slider' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min Value</Label>
              <Input
                type="number"
                value={input.minValue || 0}
                onChange={(e) => updateInput(input.id, { minValue: parseInt(e.target.value) })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Max Value</Label>
              <Input
                type="number"
                value={input.maxValue || 100}
                onChange={(e) => updateInput(input.id, { maxValue: parseInt(e.target.value) })}
                className="mt-1 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )

  const renderOutputCard = (output: SuggestedOutput) => (
    <Card key={output.id} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground">@{output.variableName}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeOutput(output.id)}
          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Output Name</Label>
            <Input
              value={output.name}
              onChange={(e) => updateOutput(output.id, { name: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Variable Name</Label>
            <Input
              value={output.variableName}
              onChange={(e) => updateOutput(output.id, { variableName: e.target.value })}
              className="mt-1 text-sm"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            value={output.description}
            onChange={(e) => updateOutput(output.id, { description: e.target.value })}
            className="mt-1 text-sm"
            rows={2}
          />
        </div>
      </div>
    </Card>
  )

  // =============================================================================
  // RENDER STEPS
  // =============================================================================

  const renderIdeaStep = () => (
    <div className="space-y-4">
      <Tabs value={inputType} onValueChange={(value: string) => setInputType(value as 'idea' | 'business')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="idea">Campaign Idea</TabsTrigger>
          <TabsTrigger value="business">Business Description</TabsTrigger>
        </TabsList>
        
        <TabsContent value="idea" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-idea" className="text-sm font-medium">Describe Your Campaign Idea</Label>
            <Textarea
              id="campaign-idea"
              value={campaignIdea}
              onChange={(e) => setCampaignIdea(e.target.value)}
              placeholder="Example: Marathon training calculator that asks about fitness level and goals..."
              className="min-h-[80px] resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want to create.
            </p>
          </div>

          {/* Example campaign ideas */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Campaign examples:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCampaignIdea("Marathon training calculator that asks about current fitness level, running experience, target race date, and weekly availability, then provides a personalized training plan with weekly mileage, workout schedule, and nutrition tips")}
                className="text-left p-2 rounded-md border border-border hover:border-orange-400 hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Fitness Calculator</div>
                    <div className="text-xs text-muted-foreground">Training plans</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setCampaignIdea("ROI calculator for marketing campaigns that asks about monthly budget, business type, and target ROI, then provides projected returns, budget allocation recommendations, and actionable next steps")}
                className="text-left p-2 rounded-md border border-border hover:border-orange-400 hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-orange-600">ROI Calculator</div>
                    <div className="text-xs text-muted-foreground">Marketing returns</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setCampaignIdea("Career path quiz that asks about work style preferences, risk tolerance, and career goals, then provides personality analysis, recommended career matches, and personal development plan")}
                className="text-left p-2 rounded-md border border-border hover:border-orange-400 hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Career Quiz</div>
                    <div className="text-xs text-muted-foreground">Path recommendations</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setCampaignIdea("Nutrition plan generator that asks about dietary preferences, health goals, activity level, and food restrictions, then provides personalized meal plans, shopping lists, and nutrition guidance")}
                className="text-left p-2 rounded-md border border-border hover:border-orange-400 hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Nutrition Planner</div>
                    <div className="text-xs text-muted-foreground">Meal recommendations</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="business-description" className="text-sm font-medium">Describe Your Business</Label>
            <Textarea
              id="business-description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Example: I run a digital marketing agency that helps small businesses grow their online presence through SEO, social media, and paid advertising..."
              className="min-h-[80px] resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Tell us about your business and AI will suggest suitable campaign types.
            </p>
          </div>

          {/* Example business descriptions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Business examples:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBusinessDescription("I run a digital marketing agency that helps small businesses grow their online presence through SEO, social media, and paid advertising campaigns")}
                className="text-left p-2 rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-blue-600">Marketing Agency</div>
                    <div className="text-xs text-muted-foreground">SEO & advertising</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBusinessDescription("I'm a certified personal trainer who offers online fitness coaching, nutrition planning, and workout programs for busy professionals")}
                className="text-left p-2 rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-blue-600">Fitness Coach</div>
                    <div className="text-xs text-muted-foreground">Online training</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBusinessDescription("I'm a financial advisor who provides investment planning, retirement strategies, and wealth management services for individuals and families")}
                className="text-left p-2 rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-blue-600">Financial Advisor</div>
                    <div className="text-xs text-muted-foreground">Investment planning</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBusinessDescription("I own a local restaurant that specializes in farm-to-table cuisine and offers catering services for events and corporate functions")}
                className="text-left p-2 rounded-md border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-xs text-foreground group-hover:text-blue-600">Restaurant Owner</div>
                    <div className="text-xs text-muted-foreground">Farm-to-table dining</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-2">
        <Button
          onClick={handleGetSuggestions}
          disabled={!(inputType === 'idea' ? campaignIdea.trim() : businessDescription.trim()) || isLoading}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Getting Suggestions...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderReviewStep = () => {
    if (!suggestions) return null

    return (
      <div className="space-y-4">
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Questions ({suggestions.inputs.length})</TabsTrigger>
            <TabsTrigger value="outputs">Outputs ({suggestions.outputs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Suggested Questions</h4>
              <Button variant="outline" size="sm" onClick={addInput}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestions.inputs.map(renderInputCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="outputs" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Suggested Outputs</h4>
              <Button variant="outline" size="sm" onClick={addOutput}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {suggestions.outputs.map(renderOutputCard)}
            </div>

            {/* AI Prompt Preview - moved to outputs tab */}
            <div className="pt-2 border-t">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">AI Logic Prompt</h5>
              <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground max-h-20 overflow-y-auto border">
                {suggestions.aiPrompt}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={() => setStep('idea')}>
            Back
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || suggestions.inputs.length === 0 || suggestions.outputs.length === 0}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : generationComplete ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete!
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto [transform-origin:center_center]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-orange-600" />
            <span>AI Campaign Generator</span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px]">
          {step === 'idea' && renderIdeaStep()}
          {step === 'review' && renderReviewStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
