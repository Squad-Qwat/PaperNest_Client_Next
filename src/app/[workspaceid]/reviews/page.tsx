'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { ReviewCard } from '@/components/review/ReviewCard'
import { SearchInput } from '@/components/ui/search-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { documentsService } from '@/lib/api/services/documents.service'
import type { Review } from '@/lib/api/types/review.types'

export default function ReviewsPage() {
	const params = useParams()
	const workspaceId = (params?.workspaceid as string) || 'default-workspace'

	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedDocument, setSelectedDocument] = useState('all')
	const [selectedStatus, setSelectedStatus] = useState('all')
	const [sortOrder, setSortOrder] = useState('desc')

	const fetchReviews = useCallback(async () => {
		try {
			setLoading(true)
			const response = await documentsService.getPendingReviews()
			setReviews(response.reviews)
		} catch (error) {
			console.error('Failed to fetch reviews:', error)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchReviews()
	}, [fetchReviews])

	const handleApprove = async (reviewId: string) => {
		try {
			await documentsService.approveReview(reviewId)
			fetchReviews()
		} catch (error) {
			console.error('Failed to approve review:', error)
		}
	}

	const handleReject = async (reviewId: string) => {
		try {
			// For simplicity, we might need a modal to enter rejection reason.
			// For now, hardcoding a generic message or needing expansion.
			const reason = prompt('Enter rejection reason:')
			if (!reason) return
			await documentsService.rejectReview(reviewId, { message: reason })
			fetchReviews()
		} catch (error) {
			console.error('Failed to reject review:', error)
		}
	}

	const handleRequestRevision = async (reviewId: string) => {
		try {
			const feedback = prompt('Enter revision instructions:')
			if (!feedback) return
			await documentsService.requestRevision(reviewId, { message: feedback })
			fetchReviews()
		} catch (error) {
			console.error('Failed to request revision:', error)
		}
	}

	const filteredReviews = reviews.filter((review) => {
		const matchesSearch =
			review.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			review.status.toLowerCase().includes(searchQuery.toLowerCase())

		const matchesStatus =
			selectedStatus === 'all' || review.status.toLowerCase() === selectedStatus.toLowerCase()

		return matchesSearch && matchesStatus
	})

	const sortedReviews = [...filteredReviews].sort((a, b) => {
		const dateA = new Date(a.requestedAt).getTime()
		const dateB = new Date(b.requestedAt).getTime()
		return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
	})

	return (
		<div className='min-h-screen bg-gray-50'>
			<Navbar mode='workspace' />

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
					<div className='space-y-2'>
						<h1 className='text-3xl font-bold text-gray-900'>Reviews</h1>
						<p className='text-gray-600'>Kelola dan tinjau review di semua dokumen</p>
					</div>
				</div>

				<div className='space-y-6'>
					{/* Filters Section */}
					<div className='flex flex-col sm:flex-row justify-between gap-4'>
						{/* Search and Status Filter */}
						<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
							<div className='w-full sm:w-[320px]'>
								<SearchInput
									placeholder='Cari review...'
									className='w-full bg-white'
									value={searchQuery}
									onChange={setSearchQuery}
								/>
							</div>
							<div className='w-full sm:w-[140px]'>
								<Select value={selectedStatus} onValueChange={setSelectedStatus}>
									<SelectTrigger className='bg-white'>
										<SelectValue placeholder='Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Status</SelectItem>
										<SelectItem value='pending'>Pending</SelectItem>
										<SelectItem value='approved'>Approved</SelectItem>
										<SelectItem value='revision_required'>Revision</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{/* Sort Order Dropdown */}
							<div className='w-full sm:w-[140px]'>
								<Select value={sortOrder} onValueChange={setSortOrder}>
									<SelectTrigger className='bg-white'>
										<SelectValue placeholder='Sort' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='desc'>Newest First</SelectItem>
										<SelectItem value='asc'>Oldest First</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{loading ? (
						<div className='text-center py-10'>Loading reviews...</div>
					) : reviews.length > 0 ? (
						<div className='space-y-4'>
							<h2 className='text-lg font-semibold text-gray-900'>
								Semua Review ({sortedReviews.length})
							</h2>

							<div className='grid gap-4'>
								{sortedReviews.map((review) => (
									<ReviewCard
										key={review.reviewId}
										{...review}
										reviewId={review.reviewId}
										workspaceId={workspaceId}
										// Mapping properties dynamically if names slightly differ or need spread
										title={`Review for ${review.documentBodyId}`} // Placeholder title if not in data
										date={new Date(review.requestedAt).toLocaleDateString()}
										// Actions
										onApprove={() => handleApprove(review.reviewId)}
										onReject={() => handleReject(review.reviewId)}
										onRequestRevision={() => handleRequestRevision(review.reviewId)}
									/>
								))}
							</div>
						</div>
					) : (
						<div className='text-center py-10 text-gray-500'>No reviews found.</div>
					)}
				</div>
			</main>
		</div>
	)
}