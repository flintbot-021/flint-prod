'use client'

import React, { useState } from 'react'
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

// Simple Modal Component (using a modal approach instead of Radix Dialog)
const Modal: React.FC<{
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
        {children}
      </div>
    </div>
  )
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  icon?: React.ReactNode
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
  isLoading = false
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // Keep dialog open on error
    } finally {
      setIsConfirming(false)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonVariant: 'destructive' as const,
          defaultIcon: <Trash2 className="h-6 w-6" />
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonVariant: 'default' as const,
          defaultIcon: <AlertTriangle className="h-6 w-6" />
        }
      default:
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonVariant: 'default' as const,
          defaultIcon: <Archive className="h-6 w-6" />
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${styles.iconBg}`}>
              <div className={styles.iconColor}>
                {icon || styles.defaultIcon}
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-muted-foreground text-center sm:text-left mb-6">
            {description}
          </CardDescription>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConfirming || isLoading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button
              variant={styles.buttonVariant}
              onClick={handleConfirm}
              disabled={isConfirming || isLoading}
              className="w-full sm:w-auto"
            >
              {isConfirming || isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

// Hook for managing confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive' | 'warning'
    confirmText?: string
    cancelText?: string
    icon?: React.ReactNode
  } | null>(null)

  const showConfirmation = (options: {
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive' | 'warning'
    confirmText?: string
    cancelText?: string
    icon?: React.ReactNode
  }) => {
    setDialog({
      isOpen: true,
      ...options
    })
  }

  const hideConfirmation = () => {
    setDialog(null)
  }

  const ConfirmationDialogComponent = dialog ? (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={hideConfirmation}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      description={dialog.description}
      variant={dialog.variant}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      icon={dialog.icon}
    />
  ) : null

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent
  }
} 