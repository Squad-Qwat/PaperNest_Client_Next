import { AlertCircle, Calendar, CheckCircle, FileText, Plus, Trash2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ReviewStatusBadge } from './ReviewStatusBadge'

interface ReviewCardProps {
	reviewId: string
	documentBodyId: string
	lecturerUserId: string
	message: string
	status: 'Pending' | 'Approved' | 'Revision Required' | 'Open' | string
	date: string
	title: string
	workspaceId: string
	onDelete?: () => void
	isLatest?: boolean
	onAddReview?: () => void
	onApprove?: () => void
	onReject?: () => void
	onRequestRevision?: () => void
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
	isLatest,
	onAddReview,
	onApprove,
	onReject,
	onRequestRevision,
}: ReviewCardProps) {
	const router = useRouter()
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const handleCardClick = () => {
		router.push(`/${workspaceId}/reviews/${reviewId}`)
	}

	return (
		<>
			<ConfirmDialog
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={() => {
					if (onDelete) onDelete()
					setShowDeleteConfirm(false)
				}}
				title='Delete Review'
				message='Are you sure you want to delete this review? This action cannot be undone.'
				confirmText='Delete'
				cancelText='Cancel'
				variant='danger'
			/>
			<Card
				className='transition-all hover:shadow-md cursor-pointer group relative'
				onClick={handleCardClick}
			>
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
								className='h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50'
								onClick={(e) => {
									e.stopPropagation()
									setShowDeleteConfirm(true)
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
						{/* Assuming status strings match exactly or mapped */}
						<ReviewStatusBadge status={status as any} />
					</div>
				</CardHeader>
				<CardContent className='pb-3'>
					<div className='bg-muted/50 rounded-md p-3 text-sm line-clamp-2'>{message}</div>
				</CardContent>
				<CardFooter className='flex items-center justify-between'>
					<div className='flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md w-fit'>
						<FileText className='w-4 h-4' />
						<span>Untuk: {documentBodyId}</span>
					</div>

					<div className='flex gap-2'>
						{status === 'Pending' && (
							<>
								{onApprove && (
									<Button
										size='sm'
										variant='outline'
										className='text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
										onClick={(e) => {
											e.stopPropagation()
											onApprove()
										}}
									>
										<CheckCircle className='w-4 h-4 mr-1' /> Approve
									</Button>
								)}
								{onRequestRevision && (
									<Button
										size='sm'
										variant='outline'
										className='text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200'
										onClick={(e) => {
											e.stopPropagation()
											onRequestRevision()
										}}
									>
										<AlertCircle className='w-4 h-4 mr-1' /> Revision
									</Button>
								)}
								{onReject && (
									<Button
										size='sm'
										variant='outline'
										className='text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
										onClick={(e) => {
											e.stopPropagation()
											onReject()
										}}
									>
										<XCircle className='w-4 h-4 mr-1' /> Reject
									</Button>
								)}
							</>
						)}

						{isLatest && onAddReview && (
							<Button
								size='sm'
								onClick={(e) => {
									e.stopPropagation()
									onAddReview()
								}}
							>
								<Plus className='w-4 h-4 mr-1.5' />
								New Review
							</Button>
						)}
					</div>
				</CardFooter>
			</Card>
		</>
	)
}
