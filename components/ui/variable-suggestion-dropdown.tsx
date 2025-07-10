'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Hash } from 'lucide-react'
import { Badge } from './badge'

interface Variable {
  name: string
  type: 'input' | 'output'
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
  
  // Debug logging
  console.log('🔍 VariableSuggestionDropdown received:', {
    variablesCount: variables.length,
    variables: variables.map(v => ({ name: v.name, type: v.type })),
    placeholder,
    value: value.substring(0, 20) + (value.length > 20 ? '...' : '')
  })
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Filter variables based on query
  const filteredVariables = variables.filter(variable =>
    variable.name.toLowerCase().includes(dropdown.query.toLowerCase())
  )
  
  // Get cursor position for dropdown placement
  const getCursorPosition = useCallback(() => {
    const input = inputRef.current
    if (!input) return { top: 0, left: 0 }
    
    // Simple positioning - just below the input
    const rect = input.getBoundingClientRect()
    
    console.log('🔍 Position calculation:', {
      inputRect: rect,
      calculatedTop: rect.height + 5,
      calculatedLeft: 0
    })
    
    return {
      top: rect.height + 5,
      left: 0
    }
  }, [value])
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)
    
    // Check for @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    
    console.log('🔍 @ detection debug:', {
      newValue,
      cursorPos,
      textBeforeCursor,
      atMatch,
      variablesLength: variables.length,
      shouldShow: !!(atMatch && variables.length > 0)
    })
    
    if (atMatch && variables.length > 0) {
      const query = atMatch[1] || ''
      const atIndex = cursorPos - query.length - 1
      
      console.log('🎯 Showing dropdown with:', { query, atIndex })
      
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
  }, [onChange, variables.length, getCursorPosition])
  
  // Handle variable selection
  const insertVariable = useCallback((variable: Variable) => {
    console.log('🔍 insertVariable called with:', { variable, dropdown })
    
    const input = inputRef.current
    if (!input) {
      console.log('❌ No input ref found')
      return
    }
    
    const cursorPos = input.selectionStart || 0
    const newValue = value.substring(0, dropdown.atIndex) + 
                    `@${variable.name}` + 
                    value.substring(cursorPos)
    
    console.log('🔍 Variable insertion debug:', {
      originalValue: value,
      atIndex: dropdown.atIndex,
      cursorPos,
      variableName: variable.name,
      newValue,
      beforeAt: value.substring(0, dropdown.atIndex),
      afterCursor: value.substring(cursorPos)
    })
    
    onChange(newValue)
    setDropdown(prev => ({ ...prev, show: false }))
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      const newCursorPos = dropdown.atIndex + variable.name.length + 1
      input.focus()
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, dropdown.atIndex, onChange])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [dropdown.show, filteredVariables, selectedIndex, insertVariable])
  
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
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'w-full',
          inputClassName
        )}
        {...(multiline ? { rows: 4 } : {})}
      />
      
      {dropdown.show && filteredVariables.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border border-gray-300 rounded-md shadow-xl max-h-48 overflow-y-auto min-w-64 border-2 border-blue-500"
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
                console.log('🔍 Button clicked for variable:', variable.name)
                insertVariable(variable)
              }}
              className={cn(
                'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 border-none bg-transparent focus:bg-blue-50 focus:outline-none',
                index === selectedIndex && 'bg-blue-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={variable.type === 'input' ? 'secondary' : 'default'}
                    className={cn(
                      'text-xs',
                      variable.type === 'input' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    )}
                  >
                    {variable.type}
                  </Badge>
                  <code className="text-sm font-mono text-orange-600">@{variable.name}</code>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{variable.description}</p>
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