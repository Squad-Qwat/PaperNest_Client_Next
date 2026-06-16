import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ReviewInfoCardProps {
	lecturerName: string
	studentName: string
	documentId: string
	workspaceId: string
	isDeleted?: boolean
}

export function ReviewInfoCard({
	lecturerName,
	studentName,
	documentId,
	workspaceId,
	isDeleted = false,
}: Readonly<ReviewInfoCardProps>) {
	const router = useRouter()
	const t = useTranslations('Review')

	return (
		<Card className='p-5 border bg-card sticky top-24 shadow-sm'>
			<h3 className='text-lg font-bold text-foreground mb-4'>{t('title')}</h3>
			<div className='space-y-3.5'>
				<div className='flex items-center justify-between text-sm'>
					<span className='text-muted-foreground'>{t('reviewer')}</span>
					<span className='font-bold text-foreground'>{lecturerName}</span>
				</div>
				<Separator className='opacity-50' />
				<div className='flex items-center justify-between text-sm'>
					<span className='text-muted-foreground'>{t('student')}</span>
					<span className='font-bold text-foreground'>{studentName}</span>
				</div>
				<Separator className='opacity-50' />
				<div className='flex items-center justify-between text-sm'>
					<span className='text-muted-foreground'>{t('documentId')}</span>
					<span className='font-mono text-[10px] text-muted-foreground truncate ml-4'>
						{documentId}
					</span>
				</div>
			</div>
			<Button
				className={`w-full mt-6 border rounded-lg font-bold shadow-sm ${
					isDeleted
						? 'bg-muted text-muted-foreground cursor-not-allowed opacity-70 border-border'
						: 'bg-background hover:bg-accent text-foreground border-border'
				}`}
				onClick={() => !isDeleted && router.push(`/${workspaceId}/documents/${documentId}`)}
				disabled={isDeleted}
			>
				{isDeleted ? t('documentDeleted') : t('openEditor')} <ArrowRight className='w-4 h-4 ml-2' />
			</Button>
		</Card>
	)
}
