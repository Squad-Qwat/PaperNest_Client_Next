'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export interface ToolCall {
	id: string
	name: string
	args: any
	result?: string
	status: 'executing' | 'complete' | 'error'
}

export function ToolCallCard({ tool }: { tool: ToolCall }) {
	const [isExpanded, setIsExpanded] = useState(false)

	const getStatusIcon = () => {
		switch (tool.status) {
			case 'executing': return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
			case 'complete': return <CheckCircle2 className="w-3 h-3 text-green-500" />
			case 'error': return <XCircle className="w-3 h-3 text-red-500" />
			default: return <Terminal className="w-3 h-3 text-slate-400" />
		}
	}

	return (
		<div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-slate-600 my-2">
			<button 
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					{getStatusIcon()}
					<span className="font-mono text-[10px] opacity-70 uppercase tracking-wider">Aksi:</span>
					<span className="font-bold text-slate-700 dark:text-slate-200">{tool.name}</span>
				</div>
				{isExpanded ? <ChevronUp className="w-3 h-3 opacity-50" /> : <ChevronDown className="w-3 h-3 opacity-50" />}
			</button>
			
			{isExpanded && (
				<div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10">
					<div className="space-y-3">
						<div>
							<div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Parameter</div>
							<pre className="text-[10px] bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto max-h-40 font-mono">
								{JSON.stringify(tool.args, null, 2)}
							</pre>
						</div>
						{tool.result && (
							<div>
								<div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Hasil</div>
								<div className="text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto max-h-60 whitespace-pre-wrap font-mono">
									{tool.result}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
