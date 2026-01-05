import { AlertCircle, Calendar, CheckCircle, FileText, Plus, Trash2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
		// Navigate to document detail
		router.push(`/${workspaceId}/documents/${reviewId}?action=view`) // Using reviewId? or documentId?
		// Logic in parent maps review to doc ID. The prop reviewId is passed.
		// Wait, typical usages passes matches. Let's assume parent handles navigation or we use router.
		// Actually this component takes `workspaceId`.
		// Let's stick to simple push if no custom handler.
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
			<div className='bg-white rounded-xl border border-gray-200 p-6 transition-all hover:shadow-md'>
				{/* Header: Title & Delete */}
				<div className='flex justify-between items-start mb-2'>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 mb-1'>
							{title || 'Untitled Document'}
						</h3>
						<p className='text-sm text-gray-500'>Reviewer: {lecturerUserId}</p>
					</div>
					{onDelete && (
						<button
							type='button'
							className='text-gray-400 hover:text-red-500 transition-colors'
							onClick={(e) => {
								e.stopPropagation()
								setShowDeleteConfirm(true)
							}}
						>
							<Trash2 className='w-4 h-4' />
						</button>
					)}
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
				<div className='bg-gray-50 rounded-lg p-4 text-gray-700 text-sm mb-6 leading-relaxed'>
					{message || 'No feedback provided.'}
				</div>

				{/* Footer: Doc Link & Buttons */}
				<div className='flex items-center justify-between'>
					<Link
						href={`/${workspaceId}/documents/${documentBodyId}`} // Assuming mapping, or prop needs to change to documentId.
						// Actually prop name is documentBodyId in interface but usage might mean Doc ID.
						// Let's assume it IS the doc link.
						className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors'
					>
						<FileText className='w-3.5 h-3.5' />
						<span>Untuk: {title}</span> {/* UI shows "Untuk: [DocName]" */}
					</Link>

					<div className='flex gap-2'>
						{/* Approval Actions (if pending) */}
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

						{/* New Review Button (as per design) */}
						{/* Design shows "New Review" button in blue. 
                            Likely triggers "Request Review" modal in this context or "Add Review" if lecturer.
                            We will map `onAddReview` to this.
                        */}
						{onAddReview && (
							<Button size='sm' onClick={onAddReview}>
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
