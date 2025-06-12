/**
 * Accessibility utilities for focus management and keyboard navigation
 */

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = []

  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return () => {}

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Store the currently focused element
    const previouslyFocused = document.activeElement as HTMLElement
    this.focusStack.push(previouslyFocused)

    // Focus the first element
    firstElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      const previousElement = this.focusStack.pop()
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus()
      }
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
    
    return elements.filter(element => {
      return element.offsetWidth > 0 && 
             element.offsetHeight > 0 && 
             !element.hasAttribute('hidden') &&
             window.getComputedStyle(element).visibility !== 'hidden'
    })
  }

  /**
   * Move focus to the next focusable element
   */
  static focusNext(container?: HTMLElement): void {
    const root = container || document.body
    const focusableElements = this.getFocusableElements(root)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    
    if (currentIndex === -1) {
      focusableElements[0]?.focus()
    } else {
      const nextIndex = (currentIndex + 1) % focusableElements.length
      focusableElements[nextIndex]?.focus()
    }
  }

  /**
   * Move focus to the previous focusable element
   */
  static focusPrevious(container?: HTMLElement): void {
    const root = container || document.body
    const focusableElements = this.getFocusableElements(root)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    
    if (currentIndex === -1) {
      focusableElements[focusableElements.length - 1]?.focus()
    } else {
      const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
      focusableElements[prevIndex]?.focus()
    }
  }
}

// Keyboard navigation utilities
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation for a list of elements
   */
  handleArrowKeys(
    event: KeyboardEvent,
    elements: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both'
      wrap?: boolean
      onIndexChange?: (newIndex: number) => void
    } = {}
  ): number {
    const { orientation = 'vertical', wrap = true, onIndexChange } = options
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = wrap 
            ? (currentIndex + 1) % elements.length
            : Math.min(currentIndex + 1, elements.length - 1)
        }
        break
      
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = wrap
            ? currentIndex === 0 ? elements.length - 1 : currentIndex - 1
            : Math.max(currentIndex - 1, 0)
        }
        break
      
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = wrap
            ? (currentIndex + 1) % elements.length
            : Math.min(currentIndex + 1, elements.length - 1)
        }
        break
      
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = wrap
            ? currentIndex === 0 ? elements.length - 1 : currentIndex - 1
            : Math.max(currentIndex - 1, 0)
        }
        break
      
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      
      case 'End':
        event.preventDefault()
        newIndex = elements.length - 1
        break
    }

    if (newIndex !== currentIndex) {
      elements[newIndex]?.focus()
      onIndexChange?.(newIndex)
    }

    return newIndex
  }
}

// Screen reader utilities
export const ScreenReader = {
  /**
   * Announce text to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message
    
    document.body.appendChild(announcer)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  },

  /**
   * Create a visually hidden element for screen readers
   */
  createVisuallyHidden(text: string): HTMLElement {
    const element = document.createElement('span')
    element.className = 'sr-only'
    element.textContent = text
    return element
  }
}

// Color contrast utilities
export const ColorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const lum1 = this.getLuminance(...color1)
    const lum2 = this.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  },

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAG(
    color1: [number, number, number], 
    color2: [number, number, number], 
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(color1, color2)
    
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5
    }
  }
}

// React hooks for accessibility
export const useAccessibility = () => {
  return {
    FocusManager,
    KeyboardNavigation,
    ScreenReader,
    ColorContrast
  }
} 