# Simplified AI Logic System

## Overview

The AI Logic system provides a **4-step guided wizard** that makes it easy for users to create powerful AI-driven interactions without requiring AI expertise. The focus is on essential functionality with intelligent auto-generation features.

## What Makes It Simple

### 4-Step Guided Process (Instead of Complex Configuration)
Rather than overwhelming users with technical AI settings, the system provides:

1. **Step 1: Example Answers** - Fill in sample data for testing and prompt design
2. **Step 2: AI Prompt** - Write or auto-generate what the AI should do
3. **Step 3: Output Variables** - Define or auto-generate what the AI should return
4. **Step 4: Test** - See real AI responses before publishing

### Auto-Generation Features (Instead of Starting from Scratch)
- **"Suggest my prompt"** - AI analyzes your campaign and writes a contextual prompt
- **"Suggest my outputs"** - AI suggests relevant output variables based on your prompt
- **Smart defaults** - Sensible AI settings without configuration needed

### Unified System (Instead of Separate Components)
- **Same AI engine** powers campaign builder, preview, and live publish
- **Consistent results** across all modes
- **Stored test results** for reliable preview experience

## Core Features

✅ **Variable System** - Use `@variableName` to reference user inputs from previous sections  
✅ **Auto-Generation** - AI writes prompts and suggests outputs based on campaign context  
✅ **Output Variables** - Define what the AI should return with clear descriptions  
✅ **Real AI Testing** - Test with actual OpenAI integration before publishing  
✅ **Live Preview** - See how prompts look with sample data highlighted  
✅ **Progress Tracking** - Visual indicators show completion status of each step  

## User Experience

### Step 1: Example Answers
Users provide sample answers for all detected variables:
```
@name: "Sarah"
@fitness_goal: "Weight Loss" 
@weekly_commitment: "3 times"
```
These examples help design better prompts and provide realistic testing data.

### Step 2: AI Prompt (Write or Auto-Generate)
**Option A: Write manually**
```
You are an expert fitness coach. Based on @name who wants to achieve @fitness_goal and can train @weekly_commitment per week, provide personalized advice.
```

**Option B: Click "Suggest my prompt"**
- AI analyzes previous campaign sections (content, questions, messaging)
- Generates contextual prompt incorporating campaign style and available variables
- User can customize the generated prompt as needed

### Step 3: Output Variables (Define or Auto-Generate)
**Manual approach:**
- Variable name: `recommendation`
- Description: `Personalized training recommendation`

**Auto-generation:**
- Click "Suggest my outputs"
- AI suggests 2-3 relevant variables based on prompt content
- Includes descriptions and adds empty slot for customization

### Step 4: Test & Verify
- Click "Test AI Logic" to see real AI response
- Results are stored and reused in preview mode
- Same engine that powers live campaigns

## Technical Implementation

### Components
- `ai-logic-section.tsx` - 4-step wizard UI with auto-generation features
- `ai-processing-engine.ts` - Unified AI processing with dynamic prompt construction
- `use-ai-logic-test.ts` - Hook for testing with real OpenAI integration
- `ai-test-storage.ts` - Test result storage for consistent preview experience

### Default Settings (Hidden from Users)
```typescript
const DEFAULT_MODEL = 'gpt-4o'      // Latest OpenAI model with JSON mode
const DEFAULT_TEMPERATURE = 0.7     // Balanced creativity/consistency
const DEFAULT_MAX_TOKENS = 1000     // Sufficient for most responses
const DEFAULT_TIMEOUT = 30000       // 30 second timeout
```

### Dynamic Prompt Construction
The system automatically combines user prompts with output instructions:

**User writes:**
```
You are an expert fitness coach. Based on @name who wants @fitness_goal...
```

**System automatically adds:**
```
Please provide your response as a JSON object containing these exact fields:
- recommendation: Personalized training recommendation
- weekly_plan: Suggested weekly schedule

Requirements:
- Return only valid JSON
- Be specific and helpful in your responses
```

### API Integration
Real OpenAI integration is built-in and ready to use:

```typescript
// Test during campaign building
const response = await fetch('/api/ai-processing', {
  method: 'POST',
  body: JSON.stringify({
    prompt: combinedPrompt,
    variables: testInputs,
    outputVariables: outputDefinitions
  })
})

// Same API used in preview and live campaigns
```

## Benefits

1. **Guided Experience** - 4-step wizard prevents confusion and ensures completeness
2. **Auto-Generation** - AI writes prompts and suggests outputs based on campaign context  
3. **No AI Expertise Required** - Sensible defaults and intelligent assistance
4. **Consistent Results** - Same engine across builder, preview, and live modes
5. **Real Testing** - Actual AI responses, not just mock data
6. **Time Saving** - Auto-generation features eliminate starting from scratch
7. **Context Aware** - Understands campaign messaging and available variables
8. **Maintainable** - Simplified codebase with clear separation of concerns
9. **Extensible** - Easy to add new features while maintaining simplicity

## Mock vs Real AI System

### Development Mode
When `OPENAI_API_KEY` is not configured, the system provides intelligent mock responses:

- `recommendation` → Contextual advice based on variable values
- `score` → Random number (0-100) with realistic variance
- `time` → Sensible time estimates like "45 minutes"
- `plan` → Custom plan descriptions incorporating user inputs

### Production Mode  
When API key is configured:
- Real OpenAI API calls with GPT-4o
- Structured JSON responses as defined
- Proper error handling and fallbacks
- Results stored for consistent preview experience

## Auto-Generation Context

The system analyzes preceding campaign sections to generate contextual prompts:

**Content sections** → Campaign messaging, tone, and purpose  
**Question sections** → Available variables and user data collection  
**Hero sections** → Headlines and campaign positioning  
**Info sections** → Additional context and explanations  

This ensures generated prompts are not generic but specifically tailored to each campaign's goals and style.

## Configuration

Environment variables (optional during development):
- `OPENAI_API_KEY` - Required for real AI integration
- Falls back to intelligent mock responses without API key
- All other settings use sensible defaults

The system is designed to work immediately without configuration while providing full AI capabilities when needed. 