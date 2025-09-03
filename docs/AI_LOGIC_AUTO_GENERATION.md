# AI Logic Auto-Generation

This feature automatically generates contextual AI prompts and output variables based on the questions and content sections that come before an AI Logic section in a campaign.

## How It Works

### 1. 4-Step Wizard Interface
The AI Logic section provides a guided 4-step process:
- **Step 1**: Add example answers for all available variables (for testing and prompt design)
- **Step 2**: Write AI prompt with "Suggest my prompt" auto-generation feature
- **Step 3**: Define output variables with "Suggest my outputs" auto-generation feature  
- **Step 4**: Test the complete AI logic with real API calls

### 2. Enhanced Context Analysis
The system analyzes all sections that come before the AI Logic section:
- **Question sections**: Extracts question text, variable names, answer options, and content details
- **Content sections**: Extracts main content, titles, subtitles, subheadings, and descriptions  
- **Capture sections**: Identifies user data collection fields and their purposes
- **Hero sections**: Includes headlines, subheadings, and descriptive content
- **Info sections**: Captures informational content and context

### 3. Rich Context Extraction
Using the enhanced `extractRichContextForSection` function, the system provides:
- **Content Context**: All textual content including subheadings and informational sections
- **Question Context**: Detailed question text, options for multiple choice, and variable mappings
- **Variable Context**: Complete list of available variables with their sources
- **Auto-variable detection**: Automatically identifies @variables from preceding sections

### 4. Intelligent Auto-Generation Features

#### Prompt Generation ("Suggest my prompt")
Using GPT-4o, the system:
- Analyzes the comprehensive extracted context
- Considers the campaign's purpose and messaging style
- Takes into account any existing prompt for improvement
- Incorporates defined output variables
- Generates a contextual, personalized AI prompt that reflects the campaign's goals

#### Output Variable Generation ("Suggest my outputs")
The system can automatically suggest relevant output variables:
- Analyzes the prompt content and campaign context
- Suggests 2-3 meaningful output variables
- Provides descriptive names and clear descriptions
- Adds an empty variable for user customization

### 5. Dynamic Prompt Construction
The system now uses a **combined prompt approach** where:
- User's domain-specific prompt (e.g., "You are an expert fitness coach...")
- Automatically combined with output format instructions
- Creates a complete prompt that includes JSON response requirements
- Works dynamically for any campaign type (fitness, bread-making, business advice, etc.)

### 6. Real-time Integration & Testing
- **Live preview**: Shows how the prompt will look with sample data
- **Smart suggestions**: Provides reasoning for why the prompt was structured that way
- **Content-aware generation**: Incorporates campaign messaging and style
- **Test storage**: Results stored in localStorage for consistent preview experience
- **Same engine everywhere**: Campaign builder, preview, and publish use identical AI processing

## Technical Implementation

### Files
- `components/campaign-builder/logic-types/ai-logic-section.tsx`: 4-step wizard UI with auto-generation
- `lib/services/ai-processing-engine.ts`: Combined prompt construction and OpenAI integration
- `lib/services/prompt-generation.ts`: Core service for prompt and output generation
- `app/api/generate-prompt/route.ts`: API endpoint for auto-generation features
- `lib/utils/variable-extractor.ts`: Enhanced context extraction functions
- `lib/utils/ai-test-storage.ts`: Test result storage for preview consistency
- `hooks/use-ai-logic-test.ts`: Testing hook with mock/real API support

### Current AI Processing Engine Settings
```typescript
const DEFAULT_MODEL = 'gpt-4.1' // Latest OpenAI model with JSON mode and browsing
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1000
const DEFAULT_TIMEOUT = 30000
```

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

### Combined Prompt Construction
The engine now dynamically builds complete prompts:

```typescript
// User's domain prompt
"You are an expert fitness coach. Based on @name who trains @frequency..."

// Automatically combined with:
"Please provide your response as a JSON object containing these exact fields:
- recommendation: Personalized training advice
- target_time: Estimated time to achieve goals

Requirements:
- Return only valid JSON
- Be specific and helpful in your responses
- Use realistic values based on the context provided"
```

### Auto-Generation API Usage
```typescript
// Prompt generation
const response = await fetch('/api/generate-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sections: allSections,
    currentSectionOrder: section.order,
    existingPrompt: settings.prompt,
    outputVariables: settings.outputVariables
  })
})

// Output variable generation (uses same endpoint)
// Automatically suggests relevant outputs based on prompt content
```

## Usage in Campaign Builder

### Step-by-Step Workflow
1. **Add content sections** first to establish campaign context and messaging
2. **Add question sections** to create variables and understand user data collection
3. **Add AI Logic section** - enters 4-step wizard:
   
   **Step 1: Example Answers**
   - Fill in sample answers for all detected variables
   - Used for prompt design and testing
   
   **Step 2: AI Prompt** 
   - Write your domain-specific prompt OR
   - Click "Suggest my prompt" for auto-generation
   - Live preview shows prompt with example data highlighted
   
   **Step 3: Output Variables**
   - Define what AI should return OR  
   - Click "Suggest my outputs" for auto-generation
   - Add/edit variables as needed
   
   **Step 4: Test**
   - Click "Test AI Logic" to see real AI response
   - Results stored for preview mode consistency

4. **Continue to output sections** that can reference AI-generated variables

## Benefits

- **Guided experience**: 4-step wizard prevents confusion and ensures completeness
- **Context-aware**: Automatically references campaign content, messaging, and available variables
- **Dual auto-generation**: Both prompts AND output variables can be auto-generated
- **Content-conscious**: Understands the campaign's purpose and tone from content sections
- **Comprehensive variable handling**: Includes all variables with proper @variable syntax
- **Time saving**: Eliminates need to manually write complex prompts from scratch
- **Best practices**: Uses proven prompt engineering patterns with dynamic JSON instructions
- **Consistent quality**: Uses AI to ensure prompts are well-structured and contextually relevant
- **Unified system**: Same AI engine powers campaign builder, preview, and publish modes
- **Smart testing**: Results persist across preview sessions for consistent experience

## Configuration

The system uses environment variables for OpenAI integration:
- `OPENAI_API_KEY`: Required for auto-generation and live testing
- Model: `gpt-4.1` (latest model with JSON mode and browsing support)
- Max tokens: 1000
- Temperature: 0.7 (balanced creativity and consistency)

## Performance & Context Limits

- **Context-rich**: Processes all preceding sections for comprehensive understanding
- **Efficient**: Uses structured extraction to minimize API calls
- **Scalable**: Handles campaigns with multiple content and question sections
- **Real-time**: Generates prompts and outputs quickly while maintaining quality
- **Persistent**: Test results stored for consistent preview experience 