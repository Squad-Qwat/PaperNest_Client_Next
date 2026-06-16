'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function SettingsHeader() {
	const router = useRouter()
	const t = useTranslations('Settings')

	return (
		<header className='bg-background border-b sticky top-0 z-50 py-4'>
			<div className='w-full px-4 md:px-6 flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button
						variant='ghost'
						onClick={() => router.push('/')}
						className='h-10 w-10 hover:bg-muted rounded-lg transition-all group p-0 min-w-0 shrink-0'
						title={t('backToDashboard')}
					>
						<ChevronLeft className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
					</Button>
					<div className='flex flex-col'>
						<div className='flex items-center gap-3'>
							<h1 className='text-xl font-semibold tracking-tight'>{t('title')}</h1>
							<div className='bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1.5'></div>
						</div>
						<p className='text-sm text-muted-foreground'>{t('subtitle')}</p>
					</div>
				</div>
			</div>
		</header>
	)
}
