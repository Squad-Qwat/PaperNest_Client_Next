'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Brain, Quote, X, FileText } from 'lucide-react'

// Elements file for miscellaneous AI components

// --- Suggestions ---
export function Suggestions({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex flex-wrap gap-2 overflow-x-auto no-scrollbar py-2", className)}>{children}</div>
}

export function Suggestion({ suggestion, onClick }: { suggestion: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
    >
      {suggestion}
    </button>
  )
}

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// --- Reasoning (Thinking) ---
export function Reasoning({ children, duration }: { children: React.ReactNode, duration?: number }) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50 my-2 overflow-hidden">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <div className="flex items-center gap-1.5"><Brain className="w-3 h-3" /> Reasoning {duration && <span className="opacity-50">• {duration}s</span>}</div>
            <span className="opacity-50">{isExpanded ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
        {isExpanded && <div className="px-4 pb-3 pt-1 text-sm text-slate-600 dark:text-slate-400 italic font-serif leading-relaxed">{children}</div>}
    </div>
  )
}
export function ReasoningTrigger() { return null }
export function ReasoningContent({ children }: { children: string }) { 
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none italic">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

// --- Sources ---
export function Sources({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 my-2">{children}</div>
}
export function SourcesTrigger({ count }: { count: number }) {
    return <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase"><Quote className="w-2.5 h-2.5" /> Sources ({count})</div>
}
export function SourcesContent({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function Source({ href, title }: { href: string, title: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors shadow-sm">
      <FileText className="w-3 h-3" /> {title}
    </a>
  )
}

// --- Attachments ---
export function Attachments({ children, variant }: any) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}
export function Attachment({ data, onRemove, children }: any) {
  return <div className="relative group p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 pr-8">{children}</div>
}
export function AttachmentPreview() { return <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div> }
export function AttachmentRemove() { return <button className="absolute right-1 top-1 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button> }
