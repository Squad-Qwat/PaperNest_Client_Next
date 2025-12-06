import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	toolCalls?: Array<{
		id: string
		name: string
		args: any
		result?: string
		status: 'executing' | 'complete' | 'error'
	}>
}

interface AIChatMessageListProps {
	messages: Message[]
	isLoading: boolean
}

export function AIChatMessageList({ messages, isLoading }: AIChatMessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	if (messages.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center h-full text-center py-10'>
				<div className='w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center'>
					<svg
						className='w-8 h-8 text-gray-400'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
						/>
					</svg>
				</div>
				<h3 className='text-lg font-medium text-gray-900 mb-2'>Start a conversation</h3>
				<p className='text-sm text-gray-500 max-w-xs'>
					Ask questions about your document, get suggestions, or request help with writing and editing.
				</p>
			</div>
		)
	}

	return (
		<div className='flex-1 overflow-y-auto px-6 py-4 space-y-8'>
			{messages.map((message) => (
				<div
					key={message.id}
					className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
				>
					<div
						className={`w-full ${message.role === 'user'
							? 'flex justify-end'
							: 'flex justify-start'
							}`}
					>
						<div
							className={`${message.role === 'user'
								? 'bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[85%] shadow-sm'
								: 'bg-transparent text-gray-900 w-full prose prose-slate max-w-none dark:prose-invert prose-sm'
								}`}
						>
							{message.role === 'user' ? (
								<p className='whitespace-pre-wrap break-words'>{message.content}</p>
							) : (
								<ReactMarkdown 
									remarkPlugins={[remarkGfm]}
									components={{
										pre: ({node, ...props}) => <div className="overflow-auto w-full my-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">{props.children}</div>,
										code: ({node, ...props}) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono text-xs" {...props} />,
										table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 border" {...props} /></div>,
										th: ({node, ...props}) => <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border" {...props} />,
										td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border" {...props} />,
									}}
								>
									{message.content}
								</ReactMarkdown>
							)}

							{/* Tool Calls Display */}
							{message.toolCalls && message.toolCalls.length > 0 && (
								<div className='mt-4 space-y-2 w-full'>
									{message.toolCalls.map((tool) => (
										<ToolCallCard key={tool.id} tool={tool} />
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			))}
			{isLoading && (
				<div className='flex justify-start opacity-50'>
					<div className='flex space-x-2 py-2'>
						<div className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce'></div>
						<div
							className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce'
							style={{ animationDelay: '0.2s' }}
						></div>
						<div
							className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce'
							style={{ animationDelay: '0.4s' }}
						></div>
					</div>
				</div>
			)}
			<div ref={messagesEndRef} />
		</div>
	)
}

function ToolCallCard({ tool }: { tool: any }) {
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
		<div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-transparent transition-all hover:border-slate-300 dark:hover:border-slate-600">
			<button 
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					{getStatusIcon()}
					<span className="font-mono text-[10px] opacity-70 uppercase tracking-wider">Tool Call:</span>
					<span className="font-bold text-slate-700 dark:text-slate-200">{tool.name}</span>
				</div>
				{isExpanded ? <ChevronUp className="w-3 h-3 opacity-50" /> : <ChevronDown className="w-3 h-3 opacity-50" />}
			</button>
			
			{isExpanded && (
				<div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
					<div className="space-y-3">
						<div>
							<div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Parameters</div>
							<pre className="text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto max-h-40 font-mono">
								{JSON.stringify(tool.args, null, 2)}
							</pre>
						</div>
						{tool.result && (
							<div>
								<div className="text-[9px] uppercase font-bold text-slate-400 mb-1">Result</div>
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
