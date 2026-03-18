'use client'

import { useRef, useEffect } from 'react'

export interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
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
		<div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
			{messages.map((message) => (
				<div
					key={message.id}
					className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
				>
					<div
						className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
							? 'bg-primary text-primary-foreground'
							: 'bg-gray-100 text-gray-900'
							}`}
					>
						<p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>
					</div>
				</div>
			))}
			{isLoading && (
				<div className='flex justify-start'>
					<div className='max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100'>
						<div className='flex space-x-2'>
							<div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
							<div
								className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
								style={{ animationDelay: '0.2s' }}
							></div>
							<div
								className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
								style={{ animationDelay: '0.4s' }}
							></div>
						</div>
					</div>
				</div>
			)}
			<div ref={messagesEndRef} />
		</div>
	)
}
