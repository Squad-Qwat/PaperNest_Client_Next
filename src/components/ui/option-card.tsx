"use client"

import * as React from "react"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface OptionCardProps {
  value: string
  title: string
  description: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export function OptionCard({
  value,
  title,
  description,
  disabled = false,
  className,
  icon,
}: OptionCardProps) {
  const id = React.useId()
  
  return (
    <div
      className={cn(
        "border-input has-[:checked]:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-lg border p-4 shadow-xs outline-none transition-all",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <RadioGroupItem
        value={value}
        id={`${id}-${value}`}
        disabled={disabled}
        className="order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3"
        aria-describedby={`${id}-${value}-description`}
      />
      <div className="grid grow justify-items-center gap-2 text-center">
        {icon && <div className="text-2xl">{icon}</div>}
        <Label htmlFor={`${id}-${value}`} className="justify-center font-semibold text-base">
          {title}
        </Label>
        <p id={`${id}-${value}-description`} className="text-muted-foreground text-xs">
          {description}
        </p>
      </div>
    </div>
  )
}
