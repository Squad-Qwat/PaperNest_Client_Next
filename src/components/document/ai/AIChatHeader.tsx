'use client'

import { Button } from '@/components/ui/button'

interface AIChatHeaderProps {
	onClose?: () => void
	onClearChat: () => void
}

export function AIChatHeader({ onClose, onClearChat }: AIChatHeaderProps) {
	return (
		<div className='flex items-center justify-between px-6 py-4 border-b'>
			<h2 className='text-lg font-semibold text-gray-900'>Neptune</h2>
			<div className='flex items-center gap-2'>
				<Button variant='outline' size='sm' onClick={onClearChat}>
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
	)
}
