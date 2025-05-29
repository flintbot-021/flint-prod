// Campaign Builder Types

export interface SectionType {
  id: string
  name: string
  description: string
  icon: string
  category: 'input' | 'content' | 'logic' | 'output'
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
  // Input Sections
  {
    id: 'question-multiple-choice',
    name: 'Multiple Choice',
    description: 'Single or multiple selection questions',
    icon: 'CheckSquare',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'What is your preference?',
      options: ['Option 1', 'Option 2', 'Option 3'],
      allowMultiple: false,
      required: true
    }
  },
  {
    id: 'question-text',
    name: 'Text Input',
    description: 'Short text or long text responses',
    icon: 'Type',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'Please provide your answer',
      placeholder: 'Type your answer here...',
      maxLength: 500,
      required: true,
      inputType: 'text'
    }
  },
  {
    id: 'question-rating',
    name: 'Rating Scale',
    description: 'Star ratings or numeric scales',
    icon: 'Star',
    category: 'input',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultSettings: {
      question: 'How would you rate this?',
      scale: 5,
      scaleType: 'stars',
      required: true
    }
  },
  {
    id: 'capture-email',
    name: 'Email Capture',
    description: 'Collect email addresses',
    icon: 'Mail',
    category: 'input',
    color: 'bg-green-100 text-green-800 border-green-200',
    defaultSettings: {
      label: 'Email Address',
      placeholder: 'Enter your email...',
      required: true,
      validation: 'email'
    }
  },
  {
    id: 'capture-contact',
    name: 'Contact Form',
    description: 'Full contact information collection',
    icon: 'UserPlus',
    category: 'input',
    color: 'bg-green-100 text-green-800 border-green-200',
    defaultSettings: {
      fields: ['name', 'email', 'phone'],
      requiredFields: ['name', 'email'],
      title: 'Get in Touch'
    }
  },
  {
    id: 'capture',
    name: 'Lead Capture',
    description: 'Flexible lead data collection form',
    icon: 'Users',
    category: 'input',
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

  // Content Sections
  {
    id: 'info-text',
    name: 'Text Block',
    description: 'Rich text content and paragraphs',
    icon: 'FileText',
    category: 'content',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultSettings: {
      title: 'Information',
      content: 'Add your content here...',
      alignment: 'left'
    }
  },
  {
    id: 'info-image',
    name: 'Image',
    description: 'Images with optional captions',
    icon: 'Image',
    category: 'content',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultSettings: {
      src: '',
      alt: '',
      caption: '',
      alignment: 'center'
    }
  },
  {
    id: 'info-video',
    name: 'Video',
    description: 'Embedded videos and media',
    icon: 'Play',
    category: 'content',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultSettings: {
      src: '',
      title: '',
      autoplay: false,
      controls: true
    }
  },

  // Logic Sections
  {
    id: 'logic-conditional',
    name: 'Conditional Logic',
    description: 'Show/hide content based on answers',
    icon: 'GitBranch',
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultSettings: {
      conditions: [],
      actions: []
    }
  },
  {
    id: 'logic-calculator',
    name: 'Score Calculator',
    description: 'Calculate scores based on responses',
    icon: 'Calculator',
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultSettings: {
      scoring: {},
      showScore: true
    }
  },

  // Output Sections
  {
    id: 'output-results',
    name: 'Results Page',
    description: 'Display personalized results',
    icon: 'Target',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      title: 'Your Results',
      content: 'Based on your answers...',
      showScore: false
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
      fileName: 'resource.pdf'
    }
  },
  {
    id: 'output-redirect',
    name: 'Redirect',
    description: 'Redirect to external URL',
    icon: 'ExternalLink',
    category: 'output',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultSettings: {
      url: '',
      delay: 0,
      message: 'Redirecting...'
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
  { id: 'logic', name: 'Logic & Flow', icon: 'GitBranch' },
  { id: 'output', name: 'Output & Results', icon: 'Target' }
] as const 