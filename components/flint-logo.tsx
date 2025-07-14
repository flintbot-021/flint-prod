import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FlintLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'image' | 'text'
  showText?: boolean
}

export function FlintLogo({ 
  className, 
  size = 'md', 
  variant = 'image',
  showText = true 
}: FlintLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  // Try to use image logo first, fallback to text if image fails to load
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {variant === 'image' ? (
        <div className="flex items-center space-x-2">
          <Image
            src="/flint.png" // You can change this to .svg or other formats
            alt="Flint"
            width={120}
            height={40}
            className={cn(sizeClasses[size], 'object-contain')}
            onError={(e) => {
              // Fallback to text logo if image fails to load
              e.currentTarget.style.display = 'none'
              const textElement = e.currentTarget.nextElementSibling as HTMLElement
              if (textElement) {
                textElement.style.display = 'block'
              }
            }}
          />
          <span 
            className={cn(
              'font-bold text-foreground hidden',
              textSizeClasses[size]
            )}
          >
            Flint
          </span>
        </div>
      ) : (
        <span className={cn('font-bold text-foreground', textSizeClasses[size])}>
          Flint
        </span>
      )}
    </div>
  )
} 