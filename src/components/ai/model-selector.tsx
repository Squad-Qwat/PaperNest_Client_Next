'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Search } from 'lucide-react'

// Placeholder Model Selector using Radix or standard UI
export function ModelSelector({ children, open, onOpenChange }: any) {
  return <div className="relative">{children}</div>
}

export function ModelSelectorTrigger({ children, asChild }: any) {
  return <div className="flex items-center cursor-pointer">{children}</div>
}

export function ModelSelectorContent({ children }: { children: React.ReactNode }) {
  return <div className="absolute bottom-full left-0 mb-2 w-[calc(100vw-2rem)] sm:w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999] p-1 flex flex-col overflow-hidden max-w-[220px]">
    {children}
  </div>
}

export function ModelSelectorInput({ placeholder }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
      <Search className="w-3 h-3 text-slate-400" />
      <input type="text" placeholder={placeholder} className="bg-transparent border-none focus:ring-0 text-xs w-full" />
    </div>
  )
}

export function ModelSelectorList({ children }: { children: React.ReactNode }) {
  return <div className="overflow-y-auto max-h-60 p-1">{children}</div>
}

export function ModelSelectorEmpty({ children }: { children: React.ReactNode }) { return <div className="p-4 text-center text-xs text-slate-400">{children}</div> }

export function ModelSelectorGroup({ heading, children }: any) {
  return (
    <div className="py-2">
      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{heading}</div>
      {children}
    </div>
  )
}

export function ModelSelectorItem({ children, onSelect, value }: any) {
  return (
    <div 
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
    >
      {children}
    </div>
  )
}

export function ModelSelectorLogo({ provider }: { provider: string }) {
  return <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[8px] uppercase">{provider.charAt(0)}</div>
}

export function ModelSelectorName({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-700 dark:text-slate-200 font-medium">{children}</span>
}

export function ModelSelectorLogoGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center -space-x-1 ml-auto">{children}</div>
}
