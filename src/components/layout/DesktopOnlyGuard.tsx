'use client'

import { Eye, Laptop } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface DesktopOnlyGuardProps {
	workspaceId: string
}

export function DesktopOnlyGuard({ workspaceId }: DesktopOnlyGuardProps) {
	const [hidden, setHidden] = useState(false)
	const t = useTranslations('DesktopGuard')

	if (hidden) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center'
			>
				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.4, ease: 'easeOut' }}
					className='max-w-[320px] w-full relative'
				>
					<div className='flex justify-center mb-6'>
						<Image
							src='/PaperNest-logo.svg'
							alt='PaperNest Logo'
							width={64}
							height={64}
							className='w-16 h-16'
							priority
						/>
					</div>

					<h1 className='text-xl font-bold text-foreground mb-2 tracking-tight'>{t('title')}</h1>

					<p className='text-muted-foreground text-sm leading-relaxed mb-8'>{t('description')}</p>

					<div className='bg-muted border border-border rounded-xl p-4 mb-8 flex flex-col items-center gap-2'>
						<Laptop className='h-8 w-8 text-primary/40' />
						<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
							{t('bestViewed')}
						</p>
					</div>

					<div className='flex flex-col gap-3'>
						<Button asChild className='w-full transition-all shadow-none rounded-lg'>
							<Link href={`/${workspaceId}`}>{t('backToDashboard')}</Link>
						</Button>

						<Button
							variant='outline'
							onClick={() => setHidden(true)}
							className='w-full transition-all shadow-none rounded-lg text-xs font-medium flex items-center justify-center gap-1.5'
						>
							<Eye className='h-3.5 w-3.5' />
							{t('continueAnyway')}
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}
