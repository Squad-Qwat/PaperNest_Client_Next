'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ArrowDown } from 'lucide-react'

interface ConversationProps {
  children: React.ReactNode
  className?: string
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <div className={cn("flex flex-col flex-1 min-h-0 relative", className)}>
      {children}
    </div>
  )
}

export function ConversationContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [children])

  return (
    <div 
      ref={scrollRef}
      className={cn("flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth", className)}
    >
      {children}
    </div>
  )
}

export function ConversationScrollButton() {
  return (
    <button className="absolute bottom-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 transition-opacity hover:opacity-100">
      <ArrowDown className="w-4 h-4" />
    </button>
  )
}
