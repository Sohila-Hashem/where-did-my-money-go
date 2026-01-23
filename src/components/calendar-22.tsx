"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function Calendar22({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="rounded-md w-full justify-between font-normal bg-transparent"
          >
            {value ? value.toLocaleDateString() : <span className="text-muted-foreground">Select date</span>}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            required
            defaultMonth={new Date()}
            startMonth={new Date(new Date().getFullYear(), 0, 1)}
            endMonth={new Date(new Date().getFullYear(), 11, 31)}
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
