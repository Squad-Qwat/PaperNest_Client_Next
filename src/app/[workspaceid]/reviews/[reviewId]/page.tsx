'use client'

import { AlertCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { ReviewComment } from '@/components/review/ReviewComment'
import { ReviewStatusBadge } from '@/components/review/ReviewStatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { documentsService } from '@/lib/api/services/documents.service'

export default function ReviewDetailPage() {
	const params = useParams()
	const { reviewId } = params
	const { loading: authLoading } = useAuth()
	const [review, setReview] = useState<any | null>(null) // using any to map easier to UI for now, or use Review type
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchReview = async () => {
			if (!reviewId || authLoading) return
			try {
				const { review: reviewData } = await documentsService.getReview(reviewId as string)
				// Map API response to UI shape
				setReview({
					id: reviewData.reviewId,
					title: 'Review Document', // Generic title
					lecturerName: 'Lecturer', // Backend doesn't return name yet
					status: reviewData.status,
					requestBy: 'Student', // Backend returns ID
					createdAt: new Date(reviewData.requestedAt).toLocaleDateString(),
					description: reviewData.message,
					documentName: 'Document', // Backend id: reviewData.documentId
					lecturerUserId: reviewData.lecturerUserId,
				})
			} catch (e) {
				console.error('Failed to fetch review:', e)
			} finally {
				setLoading(false)
			}
		}

		if (!authLoading) {
			fetchReview()
		}
	}, [reviewId, authLoading])

	if (authLoading || loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>Loading...</div>
		)
	}

	if (!review) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				Review not found
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<Navbar mode='workspace' />

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Header */}
				<div className='mb-6'>
					<div className='flex flex-col gap-4'>
						<h1 className='text-2xl font-bold text-gray-900'>{review.title}</h1>

						<div className='flex flex-wrap items-center gap-3 text-sm'>
							<ReviewStatusBadge status={review.status} />
							<span className='text-gray-600'>
								<span className='font-semibold text-gray-900'>{review.requestBy}</span> requested
								review for{' '}
								<span className='font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded'>
									{review.documentName}
								</span>
							</span>
							<span className='text-gray-500 hidden sm:flex items-center gap-1'>
								via {review.lecturerName} <span className='mx-1'>•</span> {review.createdAt}
							</span>
						</div>
					</div>
				</div>

				<div className='relative pl-4 sm:pl-0'>
					{/* Vertical Line */}
					<div className='absolute left-9 sm:left-5 top-0 bottom-0 w-px bg-gray-200 -z-10' />

					<ReviewComment
						authorName={review.lecturerName}
						authorInitials='LC'
						date={review.createdAt}
						content={review.description || 'No comment provided'}
						userType='lecturer'
					/>
				</div>
			</main>
		</div>
	)
}
