import { Calendar, FileText, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/use-toast'
import { documentsService } from '@/lib/api/services/documents.service'
import CreateReviewModal from './CreateReviewModal'
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

	onReviewUpdate?: (status: string, message?: string) => void
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

	onReviewUpdate,
}: ReviewCardProps) {
	const router = useRouter()
	const { toast } = useToast()
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)

	// Local optimistic status could be used, but better to rely on parent update or simple refresh
	const [isUpdating, setIsUpdating] = useState(false)

	const handleReviewSubmit = async (data: { content: string; status: string }) => {
		try {
			setIsUpdating(true)
			const payload = { message: data.content }
			let newStatus = status

			if (data.status === 'approved') {
				await documentsService.approveReview(reviewId, payload)
				newStatus = 'approved'
			} else if (data.status === 'rejected') {
				await documentsService.rejectReview(reviewId, payload)
				newStatus = 'rejected'
			} else if (data.status === 'revision') {
				await documentsService.requestRevision(reviewId, payload)
				newStatus = 'revision_required'
			}

			toast({
				title: 'Review Updated',
				description: `Review status changed to ${data.status}`,
				variant: 'default',
			})

			if (onReviewUpdate) {
				onReviewUpdate(newStatus, data.content)
			} else {
				router.refresh()
			}
		} catch (error: any) {
			console.error('Failed to submit review decision:', error)
			if (error?.errors) {
				console.error('Validation errors:', error.errors)
			}
			toast({
				title: 'Validation Error',
				description: error.errors ? JSON.stringify(error.errors) : (error.message || 'Failed to update review status'),
				variant: 'destructive',
			})
		} finally {
			setIsUpdating(false)
		}
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

			<CreateReviewModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleReviewSubmit}
			/>

			<div
				className='relative bg-white rounded-xl border border-gray-200 transition-all hover:shadow-md group cursor-pointer'
				onClick={() => router.push(`/${workspaceId}/reviews/${reviewId}`)}
			>
				{/* Delete Button - Absolute Positioned */}
				{onDelete && (
					<div className='absolute top-6 right-6 z-10'>
						<button
							type='button'
							className='text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100'
							onClick={(e) => {
								e.stopPropagation()
								setShowDeleteConfirm(true)
							}}
						>
							<Trash2 className='w-4 h-4' />
						</button>
					</div>
				)}

				<div className='p-6 pb-2'>
					{/* Header: Title */}
					<div className='mb-2 pr-8'>
						<h3 className='text-lg font-semibold text-gray-900 mb-1'>
							{title || 'Untitled Document'}
						</h3>
						<p className='text-sm text-gray-500'>Reviewer: {lecturerUserId}</p>
					</div>

					{/* Meta: Date & Status */}
					<div className='flex items-center gap-3 mb-6'>
						<div className='flex items-center gap-2 text-sm text-gray-500'>
							<Calendar className='w-4 h-4' />
							<span>{date}</span>
						</div>
						<ReviewStatusBadge status={status as any} />
					</div>

					{/* Content Box */}
					<div className='bg-gray-50 rounded-lg p-4 text-gray-700 text-sm mb-4 leading-relaxed'>
						{message || 'No feedback provided.'}
					</div>
				</div>

				{/* Footer: Doc Link & Buttons */}
				<div
					className='px-6 pb-6 pt-2 flex items-center justify-between'
					onClick={(e) => e.stopPropagation()}
				>
					<Link
						href={`/${workspaceId}/documents/${documentBodyId}`}
						className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors'
						onClick={(e) => e.stopPropagation()}
					>
						<FileText className='w-3.5 h-3.5' />
						<span>Untuk: {title}</span>
					</Link>

					<div className='flex gap-2'>

						{/* New Review / Review Decision Button */}
						{isLatest && (
							<Button
								size='sm'
								onClick={(e) => {
									e.stopPropagation()
									setIsModalOpen(true)
								}}
								disabled={isUpdating}
							>
								<Plus className='w-4 h-4 mr-1.5' />
								Review Action
							</Button>
						)}

						{/* Legacy onAddReview pass-through if needed */}
						{!isLatest && onAddReview && (
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
				</div>
			</div>
		</>
	)
}
