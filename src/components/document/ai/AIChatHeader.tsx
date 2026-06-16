'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface AIChatHeaderProps {
	onClose?: () => void
	onClearChat: () => void
}

export function AIChatHeader({ onClose, onClearChat }: AIChatHeaderProps) {
	const t = useTranslations('AIChat')

	return (
		<div className='flex items-center justify-between px-4 py-3 border-b border-border bg-transparent'>
			<div className='flex items-center gap-3'>
				<h2 className='text-lg font-semibold text-foreground'>{t('aurora')}</h2>
			</div>
			<div className='flex items-center gap-2'>
				<Button variant='outline' size='sm' onClick={onClearChat}>
					{t('clearChat')}
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
