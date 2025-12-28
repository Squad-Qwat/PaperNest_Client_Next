'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
}

interface AIChatPanelProps {
	editor?: any
	onClose?: () => void
}

export function AIChatPanel({ editor, onClose }: AIChatPanelProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: input.trim(),
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInput('')
		setIsLoading(true)

		// TODO: Implement actual AI API call
		// Simulating AI response
		setTimeout(() => {
			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: 'This is a placeholder AI response. Connect your AI service here.',
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, aiMessage])
			setIsLoading(false)
		}, 1000)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	return (
		<div className='flex flex-col h-full bg-white'>
			{/* Header */}
			<div className='flex items-center justify-between px-6 py-4 border-b'>
				<h2 className='text-lg font-semibold text-gray-900'>AI Assistant</h2>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={() => setMessages([])}>
						Clear Chat
					</Button>
					{onClose && (
						<Button
							variant='ghost'
							size='icon'
							onClick={onClose}
							className='h-8 w-8'
							aria-label='Close AI Assistant'
						>
							<svg
								className='w-5 h-5'
								fill='none'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path d='M6 18L18 6M6 6l12 12'></path>
							</svg>
						</Button>
					)}
				</div>
			</div>

			{/* Messages Area */}
			<div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
				{messages.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center'>
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
							Ask questions about your document, get suggestions, or request help with writing.
						</p>
					</div>
				) : (
					<>
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[80%] rounded-2xl px-4 py-3 ${
										message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
									}`}
								>
									<p className='text-sm whitespace-pre-wrap wrap-break-word'>{message.content}</p>
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
					</>
				)}
			</div>

			{/* Input Area */}
			<div className='border-t bg-white px-6 py-4'>
				<form onSubmit={handleSubmit} className='relative'>
					<div className='flex items-end gap-3'>
						{/* Attachment Button */}
						<Button type='button' variant='ghost' size='icon' className='shrink-0 mb-1'>
							<svg
								className='w-5 h-5 text-gray-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
								/>
							</svg>
						</Button>

						{/* Text Input */}
						<div className='flex-1 relative'>
							<Textarea
								ref={textareaRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder='Ask, search, or make anything...'
								className='min-h-12 max-h-[200px] resize-none pr-12 py-3 rounded-3xl border-gray-200 focus:border-gray-300 focus:ring-0'
								rows={1}
								disabled={isLoading}
							/>

							{/* Mode Selector inside input */}
							<div className='absolute left-3 bottom-3 flex items-center gap-2 text-xs text-gray-500'>
								<span className='flex items-center gap-1'>
									<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M13 10V3L4 14h7v7l9-11h-7z'
										/>
									</svg>
									Auto
								</span>
								<span className='flex items-center gap-1'>
									<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
										/>
									</svg>
									All Sources
								</span>
							</div>
						</div>

						{/* Submit Button */}
						<Button
							type='submit'
							size='icon'
							disabled={!input.trim() || isLoading}
							className='shrink-0 rounded-full w-12 h-12 mb-1'
						>
							<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 10l7-7m0 0l7 7m-7-7v18'
								/>
							</svg>
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
