// Campaign Builder Types

export interface SectionType {
  id: string
  name: string
  description: string
  icon: string
  category: 'input' | 'content' | 'capture' | 'logic' | 'output'
  color: string
  defaultSettings?: Record<string, unknown>
}

export interface CampaignSection {
  id: string
  type: string
  title: string
  settings: Record<string, unknown>
  order: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface DragItem {
  id: string
  type: 'section-type' | 'campaign-section'
  sectionType?: string
  data?: Record<string, unknown>
}

// Available section types for the drag-and-drop menu
export const SECTION_TYPES: SectionType[] = [
  // Input & Questions Sections
  {
    id: 'question-text',
    name: 'Text Question',
    description: 'Short text or long text responses',
    icon: 'Type',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'Type your question here',
      subheading: '',
      label: '',
      placeholder: 'Type your answer here...',
      maxLength: 500,
      required: true,
      inputType: 'text',
      buttonText: 'Next'
    }
  },
  {
    id: 'question-multiple-choice',
    name: 'Multiple Choice',
    description: 'Single or multiple selection questions',
    icon: 'CheckSquare',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'Type your question here',
      subheading: '',
      options: ['Option goes here...', 'Option goes here...', 'Option goes here...'],
      allowMultiple: false,
      required: true,
      buttonText: 'Next'
    }
  },
  {
    id: 'question-slider',
    name: 'Number Slider',
    description: 'Numeric input with slider interface',
    icon: 'Sliders',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'Type your question here',
      subheading: '',
      minValue: 0,
      maxValue: 100,
      defaultValue: 50,
      step: 1,
      showValue: true,
      required: true,
      buttonText: 'Next'
    }
  },
  {
    id: 'question-date-time',
    name: 'Date & Time',
    description: 'Date and time picker inputs',
    icon: 'Calendar',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      content: 'When would you like to schedule this?',
      subheading: '',
      includeDate: true,
      includeTime: false,
      required: true,
      buttonText: 'Next'
    }
  },
  {
    id: 'question-upload',
    name: 'File Upload',
    description: 'File upload with drag & drop',
    icon: 'Upload',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      content: 'Upload your files',
      subheading: '',
      allowImages: true,
      allowDocuments: true,
      allowAudio: false,
      allowVideo: false,
      maxFileSize: 10,
      maxFiles: 5,
      required: true,
      buttonText: 'Next'
    }
  },

  // Content Sections
  {
    id: 'content-hero',
    name: 'Hero Section',
    description: 'Full-width hero with title, subtitle, and image',
    icon: 'Image',
    category: 'content',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultSettings: {
      title: 'Your Hero Title',
      subtitle: 'Add your compelling subtitle here',
      backgroundImage: '',
      overlayColor: '#000000',
      overlayOpacity: 40,
      buttonText: 'Get Started',
      showButton: true
    }
  },
  {
    id: 'content-basic',
    name: 'Basic Section',
    description: 'Simple content block with text and optional image',
    icon: 'FileText',
    category: 'content',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultSettings: {
      title: 'Your Headline',
      subtitle: 'Add your subheading here',
      content: 'Add your content here. You can write multiple paragraphs, format text, and create rich content...',
      image: '',
      imagePosition: 'above',
      textAlignment: 'center'
    }
  },

  // Capture Section
  {
    id: 'capture-details',
    name: 'Capture Details',
    description: 'Lead capture form with customizable fields',
    icon: 'Users',
    category: 'capture',
    color: 'bg-green-100 text-green-800 border-green-200',
    defaultSettings: {
      title: 'Get Your Results',
      subheading: 'Enter your information to unlock your personalized results',
      enabledFields: {
        name: true,
        email: true,
        phone: false
      },
      requiredFields: {
        name: true,
        email: true,
        phone: false
      },
      fieldLabels: {
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number'
      },
      fieldPlaceholders: {
        name: 'Enter your full name',
        email: 'your@email.com',
        phone: '+1 (555) 123-4567'
      },
      submitButtonText: 'Get My Results',
      gdprConsent: false,
      marketingConsent: false
    }
  },

  // Logic Section
  {
    id: 'logic-ai',
    name: 'AI Logic',
    description: 'AI-powered logic using OpenAI integration',
    icon: 'Brain',
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultSettings: {
      prompt: 'You are an expert...',
      systemInstructions: '',
      outputVariables: [],
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      testInputs: {}
    }
  },

  // Output Sections
  {
    id: 'output-results',
    name: 'Results',
    description: 'Display personalized AI-generated results',
    icon: 'Target',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      title: 'Your Results',
      content: 'Hey @name, based on your input...',
      image: '',
      showVariables: true,
      alignment: 'center'
    }
  },
  {
    id: 'output-download',
    name: 'Download Link',
    description: 'Provide downloadable resources',
    icon: 'Download',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      title: 'Download Your Resource',
      description: 'Click below to download',
      fileUrl: '',
      fileName: 'resource.pdf',
      buttonText: 'Download Now'
    }
  },
  {
    id: 'output-redirect',
    name: 'Redirect',
    description: 'Redirect to external URL after completion',
    icon: 'ExternalLink',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      url: '',
      delay: 3,
      message: 'Redirecting you now...',
      showCountdown: true
    }
  },
  {
    id: 'output-dynamic-redirect',
    name: 'Dynamic Redirect',
    description: 'Redirect to Webflow page with dynamic data integration',
    icon: 'Globe',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      targetUrl: '',
      dataTransmissionMethod: 'localStorage',
      delay: 2,
      showPreloader: true,
      preloaderMessage: 'Preparing your personalized page...',
      variableMappings: [],
      customAttributes: true,
      scriptTemplate: ''
    }
  }
]

// Helper functions
export const getSectionTypeById = (id: string): SectionType | undefined => {
  return SECTION_TYPES.find(type => type.id === id)
}

export const getSectionTypesByCategory = (category: SectionType['category']): SectionType[] => {
  return SECTION_TYPES.filter(type => type.category === category)
}

export const SECTION_CATEGORIES = [
  { id: 'input', name: 'Input & Questions', icon: 'HelpCircle' },
  { id: 'content', name: 'Content', icon: 'FileText' },
  { id: 'capture', name: 'Capture', icon: 'Users' },
  { id: 'logic', name: 'Logic', icon: 'Brain' },
  { id: 'output', name: 'Output', icon: 'Target' }
] as const 