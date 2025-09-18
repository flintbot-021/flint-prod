import html2canvas from 'html2canvas'
import type { ScreenshotCaptureOptions } from '@/lib/types/asset-library'

/**
 * Capture a screenshot of an element or the entire viewport
 */
export async function captureScreenshot(options: ScreenshotCaptureOptions = {}): Promise<File> {
  const {
    element,
    filename = `screenshot-${Date.now()}.png`,
    width,
    height,
    quality = 1,
    format = 'png'
  } = options

  try {
    // Determine what to capture
    const targetElement = element || document.body

    // Configure html2canvas options
    const canvasOptions: any = {
      useCORS: true,
      allowTaint: true,
      scale: 2, // Higher resolution
      backgroundColor: null, // Transparent background
      logging: false,
      width: width,
      height: height,
      windowWidth: width || window.innerWidth,
      windowHeight: height || window.innerHeight
    }

    // Capture the element
    const canvas = await html2canvas(targetElement, canvasOptions)

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        `image/${format}`,
        quality
      )
    })

    // Create File object
    const file = new File([blob], filename, { type: `image/${format}` })
    
    return file
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Capture a screenshot of a specific element by selector
 */
export async function captureElementScreenshot(
  selector: string, 
  options: Omit<ScreenshotCaptureOptions, 'element'> = {}
): Promise<File> {
  const element = document.querySelector(selector) as HTMLElement
  
  if (!element) {
    throw new Error(`Element with selector "${selector}" not found`)
  }

  return captureScreenshot({ ...options, element })
}

/**
 * Capture a screenshot of the current viewport
 */
export async function captureViewportScreenshot(options: Omit<ScreenshotCaptureOptions, 'element'> = {}): Promise<File> {
  return captureScreenshot(options)
}

/**
 * Capture a screenshot with specific dimensions
 */
export async function captureFixedSizeScreenshot(
  width: number,
  height: number,
  options: Omit<ScreenshotCaptureOptions, 'width' | 'height'> = {}
): Promise<File> {
  return captureScreenshot({ ...options, width, height })
}

/**
 * Create a canvas-based screenshot fallback (for when html2canvas fails)
 */
export async function createCanvasScreenshot(
  element: HTMLElement,
  options: ScreenshotCaptureOptions = {}
): Promise<File> {
  const {
    filename = `canvas-screenshot-${Date.now()}.png`,
    width = element.offsetWidth,
    height = element.offsetHeight,
    format = 'png'
  } = options

  try {
    // Create a canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Get computed styles
    const computedStyle = window.getComputedStyle(element)
    
    // Fill background
    ctx.fillStyle = computedStyle.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Add text content (basic fallback)
    ctx.fillStyle = computedStyle.color || '#000000'
    ctx.font = `${computedStyle.fontSize || '16px'} ${computedStyle.fontFamily || 'Arial'}`
    ctx.textAlign = 'center'
    ctx.fillText(
      element.textContent || 'Screenshot Content',
      width / 2,
      height / 2
    )

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        `image/${format}`
      )
    })

    return new File([blob], filename, { type: `image/${format}` })
  } catch (error) {
    console.error('Canvas screenshot failed:', error)
    throw new Error(`Failed to create canvas screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
