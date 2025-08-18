'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [campaignIdea, setCampaignIdea] = useState('')
  
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
    if (!campaignIdea.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-campaign-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: campaignIdea.trim()
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
    <Card key={input.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {input.type.replace('_', ' ').replace('question', '')}
          </Badge>
          <span className="text-xs text-gray-500">@{input.variableName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeInput(input.id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
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
    <Card key={output.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-500">@{output.variableName}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeOutput(output.id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-idea" className="text-sm font-medium">Describe Your Campaign Idea</Label>
          <Textarea
            id="campaign-idea"
            value={campaignIdea}
            onChange={(e) => setCampaignIdea(e.target.value)}
            placeholder="Example: Marathon training calculator based on fitness level and goals..."
            className="min-h-[80px] resize-none"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Be specific about what you want to create.
          </p>
        </div>

        {/* Example suggestions - clickable cards */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Quick examples:
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
                  <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Fitness</div>
                  <div className="text-xs text-muted-foreground">Marathon training calculator</div>
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
                  <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Business</div>
                  <div className="text-xs text-muted-foreground">ROI calculator</div>
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
                  <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Personal</div>
                  <div className="text-xs text-muted-foreground">Career path quiz</div>
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
                  <div className="font-medium text-xs text-foreground group-hover:text-orange-600">Health</div>
                  <div className="text-xs text-muted-foreground">Nutrition plan generator</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={handleGetSuggestions}
          disabled={!campaignIdea.trim() || isLoading}
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
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Review & Edit Suggestions
          </h3>
          <p className="text-muted-foreground">
            AI has suggested questions and outputs. You can edit, add, or remove items before creating your campaign.
          </p>
        </div>

        {/* Suggested Inputs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Suggested Questions ({suggestions.inputs.length})</h4>
            <Button variant="outline" size="sm" onClick={addInput}>
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {suggestions.inputs.map(renderInputCard)}
          </div>
        </div>

        {/* Suggested Outputs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Suggested Outputs ({suggestions.outputs.length})</h4>
            <Button variant="outline" size="sm" onClick={addOutput}>
              <Plus className="h-4 w-4 mr-1" />
              Add Output
            </Button>
          </div>
          
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {suggestions.outputs.map(renderOutputCard)}
          </div>
        </div>

        {/* AI Prompt Preview */}
        <div>
          <h4 className="font-medium text-foreground mb-2">AI Logic Prompt</h4>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto border">
            {suggestions.aiPrompt}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setStep('idea')}>
            Back to Edit Idea
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || suggestions.inputs.length === 0 || suggestions.outputs.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Campaign...
              </>
            ) : generationComplete ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete!
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
