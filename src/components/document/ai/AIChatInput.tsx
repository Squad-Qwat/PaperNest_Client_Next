'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AIChatInputProps {
	input: string
	setInput: (val: string) => void
	isLoading: boolean
	onSubmit: (e: React.FormEvent) => void
}

export function AIChatInput({ input, setInput, isLoading, onSubmit }: AIChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			onSubmit(e)
		}
	}

	return (
		<div className='bg-white px-4 py-4 border-t border-gray-200'>
			<form onSubmit={onSubmit} className='relative'>
				<div className='mb-3'>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4 text-sm'
					>
						<svg
							className='w-4 h-4 mr-2'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
							/>
						</svg>
						Add context
					</Button>
				</div>

				<div className='relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors'>
					<Textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Ask, search, or make anything...'
						className='min-h-[100px] max-h-[200px] resize-none bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 focus-visible:border-0 px-4 pt-4 pb-14 text-base'
						disabled={isLoading}
					/>

					<div className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3'>
						<div className='flex items-center gap-3'>
							<Button
								type='button'
								variant='ghost'
								size='icon'
								className='h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg'
							>
								<svg
									className='w-4 h-4'
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
						</div>

						<Button
							type='submit'
							size='icon'
							disabled={!input.trim() || isLoading}
							className={`shrink-0 rounded-full w-9 h-9 transition-colors ${input.trim() && !isLoading
								? 'bg-primary hover:bg-primary/90 text-primary-foreground'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'
								}`}
						>
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								strokeWidth={2.5}
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M5 10l7-7m0 0l7 7m-7-7v18'
								/>
							</svg>
						</Button>
					</div>
				</div>
			</form>
		</div>
	)
}
