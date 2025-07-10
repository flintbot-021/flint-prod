import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea"> & {
    autoGrow?: boolean
  }
>(({ className, autoGrow = true, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
  // Auto-grow functionality
  const adjustHeight = React.useCallback(() => {
    if (autoGrow && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [autoGrow])
  
  React.useImperativeHandle(ref, () => textareaRef.current!, [])
  
  React.useEffect(() => {
    adjustHeight()
  }, [adjustHeight, props.value])
  
  const handleInput = React.useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    props.onInput?.(e)
  }, [adjustHeight, props.onInput])
  
  return (
    <textarea
      {...props}
      ref={textareaRef}
      onInput={handleInput}
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        autoGrow && "field-sizing-content resize-none overflow-hidden",
        className
      )}
    />
  )
})

export { Textarea }
