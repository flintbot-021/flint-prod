# AI Logic Auto-Generation

This feature automatically generates contextual AI prompts based on the questions and content sections that come before an AI Logic section in a campaign.

## How It Works

### 1. Enhanced Context Analysis
The system analyzes all sections that come before the AI Logic section:
- **Question sections**: Extracts question text, variable names, answer options, and content details
- **Content sections**: Extracts main content, titles, subtitles, subheadings, and descriptions  
- **Capture sections**: Identifies user data collection fields and their purposes
- **Hero sections**: Includes headlines, subheadings, and descriptive content
- **Info sections**: Captures informational content and context

### 2. Rich Context Extraction
Using the enhanced `extractRichContextForSection` function, the system provides:
- **Content Context**: All textual content including subheadings and informational sections
- **Question Context**: Detailed question text, options for multiple choice, and variable mappings
- **Variable Context**: Complete list of available variables with their sources

### 3. Intelligent Prompt Generation
Using GPT-4o mini, the system:
- Analyzes the comprehensive extracted context
- Considers the campaign's purpose and messaging style
- Takes into account any existing prompt for improvement
- Incorporates defined output variables
- Generates a contextual, personalized AI prompt that reflects the campaign's goals

### 4. Real-time Integration
- **Auto-variable detection**: Automatically identifies @variables from preceding sections
- **Live preview**: Shows how the prompt will look with sample data
- **Smart suggestions**: Provides reasoning for why the prompt was structured that way
- **Content-aware generation**: Incorporates campaign messaging and style

## Technical Implementation

### Files
- `lib/services/prompt-generation.ts`: Core service for prompt generation with enhanced context
- `app/api/generate-prompt/route.ts`: API endpoint for GPT-4o mini integration
- `lib/utils/variable-extractor.ts`: Enhanced context extraction functions including `extractRichContextForSection`
- `components/campaign-builder/logic-types/ai-logic-section.tsx`: UI integration with auto-generation button

### Enhanced Context Structure
The prompt generation now uses structured context including:

```typescript
CONTENT CONTEXT:
1. Hero section: Main headline and description
2. Subheading: Additional context about the campaign
3. Info section: Detailed information about the purpose

QUESTION CONTEXT:
1. What is your primary fitness goal?
2. Options: Weight Loss, Muscle Building, Endurance, Flexibility
3. How many days per week can you commit to exercising?

AVAILABLE VARIABLES:
@fitness_goal, @weekly_commitment, @experience_level
```

### API Usage
```typescript
const request: PromptGenerationRequest = {
  sections: allSections,
  currentSectionOrder: section.order,
  existingPrompt: settings.prompt,
  outputVariables: settings.outputVariables,
  campaignContext: {
    name: 'Fitness Assessment',
    industry: 'health'
  }
}

const response = await fetch('/api/generate-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})
```

### Context Extraction Features
The `extractRichContextForSection` function provides:
- **Question text and options**: Full question content with multiple choice options
- **Content headings and subheadings**: All textual content from content sections
- **Variable names and types**: Complete variable mapping with sources
- **Section relationships**: Understanding of how sections flow together

## Usage in Campaign Builder

1. **Add content sections** first to establish campaign context and messaging
2. **Add question sections** to create variables and understand user data collection
3. **Add AI Logic section** 
4. **Click "Auto-Generate"** in the prompt step (step 2)
5. **Review the generated prompt** which will incorporate:
   - Campaign messaging and context from content sections
   - Available variables from question sections
   - Appropriate tone and style based on campaign content
6. **Customize as needed** - the generated prompt serves as an intelligent starting point

## Benefits

- **Context-aware**: Automatically references campaign content, messaging, and available variables
- **Content-conscious**: Understands the campaign's purpose and tone from content sections
- **Comprehensive variable handling**: Includes all variables with proper @variable syntax
- **Time saving**: Eliminates need to manually write complex prompts from scratch
- **Best practices**: Follows proven prompt engineering patterns
- **Consistent quality**: Uses AI to ensure prompts are well-structured and contextually relevant
- **Iterative improvement**: Can regenerate based on changes to earlier sections

## Example Enhanced Output

For a fitness campaign with hero section, info content, and questions about goals:

**Generated with enhanced context:**
```
You are a certified fitness expert and personal trainer helping users achieve their health goals.

Based on the "Transform Your Fitness Journey" campaign and the user's responses:

- @name is looking to transform their fitness journey
- Their primary goal is @fitness_goal 
- They can commit to @weekly_commitment workout sessions per week
- Their current experience level is @experience_level

Drawing from our comprehensive fitness program designed to help busy professionals achieve lasting results, please provide:

1. A personalized workout plan tailored to their @fitness_goal and @experience_level
2. Realistic expectations for someone committing to @weekly_commitment sessions
3. Specific strategies that fit their lifestyle and schedule

Be encouraging, actionable, and reference their specific goals throughout your recommendations.
```

**Key improvements:**
- References campaign title and messaging
- Incorporates the "busy professionals" context from content sections
- Uses campaign-specific language ("transform their fitness journey")
- Maintains professional yet encouraging tone matching campaign style

## Configuration

The system uses environment variables for OpenAI integration:
- `OPENAI_API_KEY`: Required for GPT-4o mini access
- Model: `gpt-4o-mini` (optimized for speed and cost)
- Max tokens: 1000
- Temperature: 0.7 (balanced creativity and consistency)

## Performance & Context Limits

- **Context-rich**: Processes all preceding sections for comprehensive understanding
- **Efficient**: Uses structured extraction to minimize API calls
- **Scalable**: Handles campaigns with multiple content and question sections
- **Real-time**: Generates prompts quickly while maintaining quality 