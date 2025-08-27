"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ date, onSelect, placeholder = "Pick a date", disabled }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerProps {
  date?: Date
  time?: string
  onDateSelect: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  dateLabel?: string
  timeLabel?: string
  disabled?: boolean
}

export function DateTimePicker({ 
  date, 
  time = "", 
  onDateSelect, 
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  disabled 
}: DateTimePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">{dateLabel}</label>
        <DatePicker 
          date={date} 
          onSelect={onDateSelect} 
          placeholder="Select date"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">{timeLabel}</label>
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
