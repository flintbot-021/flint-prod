import { useState, useEffect } from 'react'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastState = ToastProps & {
  id: string
  isVisible: boolean
}

let toastCount = 0
let toastListeners: ((toasts: ToastState[]) => void)[] = []
let toasts: ToastState[] = []

const updateListeners = () => {
  toastListeners.forEach(listener => listener(toasts))
}

export const toast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
  const id = (++toastCount).toString()
  const newToast: ToastState = {
    id,
    title,
    description,
    variant,
    duration,
    isVisible: true
  }

  toasts = [...toasts, newToast]
  updateListeners()

  // Auto-remove toast after duration
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    updateListeners()
  }, duration)

  return id
}

export const useToast = () => {
  const [toastList, setToastList] = useState<ToastState[]>(toasts)

  useEffect(() => {
    toastListeners.push(setToastList)
    
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToastList)
    }
  }, [])

  return {
    toast,
    toasts: toastList
  }
} 