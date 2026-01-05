import { Calendar, CheckCircle, FileText, Plus, Trash2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
	const [isModalOpen, setIsModalOpen] = useState(false)

	const handleReviewSubmit = async (data: { content: string; status: string }) => {
		try {
			const payload = { message: data.content }
			if (data.status === 'approved') {
				await documentsService.approveReview(reviewId, payload)
			} else if (data.status === 'rejected') {
				await documentsService.rejectReview(reviewId, payload)
			} else if (data.status === 'revision') {
				await documentsService.requestRevision(reviewId, payload)
			}
			router.refresh()
		} catch (error) {
			console.error('Failed to submit review decision:', error)
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

			<div className='relative bg-white rounded-xl border border-gray-200 transition-all hover:shadow-md group'>
				{/* Delete Button - Absolute Positioned */}
				{onDelete && (
					<button
						type='button'
						className='absolute top-6 right-6 z-10 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 opacity-0 group-hover:opacity-100'
						onClick={(e) => {
							e.stopPropagation()
							setShowDeleteConfirm(true)
						}}
					>
						<Trash2 className='w-4 h-4' />
					</button>
				)}

				<Link 
					href={`/${workspaceId}/reviews/${reviewId}`}
					className='block p-6 pb-2'
				>
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
				</Link>

				{/* Footer: Doc Link & Buttons */}
				<div className='px-6 pb-6 pt-2 flex items-center justify-between'>
					<Link
						href={`/${workspaceId}/documents/${documentBodyId}`}
						className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors'
					>
						<FileText className='w-3.5 h-3.5' />
						<span>Untuk: {title}</span>
					</Link>

					<div className='flex gap-2'>
						{/* Approval Actions (legacy) */}
						{status === 'pending' && (
							<>
								{onApprove && (
									<Button
										size='sm'
										variant='ghost'
										onClick={onApprove}
										className='text-green-600 hover:text-green-700 hover:bg-green-50'
									>
										<CheckCircle className='w-4 h-4 mr-1' /> Approve
									</Button>
								)}
								{onReject && (
									<Button
										size='sm'
										variant='ghost'
										onClick={onReject}
										className='text-red-600 hover:text-red-700 hover:bg-red-50'
									>
										<XCircle className='w-4 h-4 mr-1' /> Reject
									</Button>
								)}
							</>
						)}

						{/* New Review / Review Decision Button */}
						{isLatest && (
							<Button 
								size='sm' 
								onClick={() => setIsModalOpen(true)}
							>
								<Plus className='w-4 h-4 mr-1.5' />
								Review Action
							</Button>
						)}

						{/* Legacy onAddReview pass-through if needed */}
						{!isLatest && onAddReview && (
							<Button 
								size='sm' 
								onClick={onAddReview}
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
