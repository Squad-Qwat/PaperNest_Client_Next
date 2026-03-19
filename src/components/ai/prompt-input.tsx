'use client'

import * as React from "react"
import { useState, useRef, useEffect, useContext, createContext } from "react"
import { cn } from '@/lib/utils'
import { Plus, SendHorizontal, LayoutGrid } from 'lucide-react'

const PromptInputContext = createContext<any>(null)

export function usePromptInputAttachments() {
  const context = useContext(PromptInputContext)
  return context?.attachments || { files: [], remove: () => {} }
}

export interface PromptInputMessage {
  text: string
  files: any[]
}

interface PromptInputProps {
  children: React.ReactNode
  onSubmit: (message: PromptInputMessage) => void
  className?: string
  globalDrop?: boolean
  multiple?: boolean
}

export function PromptInput({ children, onSubmit, className, value }: any) {
  const [attachments, setAttachments] = useState({ files: [], remove: (id: string) => {} })
  
  return (
    <PromptInputContext.Provider value={{ attachments }}>
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ text: value, files: attachments.files })
        }}
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          className
        )}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  )
}

export function PromptInputHeader({ children }: { children?: React.ReactNode }) {
  return <div className="px-3 pt-3 flex flex-wrap gap-2">{children}</div>
}

export function PromptInputBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 min-w-0">{children}</div>
}

export function PromptInputTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const adjustHeight = () => {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
      textarea.addEventListener('input', adjustHeight)
      adjustHeight()
      return () => textarea.removeEventListener('input', adjustHeight)
    }
  }, [])

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "flex w-full resize-none bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[200px]",
        className
      )}
      {...props}
    />
  )
}

export function PromptInputFooter({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pb-3 flex items-center justify-between gap-2 border-t border-slate-50 dark:border-slate-800/50 mt-1">{children}</div>
}

export function PromptInputTools({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5">{children}</div>
}

export function PromptInputButton({ children, onClick, variant = "ghost", className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
        variant === 'default' ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-500",
        className
      )}
    >
      {children}
    </button>
  )
}

export function PromptInputSubmit({ disabled, status }: any) {
  return (
    <button 
      type="submit"
      disabled={disabled}
      className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
    >
      <SendHorizontal className="w-4 h-4" />
    </button>
  )
}

export function PromptInputActionAddAttachments() {
  return <div className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"><Plus className="w-4 h-4" /> Add Files</div>
}

export function PromptInputActionMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative group">{children}</div>
}

export function PromptInputActionMenuTrigger() {
  return <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><LayoutGrid size={16} /></button>
}

export function PromptInputActionMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-48">{children}</div>
}
