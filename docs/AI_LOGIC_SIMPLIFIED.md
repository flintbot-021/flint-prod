# Simplified AI Logic System

## Overview

The AI Logic system has been simplified to make it easier for users to understand and use. The focus is now on the essential functionality without overwhelming users with technical AI configuration options.

## What Changed

### Before (Complex)
- System instructions + main prompt (confusing)
- Model selection dropdown (gpt-4, gpt-3.5, etc.)
- Temperature slider (0-2)
- Max tokens input field
- Complex AI processing engine with many options

### After (Simple)
- **Single prompt area** - just write what you want the AI to do
- **Default AI settings** - sensible defaults (GPT-4, temp 0.7, 1000 tokens)
- **Clean, focused UI** - only essential controls visible
- **Better UX** - clearer labels and helpful placeholder text

## Core Features (Kept)

✅ **Variable System** - Use `@variableName` to reference user inputs  
✅ **Output Variables** - Define what the AI should return  
✅ **Testing** - Test your logic with sample inputs  
✅ **Real AI Integration** - Ready for OpenAI API when needed  

## User Experience

### 1. Write Your Prompt
Users simply write a single prompt describing what they want the AI to do:

```
You are an expert fitness coach. Based on @name who trains @frequency times per week and wants to run a @distance race, provide personalized training advice.
```

### 2. Define Output Variables
Users specify what the AI should return:
- Variable name: `recommendation`
- Description: `Personalized training recommendation`

### 3. Test with Sample Data
Users can test their logic with sample inputs before publishing.

## Technical Implementation

### Components
- `ai-logic-section.tsx` - Simplified UI component
- `ai-processing-engine.ts` - Streamlined AI processing
- `use-ai-logic-test.ts` - Hook for testing (mock + real AI)

### Default Settings
```typescript
const DEFAULT_MODEL = 'gpt-4'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1000
```

### API Integration
The system is ready for real OpenAI integration. To enable:

1. Add OpenAI API key to environment
2. Uncomment the real API code in `runTest()`
3. The system automatically falls back to mock data for development

## Benefits

1. **Easier to Use** - No AI expertise required
2. **Less Overwhelming** - Focused on what matters
3. **Better Testing** - Realistic mock responses
4. **Maintainable** - Simpler codebase
5. **Extensible** - Easy to add features later

## Mock Response System

The test system generates intelligent mock responses based on variable names and descriptions:

- `recommendation` → Personalized advice
- `score` → Random number (0-100)  
- `time` → "45 minutes"
- `plan` → Custom plan description
- And more contextual responses...

This helps users understand how their AI logic will work without needing a real API key during development. 