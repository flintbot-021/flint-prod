'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Hash } from 'lucide-react'
import { Badge } from './badge'
import { getAITestResults } from '@/lib/utils/ai-test-storage'

interface Variable {
  name: string
  type: 'input' | 'output' | 'capture'
  description: string
  sampleValue: string
}

interface VariableSuggestionDropdownProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onSave?: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  multiline?: boolean
  variables: Variable[]
  autoSave?: boolean
}

interface DropdownState {
  show: boolean
  query: string
  position: { top: number; left: number }
  atIndex: number
}

export function VariableSuggestionDropdown({
  value,
  onChange,
  onBlur,
  onSave,
  placeholder,
  className,
  inputClassName,
  multiline = false,
  variables = [],
  autoSave = false
}: VariableSuggestionDropdownProps) {
  const [dropdown, setDropdown] = useState<DropdownState>({
    show: false,
    query: '',
    position: { top: 0, left: 0 },
    atIndex: -1
  })
  

  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [aiTestData, setAiTestData] = useState<Record<string, any>>({})
  
  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (multiline && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement
      // Force reset height to 0 first, then auto to properly recalculate
      textarea.style.height = '0px'
      textarea.style.height = 'auto'
      // Set height based on content, with minimum of 1.5rem (24px)
      const newHeight = Math.max(textarea.scrollHeight, 24)
      textarea.style.height = newHeight + 'px'
      
      // Also resize the overlay to match
      if (overlayRef.current) {
        overlayRef.current.style.height = newHeight + 'px'
      }
    }
  }, [multiline])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])
  
  // Initial resize when component mounts
  useEffect(() => {
    autoResize()
  }, [autoResize])
  
  // Load AI test data
  useEffect(() => {
    const loadTestData = () => {
      const testResults = getAITestResults()
      setAiTestData(testResults)
    }
    
    loadTestData()
    
    // Listen for storage changes to update when AI test data changes
    const handleStorageChange = () => {
      loadTestData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event (in case data changes in same tab)
    window.addEventListener('aiTestResultsUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('aiTestResultsUpdated', handleStorageChange)
    }
  }, [])
  
    // Get actual sample value for a variable
  const getSampleValue = (variable: Variable): string => {
    // aiTestData is a flat object containing both input and output variables
    const sampleValue = aiTestData[variable.name]
    
    if (sampleValue !== undefined && sampleValue !== null) {
      return String(sampleValue)
    }
    
    // Fall back to the variable's provided sample value
    if (variable.sampleValue && variable.sampleValue !== 'No sample data') {
      return variable.sampleValue
    }
    
    return 'No sample data'
  }
  
  // Render text with highlighted @ variables as simple colored text
  const renderHighlightedText = (text: string) => {
    if (!text) return null
    
    // Split text by @ variables but keep the @ symbols
    const parts = text.split(/(@\w+)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        // Check if this is a valid variable
        const variableName = part.substring(1)
        const isValidVariable = variables.some(v => v.name === variableName)

        return (
          <span
            key={index}
            className={cn(
              // Simple colored text - no background or styling
              'font-medium',
              isValidVariable 
                ? 'text-orange-600' 
                : 'text-gray-400'
            )}
          >
            {part}
          </span>
        )
      }
      // Show regular text normally - inherit color from parent
      return <span key={index}>{part}</span>
    })
  }
  
  // Filter variables based on query
  const filteredVariables = variables.filter(variable => 
    variable.name.toLowerCase().includes(dropdown.query.toLowerCase())
  )
  
  // Get cursor position for dropdown placement
  const getCursorPosition = useCallback(() => {
    const input = inputRef.current
    if (!input) return { top: 0, left: 0 }
    
    const rect = input.getBoundingClientRect()
    
    // For better UX, center the dropdown under the input
    // This feels more natural than bottom-left positioning
    const dropdownWidth = 256 // min-w-64 = 256px
    const inputWidth = rect.width
    const leftOffset = Math.max(0, (inputWidth - dropdownWidth) / 2)
    

    
    return {
      top: rect.height + 5,
      left: leftOffset
    }
  }, [value])
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)
    
    // Auto-resize on change
    setTimeout(() => autoResize(), 0)
    
    // Check for @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    

    
    if (atMatch && variables.length > 0) {
      const query = atMatch[1] || ''
      const atIndex = cursorPos - query.length - 1
      

      
      setDropdown({
        show: true,
        query,
        position: getCursorPosition(),
        atIndex
      })
      setSelectedIndex(0)
    } else {
      setDropdown(prev => ({ ...prev, show: false }))
    }
  }, [onChange, variables.length, getCursorPosition, autoResize])
  
  // Handle variable selection
  const insertVariable = useCallback((variable: Variable) => {
    const input = inputRef.current
    if (!input) return
    
    const cursorPos = input.selectionStart || 0
    const newValue = value.substring(0, dropdown.atIndex) + 
                    `@${variable.name}` + 
                    value.substring(cursorPos)
    
    onChange(newValue)
    setDropdown(prev => ({ ...prev, show: false }))
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      const newCursorPos = dropdown.atIndex + variable.name.length + 1
      input.focus()
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, dropdown.atIndex, onChange])
  
  // Handle keyboard navigation and atomic @variable deletion
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle atomic @variable deletion on backspace
    if (e.key === 'Backspace') {
      const input = e.target as HTMLInputElement | HTMLTextAreaElement
      const cursorPosition = input.selectionStart || 0
      
      // Look backwards from cursor to find if we're at the end of an @variable
      const textBeforeCursor = value.substring(0, cursorPosition)
      const variableMatch = textBeforeCursor.match(/@\w+$/)
      
      if (variableMatch) {
        // We're at the end of an @variable, delete the entire variable
        e.preventDefault()
        const newValue = textBeforeCursor.substring(0, textBeforeCursor.length - variableMatch[0].length) + 
                        value.substring(cursorPosition)
        const newCursorPosition = cursorPosition - variableMatch[0].length
        
        onChange(newValue)
        
        // Set cursor position after the change
        setTimeout(() => {
          input.setSelectionRange(newCursorPosition, newCursorPosition)
        }, 0)
        
        return
      }
    }
    
    // Handle atomic @variable deletion on delete key
    if (e.key === 'Delete') {
      const input = e.target as HTMLInputElement | HTMLTextAreaElement
      const cursorPosition = input.selectionStart || 0
      
      // Look forwards from cursor to find if we're at the beginning of an @variable
      const textAfterCursor = value.substring(cursorPosition)
      const variableMatch = textAfterCursor.match(/^@\w+/)
      
      if (variableMatch) {
        // We're at the beginning of an @variable, delete the entire variable
        e.preventDefault()
        const newValue = value.substring(0, cursorPosition) + 
                        value.substring(cursorPosition + variableMatch[0].length)
        
        onChange(newValue)
        
        // Cursor stays at the same position
        setTimeout(() => {
          input.setSelectionRange(cursorPosition, cursorPosition)
        }, 0)
        
        return
      }
    }
    
    // Handle dropdown navigation (existing logic)
    if (!dropdown.show) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredVariables.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex])
        }
        break
      case 'Escape':
        setDropdown(prev => ({ ...prev, show: false }))
        break
    }
  }, [dropdown.show, filteredVariables, selectedIndex, insertVariable, value, onChange])
  
  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => {
      setDropdown(prev => ({ ...prev, show: false }))
      if (onBlur) onBlur()
      if (autoSave && onSave) onSave(value)
    }, 150)
  }, [onBlur, onSave, autoSave, value])
  
  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdown(prev => ({ ...prev, show: false }))
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className={cn('relative', className)}>
      {/* Highlighted overlay for @ variables */}
      <div
        ref={overlayRef}
        className={cn(
          'absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-visible',
          'font-[inherit] leading-relaxed', // Match input font and line height - removed text-transparent
          inputClassName?.includes('text-center') ? 'text-center' : '',
          inputClassName?.includes('text-left') ? 'text-left' : '',
          inputClassName?.includes('text-right') ? 'text-right' : '',
          inputClassName // Apply same styling as input including text color
        )}
        style={{
          zIndex: 1,
          lineHeight: '1.8', // Match input line height exactly
          fontSize: 'inherit', // Ensure font size matches
          fontFamily: 'inherit', // Ensure font family matches
          padding: '0.25rem' // Default padding, overridden by inputClassName
        }}
      >
        {renderHighlightedText(value)}
      </div>
      
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'w-full relative z-10 bg-transparent leading-relaxed',
          inputClassName,
          '!text-transparent' // Hide input text so overlay chips show
        )}
        style={{ 
          backgroundColor: 'transparent',
          lineHeight: '1.8', // Match overlay line height
          caretColor: '#374151' // Make cursor visible with gray color
        }}
        {...(multiline ? { rows: 1 } : {})}
      />
      
      {dropdown.show && filteredVariables.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border border-gray-300 rounded-md shadow-xl max-h-48 overflow-y-auto min-w-64"
          style={{
            top: dropdown.position.top,
            left: dropdown.position.left
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Hash className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Variables</span>
            </div>
          </div>
          
          {filteredVariables.map((variable, index) => (
            <button
              key={variable.name}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                insertVariable(variable)
              }}
              className={cn(
                'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 border-none bg-transparent focus:bg-blue-50 focus:outline-none',
                index === selectedIndex && 'bg-blue-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
              <Badge 
                    variant={variable.type === 'input' ? 'secondary' : 'default'}
                    className={cn(
                      'text-xs',
                      variable.type === 'input' ? 'bg-blue-100 text-blue-800' : 
                      variable.type === 'capture' ? 'bg-purple-100 text-purple-800' : 
                      'bg-green-100 text-green-800'
                    )}
              >
                {variable.type}
              </Badge>
                  <code className="text-sm font-mono text-orange-600">@{variable.name}</code>
                </div>
                <div className="text-xs text-gray-400">
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                    {(() => {
                      const sampleValue = getSampleValue(variable)
                      return sampleValue.length > 40 
                        ? `${sampleValue.substring(0, 40)}...` 
                        : sampleValue
                    })()}
                  </code>
                </div>
              </div>
            </button>
          ))}
          
          {filteredVariables.length === 0 && dropdown.query && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No variables found for "{dropdown.query}"
            </div>
          )}
      </div>
      )}
    </div>
  )
}