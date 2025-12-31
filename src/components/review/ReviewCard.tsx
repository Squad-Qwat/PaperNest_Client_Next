import { ReviewStatusBadge } from './ReviewStatusBadge'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { FileText, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ReviewCardProps {
	reviewId: string
	documentBodyId: string
	lecturerUserId: string
	message: string
	status: 'Pending' | 'Approved' | 'Revision Required'
	date: string
	title: string
	workspaceId: string
	onDelete?: () => void
}

export function ReviewCard({
	reviewId,
	documentBodyId,
	lecturerUserId,
	message,
	status,
	date,
	title,
	workspaceId,
	onDelete,
}: ReviewCardProps) {


	return (
		<Link href={`/${workspaceId}/reviews/${reviewId}`} className='block'>
			<Card className='transition-all hover:shadow-md cursor-pointer'>
				<CardHeader className='pb-3'>
					<div className='flex justify-between items-start'>
						<div className='space-y-1.5'>
							<CardTitle className='text-base hover:text-emerald-600 transition-colors'>
								{title}
							</CardTitle>
							<CardDescription className='flex items-center gap-2 text-xs'>
								<span>Reviewer: {lecturerUserId}</span>
							</CardDescription>
						</div>
						{onDelete && (
							<Button
								variant='ghost'
								size='icon'
								className='h-8 w-8'
								onClick={(e) => {
									e.preventDefault() // Prevent navigation when clicking delete
									onDelete()
								}}
							>
								<Trash2 className='w-4 h-4' />
							</Button>
						)}
					</div>
					<div className='flex items-center gap-3 pt-1'>
						<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
							<Calendar className='w-3.5 h-3.5' />
							<span>{date}</span>
						</div>
						<ReviewStatusBadge status={status} />
					</div>
				</CardHeader>
				<CardContent className='pb-3'>
					<div className='bg-muted/50 rounded-md p-3 text-sm line-clamp-2'>{message}</div>
				</CardContent>
				<CardFooter>
					<div className='flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md w-fit'>
						<FileText className='w-4 h-4' />
						<span>Untuk: {documentBodyId}</span>
					</div>
				</CardFooter>
			</Card>
		</Link>
	)
}
