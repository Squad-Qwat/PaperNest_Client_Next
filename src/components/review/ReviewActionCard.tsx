import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ReviewActionCardProps {
	onAction: (type: 'approved' | 'rejected' | 'revision_required') => void
}

export function ReviewActionCard({ onAction }: Readonly<ReviewActionCardProps>) {
	const t = useTranslations('Review')

	return (
		<Card className='p-6 border shadow-sm bg-card sticky top-24'>
			<h3 className='text-lg font-bold text-foreground mb-6 flex items-center gap-2'>
				<CheckCircle2 className='w-5 h-5 text-teal-600 dark:text-teal-400' />
				{t('takeAction')}
			</h3>

			<div className='grid grid-cols-1 gap-3 mb-6'>
				<Button
					onClick={() => onAction('approved')}
					className='w-full bg-teal-600 hover:bg-teal-700 font-bold'
				>
					<CheckCircle2 className='w-4 h-4 mr-2' /> {t('approve')}
				</Button>
				<Button
					variant='outline'
					onClick={() => onAction('revision_required')}
					className='w-full border-amber-200/50 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-bold'
				>
					<AlertCircle className='w-4 h-4 mr-2' /> {t('requestRevision')}
				</Button>
				<Button
					variant='outline'
					onClick={() => onAction('rejected')}
					className='w-full border-red-200/50 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold'
				>
					<XCircle className='w-4 h-4 mr-2' /> {t('reject')}
				</Button>
			</div>

			<div className='p-4 bg-muted/50 rounded-lg border border-border'>
				<div className='flex gap-2'>
					<Info className='w-4 h-4 text-muted-foreground mt-0.5' />
					<p className='text-xs text-muted-foreground leading-normal'>{t('infoWarning')}</p>
				</div>
			</div>
		</Card>
	)
}
