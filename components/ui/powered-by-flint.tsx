'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PoweredByFlintProps {
  className?: string
  variant?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function PoweredByFlint({ 
  className, 
  variant = 'auto',
  size = 'sm',
  showIcon = true
}: PoweredByFlintProps) {
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm'
  }
  
  const variantClasses = {
    light: 'text-gray-500 hover:text-gray-700',
    dark: 'text-gray-400 hover:text-gray-200',
    auto: 'text-muted-foreground hover:text-foreground'
  }

  return (
    <a
      href="https://flint.so"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center space-x-1 transition-colors duration-200",
        "hover:opacity-80 cursor-pointer",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showIcon && (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="flex-shrink-0"
        >
          {/* Flint logo - simplified flame icon */}
          <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3 6 1 1 2 2 2 3 0 .5.5 1 1 1s1-.5 1-1c0-1 1-2 2-3 1.5-1.5 3-3.5 3-6 0-3.5-2.5-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      )}
      <span className="font-medium">Powered by</span>
      <span className="font-semibold">Flint</span>
    </a>
  )
}
