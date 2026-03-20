'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MessageProps {
  from: 'user' | 'assistant'
  children: React.ReactNode
  className?: string
}

export function Message({ from, children, className }: MessageProps) {
  return (
    <div className={cn(
      "flex w-full group",
      from === 'user' ? "justify-end" : "justify-start",
      className
    )}>
      <div className={cn(
        "max-w-[90%] flex flex-col gap-2",
        from === 'user' ? "items-end" : "items-start"
      )}>
        {children}
      </div>
    </div>
  )
}

export function MessageContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

export function MessageResponse({ children, className }: { children: string, className?: string }) {
  return (
    <div className={cn(
      "prose prose-slate prose-sm dark:prose-invert max-w-none break-words",
      "prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700",
      "prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded",
      className
    )}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 border" {...props} /></div>,
          th: ({ node, ...props }) => <th className="px-3 py-2 bg-gray-50 dark:bg-slate-800 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

// Branching components
export function MessageBranch({ children, defaultBranch = 0 }: { children: React.ReactNode, defaultBranch?: number }) {
  const [activeBranch, setActiveBranch] = React.useState(defaultBranch)
  
  // In a real implementation, we would use context to share activeBranch
  // For now, we'll keep it simple as the demo shows
  return <div className="w-full flex flex-col gap-1">{children}</div>
}

export function MessageBranchContent({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>
}

export function MessageBranchSelector({ from, children, className }: { from: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 mt-2",
      from === 'user' ? "justify-end" : "justify-start",
      className
    )}>
      {children}
    </div>
  )
}

export function MessageBranchPrevious({ onClick, disabled }: any) { 
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30"
    >
      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
    </button>
  ) 
}

export function MessageBranchNext({ onClick, disabled }: any) { 
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30"
    >
      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
    </button> 
  ) 
}

export function MessageBranchPage({ current, total }: { current: number, total: number }) { 
  return <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{current} / {total}</span> 
}
