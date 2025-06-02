"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to?: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  initialFocus?: boolean
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  initialFocus,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  // For simplicity, we'll use a basic calendar implementation
  // In a real app, you'd use react-day-picker or similar
  
  const handleDateSelect = (date: Date) => {
    if (disabled?.(date)) return
    
    if (mode === "single") {
      onSelect?.(date)
    }
    // Add logic for multiple and range modes as needed
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const isSelected = (day: number) => {
    if (!selected || mode !== "single" || !(selected instanceof Date)) return false
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return dayDate.toDateString() === selected.toDateString()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={previousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="h-9 w-9" />
        ))}
        
        {/* Days of the month */}
        {days.map((day) => {
          const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
          const isDisabled = disabled?.(dayDate)
          const selected = isSelected(day)
          
          return (
            <Button
              key={day}
              variant={selected ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-9 w-9 p-0 font-normal",
                selected && "bg-primary text-primary-foreground",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isDisabled && handleDateSelect(dayDate)}
              disabled={isDisabled}
            >
              {day}
            </Button>
          )
        })}
      </div>
    </div>
  )
} 